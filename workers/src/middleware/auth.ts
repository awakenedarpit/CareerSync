import type { Context, Next } from 'hono';
import type { AppEnv, UserRole } from '../types';
import { verifyJwtToken } from '../utils/crypto';

/**
 * JWT Authentication Middleware
 * Extracts, validates, and decodes the Bearer token from the Authorization header.
 * Attaches the authenticated user context (including tenantId and role) to Hono context.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || (!authHeader.startsWith('Bearer ') && authHeader.trim() !== 'Bearer')) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized: Missing or malformed authorization header',
        code: 'MISSING_BEARER_TOKEN'
      },
      401
    );
  }

  const token = authHeader.replace(/^Bearer\s*/i, '').trim();
  if (!token) {
    return c.json(
      {
        success: false,
        error: 'Unauthorized: Empty bearer token provided',
        code: 'EMPTY_BEARER_TOKEN'
      },
      401
    );
  }

  const secret = c.env?.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';

  try {
    const payload = await verifyJwtToken(token, secret);

    if (!payload.sub || !payload.tenant_id || !payload.role) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized: Token payload is missing required claims (sub, tenant_id, role)',
          code: 'MALFORMED_CLAIMS'
        },
        401
      );
    }

    c.set('user', {
      id: payload.sub,
      tenantId: payload.tenant_id,
      role: payload.role as UserRole,
      email: payload.email || ''
    });

    // Defense-in-depth: Reject tenant header spoofing for non-superadmin users
    const clientHeaderTenantId = c.req.header('x-tenant-id')?.trim();
    if (payload.role !== 'superadmin' && clientHeaderTenantId && clientHeaderTenantId !== payload.tenant_id) {
      return c.json(
        {
          success: false,
          error: 'Tenant access forbidden: tenant spoofing detected in header',
          code: 'TENANT_SPOOFING_REJECTED'
        },
        403
      );
    }

    c.set('tenantId', payload.tenant_id);

    return next();
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: `Unauthorized: ${error?.message || 'Invalid or expired token'}`,
        code: 'TOKEN_VERIFICATION_FAILED'
      },
      401
    );
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to one or more authorized roles.
 *
 * Example usage:
 * app.get('/admin/drives', requireAuth, requireRole(['college_admin', 'superadmin']), handler);
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required before role verification',
          code: 'UNAUTHENTICATED'
        },
        401
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          error: `Forbidden: Role '${user.role}' is not authorized to access this resource`,
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        },
        403
      );
    }

    return next();
  };
}
