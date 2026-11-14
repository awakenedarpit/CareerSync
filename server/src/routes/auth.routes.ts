import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import env from '../config/env';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { UserRole } from '../types';
import { getDb } from '../db/client';
import { users, students, tenants, auditEvents, invitations } from '../db/schema';
import { hashPassword, verifyPassword, createJwtToken } from '../utils/crypto';
import { requireAuth } from '../middleware/auth';
import { isValidUuid } from '../middleware/tenant';
import { mockInvitations, mockUsers, logAuditEvent } from './superadmin.routes';

const authRoutes = Router();

// Zod schemas for request validation
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z
    .enum(['student', 'college_admin', 'faculty_coordinator', 'recruiter', 'superadmin'])
    .default('student'),
  tenantId: z.string().uuid().optional(),
  tenantSlug: z.string().optional(),
  // Optional student fields if role === 'student'
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  batchYear: z.number().int().optional(),
  degree: z.string().default('B.Tech').optional(),
  cgpa: z.union([z.number(), z.string()]).optional(),
  dateOfBirth: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().uuid().optional(),
  tenantSlug: z.string().optional()
});

/**
 * POST /api/v1/auth/register
 * Register a user scoped strictly to a college tenant.
 */
authRoutes.post('/register', async (req: Request, res: Response) => {
  const body = req.body;

  const parseResult = RegisterSchema.safeParse(body);
  if (!parseResult.success) {
    return res.status(400).json(
      {
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors
      });
  }

  const data = parseResult.data;
  const dbUrl = (env.DATABASE_URL || process.env.DATABASE_URL);

  // Resolve tenantId: body -> header -> context
  let resolvedTenantId =
    data.tenantId ||
    (req.headers['x-tenant-id'] as string)?.trim() ||
    req.tenantId;

  if (!resolvedTenantId && !data.tenantSlug) {
    return res.status(400).json(
      {
        success: false,
        error: 'Tenant context required. Provide tenantId or tenantSlug.',
        code: 'TENANT_REQUIRED'
      });
  }

  const secret = (env.JWT_SECRET || process.env.JWT_SECRET) || 'carrersync_jwt_default_secret_dev_key_32_chars';
  const hashedPassword = await hashPassword(data.password);
  const normalizedEmail = data.email.toLowerCase().trim();

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      // Resolve tenant slug if tenantId wasn't passed directly
      if (!resolvedTenantId && data.tenantSlug) {
        const [foundTenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, data.tenantSlug.toLowerCase().trim()))
          .limit(1);

        if (!foundTenant) {
          return res.status(404).json(
            { success: false, error: `Tenant with slug '${data.tenantSlug}' not found` });
        }
        resolvedTenantId = foundTenant.id;
      }

      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return res.json({ success: false, error: 'Invalid or unresolved tenant UUID' });
      }

      // Check tenant status
      const [targetTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, resolvedTenantId))
        .limit(1);

      if (!targetTenant) {
        return res.status(404).json({ success: false, error: 'Target tenant does not exist' });
      }

      if (!targetTenant.isActive) {
        return res.status(403).json({ success: false, error: 'Tenant is currently deactivated' });
      }

      // Check for duplicate user under same tenant
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, resolvedTenantId),
            eq(users.email, normalizedEmail)
          )
        )
        .limit(1);

      if (existingUser) {
        return res.status(409).json(
          {
            success: false,
            error: 'User with this email already exists in this institution'
          });
      }

      // Insert User
      const [createdUser] = await db
        .insert(users)
        .values({
          tenantId: resolvedTenantId,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          fullName: data.fullName.trim(),
          role: data.role as any,
          isActive: true,
          isVerified: data.role === 'superadmin' || data.role === 'college_admin'
        })
        .returning();

      // If student role, insert student profile
      let studentRecord = null;
      if (data.role === 'student') {
        const [createdStudent] = await db
          .insert(students)
          .values({
            tenantId: resolvedTenantId,
            userId: createdUser.id,
            rollNumber: data.rollNumber || `CS-${Math.floor(10000 + Math.random() * 90000)}`,
            department: data.department || 'Computer Science and Engineering',
            batchYear: data.batchYear || new Date().getFullYear(),
            degree: data.degree || 'B.Tech',
            cgpa: data.cgpa ? String(data.cgpa) : '0.00'
          })
          .returning();
        studentRecord = createdStudent;
      }

      // Log audit event
      try {
        await db.insert(auditEvents).values({
          tenantId: resolvedTenantId,
          actorId: createdUser.id,
          actorEmail: createdUser.email,
          action: 'USER_REGISTERED',
          resourceType: 'user',
          resourceId: createdUser.id,
          changesDiff: { role: createdUser.role, fullName: createdUser.fullName }
        });
      } catch (auditErr) {
        console.warn('Audit logging failed silently:', auditErr);
      }

      // Issue JWT
      const token = await createJwtToken(
        {
          sub: createdUser.id,
          tenant_id: createdUser.tenantId,
          role: createdUser.role,
          email: createdUser.email
        },
        secret
      );

      return res.status(201).json(
        {
          success: true,
          message: 'User registered successfully',
          token,
          user: {
            id: createdUser.id,
            email: createdUser.email,
            fullName: createdUser.fullName,
            role: createdUser.role,
            tenantId: createdUser.tenantId,
            student: studentRecord
          }
        });
    } catch (err: any) {
      console.error('Registration database error:', err);
      return res.status(500).json(
        { success: false, error: 'Database error during registration', details: err?.message });
    }
  }

  // Fallback for tests when DB is mocked/offline
  const mockUserId = crypto.randomUUID();
  resolvedTenantId = resolvedTenantId || crypto.randomUUID();
  const token = await createJwtToken(
    {
      sub: mockUserId,
      tenant_id: resolvedTenantId,
      role: data.role,
      email: normalizedEmail
    },
    secret
  );

  return res.status(201).json(
    {
      success: true,
      message: 'User registered successfully (offline mode)',
      token,
      user: {
        id: mockUserId,
        email: normalizedEmail,
        fullName: data.fullName,
        role: data.role,
        tenantId: resolvedTenantId
      }
    });
});

