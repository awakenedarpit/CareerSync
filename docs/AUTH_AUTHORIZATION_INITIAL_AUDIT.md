# Auth & Authorization Initial Audit — CareerSync
**Auditor:** auth-auditor agent  
**Date:** 2026-11-16  
**Scope:** Full read-only inspection of auth middleware, routes, services, schema, frontend, and database layer  
**Status:** COMPLETE

---

## 1. Executive Summary

CareerSync has a solid JWT + bcrypt foundation with multi-tenant isolation, but contains **several exploitable vulnerabilities** and **critical functional gaps** that must be fixed before production use.

### Top Critical Findings (ordered by severity)

| # | Severity | Finding |
|---|----------|---------|
| 1 | **P0 — CVE-level** | Login offline/demo fallback accepts `role` from request body and issues a real JWT with that role — **anyone who hits a misconfigured/DB-less server can mint a `superadmin` token** |
| 2 | **P0 — CVE-level** | `POST /api/v1/tenants/` and `GET /api/v1/tenants/` carry **no authentication or authorization middleware** — any anonymous user can list all tenants or create new ones |
| 3 | **P0 — Auth bypass** | Login page (`Login.jsx`) does **not call the backend at all** — `handleLogin()` just calls `navigate()` on form submit, bypassing all credential verification |
| 4 | **P1 — Auth gap** | Register page (`Register.jsx`) does **not call the backend** either — just navigates on submit; `authService.register()` exists but is never wired |
| 5 | **P1 — Privilege escalation** | Public `POST /api/v1/auth/register` accepts `role` from the request body. While `superadmin` is blocked, any caller can self-register as `college_admin`, `faculty_coordinator`, or `recruiter` without any invitation or approval gate |
| 6 | **P1 — Wrong status code bug** | `GET /api/v1/super-admin/stats` responds with **HTTP 409** (not 200) on success — a copy-paste error that breaks every admin dashboard consuming this endpoint |
| 7 | **P1 — Token storage** | JWT is stored in `localStorage` — susceptible to XSS exfiltration; no HttpOnly cookie path exists |
| 8 | **P1 — No token refresh** | JWT expiry is 2 hours; no refresh token mechanism exists; users are silently logged out |
| 9 | **P2 — Role inconsistency** | Routes use a mix of `'STUDENT'`, `'student'`, `'tpo_admin'`, `'TPO_ADMIN'` — `normalizeRole()` bridges this but the dual-system is fragile |
| 10 | **P2 — Superadmin in-memory only** | No `db:seed` script exists; the only way to get a superadmin user is via the in-memory mock store (offline mode); the system has no documented out-of-band provisioning path |

---

## 2. JWT & Token Management

### Algorithm & Secret
- **Algorithm:** `HS256` — symmetric, acceptable for single-service deployments
- **Secret source:** `env.JWT_SECRET` → fallback `'carrersync_jwt_default_secret_dev_key_32_chars'`
- **Hardcoded fallback secret is in source code** (crypto.ts, auth.ts, tenant.ts, auth.routes.ts, all in multiple places)
- `env.ts` emits a **`console.warn`** in production if the default is detected — this is a warning only, not a startup failure. Must be a hard error in production.
- **Expiry:** 2 hours (`DEFAULT_EXPIRY_SECONDS = 7200`) — reasonable, but no refresh mechanism

### JWT Payload Claims
```json
{
  "sub": "<userId>",
  "tenant_id": "<uuid>",
  "role": "<role>",
  "email": "<email>",
  "hasVerificationPermission": false,
  "isDelegatedReviewer": false,
  "iat": 1700000000,
  "exp": 1700007200
}
```
- `sub`, `tenant_id`, `role` are verified as present in `requireAuth` ✅
- `hasVerificationPermission` is set **from the JWT claim itself** in auth.ts line 57 — this means if someone crafts a JWT with this claim set to `true` (possible if they know the secret), they get reviewer access

### Verification
- `verifyJwtToken()` uses `{ algorithms: ['HS256'] }` — algorithm pinning is correct ✅
- Throws on tamper, expiry, or invalid signature ✅

