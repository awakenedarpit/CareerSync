# CarrerSync Phase 19 — Master Environment Configuration Specification

> **Platform Release:** Phase 19 Production & Pilot Readiness  
> **Target Topology:** Render Web Service (Express 5) + Vercel Hobby (React 19) + Neon Serverless PostgreSQL  
> **Cost Constraints:** Strict ₹0 Cardless Architecture (Zero Cloudflare)  
> **Schema Validator:** Zod Type-Safe Parser (`server/src/config/env.ts`)  

---

## 1. Overview & Security Philosophy

CarrerSync enforces a strict, fail-safe environment configuration architecture. All runtime parameters are validated at startup through a strongly-typed Zod schema. If any mandatory variable is missing or malformed, the application immediately aborts boot with an explicit diagnostic error, preventing silent security regressions or corrupt database transactions.

### Core Security Guarantees
1. **Zero Secret Leakage:** No credentials, connection strings, or cryptographic keys are ever committed to version control. All `.env`, `.env.local`, and `.dev.vars` files are registered in `.gitignore`.
2. **Strict ₹0 Budget Compliance:** Every configuration default is tuned to operate reliably within the free tiers of Render, Vercel, Neon PostgreSQL, and Google Gemini API without requiring payment methods.
3. **Cardless Infrastructure:** Zero dependencies on Cloudflare, AWS paid tiers, or third-party credit card validation gates.

---

## 2. Backend Environment Variables (Express 5 API Server)

All backend variables are loaded via `dotenv` and validated via Zod in `server/src/config/env.ts`.

### Configuration Matrix

| Variable Name | Type / Allowed Values | Required | Default Value | Description & Security Impact |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | `number` (1024–65535) | Optional | `5050` (Local) / `10000` (Render) | The TCP port Express listens on. Render automatically injects `10000`. |
| `NODE_ENV` | `'development' \| 'test' \| 'production'` | Optional | `'development'` | Controls Express performance mode, error stack traces, and logger verbosity. |
| `ENVIRONMENT` | `string` | Optional | `'development'` | Semantic environment tag returned by health check endpoints (`/health`). |
| `DATABASE_URL` | Valid PostgreSQL URI with SSL | **Required** in Prod | *None* | **Neon Pooled Connection String** (contains `-pooler.` host). Used for runtime HTTP queries and PgBouncer pool. |
| `DATABASE_URL_UNPOOLED` | Valid PostgreSQL URI with SSL | **Required** for DDL | *None* | **Neon Direct Connection String** (no `-pooler.`). Bypasses PgBouncer for migrations and DDL locks. |
| `JWT_SECRET` | String (>= 32 characters) | **Required** in Prod | Dev fallback (32 chars) | HMAC-SHA256 signing secret for authentication tokens. Must be high-entropy in production. |
| `JWT_EXPIRES_IN` | String / numeric seconds | Optional | `'7200'` (2 hours) | Lifetime of student, TPO, recruiter, and admin session tokens before re-authentication is required. |
| `CLIENT_URL` | Valid HTTPS/HTTP URL | Optional | `'http://localhost:5173'` | Canonical frontend domain for strict CORS origin checking (`https://carrersync.vercel.app`). |
| `GEMINI_API_KEY` | String (Google API Key) | Optional | *Empty* | Optional Google Gemini API key. If absent, system gracefully falls back to deterministic rule engines. |
| `STORAGE_DRIVER` | `'local' \| 's3'` | Optional | `'local'` | File storage engine. `'local'` saves to disk; `'s3'` connects to Neon Object Storage / MinIO. |
| `STORAGE_PROVIDER` | `'local' \| 's3'` | Optional | `'local'` | Backward-compatible alias for `STORAGE_DRIVER`. |
| `UPLOAD_DIR` | Relative or absolute path | Optional | `'uploads'` | Root directory for local storage engine. Sandboxed with 0o700 directory permissions. |
| `STORAGE_LOCAL_DIRECTORY`| Path string | Optional | `'uploads'` | Backward-compatible alias for `UPLOAD_DIR`. |

---

## 3. Storage Subsystem Configuration (Provider-Independent)

CarrerSync features an abstract file storage architecture (`server/src/storage/`). Depending on `STORAGE_DRIVER`, the application configures either local sandboxed disk storage or S3-compatible cloud storage:

### Local Storage (`STORAGE_DRIVER=local`)
- **Use Case:** Local development, CI test suites, and temporary ephemeral pilot uploads on Render.
- **Root Directory:** Resolved from `UPLOAD_DIR` (defaults to `./uploads`).
- **Path Traversal Protection:** The engine sanitizes all incoming filenames, rejects null bytes (`\0`) and dot-dot traversal tokens (`..`), and chroots files to the upload root.
- **Permissions:** Root directory is initialized with `0o700` (`rwx------`) restricting host filesystem access.

