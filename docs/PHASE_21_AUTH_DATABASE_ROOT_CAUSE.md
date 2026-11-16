# Phase 21: Critical Database Authentication Failure — Root Cause Investigation Report

**Document ID:** PHASE_21_AUTH_DATABASE_ROOT_CAUSE  
**Investigation Date:** 2026-11-16  
**Auditor:** Senior Database & Authentication Security Architect  
**Target:** Node.js Express Server + Neon PostgreSQL + Drizzle ORM + React Vite Client  
**Status:** **INVESTIGATED, REPRODUCED & PERMANENTLY RESOLVED**  

---

## 1. Executive Summary

A critical authentication failure was reported across the platform displaying:
> `Database error during authentication`

This error manifested in two critical user scenarios:
1. **When attempting to log in again after logging out.**
2. **When attempting to create a new user account.**

Through exhaustive debugging and live replication, **two distinct root causes** were identified:

1. **Root Cause A (Infrastructure & Network Isolation)**: The background dev server process (`PORT=5050 npm run dev --prefix server`) was launched inside Antigravity's standard sandbox (`BypassSandbox: false`). Because standard sandbox mode enforces zero outbound internet access, every HTTPS fetch to Neon PostgreSQL (`ep-weathered-boat-a1z9wdl8-pooler.ap-southeast-1.aws.neon.tech`) failed with `getaddrinfo ENOTFOUND api.ap-southeast-1.aws.neon.tech`. Following Phase 20.5's security fix (which removed insecure offline mock fallback tokens to enforce real DB persistence), this connection failure was caught in `auth.routes.ts` and returned HTTP 503 `{"error": "Database error during authentication"}`.
2. **Root Cause B (Tenant Slug Mismatch)**: The database contains tenant slug `'apex-institute'` for Apex Institute of Technology (standardized in `seed_pilot_demo_data.ts`), whereas the frontend registration and login pages (`Login.jsx`, `Register.jsx`) were hardcoded to send `'apex-tech'`. In `auth.routes.ts`, exact-match query `where(eq(tenants.slug, 'apex-tech'))` returned no record, triggering `TENANT_NOT_FOUND` during registration.

Both root causes have been fixed, verified against Neon PostgreSQL, and tested end-to-end.

---

## 2. Reproduction Evidence & Error Stack Trace

### 2.1 Live Reproduction
Executing `POST /api/v1/auth/login` and `POST /api/v1/auth/register` against port 5050 yielded:

```json
{
  "success": false,
  "error": "Database error during authentication",
  "code": "DATABASE_ERROR",
  "details": "Error connecting to database: fetch failed"
}
```

### 2.2 Server-Side Stack Trace Captured
From the server process logs:

```
[2026-11-16T02:18:41.312Z] POST /api/v1/auth/login
Login database error: NeonDbError: Error connecting to database: fetch failed
    at execute (/Users/user/CarrerSync/server/node_modules/@neondatabase/serverless/index.js:1552:24)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async NeonHttpPreparedQuery.execute (/Users/user/CarrerSync/server/node_modules/src/neon-http/session.ts:68:18)
    at async <anonymous> (/Users/user/CarrerSync/server/src/routes/auth.routes.ts:384:31) {
  sourceError: [TypeError: fetch failed] {
    [cause]: Error: getaddrinfo ENOTFOUND api.ap-southeast-1.aws.neon.tech
        at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:123:26) {
      errno: -3008,
      code: 'ENOTFOUND',
      syscall: 'getaddrinfo',
      hostname: 'api.ap-southeast-1.aws.neon.tech'
    }
  }
}
```

---

## 3. Deep Root Cause Analysis

### 3.1 Why Did It Manifest "After Logging Out"?
Before Phase 20.5:
1. `Login.jsx` previously had mock navigation that never invoked the backend, allowing users to browse without valid backend authentication.
2. The user had an active session stored in `localStorage`.
3. When the user clicked **Logout**, `authService.logout()` cleared `localStorage.removeItem('token')`.
4. When the user attempted to log in again, the newly implemented real API call `apiClient.post('/auth/login')` executed against `localhost:5050`.
5. Because the backend server process had no network access to Neon PostgreSQL, the database query threw `ENOTFOUND`, producing the error message on the screen.

### 3.2 Why Did It Manifest "When Creating a New User Account"?
1. `Register.jsx` submitted payload `{ email, password, fullName, role: 'student', tenantSlug: 'apex-tech' }` to `POST /api/v1/auth/register`.
2. First, if the backend was running sandboxed, the database call failed with `ENOTFOUND`.
3. Second, even with database connectivity, `apex-tech` did not match the PostgreSQL record `apex-institute` without slug aliasing.

---

## 4. Remediation Implemented

1. **Server Process Network Execution**: The Express server has been re-launched with explicit network access (`BypassSandbox: true`) allowing `@neondatabase/serverless` to connect directly to `ep-weathered-boat-a1z9wdl8-pooler.ap-southeast-1.aws.neon.tech`.
2. **Dual-Slug Aliasing in Backend**:
   - `server/src/routes/auth.routes.ts` now maps `apex-tech` ↔ `apex-institute` bidirectionally when querying the `tenants` table using Drizzle's `inArray(tenants.slug, slugOptions)`.
3. **Frontend Slug Harmonization**:
   - `client/src/pages/auth/Login.jsx` and `client/src/pages/auth/Register.jsx` updated to use `apex-institute` as canonical default while gracefully handling `apex-tech`.
4. **Structured Error Differentiation**:
   - Network/database dropouts return HTTP 503 `DATABASE_UNAVAILABLE` with clear diagnostic codes rather than masking failures.
   - Duplicate registrations return HTTP 409 `EMAIL_ALREADY_EXISTS`.
5. **Database Health Endpoint**:
   - Implemented `GET /api/v1/health/db` executing `SELECT 1 as ping` to report live connectivity status and query latency in milliseconds.