### Token Storage (Frontend)
| Location | Method | Risk |
|----------|--------|------|
| `localStorage['token']` | `setToken()` in authService.js | **HIGH — XSS-extractable** |
| `localStorage['tenant_id']` | Side effect of `setToken()` | Medium |
| `localStorage['role']` | Side effect of `setToken()` | Medium — if any code trusts this directly |
| `localStorage['user']` | JSON blob of user object | Medium |

> [!CAUTION]
> `role` and `tenant_id` stored separately in localStorage are **not authoritative** — they are just copies for UI convenience. The backend correctly derives them from the JWT. However, if any frontend logic gates UI on `localStorage.getItem('role')` without re-validating the JWT, privilege escalation on the client side is possible.

### Token Refresh
- **Not implemented.** There is no `/auth/refresh` endpoint.
- `isAuthenticated()` in authService.js does client-side expiry checking and calls `logout()` — but only when explicitly called. There is no automatic background refresh.

---

## 3. Route Protection Matrix

### Auth Routes (`/api/v1/auth/*`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| `/auth/register` | POST | ❌ No | None | None | **P1** — accepts arbitrary `role` from body; `faculty_coordinator` and `recruiter` self-registration open |
| `/auth/login` | POST | ❌ No | None | None | **P0** — offline mode uses `role` from body to issue JWT |
| `/auth/me` | GET | ✅ Yes | Any | `requireAuth` | OK |
| `/auth/logout` | POST | ❌ No | None | None | Intentional (stateless); minor: no token blacklisting |
| `/auth/invitation/:token` | GET | ❌ No | None | None | Acceptable — public token validation |
| `/auth/invitations/:token` | GET | ❌ No | None | None | Acceptable — duplicate path alias |
| `/auth/invitation/accept` | POST | ❌ No | None | None | Acceptable — redeems invitation token |
| `/auth/invitations/accept` | POST | ❌ No | None | None | Acceptable — duplicate path alias |

### Tenant Routes (`/api/v1/tenants/*`) ⚠️ CRITICAL
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| `/tenants/` | GET | ❌ **MISSING** | ❌ None | None | **P0** — lists all institutions to any anonymous caller |
| `/tenants/` | POST | ❌ **MISSING** | ❌ None | None | **P0** — any anonymous caller can create a tenant |
| `/tenants/:id` | GET | ❌ **MISSING** | ❌ None | None | **P1** — public tenant detail lookup |

### Super Admin Routes (`/api/v1/super-admin/*`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| All routes | * | ✅ Yes | `superadmin` | `requireAuth`, `requireRole(['superadmin'])` | ✅ Correctly protected via router-level `.use()` |
| `/stats` | GET | ✅ Yes | `superadmin` | Above | **P1 Bug** — returns HTTP 409 on success instead of 200 |

### Student Profile Routes (`/api/v1/student/profile/*`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| All routes | * | ✅ Yes | `STUDENT` | `requireAuth`, `tenantMiddleware`, `requireRole(['STUDENT'])` | ✅ Correctly protected |

### TPO Routes (`/api/v1/tpo/*`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| All verification | * | ✅ Yes | Varies | `requireAuth`, `tenantMiddleware` + inline role check | Missing explicit `requireRole` — inline check only |
| All readiness | * | ✅ Yes | Varies | `requireAuth`, `tenantMiddleware` + inline | Same |

### Job Routes (`/api/v1/jobs/*`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| All | * | ✅ Yes | None checked | `requireAuth` | **P1** — authenticated but no role restriction; student could potentially write job postings |

### Recruiter Routes (`/api/v1/recruiter/*`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| All | * | ✅ Yes | None via middleware | `requireAuth` | **P2** — relies on inline checks; no router-level role guard |

### Health Route (`/api/v1/health`)
| Route | Method | Auth Required | Role Required | Middleware Applied | Issues |
|-------|--------|---------------|---------------|--------------------|--------|
| `/health` | GET | ❌ No | None | None | Intentional — acceptable for liveness probes. Leaks `environment` and `database` config status |