/**
 * POST /api/v1/auth/login
 * Verify credentials and return signed JWT with sub, tenant_id, and role.
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
  const body = req.body;

  const parseResult = LoginSchema.safeParse(body);
  if (!parseResult.success) {
    return res.status(400).json(
      {
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors
      });
  }

  const { email, password, tenantId, tenantSlug } = parseResult.data;
  const dbUrl = (env.DATABASE_URL || process.env.DATABASE_URL);
  const secret = (env.JWT_SECRET || process.env.JWT_SECRET) || 'carrersync_jwt_default_secret_dev_key_32_chars';
  const normalizedEmail = email.toLowerCase().trim();

  let resolvedTenantId = tenantId || (req.headers['x-tenant-id'] as string)?.trim() || req.tenantId;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      // Resolve tenant slug if provided
      if (!resolvedTenantId && tenantSlug) {
        const [foundTenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, tenantSlug.toLowerCase().trim()))
          .limit(1);

        if (foundTenant) {
          resolvedTenantId = foundTenant.id;
        }
      }

      // Build query conditions
      const conditions = [
        eq(users.email, normalizedEmail),
        eq(users.isActive, true)
      ];

      if (resolvedTenantId && isValidUuid(resolvedTenantId)) {
        conditions.push(eq(users.tenantId, resolvedTenantId));
      }

      const [user] = await db
        .select()
        .from(users)
        .where(and(...conditions))
        .limit(1);

      if (!user) {
        return res.status(401).json(
          {
            success: false,
            error: 'Invalid credentials or inactive account',
            code: 'INVALID_CREDENTIALS'
          });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json(
          {
            success: false,
            error: 'Invalid credentials or inactive account',
            code: 'INVALID_CREDENTIALS'
          });
      }

      // Issue signed JWT
      const token = await createJwtToken(
        {
          sub: user.id,
          tenant_id: user.tenantId,
          role: user.role,
          email: user.email
        },
        secret
      );

      return res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          tenantId: user.tenantId
        }
      });
    } catch (err: any) {
      console.error('Login database error:', err);
      return res.status(500).json(
        { success: false, error: 'Database error during authentication', details: err?.message });
    }
  }

  // Offline / Demo fallback for testing without DB
  const mockUserId = crypto.randomUUID();
  const mockTenantId = resolvedTenantId || crypto.randomUUID();
  const token = await createJwtToken(
    {
      sub: mockUserId,
      tenant_id: mockTenantId,
      role: 'student',
      email: normalizedEmail
    },
    secret
  );

  return res.json({
    success: true,
    message: 'Authentication successful (offline mode)',
    token,
    user: {
      id: mockUserId,
      email: normalizedEmail,
      fullName: 'Demo User',
      role: 'student',
      tenantId: mockTenantId
    }
  });
});

/**
 * GET /api/v1/auth/me
 * Return authenticated profile and verified tenant context.
 */