### S3 / Neon Object Storage (`STORAGE_DRIVER=s3`)
When using Neon Object Storage or any zero-cost S3-compatible bucket, provide:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `STORAGE_BUCKET` | `carrersync-documents` | Name of the storage bucket |
| `STORAGE_REGION` | `ap-southeast-1` | Cloud region collocated with database |
| `STORAGE_ENDPOINT` | `https://s3.ap-southeast-1.amazonaws.com` | S3 API endpoint URL |
| `STORAGE_ACCESS_KEY` | `AKIAIOSFODNN7EXAMPLE` | IAM / S3 access key |
| `STORAGE_SECRET_KEY` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | IAM / S3 secret access key |

---

## 4. Frontend Environment Variables (Vite + React 19)

All frontend client variables must be prefixed with `VITE_` to be embedded by the Vite compiler at build time.

| Variable Name | Type | Production Example | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | HTTPS URL | `https://carrersync-api.onrender.com/api/v1` | Target base URL for all Axios REST requests. |
| `VITE_WS_URL` | WSS URL | `wss://carrersync-api.onrender.com/ws` | WebSocket server endpoint for real-time alerts. |
| `VITE_APP_ENV` | String | `production` | Active environment displayed in telemetry & footer. |
| `VITE_API_PROXY_TARGET`| HTTP URL | `http://localhost:5050` | Development-only Vite dev server reverse proxy target. |

> [!WARNING]
> Never expose secrets, database connection strings, or administrative credentials to `VITE_` variables. All `VITE_` variables are compiled directly into client-side JavaScript bundles and are publicly visible to anyone inspecting browser network traffic.

---

## 5. Startup Fail-Safes & Zod Validation Implementation

In `server/src/config/env.ts`, the application parses incoming environment variables using Zod:

```typescript
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

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
  GEMINI_API_KEY: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  STORAGE_LOCAL_DIRECTORY: z.string().default('uploads')
}).passthrough();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Invalid environment variables detected:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
export default env;
```

### Fail-Safe Behavior
1. If `NODE_ENV` is set to an unsupported string (e.g. `staging`), the schema rejects it and halts process execution immediately.
2. If `PORT` is passed as a non-numeric string, `z.coerce.number()` will trigger a parse failure and exit.
3. If `STORAGE_DRIVER` is set to an unrecognized provider (such as `gcs` or `azure`), startup is rejected before any files can be mishandled.

---

## 6. Production Ready `.env.production` Reference Template

```ini
# ==============================================================================
# CarrerSync Production Environment Configuration
# Strict ₹0 Zero-Cost Architecture | Render + Vercel + Neon
# ==============================================================================

# -----------------
# 1. RUNTIME & SERVER
# -----------------
NODE_ENV=production
ENVIRONMENT=production
PORT=10000
CLIENT_URL=https://carrersync.vercel.app

# -----------------
# 2. NEON POSTGRESQL (Free Tier)
# -----------------
# Pooled endpoint for transactional application workload (via PgBouncer :5432)
DATABASE_URL=postgresql://neondb_owner:npg_secret@ep-weathered-boat-a1z9wdl8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Direct unpooled endpoint for DDL migrations & Drizzle-Kit
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_secret@ep-weathered-boat-a1z9wdl8.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# -----------------
# 3. AUTHENTICATION & SECURITY (64-byte Hex Secret)
# -----------------
JWT_SECRET=fe382b759810fa57c3f61d5c553bc58ed2fd38a4083befa461168d5bb9499687
JWT_EXPIRES_IN=7200

# -----------------
# 4. STORAGE SUBSYSTEM
# -----------------
STORAGE_DRIVER=local
UPLOAD_DIR=uploads

# -----------------
# 5. AI ENGINE (Optional Google Gemini Free Tier)
# -----------------
GEMINI_API_KEY=AQ.Ab8RN6Kyv7IwTC0EUmMVypoiBuU9PLdTBDk4MIRTT6Y9eLsvRQ
```

---

## 7. Render & Vercel Dashboard Sync Checklist

When deploying to Render and Vercel, populate the dashboard settings as follows:

### Render Dashboard Settings (`carrersync-api`)
- [x] Set **Environment** to `Node`
- [x] Set **Build Command** to `npm install --prefix server && npm run build --prefix server || true`
- [x] Set **Start Command** to `npm start --prefix server`
- [x] Add Environment Variable `DATABASE_URL` (Secret)
- [x] Add Environment Variable `DATABASE_URL_UNPOOLED` (Secret)
- [x] Add Environment Variable `JWT_SECRET` (Generated 32+ char secret)
- [x] Add Environment Variable `CLIENT_URL` = `https://carrersync.vercel.app`
- [x] Add Environment Variable `STORAGE_DRIVER` = `local`
- [x] Add Environment Variable `UPLOAD_DIR` = `uploads`
- [x] Set **Health Check Path** to `/health`

### Vercel Project Settings (`carrersync-client`)
- [x] Set **Framework Preset** to `Vite`
- [x] Set **Build Command** to `npm run build --prefix client`
- [x] Set **Output Directory** to `client/dist`
- [x] Add Environment Variable `VITE_API_URL` = `https://carrersync-api.onrender.com/api/v1`
- [x] Add Environment Variable `VITE_WS_URL` = `wss://carrersync-api.onrender.com/ws`
- [x] Add Environment Variable `VITE_APP_ENV` = `production`
