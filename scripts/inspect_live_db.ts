/**
 * CarrerSync — Standalone Live Neon PostgreSQL Database Inspector (TypeScript / Node Edition)
 *
 * Connects to Neon PostgreSQL using DATABASE_URL from .env.local / .env and queries:
 * - information_schema.tables
 * - information_schema.columns
 * - information_schema.table_constraints & referential_constraints
 * - pg_indexes & pg_index
 * - pg_type & pg_enum
 * - pg_class (RLS status)
 * - pg_policies (RLS policies)
 * - information_schema.triggers
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
loadEnvFile(path.join(rootDir, '.env.local'));
loadEnvFile(path.join(rootDir, '.env'));

function getNormalizedDbUrl(): string {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required in .env.local or environment');
  }
  if (url.startsWith('postgresql+asyncpg://')) {
    url = url.replace('postgresql+asyncpg://', 'postgresql://');
  }
  return url;
}

export async function runLiveDbAudit() {
  const url = getNormalizedDbUrl();
  console.log('Connecting to Neon PostgreSQL via @neondatabase/serverless...');
  const sql = neon(url);

  // 1. Meta & Extensions
  const [versionRes, currentDbRes, currentUserRes, extRows] = await Promise.all([
    sql`SELECT version()`,
    sql`SELECT current_database()`,
    sql`SELECT current_user`,
    sql`SELECT extname, extversion FROM pg_extension ORDER BY extname`
  ]);

  const meta = {
    version: versionRes[0]?.version,
    database: currentDbRes[0]?.current_database,
    user: currentUserRes[0]?.current_user,
    extensions: extRows
  };

  // 2. Custom Enums
  const enumRows = await sql`
    SELECT 
      t.typname AS enum_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `;

  // 3. Tables & RLS Status
  const tableRows = await sql`
    SELECT 
      t.table_name,
      t.table_type,
      COALESCE(c.relrowsecurity, false) AS rls_enabled,
      COALESCE(c.relforcerowsecurity, false) AS rls_forced
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name
  `;

  // Query row counts & size for tables
  const tables = [];
  for (const t of tableRows) {
    let rowCount: number | string = 0;
    let sizePretty = 'N/A';
    if (t.table_type === 'BASE TABLE') {
      try {
        const countRes = await sql(`SELECT count(*)::int AS count FROM "${t.table_name}"`);
        rowCount = countRes[0]?.count ?? 0;
        const sizeRes = await sql(`SELECT pg_size_pretty(pg_total_relation_size('"${t.table_name}"')) AS size`);
        sizePretty = sizeRes[0]?.size ?? 'N/A';
      } catch (err: any) {
        rowCount = `Error: ${err.message}`;
      }
    }
    tables.push({
      table_name: t.table_name,
      table_type: t.table_type,
      row_count: rowCount,
      size_pretty: sizePretty,
      rls: {
        enabled: t.rls_enabled,
        forced: t.rls_forced
      }
    });
  }

  // 4. Columns
  const columnRows = await sql`
    SELECT 
      table_name,
      column_name,
      ordinal_position,
      column_default,
      is_nullable,
      data_type,
      udt_name,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;

  // 5. Constraints
  const keyConstraints = await sql`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `;

  const foreignKeys = await sql`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `;

  // 6. Indexes
  const indexes = await sql`
    SELECT 
      i.schemaname,
      i.tablename,
      i.indexname,
      i.indexdef,
      idx.indisunique AS is_unique,
      idx.indisprimary AS is_primary
    FROM pg_indexes i
    JOIN pg_class c ON c.relname = i.indexname
    JOIN pg_index idx ON idx.indexrelid = c.oid
    WHERE i.schemaname = 'public'
    ORDER BY i.tablename, i.indexname
  `;

  // 7. Policies & Triggers
  const policies = await sql`
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `;

  const triggers = await sql`
    SELECT 
      event_object_table AS table_name,
      trigger_name,
      event_manipulation,
      action_timing,
      action_orientation,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `;

  const report = {
    meta,
    enums: enumRows,
    tables,
    columns: columnRows,
    keyConstraints,
    foreignKeys,
    indexes,
    policies,
    triggers
  };

  const outPath = path.join(rootDir, 'scripts', 'live_db_inventory_node.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Report successfully written to ${outPath}`);
  console.log(`Audited: ${tables.length} tables, ${indexes.length} indexes, ${policies.length} policies.`);
  return report;
}

if (require.main === module) {
  runLiveDbAudit().catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}
