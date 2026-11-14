import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import type { AuthUserContext } from '../types';
import { getDb } from '../db/client';
import { tenants } from '../db/schema';
import { verifyJwtToken } from '../utils/crypto';
import env from '../config/env';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid RFC4122 UUID.
 */
export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Multi-tenant isolation middleware for Express.
 *
 * Rules:
 * 1. If user is authenticated via JWT, their tenantId is canonical and authoritative.
 *    Any client-supplied header (x-tenant-id) or request body attempting to access a different
 *    tenant is flagged as tenant spoofing and rejected with 403 TENANT_SPOOFING_REJECTED.
 * 2. If unauthenticated, client-supplied tenant ID (header x-tenant-id) must be a valid UUID
 *    and, if DB is available, verified against active tenants in the database.
 * 3. Never trusts client-supplied tenant IDs blindly.
 * 4. Super Admin users possess cross-tenant platform operational authority.
 */
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  let authUser: AuthUserContext | undefined = req.user;
  const rawHeader = req.headers['x-tenant-id'];
  const clientHeaderTenantId = typeof rawHeader === 'string'
    ? rawHeader.trim()
    : Array.isArray(rawHeader)
    ? rawHeader[0].trim()
    : undefined;

  // Extract and verify Bearer token early if user is not already set
  if (!authUser) {
    const authHeader = req.headers['authorization'];
    if (authHeader && (authHeader.startsWith('Bearer ') || authHeader.trim() === 'Bearer')) {
      const token = authHeader.replace(/^Bearer\s*/i, '').trim();
      if (token) {
        const secret = env.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
        try {
          const payload = await verifyJwtToken(token, secret);
          if (payload.sub && payload.tenant_id && payload.role) {
            authUser = {
              id: payload.sub,
              tenantId: payload.tenant_id,
              role: payload.role as any,
              email: payload.email || ''
            };
            req.user = authUser;
            req.tenantId = payload.tenant_id;
          }
        } catch {
          // Token is invalid/expired; requireAuth will return 401 on protected endpoints
        }
      }
    }
  }

  if (authUser) {
    // Authenticated path: JWT tenant is authoritative.
    // Non-superadmin users are strictly isolated to their own tenant.
    // Superadmins hold cross-institutional platform authority.
    if (authUser.role !== 'superadmin') {
      // 1. Check header spoofing
      if (clientHeaderTenantId && clientHeaderTenantId !== authUser.tenantId) {
        return res.status(403).json({
          success: false,
          error: 'Tenant access forbidden: tenant spoofing detected in header',
          code: 'TENANT_SPOOFING_REJECTED'
        });
      }

      // 2. Check body spoofing on mutating requests
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (req.body && typeof req.body === 'object') {
          const bodyTenantId = req.body.tenantId || req.body.tenant_id;
          if (bodyTenantId && bodyTenantId !== authUser.tenantId) {
            return res.status(403).json({
              success: false,
              error: 'Tenant access forbidden: tenant spoofing detected in body',
              code: 'TENANT_SPOOFING_REJECTED'
            });
          }
        }
      }
    }

    req.tenantId = authUser.tenantId;
    return next();
  }

  // Unauthenticated / public path (e.g. initial login / registration)
  if (clientHeaderTenantId) {
    if (!isValidUuid(clientHeaderTenantId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tenant identifier format (must be a valid UUID)',
        code: 'INVALID_TENANT_ID'
      });
    }

    const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const db = getDb(dbUrl);
        const [tenantRecord] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, clientHeaderTenantId))
          .limit(1);

        if (!tenantRecord) {
          return res.status(404).json({
            success: false,
            error: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          });
        }

        if (!tenantRecord.isActive) {
          return res.status(403).json({
            success: false,
            error: 'Tenant is currently deactivated',
            code: 'TENANT_INACTIVE'
          });
        }

        req.tenant = tenantRecord;
      } catch (err: unknown) {
        // If DB query fails due to connectivity or mocking, continue with validated UUID
      }
    }

    req.tenantId = clientHeaderTenantId;
  }

  return next();
}

/**
 * Enforces that a verified tenantId is present in request context.
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.tenantId;
  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: 'Missing tenant context. Provide a valid x-tenant-id header or valid auth token.',
      code: 'MISSING_TENANT_CONTEXT'
    });
  }

  return next();
}

/**
 * Enforce tenant isolation when querying or modifying specific tenant records.
 * Throws an HTTP 403 error if the target tenant ID does not match current context.
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
