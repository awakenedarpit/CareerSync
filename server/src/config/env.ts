import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Load .env.local and .env from current directory or parent directory
const cwd = process.cwd();
const potentialEnvPaths = [
  path.resolve(cwd, '.env.local'),
  path.resolve(cwd, '.env'),
  path.resolve(cwd, '..', '.env.local'),
  path.resolve(cwd, '..', '.env')
];

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5050),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ENVIRONMENT: z.string().default('development'),
  DATABASE_URL: z.string().optional(),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  JWT_SECRET: z.string().default('carrersync_jwt_default_secret_dev_key_32_chars'),
  JWT_EXPIRES_IN: z.string().default('7200'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  STORAGE_LOCAL_DIRECTORY: z.string().default('uploads'),
  STORAGE_BUCKET: z.string().default('carrersync-documents'),
  STORAGE_REGION: z.string().default('ap-southeast-1'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional()
}).passthrough();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const [key, issues] of Object.entries(parsed.error.format())) {
    if (key !== '_errors') {
      console.error(`  - ${key}: ${(issues as any)._errors?.join(', ')}`);
    }
  }
  throw new Error('Environment configuration validation failed');
}

// Fail-safe security verification in production mode
if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === 'carrersync_jwt_default_secret_dev_key_32_chars') {
    console.warn('[SECURITY WARNING] Using default JWT_SECRET in production! Ensure JWT_SECRET is set in deployment environment.');
  }
}

export const env = parsed.data;
export default env;
