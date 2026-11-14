import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle ORM configuration for CarrerSync Cloudflare Workers backend.
 * Following Neon Postgres best practices:
 * - Migrations and introspection use direct unpooled connection (DATABASE_URL_UNPOOLED)
 * - Falls back to DATABASE_URL if unpooled is not defined
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '',
  },
});
