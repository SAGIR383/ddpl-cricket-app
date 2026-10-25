import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

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

// Helper to determine optimal TTL based on key type
function getOptimalTtlMs(key: string): number {
  if (key.startsWith('auction_data_')) return 4000; // 4s for live auction
  if (key.startsWith('tournament_schedule_')) return 6000; // 6s for match schedule
  if (key === 'tournament_rules') return 30000; // 30s for rules
  if (key.startsWith('tournament_registrations_')) return 6000; // 6s for registrations
  return 5000; // 5s default
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
 * 2. Request coalescing (deduplicates simultaneous concurrent queries to Supabase)
 * 3. Supabase cricpluse_store query
 * 4. Graceful filesystem fallback
 */
export async function getStoreData<T>(
  key: string,
  fallbackFileName?: string,
  defaultValue?: T,
  bypassCache = false
): Promise<T> {
  const now = Date.now();

  // 1. Check in-memory cache
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

    // A. Try reading from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('cricpluse_store')
        .select('data')
        .eq('key', key)
        .single();

      if (!error && data && data.data !== undefined) {
        result = data.data as T;
      } else if (fallbackFileName) {
        // Fallback to local file if Supabase has no record yet
        const filePath = path.join(process.cwd(), 'src', 'data', fallbackFileName);
        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          result = JSON.parse(fileContent) as T;
        }
      }
    } catch (err) {
      console.warn(`[cricpluse_store] Supabase read failed for "${key}", checking local fallback.`, err);
      if (fallbackFileName) {
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

  let savedToSupabase = false;

  // 2. Persist to Supabase cricpluse_store (upsert)
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
      savedToSupabase = true;
    } else {
      console.error(`[cricpluse_store] Supabase upsert error for "${key}":`, error);
    }
  } catch (err) {
    console.error(`[cricpluse_store] Supabase write exception for "${key}":`, err);
  }

  // 3. Also write to local file for dev safety (if filesystem is writable)
  if (fallbackFileName) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', fallbackFileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
    } catch {
      // Ephemeral on Vercel is expected; suppressed
    }
  }

  return savedToSupabase;
}