authRoutes.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = req.user!;
  const dbUrl = (env.DATABASE_URL || process.env.DATABASE_URL);

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const [dbUser] = await db
        .select({
          id: users.id,
          tenantId: users.tenantId,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          createdAt: users.createdAt
        })
        .from(users)
        .where(and(eq(users.id, user.id), eq(users.tenantId, user.tenantId)))
        .limit(1);

      if (!dbUser) {
        return res.json({ success: false, error: 'User record not found' });
      }

      // If student, fetch student profile
      let studentProfile = null;
      if (dbUser.role === 'student') {
        const [foundStudent] = await db
          .select()
          .from(students)
          .where(eq(students.userId, dbUser.id))
          .limit(1);
        studentProfile = foundStudent || null;
      }

      // Fetch tenant details
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, dbUser.tenantId))
        .limit(1);

      return res.json({
        success: true,
        user: {
          ...dbUser,
          student: studentProfile
        },
        tenant: tenant || null
      });
    } catch (err: any) {
      console.error('Fetch me database error:', err);
    }
  }

  // Default response with verified token context
  return res.json({
    success: true,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    },
    tenant: {
      id: user.tenantId
    }
  });
});

/**
 * POST /api/v1/auth/logout
 * Stateless token logout endpoint.
 */
authRoutes.post('/logout', (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ============================================================================
// Invitations Public Endpoints: Validate & Accept Token
// ============================================================================

const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2).optional()
});

/**
 * GET /api/v1/auth/invitation/:token (and /invitations/:token)
 * Public endpoint to validate an invitation token before registration.
 */
