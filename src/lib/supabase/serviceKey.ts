import 'server-only';

/**
 * Server-side accessor for the Supabase service role key.
 * The key must be provided via the SUPABASE_SERVICE_ROLE_KEY environment
 * variable — it is never hardcoded or exposed to browser bundles.
 */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key) return key;
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set; falling back to the public anon key.');
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}
