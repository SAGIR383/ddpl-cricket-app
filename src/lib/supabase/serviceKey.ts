/**
 * Server-side accessor for the Supabase service role key.
 * The key must be provided via the SUPABASE_SERVICE_ROLE_KEY environment
 * variable; it is never hardcoded in source.
 */
export function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  );
}
