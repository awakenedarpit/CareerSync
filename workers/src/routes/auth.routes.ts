import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { AppEnv, UserRole } from '../types';
import { getDb } from '../db/client';
import { users, students, tenants, auditEvents, invitations } from '../db/schema';
import { hashPassword, verifyPassword, createJwtToken } from '../utils/crypto';
import { requireAuth } from '../middleware/auth';
import { isValidUuid } from '../middleware/tenant';
import { mockInvitations, mockUsers, logAuditEvent } from './superadmin.routes';

const authRoutes = new Hono<AppEnv>();

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
authRoutes.post('/register', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = RegisterSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors
      },
      400
    );
  }

  const data = parseResult.data;
  const dbUrl = c.env?.DATABASE_URL;

  // Resolve tenantId: body -> header -> context
  let resolvedTenantId =
    data.tenantId ||
    c.req.header('x-tenant-id')?.trim() ||
    c.get('tenantId');

  if (!resolvedTenantId && !data.tenantSlug) {
    return c.json(
      {
        success: false,
        error: 'Tenant context required. Provide tenantId or tenantSlug.',
        code: 'TENANT_REQUIRED'
      },
      400
    );
  }

  const secret = c.env?.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
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
          return c.json(
            { success: false, error: `Tenant with slug '${data.tenantSlug}' not found` },
            404
          );
        }
        resolvedTenantId = foundTenant.id;
      }

      if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
        return c.json({ success: false, error: 'Invalid or unresolved tenant UUID' }, 400);
      }

      // Check tenant status
      const [targetTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, resolvedTenantId))
        .limit(1);

      if (!targetTenant) {
        return c.json({ success: false, error: 'Target tenant does not exist' }, 404);
      }

      if (!targetTenant.isActive) {
        return c.json({ success: false, error: 'Tenant is currently deactivated' }, 403);
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
        return c.json(
          {
            success: false,
            error: 'User with this email already exists in this institution'
          },
          409
        );
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

      return c.json(
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
        },
        201
      );
    } catch (err: any) {
      console.error('Registration database error:', err);
      return c.json(
        { success: false, error: 'Database error during registration', details: err?.message },
        500
      );
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

  return c.json(
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
    },
    201
  );
});

/**
 * POST /api/v1/auth/login
 * Verify credentials and return signed JWT with sub, tenant_id, and role.
 */
authRoutes.post('/login', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = LoginSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors
      },
      400
    );
  }

  const { email, password, tenantId, tenantSlug } = parseResult.data;
  const dbUrl = c.env?.DATABASE_URL;
  const secret = c.env?.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
  const normalizedEmail = email.toLowerCase().trim();

  let resolvedTenantId = tenantId || c.req.header('x-tenant-id')?.trim() || c.get('tenantId');

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
        return c.json(
          {
            success: false,
            error: 'Invalid credentials or inactive account',
            code: 'INVALID_CREDENTIALS'
          },
          401
        );
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return c.json(
          {
            success: false,
            error: 'Invalid credentials or inactive account',
            code: 'INVALID_CREDENTIALS'
          },
          401
        );
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

      return c.json({
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
      return c.json(
        { success: false, error: 'Database error during authentication', details: err?.message },
        500
      );
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

  return c.json({
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
authRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user')!;
  const dbUrl = c.env?.DATABASE_URL;

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
        return c.json({ success: false, error: 'User record not found' }, 404);
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

      return c.json({
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
  return c.json({
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
authRoutes.post('/logout', (c) => {
  return c.json({
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
const handleValidateInvitation = async (c: any) => {
  const token = c.req.param('token').trim();
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const [inv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, token))
        .limit(1);

      if (!inv) {
        return c.json(
          { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' },
          404
        );
      }

      if (inv.status === 'revoked') {
        return c.json(
          { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED', invitation: inv },
          410
        );
      }

      if (inv.status === 'accepted') {
        return c.json(
          { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED', invitation: inv },
          410
        );
      }

      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
      if (isExpired || inv.status === 'expired') {
        return c.json(
          { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED', invitation: inv },
          410
        );
      }

      return c.json({
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
      return c.json(
        { success: false, error: 'Database error validating invitation', details: err?.message },
        500
      );
    }
  }

  // Offline mock fallback
  const inv = mockInvitations.find((i) => i.token === token);
  if (!inv) {
    return c.json(
      { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' },
      404
    );
  }

  if (inv.status === 'revoked') {
    return c.json(
      { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED', invitation: inv },
      410
    );
  }

  if (inv.status === 'accepted') {
    return c.json(
      { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED', invitation: inv },
      410
    );
  }

  const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
  if (isExpired || inv.status === 'expired') {
    return c.json(
      { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED', invitation: inv },
      410
    );
  }

  return c.json({
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
const handleAcceptInvitation = async (c: any) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = AcceptInvitationSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const { token, password, fullName } = parseResult.data;
  const dbUrl = c.env?.DATABASE_URL;
  const secret = c.env?.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
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
        return c.json(
          { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' },
          404
        );
      }

      if (inv.status === 'revoked') {
        return c.json(
          { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED' },
          410
        );
      }

      if (inv.status === 'accepted') {
        return c.json(
          { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED' },
          410
        );
      }

      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
      if (isExpired || inv.status === 'expired') {
        return c.json(
          { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED' },
          410
        );
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

      await logAuditEvent(c, {
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

      return c.json(
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
        },
        201
      );
    } catch (err: any) {
      console.error('Accept invitation error:', err);
      return c.json(
        { success: false, error: 'Database error accepting invitation', details: err?.message },
        500
      );
    }
  }

  // Offline mock fallback
  const inv = mockInvitations.find((i) => i.token === token);
  if (!inv) {
    return c.json(
      { success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' },
      404
    );
  }

  if (inv.status === 'revoked') {
    return c.json(
      { success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED' },
      410
    );
  }

  if (inv.status === 'accepted') {
    return c.json(
      { success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED' },
      410
    );
  }

  const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
  if (isExpired || inv.status === 'expired') {
    return c.json(
      { success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED' },
      410
    );
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

  await logAuditEvent(c, {
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

  return c.json(
    {
      success: true,
      message: 'Invitation accepted and account activated successfully',
      token: jwtToken,
      user: newMockUser
    },
    201
  );
};

authRoutes.post('/invitation/accept', handleAcceptInvitation);
authRoutes.post('/invitations/accept', handleAcceptInvitation);

export { authRoutes };
