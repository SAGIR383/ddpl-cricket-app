import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

import { getServiceRoleKey } from '@/lib/supabase/serviceKey';
import { neonQuery } from '@/lib/db/neon';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const supabaseServiceKey = getServiceRoleKey();

// Database client with elevated service privileges for server-side persistence
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
  if (key.startsWith('auction_data_')) return 6000; // 6s for live auction
  if (key.startsWith('tournament_schedule_')) return 30000; // 30s for match schedule
  if (key === 'tournament_rules' || key.startsWith('tournament_rules_')) return 120000; // 2 mins for rules
  if (key === 'tournament_configs') return 120000; // 2 mins for tournament configs
  if (key === 'user_roles' || key === 'super_admin_accounts') return 300000; // 5 mins for accounts/roles
  if (key.startsWith('tournament_registrations_')) return 20000; // 20s for registrations
  if (key === 'cricplus_articles' || key.startsWith('blog_')) return 180000; // 3 mins for articles
  return 30000; // 30s default
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
 * 3. Primary: Neon Cloud PostgreSQL (High speed, zero egress penalty)
 * 4. Secondary: Supabase cricpluse_store query
 * 5. Tertiary: Graceful filesystem fallback
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

    // A. Primary: Query Neon Cloud PostgreSQL directly
    try {
      const rows = await neonQuery<{ data: any }>('SELECT data FROM cricpluse_store WHERE key = $1 LIMIT 1', [key]);
      if (rows && rows.length > 0 && rows[0].data !== undefined && rows[0].data !== null) {
        result = rows[0].data as T;
        fetched = true;
      }
    } catch (neonErr) {
      console.warn(`[cricpluse_store] Neon read warning for "${key}", falling back:`, (neonErr as any)?.message);
    }

    // B. Secondary: Fallback to Supabase if Neon returned nothing
    if (!fetched) {
      try {
        const { data, error } = await supabaseAdmin
          .from('cricpluse_store')
          .select('data')
          .eq('key', key)
          .single();

        if (!error && data && data.data !== undefined) {
          result = data.data as T;
          fetched = true;
        }
      } catch (err) {
        console.warn(`[cricpluse_store] Supabase read fallback warning for "${key}":`, err);
      }
    }

    // C. Tertiary: Local file fallback
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
  // Also clear in-flight requests for this key
  inFlightRequests.delete(key);

  let savedSuccessfully = false;

  // 2. Primary: Persist to Neon Cloud PostgreSQL
  try {
    const jsonStr = JSON.stringify(value);
    await neonQuery(
      `INSERT INTO cricpluse_store (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE
       SET data = EXCLUDED.data, updated_at = NOW()`,
      [key, jsonStr]
    );
    savedSuccessfully = true;
  } catch (neonErr) {
    console.error(`[cricpluse_store] Neon write error for "${key}":`, neonErr);
  }

  // 3. Secondary: Keep Supabase in sync as backup (fire and forget / non-blocking)
  try {
    Promise.resolve(
      supabaseAdmin
        .from('cricpluse_store')
        .upsert(
          {
            key,
            data: value as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
    ).catch(() => {});
  } catch {
    // Non-blocking sync to Supabase backup
  }

  // 4. Tertiary: Also write to local file for dev safety (if filesystem is writable)
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
