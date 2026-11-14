import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv, AuthUserContext } from '../types';
import { getDb } from '../db/client';
import { tenants } from '../db/schema';
import { verifyJwtToken } from '../utils/crypto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid UUIDv4.
 */
export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Multi-tenant isolation middleware.
 *
 * Rules:
 * 1. If user is authenticated via JWT, their tenantId is canonical and authoritative.
 *    Any client-supplied header (x-tenant-id) or request body attempting to access a different
 *    tenant is flagged as tenant spoofing and rejected with 403 Forbidden.
 * 2. If unauthenticated (e.g. login/register), client-supplied tenant ID (header x-tenant-id)
 *    must be a valid UUID and, if DB is available, verified against active tenants in the database.
 * 3. Never trusts client-supplied tenant IDs blindly.
 */
export async function tenantMiddleware(c: Context<AppEnv>, next: Next) {
  let authUser: AuthUserContext | undefined = c.get('user');
  const clientHeaderTenantId = c.req.header('x-tenant-id')?.trim();

  // If user is not yet set in context but Authorization Bearer header is present,
  // extract and verify token to ensure tenant spoofing is caught early.
  if (!authUser) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && (authHeader.startsWith('Bearer ') || authHeader.trim() === 'Bearer')) {
      const token = authHeader.replace(/^Bearer\s*/i, '').trim();
      if (token) {
        const secret = c.env?.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
        try {
          const payload = await verifyJwtToken(token, secret);
          if (payload.sub && payload.tenant_id && payload.role) {
            authUser = {
              id: payload.sub,
              tenantId: payload.tenant_id,
              role: payload.role as any,
              email: payload.email || '',
            };
            c.set('user', authUser);
            c.set('tenantId', payload.tenant_id);
          }
        } catch {
          // Token is invalid/expired; requireAuth will handle 401 on protected endpoints
        }
      }
    }
  }

  if (authUser) {
    // Authenticated path: JWT tenant is authoritative
    // Non-superadmin users are strictly isolated to their own tenant.
    // Superadmins hold platform-wide authority across all institutions.
    if (authUser.role !== 'superadmin') {
      // 1. Check header spoofing
      if (clientHeaderTenantId && clientHeaderTenantId !== authUser.tenantId) {
        return c.json(
          {
            success: false,
            error: 'Tenant access forbidden: tenant spoofing detected in header',
            code: 'TENANT_SPOOFING_REJECTED',
          },
          403
        );
      }

      // 2. Check body spoofing on mutating requests
      if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
        const contentType = c.req.header('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const clonedReq = c.req.raw.clone();
            const body = await clonedReq.json();
            if (body && typeof body === 'object') {
              const bodyTenantId = (body as any).tenantId || (body as any).tenant_id;
              if (bodyTenantId && bodyTenantId !== authUser.tenantId) {
                return c.json(
                  {
                    success: false,
                    error: 'Tenant access forbidden: tenant spoofing detected in body',
                    code: 'TENANT_SPOOFING_REJECTED',
                  },
                  403
                );
              }
            }
          } catch {
            // Non-JSON or empty body; ignore
          }
        }
      }
    }

    c.set('tenantId', authUser.tenantId);
    return next();
  }

  // Unauthenticated / public path (e.g., initial login/registration)
  if (clientHeaderTenantId) {
    if (!isValidUuid(clientHeaderTenantId)) {
      return c.json(
        {
          success: false,
          error: 'Invalid tenant identifier format (must be a valid UUID)',
          code: 'INVALID_TENANT_ID'
        },
        400
      );
    }

    // If database connection is configured, verify tenant exists and is active
    const dbUrl = c.env?.DATABASE_URL;
    if (dbUrl) {
      try {
        const db = getDb(dbUrl);
        const [tenantRecord] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, clientHeaderTenantId))
          .limit(1);

        if (!tenantRecord) {
          return c.json(
            {
              success: false,
              error: 'Tenant not found',
              code: 'TENANT_NOT_FOUND'
            },
            404
          );
        }

        if (!tenantRecord.isActive) {
          return c.json(
            {
              success: false,
              error: 'Tenant is currently deactivated',
              code: 'TENANT_INACTIVE'
            },
            403
          );
        }

        c.set('tenant', tenantRecord);
      } catch (err: unknown) {
        // If DB query fails due to connectivity, continue with validated UUID
        console.error('Tenant DB validation error:', err);
      }
    }

    c.set('tenantId', clientHeaderTenantId);
  }

  return next();
}

/**
 * Enforces that a verified tenantId is present in context.
 */
export async function requireTenant(c: Context<AppEnv>, next: Next) {
  const tenantId = c.get('tenantId');
  if (!tenantId) {
    return c.json(
      {
        success: false,
        error: 'Missing tenant context. Provide a valid x-tenant-id header or valid auth token.',
        code: 'MISSING_TENANT_CONTEXT'
      },
      400
    );
  }

  return next();
}

/**
 * Enforce tenant isolation when querying or modifying specific tenant records.
 * Throws an HTTP 403 response if the target tenant ID does not match current context.
 */
export function enforceTenantIsolation(
  currentTenantId: string,
  targetTenantId: string
): void {
  if (currentTenantId !== targetTenantId) {
    const error: any = new Error('Cross-tenant data access violation');
    error.status = 403;
    error.code = 'CROSS_TENANT_VIOLATION';
    throw error;
  }
}
