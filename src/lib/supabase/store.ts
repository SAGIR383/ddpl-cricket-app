import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Database client with elevated service privileges for server-side persistence
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

/**
 * Universal Store helper:
 * Tries Supabase cricpluse_store first; falls back gracefully to local JSON files if offline or misconfigured.
 */
export async function getStoreData<T>(key: string, fallbackFileName?: string, defaultValue?: T): Promise<T> {
  // 1. Try reading from Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('cricpluse_store')
      .select('data')
      .eq('key', key)
      .single();

    if (!error && data && data.data !== undefined) {
      return data.data as T;
    }
  } catch (err) {
    console.warn(`[cricpluse_store] Supabase read failed for key "${key}", falling back to local file.`, err);
  }

  // 2. Fallback to local filesystem if available
  if (fallbackFileName) {
    try {
      const filePath = path.join(process.cwd(), 'src', 'data', fallbackFileName);
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent) as T;
      }
    } catch (fsErr) {
      console.error(`[cricpluse_store] Local file fallback read error for "${fallbackFileName}":`, fsErr);
    }
  }

  return defaultValue as T;
}

export async function setStoreData<T>(key: string, value: T, fallbackFileName?: string): Promise<boolean> {
  let savedToSupabase = false;

  // 1. Save to Supabase cricpluse_store (upsert)
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

  // 2. Also write to local file for dev safety (if filesystem is writable)
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