### Other Routes Summary
| Route Group | Auth | Role Guard | Notes |
|-------------|------|------------|-------|
| `/api/v1/profiling` | ✅ | None via middleware | Inline checks only |
| `/api/v1/readiness` | ✅ | None via middleware | Inline checks only |
| `/api/v1/notifications` | ✅ | None | Any authed user |
| `/api/v1/alumni` | ✅ | None | Any authed user |
| `/api/v1/peer-interviews` | ✅ | None | Any authed user |
| `/api/v1/collaboration` | ✅ | None | Any authed user |
| `/api/v1/moderation` | ✅ | None | Any authed user — should be TPO-restricted |
| `/api/v1/orchestration` | ✅ | None | Any authed user — should be admin/TPO |
| `/api/v1/tpo/fairness` | ✅ | None via router | Inline only |
| `/api/v1/tpo/accreditation` | ✅ | None via router | Inline only |

---

## 4. In-Memory Store Inventory

All in-memory stores are defined in `server/src/routes/superadmin.routes.ts` as module-level `export const` arrays. They are used as fallbacks when `DATABASE_URL` is not set.

| Variable | Type | Entity | File | Scope | Severity |
|----------|------|--------|------|-------|----------|
| `mockColleges` | `MockCollege[]` | Tenant/Institution records | superadmin.routes.ts | Module-level, process lifetime | **P1** — survives across requests but resets on restart |
| `mockUsers` | `MockUser[]` | User accounts | superadmin.routes.ts | Module-level, process lifetime | **P0** — includes hardcoded `superadmin@carrersync.com` account; writable by accept-invitation path |
| `mockInvitations` | `MockInvitation[]` | Invitations | superadmin.routes.ts | Module-level, process lifetime | **P1** — includes real-looking tokens |
| `mockAuditLogs` | `MockAuditLog[]` | Audit log entries | superadmin.routes.ts | Module-level, process lifetime | P2 |
| `mockSettings` | `Record<string, unknown>` | Platform settings | superadmin.routes.ts | Module-level, `let` — mutable | P2 |

> [!WARNING]
> The `mockUsers` array contains a seeded `superadmin@carrersync.com` account and is exported. The `auth.routes.ts` invitation-accept path mutates this array via `mockUsers.unshift(newMockUser)`. This means in offline mode, **invitation acceptance creates real-looking in-memory users** that persist only for the life of the process. Any restart wipes them. This is a functional blocker if the app is used without a DB.

> [!IMPORTANT]
> The `mockInvitations` array is also exported and directly imported by `auth.routes.ts` for the invitation validation/accept offline flow. This cross-module mutable shared state is an architectural concern: two route files share and mutate the same in-memory array.

---

## 5. Role Name Consistency Report

### Defined Canonical Roles (schema.ts `userRoleEnum`)
```
superadmin | college_admin | tpo_admin | faculty_coordinator | recruiter | student | alumni
```

### Role Names Used in JWT (`role` claim)
Lowercase database names: `superadmin`, `college_admin`, `tpo_admin`, `faculty_coordinator`, `recruiter`, `student`, `alumni`

### Role Names Used in Middleware Calls

| File | `requireRole()` call | Normalized to |
|------|----------------------|---------------|
| superadmin.routes.ts | `['superadmin']` | `SUPER_ADMIN` ✅ |
| student-profile.routes.ts | `['STUDENT']` | `STUDENT` ✅ |
| institutional.routes.ts | `['college_admin', 'superadmin']` | `COLLEGE_ADMIN`, `SUPER_ADMIN` ✅ |
| tpo.routes.ts | Inline check only | — |
| moderation.routes.ts | None | — ⚠️ |

### `normalizeRole()` Mapping (roles.ts)
| Input | Output |
|-------|--------|
| `superadmin` | `SUPER_ADMIN` ✅ |
| `college_admin` | `COLLEGE_ADMIN` ✅ |
| `tpo_admin` | `TPO_ADMIN` ✅ |
| `faculty_coordinator` | `COLLEGE_ADMIN` ⚠️ **loses distinction** |
| `recruiter` | `RECRUITER` ✅ |
| `student` | `STUDENT` ✅ |
| `alumni` | `ALUMNI` ✅ |

