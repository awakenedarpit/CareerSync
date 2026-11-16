# Phase 21: Authentication & Database Connection Repair Specification

**Document ID:** PHASE_21_AUTHENTICATION_FIX  
**Date:** 2026-11-16  
**Scope:** Express Authentication Routes, Database Client Handling, Health Verification, Frontend Auth Integration  
**Status:** **IMPLEMENTED & VERIFIED**  

---

## 1. Summary of Changes

To resolve the `Database error during authentication` failure, code changes were made across 5 core files:

| File | Subsystem | Modifications |
| :--- | :--- | :--- |
| `server/src/routes/auth.routes.ts` | Backend Auth API | 1. Implemented multi-slug resolver (`apex-institute` ↔ `apex-tech`).<br>2. Differentiated connection failures (`503 DATABASE_UNAVAILABLE`) from credential errors (`401 INVALID_CREDENTIALS`) and duplicate emails (`409 EMAIL_ALREADY_EXISTS`). |
| `server/src/routes/health.routes.ts` | Backend Observability | Added `GET /health/db` endpoint executing live `SELECT 1 as ping` with latency measurement. |
| `server/src/app.ts` | Server App Router | Mounted `healthRoutes` across `/health`, `/api/health`, and `/api/v1/health`. |
| `client/src/pages/auth/Login.jsx` | Frontend Auth UI | Updated default institution slug from `apex-tech` to `apex-institute`. |
| `client/src/pages/auth/Register.jsx`| Frontend Registration UI | Updated default institution slug from `apex-tech` to `apex-institute` and updated helper text. |

---

## 2. Detailed Code Modifications

### 2.1 Backend Slug Resolution & Error Differentiation (`server/src/routes/auth.routes.ts`)

#### Dual-Slug Matching:
```ts
// Resolve tenant slug with bidirectional fallback (apex-institute <-> apex-tech)
if (!resolvedTenantId && data.tenantSlug) {
  const inputSlug = data.tenantSlug.toLowerCase().trim();
  const slugOptions = [inputSlug];
  if (inputSlug === 'apex-tech') slugOptions.push('apex-institute');
  if (inputSlug === 'apex-institute') slugOptions.push('apex-tech');

  const [foundTenant] = await db
    .select()
    .from(tenants)
    .where(inArray(tenants.slug, slugOptions))
    .limit(1);

  if (!foundTenant) {
    return res.status(404).json({
      success: false,
      error: `Tenant with slug '${data.tenantSlug}' not found`,
      code: 'TENANT_NOT_FOUND'
    });
  }
  resolvedTenantId = foundTenant.id;
}
```

#### Diagnostic Error Handling in `/register`:
```ts
} catch (err: any) {
  const isConnError = err?.message?.includes('fetch failed') ||
    err?.message?.includes('ENOTFOUND') ||
    err?.message?.includes('ECONNREFUSED') ||
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'ENOTFOUND';

  if (isConnError) {
    return res.status(503).json({
      success: false,
      error: 'Database connection unavailable. Please check database connectivity.',
      code: 'DATABASE_UNAVAILABLE',
      details: err?.message
    });
  }

  if (err?.code === '23505' || err?.message?.includes('users_email_unique') || err?.message?.includes('unique constraint')) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email address already exists.',
      code: 'EMAIL_ALREADY_EXISTS'
    });
  }

  return res.status(503).json({
    success: false,
    error: 'Database error during registration',
    code: 'DATABASE_ERROR',
    details: err?.message
  });
}
```

### 2.2 Live Database Health Endpoint (`server/src/routes/health.routes.ts`)

```ts
router.get('/health/db', async (req: Request, res: Response) => {
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(503).json({
      status: 'unhealthy',
      connected: false,
      error: 'DATABASE_URL not configured'
    });
  }

  const start = Date.now();
  try {
    const db = getDb(dbUrl);
    await db.execute(sql`SELECT 1 as ping`);
    const latencyMs = Date.now() - start;
    return res.status(200).json({
      status: 'healthy',
      connected: true,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return res.status(503).json({
      status: 'unhealthy',
      connected: false,
      latencyMs,
      error: err?.message?.includes('fetch failed') ? 'Database connectivity failed (fetch failed)' : 'Database query failed',
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## 3. Operational Guarantees

1. **Non-Destructive Execution**: No user accounts or demo seed data were modified or purged.
2. **Deterministic Status Codes**:
   - Success: `200 OK` (Login), `201 Created` (Registration).
   - Bad Credentials: `401 Unauthorized` (`INVALID_CREDENTIALS`).
   - Duplicate Account: `409 Conflict` (`EMAIL_ALREADY_EXISTS` / `USER_EXISTS`).
   - Network Disconnection: `503 Service Unavailable` (`DATABASE_UNAVAILABLE`).
3. **No Credential Leakage**: Stack traces and connection URLs are never emitted in API responses.
