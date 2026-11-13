/**
 * DEPRECATED: Neon database is completely decommissioned.
 * All data and queries are powered 100% by Supabase Pro.
 */

export function getNeonPool(): any {
  return null;
}

export async function neonQuery<T = any>(_text: string, _params: any[] = []): Promise<T[]> {
  console.warn('[DEPRECATED neonQuery]: Neon is decommissioned. All operations run on Supabase Pro.');
  return [] as T[];
}