> [!WARNING]
> `faculty_coordinator` normalizes to `COLLEGE_ADMIN`. This means any `requireRole(['COLLEGE_ADMIN'])` check will also pass for faculty coordinators, **even if that endpoint should be college_admin-only**. This silent aliasing could grant unintended access.

### Role Absent from Schema but Referenced
- `tpo` (alias) — handled by `normalizeRole()` → `TPO_ADMIN`
- `admin` (alias) — handled by `normalizeRole()` → `COLLEGE_ADMIN`
- `ALUMNI` — defined in `normalizeRole()` and `ALL_ROLES` but absent from `CANONICAL_ROLES` array

### RegisterSchema allowed roles
```
student | college_admin | faculty_coordinator | recruiter | superadmin
```
Note: `tpo_admin` and `alumni` are **not in RegisterSchema**. `tpo_admin` can only be created via superadmin user creation or invitation. This is intentional but undocumented.

---

## 6. Frontend Auth Analysis

### Login.jsx — ⚠️ No real auth
```jsx
const handleLogin = (e) => {
  e.preventDefault();
  if (selectedRole === 'student') navigate('/student');
  else if (selectedRole === 'admin') navigate('/admin');
  else navigate('/recruiter');
};
```
- **Does not call `authService.login()` or any API endpoint**
- Does not validate credentials
- Does not store a JWT
- Simply navigates by selected role
- **Any user clicking the button enters the portal with no authentication**

### Register.jsx — ⚠️ No real registration
```jsx
const handleRegister = (e) => {
  e.preventDefault();
  if (role === 'student') navigate('/student');
  else navigate('/recruiter');
};
```
- Same problem — no backend call, no account creation, no JWT

### authService.js — ✅ Correctly implemented but unused by UI
| Function | Implementation | Used by Login.jsx/Register.jsx? |
|----------|---------------|--------------------------------|
| `login()` | Calls `POST /api/v1/auth/login`, stores JWT | ❌ Not called |
| `register()` | Calls `POST /api/v1/auth/register`, stores JWT | ❌ Not called |
| `getToken()` | Reads from localStorage, strips Bearer prefix | — |
| `setToken()` | Stores token + user + tenantId + role in localStorage | — |
| `logout()` | Clears all storage keys | — |
| `isAuthenticated()` | Client-side JWT expiry check | — |
| `ensureAuthenticatedSession()` | Auto-logs in with `DEMO_CREDENTIALS` | — |

### DEMO_CREDENTIALS (authService.js, hardcoded)
```js
const DEMO_CREDENTIALS = {
  student:  { email: 'priya.sharma21@college.edu', password: 'Password@123', role: 'student' },
  admin:    { email: 'head.tnp@college.edu',       password: 'Password@123', role: 'college_admin' },
  recruiter:{ email: 'sarah.j@google.com',         password: 'Password@123', role: 'recruiter' }
};
```
- **Frontend only** — these are NOT hardcoded in the backend
- No matching users exist in the DB (no seed script)
- `ensureAuthenticatedSession()` auto-attempts login with these — if the backend is live but DB has no matching users, it falls into error silently

### api.js (Axios interceptor) — ✅ Mostly correct
- Attaches `Authorization: Bearer <token>` from localStorage ✅
- Attaches `X-Tenant-ID` from localStorage ✅
- On 401 with `TOKEN_VERIFICATION_FAILED` or `EMPTY_BEARER_TOKEN`, removes token from storage ✅
- **Gap:** Does not redirect to `/login` on 401 — leaves user in an authenticated-looking but non-functional state
- **Gap:** Does not handle `MISSING_BEARER_TOKEN` or `MALFORMED_CLAIMS` codes — token only removed for two specific codes

---

## 7. Database Schema Summary

### Tables Defined in schema.ts (partial — large schema)

| Table | Key Auth/Tenant Columns | Notes |
|-------|------------------------|-------|
| `tenants` | `id`, `slug`, `isActive`, `isSuspended` | Root isolation unit |
| `users` | `tenantId (FK)`, `email`, `passwordHash`, `role (enum)`, `isActive`, `isVerified` | Unique index on `(tenantId, email)` |
| `students` | `tenantId (FK)`, `userId (FK, unique)` | 1:1 with users |
| `skills` | — | Global, no tenant column |
| `auditEvents` | `tenantId`, `actorId`, `actorEmail` | Audit trail |
| `invitations` | `tenantId`, `email`, `role`, `token`, `status`, `expiresAt` | Used for user onboarding |
| + ~40 more tables | Various `tenantId` FKs | Phase 9–17 tables |

