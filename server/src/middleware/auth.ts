import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types';
import { normalizeRole, CanonicalRole } from '../utils/roles';
import { verifyJwtToken } from '../utils/crypto';
import env from '../config/env';

/**
 * JWT Authentication Middleware for Express.
 * Extracts, validates, and decodes the Bearer token from the Authorization header.
 * Attaches the authenticated user context (including tenantId and role) to req.user and req.tenantId.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const rawHeader = req.headers['authorization'];
  const authHeader = typeof rawHeader === 'string'
    ? rawHeader.trim()
    : Array.isArray(rawHeader as any)
    ? (rawHeader as any)[0].trim()
    : undefined;

  // Safely validate Bearer scheme case-insensitively
  if (!authHeader || !/^Bearer(\s+|$)/i.test(authHeader)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or malformed authorization header',
      code: 'MISSING_BEARER_TOKEN'
    });
  }

  // Strip single or duplicate Bearer prefixes case-insensitively
  const token = authHeader.replace(/^(bearer(\s+|$))+/i, '').trim();
  if (!token || token.toLowerCase() === 'null' || token.toLowerCase() === 'undefined') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Empty bearer token provided',
      code: 'EMPTY_BEARER_TOKEN'
    });
  }

  const secret = env.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';

  try {
    const payload = await verifyJwtToken(token, secret);

    if (!payload.sub || !payload.tenant_id || !payload.role) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Token payload is missing required claims (sub, tenant_id, role)',
        code: 'MALFORMED_CLAIMS'
      });
    }

    req.user = {
      id: payload.sub,
      tenantId: payload.tenant_id,
      role: payload.role as UserRole,
      email: payload.email || '',
      hasVerificationPermission: Boolean(payload.hasVerificationPermission || payload.isDelegatedReviewer)
    };

    // Defense-in-depth: Reject tenant header spoofing for non-superadmin users
    const rawHeader = req.headers['x-tenant-id'];
    const clientHeaderTenantId = typeof rawHeader === 'string'
      ? rawHeader.trim()
      : Array.isArray(rawHeader)
      ? rawHeader[0].trim()
      : undefined;

    if (normalizeRole(payload.role) !== 'SUPER_ADMIN' && clientHeaderTenantId && clientHeaderTenantId !== payload.tenant_id) {
      return res.status(403).json({
        success: false,
        error: 'Tenant access forbidden: tenant spoofing detected in header',
        code: 'TENANT_SPOOFING_REJECTED'
      });
    }

    req.tenantId = payload.tenant_id;
    return next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: `Unauthorized: ${error?.message || 'Invalid or expired token'}`,
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
}

/**
 * Standard alias for requireAuth.
 */
export const authenticateToken = requireAuth;

/**
 * Role-Based Access Control (RBAC) Middleware for Express.
 * Restricts access to one or more authorized roles.
 * Supports both canonical uppercase (CanonicalRole) and legacy lowercase (UserRole).
 */
export function requireRole(allowedRoles: (UserRole | CanonicalRole | string)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication required before role verification',
        code: 'UNAUTHENTICATED'
      });
    }

    const userCanonical = normalizeRole(user.role);
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r) || String(r).toLowerCase());

    const isPermitted =
      (userCanonical && normalizedAllowed.includes(userCanonical)) ||
      allowedRoles.includes(user.role as any) ||
      allowedRoles.includes(String(user.role).toLowerCase() as any);

    if (!isPermitted) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Role '${user.role}' is not authorized to access this resource`,
        code: 'FORBIDDEN_INSUFFICIENT_ROLE'
      });
    }

    return next();
  };
}