const handleValidateInvitation = async (req: Request, res: Response) => {
  const token = String(req.params.token).trim();
  const dbUrl = (env.DATABASE_URL || process.env.DATABASE_URL);

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const [inv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, token))
        .limit(1);

      if (!inv) {
        return res.status(404).json(
          { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' });
      }

      if (inv.status === 'revoked') {
        return res.status(410).json(
          { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED', invitation: inv });
      }

      if (inv.status === 'accepted') {
        return res.status(410).json(
          { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED', invitation: inv });
      }

      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
      if (isExpired || inv.status === 'expired') {
        return res.status(410).json(
          { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED', invitation: inv });
      }

      return res.json({
        success: true,
        valid: true,
        invitation: {
          id: inv.id,
          email: inv.email,
          role: inv.role,
          tenantId: inv.tenantId,
          fullName: inv.fullName,
          expiresAt: inv.expiresAt,
          status: inv.status
        }
      });
    } catch (err: any) {
      console.error('Validate invitation error:', err);
      return res.status(500).json(
        { success: false, error: 'Database error validating invitation', details: err?.message });
    }
  }

  // Offline mock fallback
  const inv = mockInvitations.find((i) => i.token === token);
  if (!inv) {
    return res.status(404).json(
      { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' });
  }

  if (inv.status === 'revoked') {
    return res.status(410).json(
      { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED', invitation: inv });
  }

  if (inv.status === 'accepted') {
    return res.status(410).json(
      { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED', invitation: inv });
  }

  const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
  if (isExpired || inv.status === 'expired') {
    return res.status(410).json(
      { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED', invitation: inv });
  }

  return res.json({
    success: true,
    valid: true,
    invitation: {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      tenantId: inv.tenantId,
      fullName: inv.fullName,
      expiresAt: inv.expiresAt,
      status: inv.status
    }
  });
};

authRoutes.get('/invitation/:token', handleValidateInvitation);
authRoutes.get('/invitations/:token', handleValidateInvitation);

/**
 * POST /api/v1/auth/invitation/accept (and /invitations/accept)
 * Redeem single-use invitation token, set user credentials, and activate account.
 */
const handleAcceptInvitation = async (req: Request, res: Response) => {
  const body = req.body;

  const parseResult = AcceptInvitationSchema.safeParse(body);
  if (!parseResult.success) {
    return res.status(400).json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors });
  }

  const { token, password, fullName } = parseResult.data;
  const dbUrl = (env.DATABASE_URL || process.env.DATABASE_URL);
  const secret = (env.JWT_SECRET || process.env.JWT_SECRET) || 'carrersync_jwt_default_secret_dev_key_32_chars';
  const hashedPassword = await hashPassword(password);

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const [inv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, token))
        .limit(1);

      if (!inv) {
        return res.status(404).json(
          { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' });
      }

      if (inv.status === 'revoked') {
        return res.status(410).json(
          { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED' });
      }

      if (inv.status === 'accepted') {
        return res.status(410).json(
          { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED' });
      }

      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
      if (isExpired || inv.status === 'expired') {
        return res.status(410).json(
          { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED' });
      }

      const targetTenantId = inv.tenantId || '11111111-1111-4111-8111-111111111111';
      const userFullName = (fullName || inv.fullName || 'Invited User').trim();

      const [newUser] = await db
        .insert(users)
        .values({
          tenantId: targetTenantId,
          email: inv.email,
          passwordHash: hashedPassword,
          fullName: userFullName,
          role: inv.role as any,
          isActive: true,
          isVerified: true
        })
        .returning();

      if (inv.role === 'student') {
        await db.insert(students).values({
          tenantId: targetTenantId,
          userId: newUser.id,
          rollNumber: `CS-${Math.floor(10000 + Math.random() * 90000)}`,
          department: 'Computer Science and Engineering',
          batchYear: new Date().getFullYear(),
          degree: 'B.Tech',
          cgpa: '0.00'
        });
      }

      await db
        .update(invitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(invitations.id, inv.id));

      await logAuditEvent(req, {
        tenantId: targetTenantId,
        action: 'INVITATION_ACCEPTED',
        resourceType: 'invitation',
        resourceId: inv.id,
        changesDiff: { userId: newUser.id, email: newUser.email, role: newUser.role }
      });

      const jwtToken = await createJwtToken(
        {
          sub: newUser.id,
          tenant_id: newUser.tenantId,
          role: newUser.role,
          email: newUser.email
        },
        secret
      );

      return res.status(201).json(
        {
          success: true,
          message: 'Invitation accepted and account activated successfully',
          token: jwtToken,
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            role: newUser.role,
            tenantId: newUser.tenantId
          }
        });
    } catch (err: any) {
      console.error('Accept invitation error:', err);
      return res.status(500).json(
        { success: false, error: 'Database error accepting invitation', details: err?.message });
    }
  }

  // Offline mock fallback
  const inv = mockInvitations.find((i) => i.token === token);
  if (!inv) {
    return res.status(404).json(
      { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' });
  }

  if (inv.status === 'revoked') {
    return res.status(410).json(
      { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED' });
  }

  if (inv.status === 'accepted') {
    return res.status(410).json(
      { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED' });
  }

  const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
  if (isExpired || inv.status === 'expired') {
    return res.status(410).json(
      { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED' });
  }

  const targetTenantId = inv.tenantId || '11111111-1111-4111-8111-111111111111';
  const userFullName = (fullName || inv.fullName || 'Invited User').trim();
  const newUserId = crypto.randomUUID();

  const newMockUser = {
    id: newUserId,
    tenantId: targetTenantId,
    email: inv.email,
    fullName: userFullName,
    role: inv.role,
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockUsers.unshift(newMockUser);

  inv.status = 'accepted';
  inv.acceptedAt = new Date().toISOString();
  inv.updatedAt = new Date().toISOString();

  await logAuditEvent(req, {
    tenantId: targetTenantId,
    action: 'INVITATION_ACCEPTED',
    resourceType: 'invitation',
    resourceId: inv.id,
    changesDiff: { userId: newUserId, email: inv.email, role: inv.role }
  });

  const jwtToken = await createJwtToken(
    {
      sub: newUserId,
      tenant_id: targetTenantId,
      role: inv.role,
      email: inv.email
    },
    secret
  );

  return res.status(201).json(
    {
      success: true,
      message: 'Invitation accepted and account activated successfully',
      token: jwtToken,
      user: newMockUser
    });
};

authRoutes.post('/invitation/accept', handleAcceptInvitation);
authRoutes.post('/invitations/accept', handleAcceptInvitation);

export { authRoutes };
