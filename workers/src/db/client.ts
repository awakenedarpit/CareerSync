import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const dbCache = new Map<string, Database>();

/**
 * Creates or retrieves a cached Drizzle ORM client connected to Neon PostgreSQL via HTTP.
 * Suitable for Cloudflare Workers edge environment.
 */
export function getDb(connectionString?: string): Database {
  const url =
    connectionString ||
    (typeof process !== 'undefined' && process.env ? process.env.DATABASE_URL : undefined);

  if (!url) {
    throw new Error(
      'DATABASE_URL is required to initialize the Neon PostgreSQL client.'
    );
  }

  const cached = dbCache.get(url);
  if (cached) {
    return cached;
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });
  dbCache.set(url, db);
  return db;
}

export { schema };
