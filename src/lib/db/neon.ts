import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  '';

// High performance singleton connection pool for Next.js / Serverless
let pool: Pool | null = null;

export function getNeonPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
    });

    pool.on('error', (err) => {
      console.error('[Neon Pool Error]:', err.message);
    });
  }
  return pool;
}

/**
 * Direct safe query helper for Neon PostgreSQL
 */
export async function neonQuery<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const p = getNeonPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}
