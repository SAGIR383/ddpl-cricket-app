/**
 * Safe server-side accessor for Supabase elevated service role privileges.
 * Strictly reads from environment variables to prevent secret leakage.
 */
export function getServiceRoleKey(): string {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}
