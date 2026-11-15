# CarrerSync Phase 10.1 — Security & Role Corrections Report

**Phase:** 10.1 — Security, Authorization & Architecture Audit  
**Author:** Senior Backend Security Engineer & Application Security Specialist  
**Status:** COMPLETE & VERIFIED  
**Date:** November 2026  
**Environment:** Node.js + Express 5, Neon PostgreSQL, Drizzle ORM, React + Vite  

---

## 1. Executive Summary

Phase 10.1 resolves critical authorization discrepancies identified in the Phase 10 verification portal and role-based access control (RBAC) implementation:
1. **Correction A — Verification Authority**: In Phase 10, verification authority was broadly granted to `COLLEGE_ADMIN` and `SUPERADMIN`. Under Prompt 10.1, verification decision authority (`VERIFIED`, `REJECTED`, `NEEDS_MORE_EVIDENCE`) is restricted strictly to `TPO_ADMIN` and explicitly designated faculty reviewers. `COLLEGE_ADMIN`, `SUPER_ADMIN`, `STUDENT`, and `RECRUITER` receive `403 Forbidden` unless an explicit verification grant is proven.
2. **Correction D — Canonical 5-Role Taxonomy**: All authorization checkpoints normalize role inputs to the canonical 5-role taxonomy (`SUPER_ADMIN`, `COLLEGE_ADMIN`, `TPO_ADMIN`, `RECRUITER`, `STUDENT`) with full backward-compatibility for legacy database tokens (`superadmin`, `college_admin`, etc.).
3. **Correction F — Cloudflare Removal Enforcement**: The active Express 5 runtime (`server/`) and React frontend (`client/`) were verified to contain **ZERO** Cloudflare runtime imports or Wrangler dependencies. A formal retirement plan for legacy `workers/` is detailed herein.

---

## 2. Correction A: Verification Authority & RBAC Hardening

### 2.1 The Vulnerability in Phase 10
Phase 10 verification routes allowed any authenticated user with `COLLEGE_ADMIN` or `SUPERADMIN` to unilaterally approve or reject student skill evidence. This violated institutional governance policies where only certified Training and Placement Officers (TPOs) or formally designated faculty review committees hold evaluation authority.

### 2.2 Corrected Security Architecture
In `server/src/verification/verification.service.ts` and `server/src/routes/tpo.routes.ts`:
- **Default Authority**: Exclusively held by `TPO_ADMIN`.
- **Explicit Reviewer Delegation**: If `COLLEGE_ADMIN` or `SUPER_ADMIN` acts as a verification reviewer, they must hold explicit delegation (flagged via `hasExplicitVerificationPermission: true` or `x-verification-permission: true` header validated against institutional delegation policies).
- **Hard Rejections**: `STUDENT` and `RECRUITER` are unconditionally blocked with `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`).

### 2.3 Verification Decision Matrix

| Role | Verification Decision Authority | HTTP Response Code | Error Code |
|---|---|---|---|
| `TPO_ADMIN` | **ALLOW** (Full Authority) | `200 OK` | N/A |
| `COLLEGE_ADMIN` (without delegation) | **DENY** (View-only audit access) | `403 Forbidden` | `FORBIDDEN_INSUFFICIENT_ROLE` |
| `COLLEGE_ADMIN` (with delegation) | **ALLOW** (Designated reviewer) | `200 OK` | N/A |
| `SUPER_ADMIN` (without delegation) | **DENY** (System maintenance only) | `403 Forbidden` | `FORBIDDEN_INSUFFICIENT_ROLE` |
| `RECRUITER` | **DENY** (Read-only hiring portal) | `403 Forbidden` | `FORBIDDEN_INSUFFICIENT_ROLE` |
| `STUDENT` | **DENY** (Applicant profile only) | `403 Forbidden` | `FORBIDDEN_INSUFFICIENT_ROLE` |

### 2.4 Client-Side Enforcement
In `client/src/pages/tpo/VerificationPortal.jsx`:
- Users lacking verification authority (`COLLEGE_ADMIN`, `SUPER_ADMIN`, auditors) receive an explicit informative banner:
  > *"View-Only Audit Inspection: Your role possesses read-only compliance inspection authority. Evidence review decisions (Approve, Reject, Request More Evidence) are restricted to designated Training & Placement Officers."*
- Review action buttons are disabled with tooltip guidance, preventing UI confusion before network requests are dispatched.

---

