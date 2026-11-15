import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

/**
 * Drizzle ORM configuration for CarrerSync Node.js + Express 5 backend.
 * Uses Neon PostgreSQL direct or pooled database connection string.
 * Supports execution from either repository root or server/ directory.
 */
const isInsideServer = fs.existsSync(path.resolve(process.cwd(), 'src/db/schema.ts'));
const schemaPath = isInsideServer ? './src/db/schema.ts' : './server/src/db/schema.ts';
const outPath = isInsideServer ? './drizzle' : './server/drizzle';

export default defineConfig({
  dialect: 'postgresql',
  schema: schemaPath,
  out: outPath,
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
});
