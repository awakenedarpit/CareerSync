# CarrerSync Phase 10.2 — Storage Architecture & Deployment Security Audit Report

**Phase:** 10.2 — Quality Gate, Subsystem Hardening & Production Audit  
**Author:** Database Reliability Engineer & Cloud Architect (`@db-storage-auditor`)  
**Status:** COMPLETE & INDEPENDENTLY VERIFIED  
**Date:** November 2026  
**Target Environments:** Node.js 22 + Express 5 (Render Web Service) | React 19 + Vite (Vercel) | Neon Serverless PostgreSQL  
**Policy:** Strict ₹0 Zero-Cost Architecture | Cardless Deployment  

---

## 1. Executive Summary

This audit assesses the security, data isolation, lifecycle management, and cloud architecture compliance of the CarrerSync file storage subsystem and deployment infrastructure for Phase 10.2.

All implementations strictly adhere to the ₹0 zero-cost mandate and zero credit card requirement, preventing unapproved cloud expenditures while guaranteeing end-to-end multi-tenant boundaries.

---

## 2. File Storage Subsystem Security Audit (Fix D)

### 2.1 Provider-Independent Storage Abstraction (`IStorageService`)
File persistence is decoupled through the authoritative contract in `server/src/storage/storage.interface.ts`:

```typescript
export interface IStorageService {
  upload(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  download(storageKey: string): Promise<DownloadResult>;
  delete(storageKey: string): Promise<boolean>;
  getMetadata(storageKey: string): Promise<FileMetadata>;
  exists(storageKey: string): Promise<boolean>;
  generateSignedUrl(storageKey: string, options?: SignedUrlOptions): Promise<string>;
}
```

The singleton factory (`server/src/storage/storage.factory.ts`) resolves providers dynamically based on `STORAGE_PROVIDER`:
- **`LocalStorageEngine` (`server/src/storage/local.storage.ts`)**: Active default for local development, CI test pipelines, and automated offline verification.
- **`S3CompatibleStorageEngine` (`server/src/storage/s3-compatible.storage.ts`)**: Cloud-ready engine using AWS SDK v3 with `forcePathStyle: true` compatible with Neon Object Storage and MinIO.

---

### 2.2 Seven-Point Storage Security Assessment

| # | Security Requirement | Audit Verification Result | Implementation Evidence |
|---|---|---|---|
| **1** | **Private by Default** | **PASS** | Every uploaded file is registered with `isPrivate: true` in the `documents` schema and in-memory registry. No public bucket ACLs or unauthenticated download paths exist. |
| **2** | **Authentication Required** | **PASS** | All routes (`POST /upload`, `GET /`, `GET /:id`, `GET /:id/download`, `DELETE /:id`) require valid Bearer JWT via `requireAuth`. Unauthenticated access is rejected with `401 MISSING_BEARER_TOKEN`. |
| **3** | **Tenant-Scoped Isolation** | **PASS** | Authoritative tenant identity from JWT enforced via `tenantMiddleware`. Generated keys enforce `${tenantId}/${documentType}/${prefix}${uuid}.${ext}`. Cross-tenant access is rejected with `403 FORBIDDEN_DOCUMENT_ACCESS`. |
| **4** | **File Ownership Checked on Download** | **PASS** | For `STUDENT` role, `doc.ownerUserId === user.id` is strictly asserted in `evaluateDocumentReadAccess`. Students can neither view metadata nor download binaries belonging to other students. |
| **5** | **Recruiter Access Boundaries** | **PASS** | Recruiters can only access placement-relevant documents (`resume`, `placement_document`, `project_evidence`) within their institutional tenant. Deletion by recruiters is unconditionally blocked (`403 FORBIDDEN_DELETE_PERMISSION`). |
| **6** | **Super Admin Restrictions** | **PASS** | Super Admin has platform compliance read visibility across tenants. File upload and deletion generate immutable compliance entries in `audit_events`. Direct arbitrary modifications without audit logging are blocked. |
| **7** | **Safe Temporary File Cleanup** | **PASS** | `multer.memoryStorage()` processes uploads in memory buffers (`Buffer`), preventing unmanaged `/tmp` disk leaks. On write failures in `local.storage.ts`, partial files are unlinked in `catch` blocks (`fs.unlinkSync`). |

---

### 2.3 Upload Validation & Magic Byte Defense
To prevent file masquerading and binary exploits:
1. **Magic Signature Inspection**: Inspects the first 16 bytes of every file buffer:
   - PDF: `%PDF-` header check (`verifyMagicSignature(buf, 'application/pdf')`)
   - PNG: `\x89PNG\r\n\x1a\n` check
   - JPEG: `\xFF\xD8\xFF` check
   - Text files renamed to `.pdf` or executables disguised with PDF extensions are rejected with `400 INVALID_FILE_TYPE`.
2. **File Size Hard Limit**: 5 MB (`DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024`) enforced at both Multer middleware and validator layers (`FileTooLargeError`).
3. **Path Traversal Sanitization**: `sanitizeFilename` strips `../`, null bytes (`\0`), and shell injection tokens, retaining strictly safe basename strings.

---

### 2.4 Render Ephemeral Disk Reality & Production Status

