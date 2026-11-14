import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import env from '../config/env';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const dbCache = new Map<string, Database>();

/**
 * Normalizes connection string for Neon client (e.g. converting asyncpg protocol to postgresql).
 */
function normalizeDbUrl(url: string): string {
  if (url.startsWith('postgresql+asyncpg://')) {
    return url.replace('postgresql+asyncpg://', 'postgresql://');
  }
  return url;
}

/**
 * Creates or retrieves a cached Drizzle ORM client connected to Neon PostgreSQL.
 */
export function getDb(connectionString?: string): Database {
  const rawUrl = connectionString || env.DATABASE_URL || process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error('DATABASE_URL is required to initialize the Neon PostgreSQL client.');
  }

  const url = normalizeDbUrl(rawUrl);

  const cached = dbCache.get(url);
  if (cached) {
    return cached;
  }

  const sqlClient = neon(url);
  const db = drizzle(sqlClient, { schema });
  dbCache.set(url, db);
  return db;
}

/**
 * Transaction-scoped RLS context helper executing set_config('app.current_tenant_id', tenantId, true).
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (txOrDb: Database) => Promise<T>,
  connectionString?: string
): Promise<T> {
  const db = getDb(connectionString);

  if (typeof (db as any).transaction === 'function') {
    return await (db as any).transaction(async (tx: any) => {
      if (typeof tx.execute === 'function') {
        await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
      }
      return await callback(tx);
    });
  }

  if (typeof (db as any).execute === 'function') {
    await (db as any).execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
  }

  return await callback(db);
}

export { schema };
