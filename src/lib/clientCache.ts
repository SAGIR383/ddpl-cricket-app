/**
 * Client-Side Fast Navigation Cache (Stale-While-Revalidate)
 * Eliminates blank screens and spinner delays during page navigation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const clientMemoryCache = new Map<string, CacheEntry<any>>();
const inFlightClientRequests = new Map<string, Promise<any>>();

/**
 * Synchronous cache lookup to initialize component state immediately without loading spinners.
 */
export function getFastCached<T>(url: string, maxAgeMs = 30000): T | null {
  if (typeof window === 'undefined') return null;
  const entry = clientMemoryCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) return null;
  return entry.data as T;
}

/**
 * Fast fetch with client-side caching and automatic deduplication.
 * Returns cached data immediately if fresh; revalidates silently.
 */
export async function fetchWithCache<T>(
  url: string,
  options?: {
    ttlMs?: number;
    forceRefresh?: boolean;
    onRevalidate?: (freshData: T) => void;
  }
): Promise<T> {
  const ttlMs = options?.ttlMs ?? 10000; // 10s default
  const now = Date.now();

  const cached = clientMemoryCache.get(url);
  const isFresh = cached && now - cached.timestamp < ttlMs;

  // If we have fresh cached data and no force-refresh, return immediately (0ms)
  if (isFresh && !options?.forceRefresh) {
    return cached.data as T;
  }

  // If we have stale data, return it immediately to the caller, and revalidate in background!
  if (cached && !options?.forceRefresh) {
    // Trigger background revalidation silently
    triggerBackgroundRevalidation<T>(url, options?.onRevalidate);
    return cached.data as T;
  }

  // Deduplicate identical in-flight network requests
  if (inFlightClientRequests.has(url)) {
    try {
      return (await inFlightClientRequests.get(url)) as T;
    } catch {
      // In-flight failed, retry
    }
  }

  const fetchPromise = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    }
    const data = await res.json();
    clientMemoryCache.set(url, { data, timestamp: Date.now() });
    return data as T;
  })();

  inFlightClientRequests.set(url, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inFlightClientRequests.delete(url);
  }
}

async function triggerBackgroundRevalidation<T>(
  url: string,
  onRevalidate?: (freshData: T) => void
) {
  if (inFlightClientRequests.has(url)) return;

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const freshData = await res.json();
        clientMemoryCache.set(url, { data: freshData, timestamp: Date.now() });
        if (onRevalidate) {
          onRevalidate(freshData as T);
        }
      }
    } catch {
      // Background revalidation error: ignore safely
    }
  })();

  inFlightClientRequests.set(url, fetchPromise);
  try {
    await fetchPromise;
  } finally {
    inFlightClientRequests.delete(url);
  }
}

/**
 * Invalidate client cache when mutations happen (e.g. team created, bid placed)
 */
export function invalidateClientCache(urlPattern?: string) {
  if (!urlPattern) {
    clientMemoryCache.clear();
    return;
  }
  clientMemoryCache.forEach((_, key) => {
    if (key.includes(urlPattern)) {
      clientMemoryCache.delete(key);
    }
  });
}