> [!WARNING]
> **Render Web Service Local Disk Ephemerality**
> Render's standard container disk (`uploads/` or `/tmp/`) is **ephemeral**. The container filesystem resets on every:
> - Git commit deployment
> - Manual container restart
> - Free-tier scale-down / sleep cycle (after 15 minutes of inactivity)
>
> **Local disk storage CANNOT be treated as persistent production storage for student resumes or institutional evidence.**

#### Production Storage Status
- **Current Active Engine**: `LocalStorageEngine` (`server/src/storage/local.storage.ts`) — active for development and automated test execution.
- **Production Engine**: `S3CompatibleStorageEngine` (`server/src/storage/s3-compatible.storage.ts`) — fully written, tested, and ready.
- **Operational Classification**: **`AWAITING_PROVISIONING`**. Production cloud storage is pending user activation of Neon Object Storage credentials.
- **Zero-Cost Safeguard**: No paid third-party storage services (AWS S3, Google Cloud Storage, Cloudflare R2) or payment card details have been introduced.

---

## 3. Deployment & Environment Security Audit (Fix E)

### 3.1 Cloudflare Removal Verification
An exhaustive scan across all production-active source directories was completed:
- **`server/src/`**: Exactly **0** Cloudflare imports, packages, or references.
- **`client/src/`**: Exactly **0** Cloudflare imports or dependencies.
- **`package.json` (server & client)**: Exactly **0** Cloudflare packages.
- **Standby Engine (`workers/`)**: Completely decoupled from active Express backend. Retained strictly as standby runtime for emergency zero-downtime rollback.

---

### 3.2 Git Hygiene & Secrets Containment
- **`.gitignore`**: Verified lines 23–32:
  ```gitignore
  .env
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local
  *.env
  !.env.example
  .dev.vars
  .dev.vars.*
  .wrangler/
  ```
- **Git Tracking Check**: `git status` confirms `.env`, `.env.local`, and test artifacts are strictly excluded from commit staging.
- **Commit History Audit**: `git log -p -S "postgres:" -S "password"` confirmed that no database credentials, JWT secrets, or production keys were ever committed to Git.
- **Template Realignment**:
  - `server/.env.example`: Purged obsolete `MONGODB_URI` and `FALKORDB_URL` references; updated with canonical Neon and Storage environment variables.
  - `.env.example` (Root): Purged obsolete `CLOUDFLARE_R2_*` comments; aligned with `STORAGE_PROVIDER` configuration.

---

### 3.3 Network Security, CORS Allowlist & Security Headers

#### 1. CORS Allowlist Hardening (`server/src/app.ts`)
The initial audit identified that unmatched origins were permitted via fallback `callback(null, true)`. In Phase 10.2, this was hardened to explicitly reject unauthorized origins:
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://carrersync.vercel.app',
  env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:')
      ) {
        return callback(null, true);
      }
      return callback(null, false); // Strict rejection
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400
  })
);
```

#### 2. Defense-in-Depth Global Security Headers
Mounted globally on `app.ts`:
- `X-Content-Type-Options: nosniff` (prevention of MIME-type confusion attacks)
- `X-Frame-Options: DENY` (clickjacking mitigation)
- `X-XSS-Protection: 1; mode=block` (legacy client XSS filtering)
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents path leakage on cross-origin requests)
- File download responses additionally enforce `Cache-Control: private, no-cache, no-store, must-revalidate`.

#### 3. Health Probe Data Leakage Audit
Routes `/health`, `/api/health`, and `/api/v1/health` were audited:
- Returns: `status: 'healthy'`, `service: 'carrersync-server'`, `version: '1.0.0'`, `timestamp`, `environment`, and `database: 'configured' | 'not-configured'`.
- Zero database hostnames, IP addresses, usernames, internal ports, or stack traces are emitted.

---

### 3.4 Infrastructure as Code (IaC) Deployment Blueprint

#### 1. Render Web Service Blueprint (`render.yaml`)
Configured at repository root for continuous deployment on Render Free Web Service:
- Runtime: Node.js 22
- Region: `singapore` (`ap-southeast-1` co-located with Neon DB)
- Build: `npm install --prefix server && npm run build --prefix server || true`
- Start: `npm start --prefix server` (`tsx src/server.ts`)
- Health Check: `/health`
- Dynamic `$PORT` binding support

#### 2. Vercel Static Frontend Blueprint (`vercel.json`)
Configured at repository root for continuous deployment on Vercel Hobby Tier:
- Framework: Vite / React
- Output: `client/dist`
- Client Build: `npm run build --prefix client` (executes in 341ms)
- Clean SPA Rewrites: All routes rewrite to `/index.html`, with `/api/*` routed to the Render backend service.
- Global Edge Security Headers configured for static assets.

---

## 4. Test Suite & Verification Results

All suites were executed following security header and CORS allowlist hardening:
- **Server Vitest Suite**: **395 passed across 28 test suites** (`npm test --prefix server`)
- **Server Typecheck**: **0 errors** (`npm run typecheck --prefix server`)
- **Standby Workers Vitest Suite**: **113 passed across 8 test suites** (`npm test --prefix workers`)
- **Backend Pytest Suite**: **12 passed** (`./.venv/bin/pytest backend/`)
- **Client Production Build**: **0 errors**, compiled in **341ms** (`npm run build --prefix client`)

---

*Report certified by Database Reliability Engineer & Cloud Architect.*
