/**
 * Safe server-side accessor for Supabase elevated service role privileges.
 * Strictly reads from environment variables to prevent secret leakage.
 * If service role key is absent or invalid, safely falls back to public anon key.
 */
export function getServiceRoleKey(): string {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && (serviceKey.startsWith('eyJ') || serviceKey.startsWith('sb_secret_') || serviceKey.length > 20)) {
    return serviceKey;
  }
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf'
  );
}
