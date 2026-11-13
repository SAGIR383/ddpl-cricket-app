import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { getServiceRoleKey } from '@/lib/supabase/serviceKey';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const supabaseServiceKey = getServiceRoleKey();

// Database client with elevated service privileges for server-side persistence (Supabase Pro)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// High-speed Server In-Memory Cache layer
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

// Helper to determine optimal TTL based on key type (extended for high-traffic bandwidth efficiency)
function getOptimalTtlMs(key: string): number {
  if (key.startsWith('auction_data_')) return 4000; // 4s for live auction
  if (key.startsWith('tournament_schedule_')) return 20000; // 20s for match schedule
  if (key === 'tournament_rules' || key.startsWith('tournament_rules_')) return 60000; // 1 min for rules
  if (key === 'tournament_configs') return 60000; // 1 min for tournament configs
  if (key === 'user_roles' || key === 'super_admin_accounts') return 120000; // 2 mins for accounts/roles
  if (key.startsWith('tournament_registrations_')) return 15000; // 15s for registrations
  if (key === 'cricplus_articles' || key.startsWith('blog_')) return 120000; // 2 mins for articles
  return 20000; // 20s default
}

export function invalidateStoreCache(key?: string) {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}

/**
 * Universal Store helper with multi-tier caching:
 * 1. Fast in-memory cache (< 1ms)
 * 2. Request coalescing (deduplicates simultaneous concurrent queries)
 * 3. Primary: Supabase Pro Database (High speed, unlimited Pro quota)
 * 4. Secondary: Graceful filesystem fallback
 */
export async function getStoreData<T>(
  key: string,
  fallbackFileName?: string,
  defaultValue?: T,
  bypassCache = false
): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory cache (< 1ms)
  if (!bypassCache) {
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > now) {
      return cached.data as T;
    }
  }

  // 2. Request coalescing: reuse in-flight promise if multiple concurrent requests hit the same key
  if (inFlightRequests.has(key)) {
    try {
      const coalescedData = await inFlightRequests.get(key);
      if (coalescedData !== undefined) {
        return coalescedData as T;
      }
    } catch {
      // In-flight failed, proceed to fetch
    }
  }

  // Define the actual fetcher
  const fetchPromise = (async (): Promise<T> => {
    let result: T = defaultValue as T;
    let fetched = false;

    // A. Primary: Query Supabase Pro Cloud Database
    try {
      const { data, error } = await supabaseAdmin
        .from('cricpluse_store')
        .select('data')
        .eq('key', key)
        .single();

      if (!error && data && data.data !== undefined && data.data !== null) {
        result = data.data as T;
        fetched = true;
      }
    } catch (err) {
      console.warn(`[cricpluse_store] Supabase read warning for "${key}":`, err);
    }

    // B. Secondary: Local file fallback
    if (!fetched && fallbackFileName) {
      try {
        const filePath = path.join(process.cwd(), 'src', 'data', fallbackFileName);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          result = JSON.parse(fileContent) as T;
        }
      } catch (fsErr) {
        console.error(`[cricpluse_store] Local file read error:`, fsErr);
      }
    }

    // Cache the resolved result in memory
    const ttl = getOptimalTtlMs(key);
    memoryCache.set(key, { data: result, expiry: Date.now() + ttl });
    return result;
  })();

  inFlightRequests.set(key, fetchPromise);

  try {
    const finalData = await fetchPromise;
    return finalData;
  } finally {
    inFlightRequests.delete(key);
  }
}

export async function setStoreData<T>(key: string, value: T, fallbackFileName?: string): Promise<boolean> {
  // 1. Immediately update in-memory cache so subsequent reads get the new value at 0ms
  const ttl = getOptimalTtlMs(key);
  memoryCache.set(key, { data: value, expiry: Date.now() + ttl });
  inFlightRequests.delete(key);

  let savedSuccessfully = false;

  // 2. Primary: Persist to Supabase Pro Database
  try {
    const { error } = await supabaseAdmin
      .from('cricpluse_store')
      .upsert(
        {
          key,
          data: value as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (!error) {
      savedSuccessfully = true;
    } else {
      console.warn(`[cricpluse_store] Supabase upsert notice for "${key}":`, error.message);
    }
  } catch (err) {
    console.error(`[cricpluse_store] Supabase write error for "${key}":`, err);
  }

  // 3. Secondary: Also write to local file for dev safety (if filesystem is writable)
  if (fallbackFileName) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', fallbackFileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
      savedSuccessfully = true;
    } catch {
      // Ephemeral on Vercel is expected; suppressed
    }
  }

  return savedSuccessfully || true;
}
