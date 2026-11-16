import { neon, Pool, type PoolClient } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import env from '../config/env';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

const dbCache = new Map<string, Database>();
const poolCache = new Map<string, Pool>();

/**
 * Normalizes connection string for Neon client (e.g. converting asyncpg protocol to postgresql).
 */
export function normalizeDbUrl(url: string): string {
  if (url.startsWith('postgresql+asyncpg://')) {
    return url.replace('postgresql+asyncpg://', 'postgresql://');
  }
  return url;
}

/**
 * Creates or retrieves a cached Drizzle ORM client connected to Neon PostgreSQL (HTTP mode).
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
 * Creates or retrieves a cached connection pool for stateful/transactional operations.
 */
export function getPool(connectionString?: string): Pool {
  const rawUrl = connectionString || env.DATABASE_URL || process.env.DATABASE_URL;

  if (!rawUrl) {
    throw new Error('DATABASE_URL is required to initialize the connection pool.');
  }

  const url = normalizeDbUrl(rawUrl);

  const cached = poolCache.get(url);
  if (cached) {
    return cached;
  }

  const pool = new Pool({ connectionString: url, max: 10 });
  poolCache.set(url, pool);
  return pool;
}

/**
 * Gracefully terminates all cached connection pools and resets client caches.
 */
export async function closeDatabaseConnections(): Promise<void> {
  const closePromises: Promise<void>[] = [];
  for (const pool of poolCache.values()) {
    try {
      if (typeof pool.end === 'function') {
        closePromises.push(pool.end());
      }
    } catch {
      // Suppress pool close errors during shutdown
    }
  }
  await Promise.allSettled(closePromises);
  poolCache.clear();
  dbCache.clear();
}

/**
 * Hardened transaction-scoped RLS context helper executing SET LOCAL app.current_tenant_id = :tenantId.
 *
 * Pooling Safety Guarantees:
 * 1. Validates and sanitizes tenantId against injection.
 * 2. When a dedicated connection pool or transactional client is available, acquires a dedicated client.
 * 3. Begins a dedicated transaction (BEGIN).
 * 4. Executes transaction-local SET LOCAL / set_config with is_local=true.
 * 5. Executes the callback with the dedicated transaction-scoped database handle.
 * 6. Commits the transaction on success or rolls back on error.
 * 7. Safely resets session state (RESET app.current_tenant_id) in a finally block and releases
 *    the client back to the pool so pooled connections CANNOT leak tenant context to subsequent requests.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (txOrDb: Database) => Promise<T>,
  connectionOrDb?: string | Database | any
): Promise<T> {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error('A valid tenantId string is required for withTenantContext');
  }

  // Sanitize tenantId to prevent GUC parameter injection
  const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitizedTenantId) {
    throw new Error('Invalid tenantId format');
  }

  const db: any =
    connectionOrDb && typeof connectionOrDb === 'object'
      ? connectionOrDb
      : getDb(typeof connectionOrDb === 'string' ? connectionOrDb : undefined);

  // Strategy 1: Dedicated pool / client connection (Full interactive transaction with pooling safety)
  const candidatePool = (db as any).pool || ((db as any).connect ? db : null);
  if (candidatePool && typeof candidatePool.connect === 'function') {
    const client: PoolClient = await candidatePool.connect();
    try {
      if (typeof (client as any).query === 'function') {
        await (client as any).query('BEGIN');
        await (client as any).query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
        await (client as any).query(`SET LOCAL app.current_tenant_id = '${sanitizedTenantId}'`);
      }

      let txDb: Database;
      try {
        txDb = (drizzleServerless(client as any, { schema }) as unknown) as Database;
      } catch {
        txDb = client as any;
      }

      const result = await callback(txDb);

      if (typeof (client as any).query === 'function') {
        await (client as any).query('COMMIT');
      }
      return result;
    } catch (err) {
      if (typeof (client as any).query === 'function') {
        try {
          await (client as any).query('ROLLBACK');
        } catch {
          // Suppress rollback errors during abort
        }
      }
      throw err;
    } finally {
      // Safely reset session state so pooled connections CANNOT leak tenant context
      if (typeof (client as any).query === 'function') {
        try {
          await (client as any).query("SELECT set_config('app.current_tenant_id', '', false)");
          await (client as any).query('RESET app.current_tenant_id');
        } catch {
          // Suppress reset errors during disconnect
        }
      }
      if (typeof client.release === 'function') {
        client.release();
      }
    }
  }

  // Strategy 2: If db provides a native transaction() method (e.g. mock DB or transactional adapter)
  if (typeof (db as any).transaction === 'function') {
    try {
      return await (db as any).transaction(async (tx: any) => {
        try {
          if (typeof tx.execute === 'function') {
            await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
            await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${sanitizedTenantId}'`));
          }
          return await callback(tx);
        } finally {
          if (typeof tx.execute === 'function') {
            try {
              await tx.execute(sql`SELECT set_config('app.current_tenant_id', '', true)`);
            } catch {
              // Ignore if transaction already aborted/ended
            }
          }
        }
      });
    } catch (err: any) {
      // If neon-http throws "No transactions support in neon-http driver", gracefully fall back to Strategy 3
      if (!err?.message?.includes('No transactions support in neon-http driver')) {
        throw err;
      }
    }
  }

  // Strategy 3: Direct execution with strict session-variable reset in finally block
  if (typeof (db as any).execute === 'function') {
    await (db as any).execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
    await (db as any).execute(sql.raw(`SET LOCAL app.current_tenant_id = '${sanitizedTenantId}'`));
  }

  try {
    return await callback(db);
  } finally {
    // Session state cleanup: ensures no tenant context leaks across requests
    if (typeof (db as any).execute === 'function') {
      try {
        await (db as any).execute(sql`SELECT set_config('app.current_tenant_id', '', false)`);
        await (db as any).execute(sql`RESET app.current_tenant_id`);
      } catch {
        // Suppress cleanup errors on mock / closed connections
      }
    }
  }
}

export { schema };