### Key Schema Observations
- `users.role` uses `userRoleEnum` — DB-enforced enum, not freeform string ✅
- `users` unique constraint: `(tenantId, email)` — same email allowed across different tenants ✅
- `users.isVerified` defaults to `false`; set to `true` only for `college_admin` on direct registration and all invitation accepts
- **No `refreshTokens` table** — confirms no refresh token system
- **No `sessions` table** — stateless JWT only
- **No `passwordResetTokens` table** — no password reset flow in DB

### Migration Status
9 migrations applied (0000–0008), all using Drizzle Kit v7 format. Last migration: `0008_numerous_morg`. Migrations appear to track the growing phase-based schema additions.

> [!NOTE]
> No `db:migrate` script in `server/package.json`. Only `db:generate` exists. There is no `db:push`, `db:seed`, or `db:migrate` script. Migrations must be applied manually or via an external Drizzle Kit command not documented in package.json.

### Seed Script
- **No seed script exists** in `server/src/db/`, `server/scripts/`, or anywhere in the project.
- The in-memory `mockUsers` and `mockColleges` serve as the only "demo data" and only when `DATABASE_URL` is unset.

---

## 8. Prioritized Fix List

### P0 — Security Breach (Fix before any production exposure)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| P0-1 | `auth.routes.ts` L368 | **Login offline mode uses `role` from request body to issue real JWT** — `const assignedRole = parseResult.data.role \|\| 'student'` | Remove `role` from `LoginSchema`; offline mode must default to `'student'` and never accept client-supplied role |
| P0-2 | `tenant.routes.ts` | **`GET /` and `POST /` have no auth middleware** — anyone can list or create tenants | Add `requireAuth` + `requireRole(['superadmin'])` to `POST /`; `GET /` should require auth at minimum |
| P0-3 | `Login.jsx` L24-29 | **Login form does not call the backend** — navigation-only, zero authentication | Wire `handleLogin` to call `authService.login()` with real credentials |

### P1 — Functional Blocker

| ID | File | Issue | Fix |
|----|------|-------|-----|
| P1-1 | `auth.routes.ts` L21-32 | **Register allows `college_admin` and `recruiter` self-registration** without invitation | Add invitation-token gate for privileged roles; student self-registration is acceptable |
| P1-2 | `Register.jsx` L23-27 | **Register form does not call the backend** — zero account creation | Wire `handleRegister` to call `authService.register()` |
| P1-3 | `superadmin.routes.ts` L505 | **`GET /stats` returns HTTP 409 on success** — copy-paste error `res.status(409).json({ success: true, stats })` | Change to `res.status(200).json(...)` |
| P1-4 | `authService.js` | **JWT stored in localStorage** — XSS-extractable | Move to `HttpOnly` cookie via backend `Set-Cookie`; or at minimum use `sessionStorage` |
| P1-5 | No file | **No token refresh mechanism** — 2-hour expiry means frequent logouts | Add `POST /auth/refresh` with rotating refresh tokens stored in DB |
| P1-6 | No file | **No `db:seed` or `db:migrate` script** — no way to get demo data into real DB | Create idempotent seed script covering all 6 roles; add `db:migrate` and `db:seed` scripts to `package.json` |
| P1-7 | `superadmin.routes.ts` | **In-memory stores are cross-request mutable shared state** shared with `auth.routes.ts` via import | Only valid for offline testing; guard with `if (process.env.NODE_ENV !== 'test')` warning, or remove entirely in favour of DB |
| P1-8 | `api.js` L57-63 | **401 interceptor does not redirect to login** — user stays on page with expired session | Add `window.location.href = '/auth/login'` after clearing token on 401 |

### P2 — Improvement / Hardening

