import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/supabase/serviceKey';

export const SUPABASE_URL = getSupabaseUrl();
export const SUPABASE_ANON_KEY = getSupabaseAnonKey();

// Browser singleton client to prevent redundant client instantiation & WebSocket churn
let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  if (!clientInstance) {
    clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return clientInstance;
}