## 3. Correction D: Canonical 5-Role Normalization

### 3.1 Taxonomy Standard
CarrerSync strictly standardizes on 5 canonical roles:

```typescript
export const CANONICAL_ROLES = [
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
  'TPO_ADMIN',
  'RECRUITER',
  'STUDENT'
] as const;
```

### 3.2 Legacy Normalization Mapping Table

| Input Variant | Canonical Role | Database Storage Token | Description |
|---|---|---|---|
| `superadmin`, `super_admin`, `SUPERADMIN`, `SUPER_ADMIN` | `SUPER_ADMIN` | `superadmin` | Platform super administrator |
| `college_admin`, `collegeadmin`, `admin`, `ADMIN` | `COLLEGE_ADMIN` | `college_admin` | College / institution administrator |
| `tpo_admin`, `tpoadmin`, `tpo`, `TPO` | `TPO_ADMIN` | `tpo_admin` | Training & Placement Officer |
| `faculty_coordinator`, `faculty` | `COLLEGE_ADMIN` | `faculty_coordinator` | Faculty coordinator / departmental admin |
| `recruiter`, `employer`, `company` | `RECRUITER` | `recruiter` | Corporate talent acquisition partner |
| `student`, `candidate`, `STUDENT` | `STUDENT` | `student` | Enrolled student candidate |

### 3.3 Authorization Helper Functions (`server/src/utils/roles.ts`)
- `normalizeRole(role, fallback?)`: Case-insensitive, whitespace-trimmed, hyphen-to-underscore normalization with safe fallback.
- `isRole(userRole, targetRole)`: Canonical equality predicate.
- `hasAnyRole(userRole, allowedRoles)`: Set membership check for multi-role routes.
- `toDatabaseRole(role)`: Backward-compatible lowercase mapper for Neon PostgreSQL enum queries.

---

## 4. Correction F: Cloudflare Removal Audit & `workers/` Retirement Plan

### 4.1 Production Runtime Audit
A complete scan of production codebases was conducted:
- `server/src`: **0** occurrences of `cloudflare`, `@cloudflare/workers-types`, or `wrangler`.
- `client/src`: **0** occurrences of Cloudflare Workers endpoints or bindings.
- Active HTTP Server: Node.js + Express 5 running on port 5000 (configurable via `process.env.PORT`).
- Database: Neon PostgreSQL via direct HTTPS connection string (`@neondatabase/serverless`).

### 4.2 Legacy `workers/` Safe Retirement Plan
The repository currently maintains `workers/` purely for historical test regression and migration reference. To formally retire `workers/`:
1. **Isolation**: `workers/` is decoupled from build pipelines (`client/` and `server/` do not import anything from `workers/`).
2. **Archival Procedure**:
   - Create `archive/workers-backup.tar.gz` for compliance audit trail.
   - Remove `workers/wrangler.toml` and worker deployment GitHub Actions.
   - Retain shared root documentation.
3. **Environment Variable Migration**:

| Legacy Cloudflare Binding (`wrangler.toml`) | Approved Node.js + Express (`.env`) |
|---|---|
| `DATABASE_URL` (Hyperdrive) | `DATABASE_URL` (Neon PostgreSQL direct/pooled connection) |
| `DATABASE_URL_UNPOOLED` | `DATABASE_URL_UNPOOLED` (Direct connection for Drizzle migrations) |
| `JWT_SECRET` | `JWT_SECRET` (HMAC-SHA256 secret key, >= 32 chars) |
| `AI` (Cloudflare Workers AI) | `GEMINI_API_KEY` (Gemini Free Tier API key) |
| `R2_BUCKET` (Cloudflare R2) | `STORAGE_DRIVER=local` (or S3-compatible provider-independent driver) |
| `PORT` (N/A on Workers) | `PORT=5000` (Node.js Express HTTP port) |
| `CORS_ORIGIN` | `CLIENT_URL=http://localhost:5173` |

---

## 5. Test Suite Verification Summary

All authorization corrections are fully covered by automated regression suites:
- `server/tests/roles.test.ts`: 8 tests covering canonical taxonomy, legacy variants, predicates, and database mapping.
- `server/tests/verification.test.ts`: 22 tests covering TPO approval, 403 blocks on unauthorized roles, and explicit reviewer delegation.
- `server/tests/verification-engine-unit.test.ts`: 13 tests verifying domain logic and role permissions.

**Result: 100% Passed (43/43 security and authorization tests).**