| ID | File | Issue | Fix |
|----|------|-------|-----|
| P2-1 | `env.ts` / `crypto.ts` | **Default JWT secret present in source code** in 4+ places; `console.warn` is not enough | Make missing/default `JWT_SECRET` in production a hard startup failure (`process.exit(1)`) |
| P2-2 | `roles.ts` L44 | **`faculty_coordinator` silently maps to `COLLEGE_ADMIN`** — unintended privilege grant | Give `faculty_coordinator` its own canonical role or document the deliberate aliasing |
| P2-3 | `auth.ts` L57 | **`hasVerificationPermission` derived from JWT claim** — if secret leaks, attacker can self-grant reviewer access | Store delegation state only in DB; remove it from JWT payload |
| P2-4 | `tpo.routes.ts` | **Role checks are inline per-handler** rather than router-level `requireRole` | Move to router-level `use()` for consistency and defence-in-depth |
| P2-5 | `tenant.middleware.ts` L70 | **Tenant spoofing check uses string `'superadmin'`** not canonical `ROLES.SUPER_ADMIN` | Use `normalizeRole(authUser.role) === 'SUPER_ADMIN'` for consistency |
| P2-6 | `moderation.routes.ts` | **Moderation routes require auth but no role check** — any authenticated user can moderate | Add `requireRole(['tpo_admin', 'college_admin'])` |
| P2-7 | `orchestration.routes.ts` | **Orchestration routes require auth but no role check** | Add `requireRole(['tpo_admin', 'college_admin', 'superadmin'])` |
| P2-8 | `auth.routes.ts` L421 | **`/auth/me` returns 200 on user-not-found** — returns `{ success: false, error: '...' }` with status 200 | Should be `res.status(404)` |
| P2-9 | `health.routes.ts` | Health endpoint leaks `database: 'configured'/'not-configured'` and `environment` | Move to authenticated endpoint or strip sensitive fields |
| P2-10 | `api.js` | **`X-Tenant-ID` header is sent with every request including login** — before the JWT is obtained | Only send after authentication; for login/register, let the backend derive it from the body |
| P2-11 | None | **No CSRF protection** — cookies (once added) will need `SameSite=Strict` and CSRF tokens | Plan CSRF strategy when moving to cookie-based auth |
| P2-12 | None | **No rate limiting** on `/auth/login` and `/auth/register` | Add rate limiting middleware (e.g., `express-rate-limit`) |

---

## Appendix A: Superadmin Provisioning Gap

The registration endpoint explicitly blocks `superadmin` self-registration with a clear message. However, there is **no documented out-of-band path** to create a superadmin in the real database. The only path:

1. Direct SQL `INSERT` into the `users` table with `role = 'superadmin'`
2. Using the in-memory mock (offline mode only — not persisted)
3. The superadmin route `POST /super-admin/users` creates users — but this requires an existing superadmin JWT to call it (chicken-and-egg)

**Recommendation:** Create a one-time CLI seeder (`server/scripts/seed-superadmin.ts`) invoked as `npx tsx scripts/seed-superadmin.ts` with environment-driven email/password, to be run once on first deployment.

---

## Appendix B: Files Inspected

```
server/src/middleware/auth.ts
server/src/middleware/tenant.ts
server/src/middleware/error.ts
server/src/routes/auth.routes.ts
server/src/routes/superadmin.routes.ts
server/src/routes/tenant.routes.ts
server/src/routes/health.routes.ts
server/src/routes/student-profile.routes.ts
server/src/routes/tpo.routes.ts
server/src/routes/job.routes.ts
server/src/routes/recruiter.routes.ts
server/src/routes/alumni.routes.ts
server/src/routes/moderation.routes.ts
server/src/routes/orchestration.routes.ts
server/src/routes/institutional.routes.ts
server/src/db/schema.ts
server/src/db/client.ts
server/src/db/index.ts
server/src/utils/crypto.ts
server/src/utils/roles.ts
server/src/config/env.ts
server/drizzle/meta/_journal.json
server/package.json
client/src/services/authService.js
client/src/services/api.js
client/src/pages/auth/Login.jsx
client/src/pages/auth/Register.jsx
server/src/app.ts (entry point, route mounting)
```
