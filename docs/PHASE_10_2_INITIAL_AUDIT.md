# CarrerSync Phase 10.2 — Initial Architecture & Subsystem Audit Report

**Phase:** 10.2 — Quality Gate, Subsystem Hardening & Production Audit  
**Author:** Database Reliability Engineer & Cloud Architect (`@db-storage-auditor`)  
**Status:** COMPLETE (Initial Findings Recorded Pre-Mutation)  
**Date:** November 2026  
**Environment:** Node.js 22 + Express 5 | Neon PostgreSQL Free Tier | Vite + React 19  

---

## 1. Executive Overview

Per the mandatory Phase 10.2 directive, this initial audit establishes the baseline state of CarrerSync across the database layer, Drizzle ORM migrations, file storage subsystems, deployment configurations, environment variable handling, and multi-tenant security architecture.

All findings recorded herein reflect the codebase and live infrastructure **prior to applying any modifications**.

---

## 2. Inventory & Inspection Summary

### 2.1 Documentation Baseline
- **`PROJECT_STATUS.md`**: Reports Express v5 as the primary active backend (`server/`) with 379 passing Vitest tests across 27 suites, and the standby edge runtime (`workers/`) with 113 passing Vitest tests. Claims migration `0000_shocking_echo.sql` is generated in `server/drizzle/`.
- **`docs/ARCHITECTURE.md`**: Canonical architecture specification detailing the ₹0 zero-cost architecture, Express runtime, 5-stage skill verification lifecycle, Neon connection pooling, and multi-tenant transaction-scoped RLS.
- **`docs/DEVELOPMENT_STATUS.md`**: Details milestone progression up to Phase 10.1, noting transition from Cloudflare to Express/Render and ongoing retirement of `workers/`.
- **`docs/PHASE_10_1_DATABASE_MIGRATION_AUDIT.md`**: Confirmed generation of `server/drizzle/0000_shocking_echo.sql` and absence of destructive DDL (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`). Crucially noted reliance on in-memory stores for offline test resilience.

---

## 3. Database Layer Initial Findings (Critical Fix C Baseline)

### 3.1 Drizzle ORM Migration Status in `server/drizzle/`
1. **Migration File Presence**:
   - `server/drizzle/0000_shocking_echo.sql` exists (50,023 bytes, 645 SQL statements).
   - Snapshot metadata exists in `server/drizzle/meta/0000_snapshot.json` (154,029 bytes) and `server/drizzle/meta/_journal.json`.
2. **Schema Alignment Verification**:
   - Running `drizzle-kit check` against `server/src/db/schema.ts` confirms: **`Everything's fine`**. The SQL migration file accurately captures the TypeScript schema definitions in `server/src/db/schema.ts`.
3. **Tooling & Path Discrepancy**:
   - In `server/package.json`, `"drizzle-kit": "^0.30.6"` is listed under `devDependencies`, but `drizzle-kit` is **not installed** in `server/node_modules/.bin/` (it is present only in `workers/node_modules/`). Running `npm run db:generate --prefix server` fails with `sh: drizzle-kit: command not found`.
   - In `server/drizzle.config.ts`, paths are defined as `schema: './server/src/db/schema.ts'` and `out: './server/drizzle'`. This configuration is root-relative and fails if invoked with CWD set to `server/`.

### 3.2 Live Neon PostgreSQL Database Audit
Direct read-only inspection of the live Neon database (`ep-weathered-boat-a1z9wdl8-pooler.ap-southeast-1.aws.neon.tech/neondb`) revealed a critical divergence between generated migrations and live database state:
1. **Live Table Inventory**:
   - Exactly **22 tables** exist in the public schema:
     `academic_semesters`, `agent_execution_logs`, `agent_workflows`, `alembic_version`, `applications`, `audit_events`, `companies`, `evidence_records`, `interviews`, `job_requirements`, `job_roles`, `learning_recommendations`, `notifications`, `placement_drives`, `placement_predictions`, `skill_assessments`, `skill_gap_analyses`, `skills`, `student_skills`, `students`, `tenants`, `users`.
   - **`alembic_version`** is present with revision `fdf3af0b3748`.
   - **Row Counts**: Domain tables currently hold 0 rows.
2. **Drizzle Migration State in DB**:
   - **`__drizzle_migrations` table DOES NOT EXIST** in the live database.
   - **`0000_shocking_echo.sql` HAS NOT BEEN APPLIED** to the live Neon database.
3. **Missing Schema Extensions**:
   - Phase 08 Document Storage: `documents` table is **NOT PRESENT** in the live DB.
   - Super Admin: `invitations` table is **NOT PRESENT** in the live DB.
   - Phase 09 AI Profiling: `document_processing_jobs`, `profile_extractions`, `profile_skill_evidence`, `profile_review_events`, `profile_versions` are **NOT PRESENT** in the live DB.
   - Phase 10 Verification & Readiness: `skill_verification_reviews`, `student_readiness_snapshots`, `recruitment_job_requirements`, `job_eligibility_evaluations` are **NOT PRESENT** in the live DB.
4. **Enum Types in Live DB**:
   - Zero PostgreSQL ENUM types exist in the live DB (`Enum types in public schema: []`). The live DB relies on VARCHAR columns created via Alembic.
5. **Runtime Decoupling**:
   - The Express application in `server/` functions seamlessly during automated testing because services (`file.routes.ts`, `tpo.routes.ts`, `readiness.service.ts`, `eligibility.service.ts`) implement in-memory store fallbacks (`inMemoryDocuments`, in-memory snapshot maps, in-memory job records) when database inserts fail or when running offline.

---

## 4. File Storage Subsystem Initial Findings (Critical Fix D Baseline)

### 4.1 Interface & Provider Abstraction (`IStorageService`)
- Architecture is decoupled via `IStorageService` (`server/src/storage/storage.interface.ts`) with factory resolution in `StorageFactory` (`server/src/storage/storage.factory.ts`).
- **Implementations**:
  1. `LocalStorageEngine` (`server/src/storage/local.storage.ts`): Fully implemented with safe path normalization, 0o700 directory permissions, 0o600 file permissions, SHA-256 checksums, and path traversal prevention.
  2. `S3CompatibleStorageEngine` (`server/src/storage/s3-compatible.storage.ts`): Fully implemented using AWS SDK v3 with `forcePathStyle: true` for Neon Object Storage compatibility.

### 4.2 Storage Security & Access Control
- **Private by Default**: All uploaded documents default to `isPrivate: true` in metadata.
- **Authentication**: All `/api/v1/files/*` endpoints mandate `requireAuth` and `tenantMiddleware`.
- **Tenant Isolation**: Storage keys are structured as `${tenantId}/${documentType}/${prefix}${uniqueId}.${ext}`. Cross-tenant access is rejected with `403 FORBIDDEN_DOCUMENT_ACCESS`.
- **Ownership Gating**: Students can only download or delete documents where `doc.ownerUserId === user.id`.
- **Recruiter Boundaries**: Recruiters can only access placement-relevant documents (`resume`, `placement_document`, `project_evidence`) and are strictly blocked from file deletion (`403 FORBIDDEN_DELETE_PERMISSION`).
- **Upload Safety & Magic Bytes**: Files are inspected for magic signatures (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`). Disguised executables and file size overruns (>5MB) are rejected with 400 errors.
- **In-Memory Buffering**: `multer.memoryStorage()` is utilized; no intermediate temporary files are left on disk.

### 4.3 Render Container Disk Ephemerality
- Render's standard web service containers utilize an **ephemeral filesystem**. Any file written to local disk (`uploads/`) is destroyed whenever the container restarts, deploys, or scales down.
- **Current Operational Reality**: `LocalStorageEngine` is valid strictly for local development and CI testing. Production cloud storage remains in **AWAITING PROVISIONING** status pending user declaration of Neon Object Storage credentials.

---

## 5. Deployment & Environment Initial Findings (Critical Fix E Baseline)

### 5.1 Deployment Configs
- Neither `render.yaml` nor `vercel.json` exists in the repository.
- Proposed configurations must be authored to formalize Render Web Service build/start directives and Vercel SPA routing/security headers under the ₹0 free-tier policy.

### 5.2 Environment Variables & Secrets Hygiene
- **`.gitignore`**: Properly excludes `.env`, `.env.local`, `.dev.vars`, and `*.env` while allowing `.env.example`.
- **Git Tracking**: Verified with `git status` that `.env` and `.env.local` are not tracked.
- **Git History**: Verified with `git log` that no raw database passwords, JWT secrets, or cloud API keys were ever committed.
- **Legacy Artifacts**: `server/.env.example` still references deprecated `MONGODB_URI` and `FALKORDB_URL`, and root `.env.example` contains deprecated `CLOUDFLARE_R2_*` comments.

### 5.3 Active Production Cloudflare Removal
- **Active Express Backend (`server/src/`)**: 0 Cloudflare runtime imports or packages.
- **Frontend Client (`client/src/`)**: 0 Cloudflare dependencies.
- **Standby Edge Runtime (`workers/`)**: Retained strictly as standby for zero-downtime rollback; isolated from `server/`.

### 5.4 Network Security & Health Probes
- **Health Checks**: `/health` and `/api/v1/health` output safe metadata (`status`, `service`, `version`, `timestamp`, `environment`, and `database: 'configured' | 'not-configured'`). Zero database connection strings, hostnames, or internal IPs are exposed.
- **CORS Configuration**: In `server/src/app.ts` (lines 30-49), line 41 unconditionally returns `callback(null, true)` for unmatched origins, effectively rendering the CORS allowlist permissive. This requires immediate hardening.
- **Security Headers**: Standard defense headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`) are set on file streaming but are not registered as global middleware in `server/src/app.ts`.

---

## 6. Audit Sign-Off

All baseline conditions have been documented without bias or false claims. Detailed validation and remediation documentation will proceed in:
- `docs/PHASE_10_2_DATABASE_VALIDATION.md`
- `docs/PHASE_10_2_STORAGE_AND_DEPLOYMENT_AUDIT.md`
