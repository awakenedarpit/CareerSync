import { Hono } from 'hono';
import { z } from 'zod';
import { eq, or, and, ilike, sql, desc } from 'drizzle-orm';
import type { AppEnv, UserRole } from '../types';
import { getDb } from '../db/client';
import {
  tenants,
  users,
  students,
  invitations,
  auditEvents,
  type Tenant,
  type User,
  type Invitation
} from '../db/schema';
import { requireAuth, requireRole } from '../middleware/auth';
import { isValidUuid } from '../middleware/tenant';
import { hashPassword } from '../utils/crypto';

// ============================================================================
// Super Admin Platform Management Routes
// Scoped to /api/v1/super-admin
// Protected strictly by requireAuth and requireRole(['superadmin'])
// ============================================================================

const superAdminRoutes = new Hono<AppEnv>();

// Apply authentication and superadmin authorization across all endpoints
superAdminRoutes.use('*', requireAuth, requireRole(['superadmin']));

// ---------------------------------------------------------------------------
// Helpers & Utilities
// ---------------------------------------------------------------------------

function generateSecureToken(prefix = 'inv_'): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${hex}`;
}

// In-Memory Mock Store for Offline / Vitest Test Environments
export interface MockCollege {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  location: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  isActive: boolean;
  isSuspended: boolean;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MockUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockInvitation {
  id: string;
  tenantId: string | null;
  email: string;
  role: UserRole;
  fullName: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  metadataJson: Record<string, unknown>;
  invitedByUserId: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockAuditLog {
  id: string;
  tenantId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  changesDiff: Record<string, unknown>;
  ipAddress: string | null;
  timestamp: string;
}

export const mockColleges: MockCollege[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Apex Institute of Technology',
    slug: 'apex-institute',
    domain: 'apex.edu',
    location: 'Bengaluru, Karnataka',
    contactEmail: 'admin@apex.edu',
    contactPhone: '+91 80 2345 6789',
    status: 'active',
    isActive: true,
    isSuspended: false,
    settings: { tier: 'enterprise' },
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Silicon Valley University',
    slug: 'silicon-valley-uni',
    domain: 'svu.edu',
    location: 'San Jose, CA',
    contactEmail: 'tpo@svu.edu',
    contactPhone: '+1 408 555 0199',
    status: 'active',
    isActive: true,
    isSuspended: false,
    settings: { tier: 'pro' },
    createdAt: '2026-02-15T09:30:00.000Z',
    updatedAt: '2026-02-15T09:30:00.000Z'
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'National Technical College',
    slug: 'national-tech',
    domain: 'ntc.ac.in',
    location: 'New Delhi, Delhi',
    contactEmail: 'principal@ntc.ac.in',
    contactPhone: '+91 11 2345 9876',
    status: 'inactive',
    isActive: false,
    isSuspended: false,
    settings: { tier: 'standard' },
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z'
  }
];

export const mockUsers: MockUser[] = [
  {
    id: 'user-00000000-0000-4000-8000-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'superadmin@carrersync.com',
    fullName: 'System Super Administrator',
    role: 'superadmin',
    isActive: true,
    isVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user-11111111-1111-4111-8111-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'admin@apex.edu',
    fullName: 'Dr. Ramesh Sharma',
    role: 'college_admin',
    isActive: true,
    isVerified: true,
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z'
  },
  {
    id: 'user-11111111-1111-4111-8111-000000000002',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'tpo@apex.edu',
    fullName: 'Priya Verma',
    role: 'tpo_admin',
    isActive: true,
    isVerified: true,
    createdAt: '2026-01-12T10:00:00.000Z',
    updatedAt: '2026-01-12T10:00:00.000Z'
  },
  {
    id: 'user-11111111-1111-4111-8111-000000000003',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'student.aarav@apex.edu',
    fullName: 'Aarav Patel',
    role: 'student',
    isActive: true,
    isVerified: true,
    createdAt: '2026-01-15T11:00:00.000Z',
    updatedAt: '2026-01-15T11:00:00.000Z'
  },
  {
    id: 'user-11111111-1111-4111-8111-000000000004',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'recruiter.sarah@google.com',
    fullName: 'Sarah Jenkins',
    role: 'recruiter',
    isActive: true,
    isVerified: true,
    createdAt: '2026-02-01T12:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z'
  },
  {
    id: 'user-11111111-1111-4111-8111-000000000005',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'suspended.student@apex.edu',
    fullName: 'Suspended Candidate',
    role: 'student',
    isActive: false,
    isVerified: true,
    createdAt: '2026-02-10T14:00:00.000Z',
    updatedAt: '2026-02-10T14:00:00.000Z'
  }
];

export const mockInvitations: MockInvitation[] = [
  {
    id: 'inv-00000000-0000-4000-8000-000000000001',
    tenantId: '22222222-2222-4222-8222-222222222222',
    email: 'newtpo@svu.edu',
    fullName: 'Kavita Reddy',
    role: 'tpo_admin',
    token: 'inv_svu_tpo_token_demo_abcdef1234567890',
    status: 'pending',
    metadataJson: { department: 'Career Development Cell' },
    invitedByUserId: 'user-00000000-0000-4000-8000-000000000001',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    acceptedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inv-00000000-0000-4000-8000-000000000002',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'accepted.tpo@apex.edu',
    fullName: 'Accepted TPO',
    role: 'college_admin',
    token: 'inv_apex_admin_token_accepted_987654321',
    status: 'accepted',
    metadataJson: {},
    invitedByUserId: 'user-00000000-0000-4000-8000-000000000001',
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'inv-00000000-0000-4000-8000-000000000003',
    tenantId: '11111111-1111-4111-8111-111111111111',
    email: 'expired.candidate@apex.edu',
    fullName: 'Expired Candidate',
    role: 'student',
    token: 'inv_expired_token_sample_1234567890',
    status: 'expired',
    metadataJson: {},
    invitedByUserId: 'user-00000000-0000-4000-8000-000000000001',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    acceptedAt: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockAuditLogs: MockAuditLog[] = [
  {
    id: 'audit-00000000-0000-4000-8000-000000000001',
    tenantId: '11111111-1111-4111-8111-111111111111',
    actorId: 'user-00000000-0000-4000-8000-000000000001',
    actorEmail: 'superadmin@carrersync.com',
    action: 'COLLEGE_PROVISIONED',
    resourceType: 'college',
    resourceId: '11111111-1111-4111-8111-111111111111',
    changesDiff: { name: 'Apex Institute of Technology', slug: 'apex-institute' },
    ipAddress: '127.0.0.1',
    timestamp: '2026-01-10T08:00:00.000Z'
  }
];

let mockSettings: Record<string, unknown> = {
  maintenanceMode: false,
  allowSelfRegistration: true,
  jwtExpiresInDays: 7,
  requireMfaForAdmins: false,
  passwordPolicy: {
    minLength: 8,
    requireNumbers: true,
    requireSpecialChars: true
  }
};

/**
 * Robust Audit Event Logger
 * Records into PostgreSQL when DATABASE_URL is available;
 * records into mockAuditLogs in offline/test environments.
 */
export async function logAuditEvent(
  c: any,
  params: {
    tenantId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    changesDiff?: Record<string, unknown>;
  }
) {
  const actor = c.get('user');
  const ipAddress =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for') ||
    '127.0.0.1';

  const dbUrl = c.env?.DATABASE_URL;
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      await db.insert(auditEvents).values({
        tenantId: params.tenantId || undefined,
        actorId: actor?.id || undefined,
        actorEmail: actor?.email || undefined,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || undefined,
        changesDiff: params.changesDiff || {},
        ipAddress: ipAddress
      });
      return;
    } catch (err) {
      console.warn('[Audit Log Insert Warning]:', err);
    }
  }

  // Offline mock recording
  mockAuditLogs.unshift({
    id: crypto.randomUUID(),
    tenantId: params.tenantId || null,
    actorId: actor?.id || null,
    actorEmail: actor?.email || null,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId || null,
    changesDiff: params.changesDiff || {},
    ipAddress: ipAddress,
    timestamp: new Date().toISOString()
  });
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const ProvisionCollegeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  domain: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  contactEmail: z.string().email('Invalid contact email').optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  settings: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true)
});

const UpdateCollegeSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().max(255).optional(),
  location: z.string().max(255).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
  settings: z.record(z.unknown()).optional()
});

const CollegeStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional()
});

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum([
    'superadmin',
    'college_admin',
    'tpo_admin',
    'faculty_coordinator',
    'recruiter',
    'student'
  ]),
  tenantId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  rollNumber: z.string().optional(),
  department: z.string().optional(),
  batchYear: z.number().int().optional(),
  degree: z.string().default('B.Tech').optional(),
  cgpa: z.union([z.number(), z.string()]).optional()
});

const UpdateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  status: z.enum(['active', 'suspended', 'inactive']).optional()
});

const UpdateUserRoleSchema = z.object({
  role: z.enum([
    'superadmin',
    'college_admin',
    'tpo_admin',
    'faculty_coordinator',
    'recruiter',
    'student'
  ])
});

const CreateInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'superadmin',
    'college_admin',
    'tpo_admin',
    'faculty_coordinator',
    'recruiter',
    'student'
  ]),
  fullName: z.string().optional(),
  tenantId: z.string().uuid().optional(),
  collegeId: z.string().uuid().optional(),
  expiresInDays: z.number().int().min(1).max(90).default(7),
  metadataJson: z.record(z.unknown()).default({})
});

const ResendInvitationSchema = z
  .object({
    expiresInDays: z.number().int().min(1).max(90).default(7)
  })
  .optional();

// ============================================================================
// 1. GET /stats — Platform Overview Stats
// ============================================================================

superAdminRoutes.get('/stats', async (c) => {
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const [collegeRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(tenants);

      const [studentRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'student'));

      const [recruiterRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'recruiter'));

      const [collegeAdminRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'college_admin'));

      const [tpoAdminRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'tpo_admin'));

      const [activeRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isActive, true));

      const [suspendedRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.isActive, false));

      const [invitationRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(invitations)
        .where(eq(invitations.status, 'pending'));

      const stats = {
        totalColleges: collegeRes?.count || 0,
        totalStudents: studentRes?.count || 0,
        totalRecruiters: recruiterRes?.count || 0,
        totalCollegeAdmins: collegeAdminRes?.count || 0,
        totalTpoAdmins: tpoAdminRes?.count || 0,
        activeUsers: activeRes?.count || 0,
        suspendedUsers: suspendedRes?.count || 0,
        pendingInvitations: invitationRes?.count || 0
      };

      return c.json({ success: true, stats });
    } catch (err: any) {
      console.error('Fetch stats database error:', err);
      return c.json(
        { success: false, error: 'Database error fetching stats', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Calculation
  const totalColleges = mockColleges.length;
  const totalStudents = mockUsers.filter((u) => u.role === 'student').length;
  const totalRecruiters = mockUsers.filter((u) => u.role === 'recruiter').length;
  const totalCollegeAdmins = mockUsers.filter((u) => u.role === 'college_admin').length;
  const totalTpoAdmins = mockUsers.filter((u) => u.role === 'tpo_admin').length;
  const activeUsers = mockUsers.filter((u) => u.isActive).length;
  const suspendedUsers = mockUsers.filter((u) => !u.isActive).length;
  const pendingInvitations = mockInvitations.filter((i) => i.status === 'pending').length;

  return c.json({
    success: true,
    stats: {
      totalColleges,
      totalStudents,
      totalRecruiters,
      totalCollegeAdmins,
      totalTpoAdmins,
      activeUsers,
      suspendedUsers,
      pendingInvitations
    }
  });
});

// ============================================================================
// 2. GET /colleges — List Colleges with Filters & Student/Admin Counts
// ============================================================================

superAdminRoutes.get('/colleges', async (c) => {
  const query = c.req.query('q')?.trim() || c.req.query('search')?.trim() || '';
  const statusFilter = c.req.query('status')?.trim().toLowerCase();
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const conditions: any[] = [];
      if (query) {
        conditions.push(
          or(
            ilike(tenants.name, `%${query}%`),
            ilike(tenants.slug, `%${query}%`),
            ilike(tenants.domain, `%${query}%`),
            ilike(tenants.location, `%${query}%`)
          )
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active') {
          conditions.push(eq(tenants.isActive, true));
        } else if (statusFilter === 'inactive') {
          conditions.push(eq(tenants.isActive, false));
        } else if (statusFilter === 'suspended') {
          conditions.push(eq(tenants.isSuspended, true));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const collegeRecords = await db
        .select({
          id: tenants.id,
          name: tenants.name,
          slug: tenants.slug,
          domain: tenants.domain,
          location: tenants.location,
          contactEmail: tenants.contactEmail,
          contactPhone: tenants.contactPhone,
          status: tenants.status,
          isActive: tenants.isActive,
          isSuspended: tenants.isSuspended,
          settings: tenants.settings,
          createdAt: tenants.createdAt,
          updatedAt: tenants.updatedAt,
          studentCount: sql<number>`(SELECT count(*)::int FROM users WHERE users.tenant_id = tenants.id AND users.role = 'student')`,
          adminCount: sql<number>`(SELECT count(*)::int FROM users WHERE users.tenant_id = tenants.id AND users.role IN ('college_admin', 'tpo_admin'))`
        })
        .from(tenants)
        .where(whereClause)
        .orderBy(desc(tenants.createdAt));

      return c.json({
        success: true,
        count: collegeRecords.length,
        colleges: collegeRecords
      });
    } catch (err: any) {
      console.error('List colleges database error:', err);
      return c.json(
        { success: false, error: 'Database error listing colleges', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Filtering
  let results = [...mockColleges];
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (col) =>
        col.name.toLowerCase().includes(q) ||
        col.slug.toLowerCase().includes(q) ||
        (col.domain && col.domain.toLowerCase().includes(q)) ||
        (col.location && col.location.toLowerCase().includes(q))
    );
  }

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') {
      results = results.filter((c) => c.isActive && !c.isSuspended);
    } else if (statusFilter === 'inactive') {
      results = results.filter((c) => !c.isActive && !c.isSuspended);
    } else if (statusFilter === 'suspended') {
      results = results.filter((c) => c.isSuspended);
    }
  }

  const enriched = results.map((col) => {
    const studentCount = mockUsers.filter(
      (u) => u.tenantId === col.id && u.role === 'student'
    ).length;
    const adminCount = mockUsers.filter(
      (u) =>
        u.tenantId === col.id && (u.role === 'college_admin' || u.role === 'tpo_admin')
    ).length;
    return {
      ...col,
      studentCount,
      adminCount
    };
  });

  return c.json({
    success: true,
    count: enriched.length,
    colleges: enriched
  });
});

// ============================================================================
// 3. POST /colleges — Provision New College Tenant
// ============================================================================

superAdminRoutes.post('/colleges', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = ProvisionCollegeSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const data = parseResult.data;
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      // Check conflict
      const [existing] = await db
        .select()
        .from(tenants)
        .where(or(eq(tenants.slug, data.slug), eq(tenants.name, data.name)))
        .limit(1);

      if (existing) {
        return c.json(
          {
            success: false,
            error: 'A college with this name or slug already exists',
            code: 'COLLEGE_CONFLICT'
          },
          409
        );
      }

      const [newCollege] = await db
        .insert(tenants)
        .values({
          name: data.name.trim(),
          slug: data.slug.toLowerCase().trim(),
          domain: data.domain?.trim() || null,
          location: data.location?.trim() || null,
          contactEmail: data.contactEmail?.trim() || null,
          contactPhone: data.contactPhone?.trim() || null,
          status: 'active',
          isActive: data.isActive,
          isSuspended: false,
          settings: data.settings
        })
        .returning();

      await logAuditEvent(c, {
        tenantId: newCollege.id,
        action: 'COLLEGE_PROVISIONED',
        resourceType: 'college',
        resourceId: newCollege.id,
        changesDiff: {
          name: newCollege.name,
          slug: newCollege.slug,
          location: newCollege.location,
          contactEmail: newCollege.contactEmail
        }
      });

      return c.json(
        {
          success: true,
          message: 'College provisioned successfully',
          college: newCollege
        },
        201
      );
    } catch (err: any) {
      console.error('Provision college database error:', err);
      return c.json(
        { success: false, error: 'Database error provisioning college', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Provisioning
  const conflict = mockColleges.find(
    (c) => c.slug === data.slug.toLowerCase() || c.name.toLowerCase() === data.name.toLowerCase()
  );
  if (conflict) {
    return c.json(
      {
        success: false,
        error: 'A college with this name or slug already exists',
        code: 'COLLEGE_CONFLICT'
      },
      409
    );
  }

  const newMockCollege: MockCollege = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    slug: data.slug.toLowerCase().trim(),
    domain: data.domain?.trim() || null,
    location: data.location?.trim() || null,
    contactEmail: data.contactEmail?.trim() || null,
    contactPhone: data.contactPhone?.trim() || null,
    status: 'active',
    isActive: data.isActive,
    isSuspended: false,
    settings: data.settings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockColleges.unshift(newMockCollege);

  await logAuditEvent(c, {
    tenantId: newMockCollege.id,
    action: 'COLLEGE_PROVISIONED',
    resourceType: 'college',
    resourceId: newMockCollege.id,
    changesDiff: {
      name: newMockCollege.name,
      slug: newMockCollege.slug,
      location: newMockCollege.location
    }
  });

  return c.json(
    {
      success: true,
      message: 'College provisioned successfully',
      college: newMockCollege
    },
    201
  );
});

// ============================================================================
// 4. GET /colleges/:id — College Detail with Administrators & Stats
// ============================================================================

superAdminRoutes.get('/colleges/:id', async (c) => {
  const idOrSlug = c.req.param('id').trim();
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const condition = isValidUuid(idOrSlug)
        ? eq(tenants.id, idOrSlug)
        : eq(tenants.slug, idOrSlug.toLowerCase());

      const [college] = await db.select().from(tenants).where(condition).limit(1);

      if (!college) {
        return c.json({ success: false, error: 'College not found', code: 'NOT_FOUND' }, 404);
      }

      // Fetch administrators
      const admins = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .where(
          and(
            eq(users.tenantId, college.id),
            or(eq(users.role, 'college_admin'), eq(users.role, 'tpo_admin'))
          )
        );

      const [studentsCountRes] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(eq(users.tenantId, college.id), eq(users.role, 'student')));

      return c.json({
        success: true,
        college: {
          ...college,
          administrators: admins,
          stats: {
            studentCount: studentsCountRes?.count || 0,
            adminCount: admins.length,
            totalUsers: (studentsCountRes?.count || 0) + admins.length
          }
        }
      });
    } catch (err: any) {
      console.error('Fetch college detail error:', err);
      return c.json(
        { success: false, error: 'Database error fetching college detail', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Detail
  const found = mockColleges.find(
    (c) => c.id === idOrSlug || c.slug.toLowerCase() === idOrSlug.toLowerCase()
  );
  if (!found) {
    return c.json({ success: false, error: 'College not found', code: 'NOT_FOUND' }, 404);
  }

  const admins = mockUsers.filter(
    (u) =>
      u.tenantId === found.id && (u.role === 'college_admin' || u.role === 'tpo_admin')
  );
  const studentCount = mockUsers.filter(
    (u) => u.tenantId === found.id && u.role === 'student'
  ).length;

  return c.json({
    success: true,
    college: {
      ...found,
      administrators: admins,
      stats: {
        studentCount,
        adminCount: admins.length,
        totalUsers: studentCount + admins.length
      }
    }
  });
});

// ============================================================================
// 5. PATCH /colleges/:id/status — Activate, Deactivate, or Suspend College
// ============================================================================

superAdminRoutes.patch('/colleges/:id/status', async (c) => {
  const idOrSlug = c.req.param('id').trim();
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = CollegeStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const data = parseResult.data;
  let targetStatus = data.status;
  let targetIsActive = data.isActive;
  let targetIsSuspended = data.isSuspended;

  if (targetStatus === 'suspended' || targetIsSuspended === true) {
    targetStatus = 'suspended';
    targetIsSuspended = true;
    targetIsActive = false;
  } else if (targetStatus === 'inactive' || targetIsActive === false) {
    targetStatus = 'inactive';
    targetIsActive = false;
    targetIsSuspended = false;
  } else if (targetStatus === 'active' || targetIsActive === true) {
    targetStatus = 'active';
    targetIsActive = true;
    targetIsSuspended = false;
  } else {
    targetStatus = 'active';
    targetIsActive = true;
    targetIsSuspended = false;
  }

  const dbUrl = c.env?.DATABASE_URL;
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const condition = isValidUuid(idOrSlug)
        ? eq(tenants.id, idOrSlug)
        : eq(tenants.slug, idOrSlug.toLowerCase());

      const [existing] = await db.select().from(tenants).where(condition).limit(1);
      if (!existing) {
        return c.json({ success: false, error: 'College not found' }, 404);
      }

      const [updated] = await db
        .update(tenants)
        .set({
          status: targetStatus,
          isActive: targetIsActive,
          isSuspended: targetIsSuspended,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, existing.id))
        .returning();

      await logAuditEvent(c, {
        tenantId: updated.id,
        action: 'COLLEGE_STATUS_UPDATED',
        resourceType: 'college',
        resourceId: updated.id,
        changesDiff: {
          previousStatus: existing.status,
          newStatus: targetStatus,
          isActive: targetIsActive,
          isSuspended: targetIsSuspended
        }
      });

      return c.json({
        success: true,
        message: `College status updated to '${targetStatus}'`,
        college: updated
      });
    } catch (err: any) {
      console.error('Update college status error:', err);
      return c.json(
        { success: false, error: 'Database error updating status', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Update
  const found = mockColleges.find(
    (col) => col.id === idOrSlug || col.slug.toLowerCase() === idOrSlug.toLowerCase()
  );
  if (!found) {
    return c.json({ success: false, error: 'College not found' }, 404);
  }

  const previousStatus = found.status;
  found.status = targetStatus;
  found.isActive = targetIsActive;
  found.isSuspended = targetIsSuspended;
  found.updatedAt = new Date().toISOString();

  await logAuditEvent(c, {
    tenantId: found.id,
    action: 'COLLEGE_STATUS_UPDATED',
    resourceType: 'college',
    resourceId: found.id,
    changesDiff: { previousStatus, newStatus: targetStatus, isActive: targetIsActive }
  });

  return c.json({
    success: true,
    message: `College status updated to '${targetStatus}'`,
    college: found
  });
});

// ============================================================================
// 6. PATCH /colleges/:id — Update College Information
// ============================================================================

superAdminRoutes.patch('/colleges/:id', async (c) => {
  const idOrSlug = c.req.param('id').trim();
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = UpdateCollegeSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const data = parseResult.data;
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const condition = isValidUuid(idOrSlug)
        ? eq(tenants.id, idOrSlug)
        : eq(tenants.slug, idOrSlug.toLowerCase());

      const [existing] = await db.select().from(tenants).where(condition).limit(1);
      if (!existing) {
        return c.json({ success: false, error: 'College not found' }, 404);
      }

      // Check for conflict if slug or name is being changed
      if (data.slug && data.slug !== existing.slug) {
        const [slugConflict] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, data.slug.toLowerCase().trim()))
          .limit(1);
        if (slugConflict && slugConflict.id !== existing.id) {
          return c.json(
            { success: false, error: 'Slug is already in use by another college' },
            409
          );
        }
      }

      const updatePayload: Record<string, any> = { updatedAt: new Date() };
      if (data.name !== undefined) updatePayload.name = data.name.trim();
      if (data.slug !== undefined) updatePayload.slug = data.slug.toLowerCase().trim();
      if (data.domain !== undefined) updatePayload.domain = data.domain?.trim() || null;
      if (data.location !== undefined) updatePayload.location = data.location?.trim() || null;
      if (data.contactEmail !== undefined)
        updatePayload.contactEmail = data.contactEmail?.trim() || null;
      if (data.contactPhone !== undefined)
        updatePayload.contactPhone = data.contactPhone?.trim() || null;
      if (data.settings !== undefined) updatePayload.settings = data.settings;

      const [updated] = await db
        .update(tenants)
        .set(updatePayload)
        .where(eq(tenants.id, existing.id))
        .returning();

      await logAuditEvent(c, {
        tenantId: updated.id,
        action: 'COLLEGE_UPDATED',
        resourceType: 'college',
        resourceId: updated.id,
        changesDiff: data
      });

      return c.json({
        success: true,
        message: 'College information updated successfully',
        college: updated
      });
    } catch (err: any) {
      console.error('Update college error:', err);
      return c.json(
        { success: false, error: 'Database error updating college', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Update
  const found = mockColleges.find(
    (col) => col.id === idOrSlug || col.slug.toLowerCase() === idOrSlug.toLowerCase()
  );
  if (!found) {
    return c.json({ success: false, error: 'College not found' }, 404);
  }

  if (data.name !== undefined) found.name = data.name.trim();
  if (data.slug !== undefined) found.slug = data.slug.toLowerCase().trim();
  if (data.domain !== undefined) found.domain = data.domain?.trim() || null;
  if (data.location !== undefined) found.location = data.location?.trim() || null;
  if (data.contactEmail !== undefined) found.contactEmail = data.contactEmail?.trim() || null;
  if (data.contactPhone !== undefined) found.contactPhone = data.contactPhone?.trim() || null;
  if (data.settings !== undefined) found.settings = data.settings;
  found.updatedAt = new Date().toISOString();

  await logAuditEvent(c, {
    tenantId: found.id,
    action: 'COLLEGE_UPDATED',
    resourceType: 'college',
    resourceId: found.id,
    changesDiff: data
  });

  return c.json({
    success: true,
    message: 'College information updated successfully',
    college: found
  });
});

// ============================================================================
// 7. GET /users — List Users Across Platform with Filters
// ============================================================================

superAdminRoutes.get('/users', async (c) => {
  const query = c.req.query('q')?.trim() || c.req.query('search')?.trim() || '';
  const roleFilter = c.req.query('role')?.trim().toLowerCase();
  const collegeIdFilter = c.req.query('collegeId')?.trim() || c.req.query('tenantId')?.trim();
  const statusFilter = c.req.query('status')?.trim().toLowerCase();

  const dbUrl = c.env?.DATABASE_URL;
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const conditions: any[] = [];

      if (query) {
        conditions.push(
          or(ilike(users.email, `%${query}%`), ilike(users.fullName, `%${query}%`))
        );
      }

      if (roleFilter && roleFilter !== 'all') {
        conditions.push(eq(users.role, roleFilter as any));
      }

      if (collegeIdFilter && collegeIdFilter !== 'all') {
        if (isValidUuid(collegeIdFilter)) {
          conditions.push(eq(users.tenantId, collegeIdFilter));
        }
      }

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'active') {
          conditions.push(eq(users.isActive, true));
        } else if (statusFilter === 'suspended' || statusFilter === 'inactive') {
          conditions.push(eq(users.isActive, false));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const userRecords = await db
        .select({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
          isActive: users.isActive,
          isVerified: users.isVerified,
          tenantId: users.tenantId,
          collegeName: tenants.name,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .where(whereClause)
        .orderBy(desc(users.createdAt));

      return c.json({
        success: true,
        count: userRecords.length,
        total: userRecords.length,
        users: userRecords
      });
    } catch (err: any) {
      console.error('List users database error:', err);
      return c.json(
        { success: false, error: 'Database error listing users', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Filtering
  let results = [...mockUsers];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (u) => u.email.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q)
    );
  }

  if (roleFilter && roleFilter !== 'all') {
    results = results.filter((u) => u.role === roleFilter);
  }

  if (collegeIdFilter && collegeIdFilter !== 'all') {
    results = results.filter((u) => u.tenantId === collegeIdFilter);
  }

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') {
      results = results.filter((u) => u.isActive);
    } else if (statusFilter === 'suspended' || statusFilter === 'inactive') {
      results = results.filter((u) => !u.isActive);
    }
  }

  const enrichedUsers = results.map((u) => {
    const col = mockColleges.find((c) => c.id === u.tenantId);
    return {
      ...u,
      collegeName: col?.name || 'Platform / Global'
    };
  });

  return c.json({
    success: true,
    count: enrichedUsers.length,
    total: enrichedUsers.length,
    users: enrichedUsers
  });
});

// ============================================================================
// 8. POST /users — Direct User Creation with Bcrypt Password
// ============================================================================

superAdminRoutes.post('/users', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = CreateUserSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const data = parseResult.data;
  const specifiedCollege = data.tenantId || data.collegeId;
  const dbUrl = c.env?.DATABASE_URL;

  // Validate college existence if specified
  if (specifiedCollege) {
    if (dbUrl) {
      try {
        const db = getDb(dbUrl);
        const [foundTenant] = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.id, specifiedCollege))
          .limit(1);
        if (!foundTenant) {
          return c.json(
            {
              success: false,
              error: 'Invalid college assignment: college does not exist',
              code: 'INVALID_COLLEGE'
            },
            400
          );
        }
      } catch (err: any) {
        // Continue to main handler if DB check fails
      }
    } else {
      const foundTenant = mockColleges.find(
        (col) => col.id === specifiedCollege || col.slug === specifiedCollege
      );
      if (!foundTenant) {
        return c.json(
          {
            success: false,
            error: 'Invalid college assignment: college does not exist',
            code: 'INVALID_COLLEGE'
          },
          400
        );
      }
    }
  }

  let resolvedTenantId = specifiedCollege;

  // If no tenant is provided for a college-bound role, check if one can be derived
  if (!resolvedTenantId && data.role !== 'superadmin') {
    resolvedTenantId = '11111111-1111-4111-8111-111111111111';
  } else if (!resolvedTenantId) {
    resolvedTenantId = '11111111-1111-4111-8111-111111111111';
  }

  const normalizedEmail = data.email.toLowerCase().trim();
  const hashedPassword = await hashPassword(data.password);

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      // Check duplicate user under tenant
      const [existing] = await db
        .select()
        .from(users)
        .where(and(eq(users.tenantId, resolvedTenantId), eq(users.email, normalizedEmail)))
        .limit(1);

      if (existing) {
        return c.json(
          {
            success: false,
            error: 'A user with this email already exists under this institution',
            code: 'USER_EXISTS'
          },
          409
        );
      }

      const [createdUser] = await db
        .insert(users)
        .values({
          tenantId: resolvedTenantId,
          email: normalizedEmail,
          passwordHash: hashedPassword,
          fullName: data.fullName.trim(),
          role: data.role as any,
          isActive: data.isActive,
          isVerified: true
        })
        .returning();

      // If student role, provision student profile
      if (data.role === 'student') {
        await db.insert(students).values({
          tenantId: resolvedTenantId,
          userId: createdUser.id,
          rollNumber: data.rollNumber || `ROLL-${Date.now().toString().slice(-6)}`,
          department: data.department || 'Computer Science and Engineering',
          batchYear: data.batchYear || new Date().getFullYear(),
          degree: data.degree || 'B.Tech',
          cgpa: data.cgpa ? String(data.cgpa) : '0.00'
        });
      }

      await logAuditEvent(c, {
        tenantId: resolvedTenantId,
        action: 'USER_CREATED',
        resourceType: 'user',
        resourceId: createdUser.id,
        changesDiff: {
          email: createdUser.email,
          fullName: createdUser.fullName,
          role: createdUser.role,
          tenantId: createdUser.tenantId
        }
      });

      return c.json(
        {
          success: true,
          message: 'User created successfully',
          user: {
            id: createdUser.id,
            email: createdUser.email,
            fullName: createdUser.fullName,
            role: createdUser.role,
            tenantId: createdUser.tenantId,
            isActive: createdUser.isActive,
            isVerified: createdUser.isVerified,
            createdAt: createdUser.createdAt
          }
        },
        201
      );
    } catch (err: any) {
      console.error('Create user database error:', err);
      return c.json(
        { success: false, error: 'Database error creating user', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Creation
  const existingMock = mockUsers.find(
    (u) => u.tenantId === resolvedTenantId && u.email.toLowerCase() === normalizedEmail
  );
  if (existingMock) {
    return c.json(
      {
        success: false,
        error: 'A user with this email already exists under this institution',
        code: 'USER_EXISTS'
      },
      409
    );
  }

  const newMockUser: MockUser = {
    id: crypto.randomUUID(),
    tenantId: resolvedTenantId,
    email: normalizedEmail,
    fullName: data.fullName.trim(),
    role: data.role as UserRole,
    isActive: data.isActive,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockUsers.unshift(newMockUser);

  await logAuditEvent(c, {
    tenantId: resolvedTenantId,
    action: 'USER_CREATED',
    resourceType: 'user',
    resourceId: newMockUser.id,
    changesDiff: {
      email: newMockUser.email,
      fullName: newMockUser.fullName,
      role: newMockUser.role,
      tenantId: newMockUser.tenantId
    }
  });

  return c.json(
    {
      success: true,
      message: 'User created successfully',
      user: newMockUser
    },
    201
  );
});

// ============================================================================
// 9. PATCH /users/:id/status — Suspend or Reactivate User Account
// ============================================================================

superAdminRoutes.patch('/users/:id/status', async (c) => {
  const userId = c.req.param('id').trim();
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = UpdateUserStatusSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const data = parseResult.data;
  let newIsActive: boolean;

  if (data.isActive !== undefined) {
    newIsActive = data.isActive;
  } else if (data.status === 'active') {
    newIsActive = true;
  } else if (data.status === 'suspended' || data.status === 'inactive') {
    newIsActive = false;
  } else {
    newIsActive = true;
  }

  const dbUrl = c.env?.DATABASE_URL;
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!targetUser) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          isActive: newIsActive,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      await logAuditEvent(c, {
        tenantId: updatedUser.tenantId,
        action: newIsActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
        resourceType: 'user',
        resourceId: updatedUser.id,
        changesDiff: { previousIsActive: targetUser.isActive, newIsActive }
      });

      return c.json({
        success: true,
        message: `User account has been ${newIsActive ? 'activated' : 'suspended'} successfully`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Update user status database error:', err);
      return c.json(
        { success: false, error: 'Database error updating user status', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Update
  const foundUser = mockUsers.find((u) => u.id === userId);
  if (!foundUser) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const previousIsActive = foundUser.isActive;
  foundUser.isActive = newIsActive;
  foundUser.updatedAt = new Date().toISOString();

  await logAuditEvent(c, {
    tenantId: foundUser.tenantId,
    action: newIsActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
    resourceType: 'user',
    resourceId: foundUser.id,
    changesDiff: { previousIsActive, newIsActive }
  });

  return c.json({
    success: true,
    message: `User account has been ${newIsActive ? 'activated' : 'suspended'} successfully`,
    user: foundUser
  });
});

// ============================================================================
// 10. PATCH /users/:id/role — Update User Role
// ============================================================================

superAdminRoutes.patch('/users/:id/role', async (c) => {
  const userId = c.req.param('id').trim();
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = UpdateUserRoleSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const { role } = parseResult.data;
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!targetUser) {
        return c.json({ success: false, error: 'User not found' }, 404);
      }

      const [updatedUser] = await db
        .update(users)
        .set({
          role: role as any,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      await logAuditEvent(c, {
        tenantId: updatedUser.tenantId,
        action: 'USER_ROLE_UPDATED',
        resourceType: 'user',
        resourceId: updatedUser.id,
        changesDiff: { previousRole: targetUser.role, newRole: role }
      });

      return c.json({
        success: true,
        message: `User role updated to '${role}' successfully`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Update user role database error:', err);
      return c.json(
        { success: false, error: 'Database error updating role', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Update
  const foundUser = mockUsers.find((u) => u.id === userId);
  if (!foundUser) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const previousRole = foundUser.role;
  foundUser.role = role as UserRole;
  foundUser.updatedAt = new Date().toISOString();

  await logAuditEvent(c, {
    tenantId: foundUser.tenantId,
    action: 'USER_ROLE_UPDATED',
    resourceType: 'user',
    resourceId: foundUser.id,
    changesDiff: { previousRole, newRole: role }
  });

  return c.json({
    success: true,
    message: `User role updated to '${role}' successfully`,
    user: foundUser
  });
});

// ============================================================================
// 11. GET /invitations — List Invitations with Status & Tenant Filters
// ============================================================================

superAdminRoutes.get('/invitations', async (c) => {
  const query = c.req.query('q')?.trim() || c.req.query('search')?.trim() || '';
  const statusFilter = c.req.query('status')?.trim().toLowerCase();
  const roleFilter = c.req.query('role')?.trim().toLowerCase();
  const collegeIdFilter = c.req.query('collegeId')?.trim() || c.req.query('tenantId')?.trim();

  const dbUrl = c.env?.DATABASE_URL;
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const conditions: any[] = [];

      if (query) {
        conditions.push(
          or(
            ilike(invitations.email, `%${query}%`),
            ilike(invitations.fullName, `%${query}%`)
          )
        );
      }

      if (statusFilter && statusFilter !== 'all') {
        conditions.push(eq(invitations.status, statusFilter as any));
      }

      if (roleFilter && roleFilter !== 'all') {
        conditions.push(eq(invitations.role, roleFilter as any));
      }

      if (collegeIdFilter && collegeIdFilter !== 'all') {
        if (isValidUuid(collegeIdFilter)) {
          conditions.push(eq(invitations.tenantId, collegeIdFilter));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const invitationRecords = await db
        .select({
          id: invitations.id,
          email: invitations.email,
          fullName: invitations.fullName,
          role: invitations.role,
          token: invitations.token,
          status: invitations.status,
          metadataJson: invitations.metadataJson,
          tenantId: invitations.tenantId,
          collegeName: tenants.name,
          expiresAt: invitations.expiresAt,
          acceptedAt: invitations.acceptedAt,
          createdAt: invitations.createdAt,
          updatedAt: invitations.updatedAt
        })
        .from(invitations)
        .leftJoin(tenants, eq(invitations.tenantId, tenants.id))
        .where(whereClause)
        .orderBy(desc(invitations.createdAt));

      return c.json({
        success: true,
        count: invitationRecords.length,
        total: invitationRecords.length,
        invitations: invitationRecords
      });
    } catch (err: any) {
      console.error('List invitations database error:', err);
      return c.json(
        { success: false, error: 'Database error listing invitations', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Filtering
  let results = [...mockInvitations];

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (inv) =>
        inv.email.toLowerCase().includes(q) ||
        (inv.fullName && inv.fullName.toLowerCase().includes(q))
    );
  }

  if (statusFilter && statusFilter !== 'all') {
    results = results.filter((inv) => inv.status === statusFilter);
  }

  if (roleFilter && roleFilter !== 'all') {
    results = results.filter((inv) => inv.role === roleFilter);
  }

  if (collegeIdFilter && collegeIdFilter !== 'all') {
    results = results.filter((inv) => inv.tenantId === collegeIdFilter);
  }

  const enrichedInvitations = results.map((inv) => {
    const col = mockColleges.find((c) => c.id === inv.tenantId);
    return {
      ...inv,
      collegeName: col?.name || 'Platform Wide'
    };
  });

  return c.json({
    success: true,
    count: enrichedInvitations.length,
    total: enrichedInvitations.length,
    invitations: enrichedInvitations
  });
});

// ============================================================================
// 11b. GET /invitations/validate/:token — Validate Invitation Token
// ============================================================================

superAdminRoutes.get('/invitations/validate/:token', async (c) => {
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
        return c.json({ success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' }, 404);
      }

      if (inv.status === 'revoked') {
        return c.json({ success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED', invitation: inv }, 410);
      }

      if (inv.status === 'accepted') {
        return c.json({ success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED', invitation: inv }, 410);
      }

      const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
      if (isExpired || inv.status === 'expired') {
        return c.json({ success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED', invitation: inv }, 410);
      }

      return c.json({ success: true, valid: true, invitation: inv });
    } catch (err: any) {
      console.error('Validate invitation error:', err);
      return c.json({ success: false, error: 'Database error validating invitation', details: err?.message }, 500);
    }
  }

  // Offline mock
  const inv = mockInvitations.find((i) => i.token === token);
  if (!inv) {
    return c.json({ success: false, error: 'Invitation not found', code: 'INVITATION_NOT_FOUND' }, 404);
  }

  if (inv.status === 'revoked') {
    return c.json({ success: false, error: 'Invitation has been revoked', code: 'INVITATION_REVOKED', invitation: inv }, 410);
  }

  if (inv.status === 'accepted') {
    return c.json({ success: false, error: 'Invitation has already been used', code: 'INVITATION_ALREADY_USED', invitation: inv }, 410);
  }

  const isExpired = new Date(inv.expiresAt).getTime() <= Date.now();
  if (isExpired || inv.status === 'expired') {
    return c.json({ success: false, error: 'Invitation has expired', code: 'INVITATION_EXPIRED', invitation: inv }, 410);
  }

  return c.json({ success: true, valid: true, invitation: inv });
});

// ============================================================================
// 11c. GET /invitations/:id — Get Invitation Details by ID or Token
// ============================================================================

superAdminRoutes.get('/invitations/:id', async (c) => {
  const idOrToken = c.req.param('id').trim();
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const condition = isValidUuid(idOrToken)
        ? eq(invitations.id, idOrToken)
        : eq(invitations.token, idOrToken);

      const [inv] = await db.select().from(invitations).where(condition).limit(1);
      if (!inv) {
        return c.json({ success: false, error: 'Invitation not found', code: 'NOT_FOUND' }, 404);
      }
      return c.json({ success: true, invitation: inv });
    } catch (err: any) {
      return c.json({ success: false, error: 'Database error fetching invitation', details: err?.message }, 500);
    }
  }

  const inv = mockInvitations.find((i) => i.id === idOrToken || i.token === idOrToken);
  if (!inv) {
    return c.json({ success: false, error: 'Invitation not found', code: 'NOT_FOUND' }, 404);
  }
  return c.json({ success: true, invitation: inv });
});

// ============================================================================
// 12. POST /invitations — Create Expiring Invitation Token
// ============================================================================

superAdminRoutes.post('/invitations', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  const parseResult = CreateInvitationSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { success: false, error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const data = parseResult.data;
  const normalizedEmail = data.email.toLowerCase().trim();
  const resolvedTenantId = data.tenantId || data.collegeId || null;
  const dbUrl = c.env?.DATABASE_URL;

  // Validate college existence if specified
  if (resolvedTenantId) {
    if (dbUrl) {
      try {
        const db = getDb(dbUrl);
        const [foundTenant] = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.id, resolvedTenantId))
          .limit(1);
        if (!foundTenant) {
          return c.json(
            {
              success: false,
              error: 'Invalid college assignment: college does not exist',
              code: 'INVALID_COLLEGE'
            },
            400
          );
        }
      } catch (err: any) {
        // Continue if DB check errors
      }
    } else {
      const foundTenant = mockColleges.find(
        (col) => col.id === resolvedTenantId || col.slug === resolvedTenantId
      );
      if (!foundTenant) {
        return c.json(
          {
            success: false,
            error: 'Invalid college assignment: college does not exist',
            code: 'INVALID_COLLEGE'
          },
          400
        );
      }
    }
  }

  const token = generateSecureToken('inv_');
  const expiresAtDate = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000);
  const actor = c.get('user');
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      // Check if user already exists
      if (resolvedTenantId) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(
            and(eq(users.tenantId, resolvedTenantId), eq(users.email, normalizedEmail))
          )
          .limit(1);

        if (existingUser) {
          return c.json(
            {
              success: false,
              error: 'A registered user with this email already exists under this institution',
              code: 'USER_ALREADY_EXISTS'
            },
            409
          );
        }
      }

      // Check pending duplicate invitation
      const pendingConditions = [
        eq(invitations.email, normalizedEmail),
        eq(invitations.status, 'pending')
      ];
      if (resolvedTenantId) {
        pendingConditions.push(eq(invitations.tenantId, resolvedTenantId));
      }

      const [existingPending] = await db
        .select()
        .from(invitations)
        .where(and(...pendingConditions))
        .limit(1);

      if (existingPending) {
        return c.json(
          {
            success: false,
            error: 'An active pending invitation already exists for this email',
            code: 'INVITATION_ALREADY_EXISTS',
            invitationId: existingPending.id
          },
          409
        );
      }

      const [newInvitation] = await db
        .insert(invitations)
        .values({
          tenantId: resolvedTenantId || undefined,
          email: normalizedEmail,
          role: data.role as any,
          fullName: data.fullName?.trim() || null,
          token: token,
          status: 'pending',
          metadataJson: data.metadataJson,
          invitedByUserId: actor?.id || undefined,
          expiresAt: expiresAtDate
        })
        .returning();

      await logAuditEvent(c, {
        tenantId: resolvedTenantId,
        action: 'INVITATION_CREATED',
        resourceType: 'invitation',
        resourceId: newInvitation.id,
        changesDiff: {
          email: newInvitation.email,
          role: newInvitation.role,
          tenantId: newInvitation.tenantId,
          expiresAt: newInvitation.expiresAt
        }
      });

      return c.json(
        {
          success: true,
          message: 'Invitation issued successfully',
          invitation: newInvitation,
          inviteLink: `https://carrersync.vercel.app/register/invite?token=${token}`
        },
        201
      );
    } catch (err: any) {
      console.error('Create invitation database error:', err);
      return c.json(
        { success: false, error: 'Database error creating invitation', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Creation
  const existingUserMock = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      (!resolvedTenantId || u.tenantId === resolvedTenantId)
  );
  if (existingUserMock) {
    return c.json(
      {
        success: false,
        error: 'A registered user with this email already exists under this institution',
        code: 'USER_ALREADY_EXISTS'
      },
      409
    );
  }

  const existingPendingMock = mockInvitations.find(
    (inv) =>
      inv.email.toLowerCase() === normalizedEmail &&
      inv.status === 'pending' &&
      (!resolvedTenantId || inv.tenantId === resolvedTenantId)
  );

  if (existingPendingMock) {
    return c.json(
      {
        success: false,
        error: 'An active pending invitation already exists for this email',
        code: 'INVITATION_ALREADY_EXISTS',
        invitationId: existingPendingMock.id
      },
      409
    );
  }

  const newMockInvitation: MockInvitation = {
    id: crypto.randomUUID(),
    tenantId: resolvedTenantId,
    email: normalizedEmail,
    role: data.role as UserRole,
    fullName: data.fullName?.trim() || null,
    token: token,
    status: 'pending',
    metadataJson: data.metadataJson,
    invitedByUserId: actor?.id || null,
    expiresAt: expiresAtDate.toISOString(),
    acceptedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  mockInvitations.unshift(newMockInvitation);

  await logAuditEvent(c, {
    tenantId: resolvedTenantId,
    action: 'INVITATION_CREATED',
    resourceType: 'invitation',
    resourceId: newMockInvitation.id,
    changesDiff: {
      email: newMockInvitation.email,
      role: newMockInvitation.role,
      expiresAt: newMockInvitation.expiresAt
    }
  });

  return c.json(
    {
      success: true,
      message: 'Invitation issued successfully',
      invitation: newMockInvitation,
      inviteLink: `https://carrersync.vercel.app/register/invite?token=${token}`
    },
    201
  );
});

// ============================================================================
// 13. POST /invitations/:id/revoke — Revoke Pending Invitation
// ============================================================================

superAdminRoutes.post('/invitations/:id/revoke', async (c) => {
  const invitationId = c.req.param('id').trim();
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const [targetInv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      if (!targetInv) {
        return c.json({ success: false, error: 'Invitation not found' }, 404);
      }

      if (targetInv.status === 'accepted') {
        return c.json(
          {
            success: false,
            error: 'Cannot revoke an invitation that has already been accepted',
            code: 'INVITATION_ALREADY_ACCEPTED'
          },
          400
        );
      }

      const [revokedInv] = await db
        .update(invitations)
        .set({
          status: 'revoked',
          updatedAt: new Date()
        })
        .where(eq(invitations.id, invitationId))
        .returning();

      await logAuditEvent(c, {
        tenantId: revokedInv.tenantId,
        action: 'INVITATION_REVOKED',
        resourceType: 'invitation',
        resourceId: revokedInv.id,
        changesDiff: { previousStatus: targetInv.status, newStatus: 'revoked' }
      });

      return c.json({
        success: true,
        message: 'Invitation revoked successfully',
        invitation: revokedInv
      });
    } catch (err: any) {
      console.error('Revoke invitation database error:', err);
      return c.json(
        { success: false, error: 'Database error revoking invitation', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Revocation
  const foundInv = mockInvitations.find((inv) => inv.id === invitationId);
  if (!foundInv) {
    return c.json({ success: false, error: 'Invitation not found' }, 404);
  }

  if (foundInv.status === 'accepted') {
    return c.json(
      {
        success: false,
        error: 'Cannot revoke an invitation that has already been accepted',
        code: 'INVITATION_ALREADY_ACCEPTED'
      },
      400
    );
  }

  const previousStatus = foundInv.status;
  foundInv.status = 'revoked';
  foundInv.updatedAt = new Date().toISOString();

  await logAuditEvent(c, {
    tenantId: foundInv.tenantId,
    action: 'INVITATION_REVOKED',
    resourceType: 'invitation',
    resourceId: foundInv.id,
    changesDiff: { previousStatus, newStatus: 'revoked' }
  });

  return c.json({
    success: true,
    message: 'Invitation revoked successfully',
    invitation: foundInv
  });
});

// ============================================================================
// 14. POST /invitations/:id/resend — Extend Expiration & Refresh Token
// ============================================================================

superAdminRoutes.post('/invitations/:id/resend', async (c) => {
  const invitationId = c.req.param('id').trim();
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  const parseResult = ResendInvitationSchema.safeParse(body);
  const expiresInDays = parseResult.success && parseResult.data?.expiresInDays ? parseResult.data.expiresInDays : 7;

  const newToken = generateSecureToken('inv_');
  const newExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const dbUrl = c.env?.DATABASE_URL;

  if (dbUrl) {
    try {
      const db = getDb(dbUrl);

      const [targetInv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitationId))
        .limit(1);

      if (!targetInv) {
        return c.json({ success: false, error: 'Invitation not found' }, 404);
      }

      if (targetInv.status === 'accepted') {
        return c.json(
          {
            success: false,
            error: 'Cannot resend an invitation that has already been accepted',
            code: 'INVITATION_ALREADY_ACCEPTED'
          },
          400
        );
      }

      const [refreshedInv] = await db
        .update(invitations)
        .set({
          token: newToken,
          status: 'pending',
          expiresAt: newExpiresAt,
          updatedAt: new Date()
        })
        .where(eq(invitations.id, invitationId))
        .returning();

      await logAuditEvent(c, {
        tenantId: refreshedInv.tenantId,
        action: 'INVITATION_RESENT',
        resourceType: 'invitation',
        resourceId: refreshedInv.id,
        changesDiff: {
          previousExpiresAt: targetInv.expiresAt,
          newExpiresAt: refreshedInv.expiresAt
        }
      });

      return c.json({
        success: true,
        message: 'Invitation token refreshed and expiration extended successfully',
        invitation: refreshedInv,
        inviteLink: `https://carrersync.vercel.app/register/invite?token=${newToken}`
      });
    } catch (err: any) {
      console.error('Resend invitation database error:', err);
      return c.json(
        { success: false, error: 'Database error resending invitation', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Resend
  const foundInv = mockInvitations.find((inv) => inv.id === invitationId);
  if (!foundInv) {
    return c.json({ success: false, error: 'Invitation not found' }, 404);
  }

  if (foundInv.status === 'accepted') {
    return c.json(
      {
        success: false,
        error: 'Cannot resend an invitation that has already been accepted',
        code: 'INVITATION_ALREADY_ACCEPTED'
      },
      400
    );
  }

  const previousExpiresAt = foundInv.expiresAt;
  foundInv.token = newToken;
  foundInv.status = 'pending';
  foundInv.expiresAt = newExpiresAt.toISOString();
  foundInv.updatedAt = new Date().toISOString();

  await logAuditEvent(c, {
    tenantId: foundInv.tenantId,
    action: 'INVITATION_RESENT',
    resourceType: 'invitation',
    resourceId: foundInv.id,
    changesDiff: { previousExpiresAt, newExpiresAt: foundInv.expiresAt }
  });

  return c.json({
    success: true,
    message: 'Invitation token refreshed and expiration extended successfully',
    invitation: foundInv,
    inviteLink: `https://carrersync.vercel.app/register/invite?token=${newToken}`
  });
});

// ============================================================================
// 15. GET /audit-logs — Query Platform-Wide Compliance Audit Events
// ============================================================================

superAdminRoutes.get('/audit-logs', async (c) => {
  const actionFilter = c.req.query('action')?.trim();
  const resourceTypeFilter = c.req.query('resourceType')?.trim();
  const actorEmailFilter = c.req.query('actorEmail')?.trim();
  const tenantIdFilter = c.req.query('tenantId')?.trim();
  const limitParam = parseInt(c.req.query('limit') || '50', 10);
  const limit = Math.min(Math.max(limitParam, 1), 200);

  const dbUrl = c.env?.DATABASE_URL;
  if (dbUrl) {
    try {
      const db = getDb(dbUrl);
      const conditions: any[] = [];

      if (actionFilter && actionFilter !== 'all') {
        conditions.push(eq(auditEvents.action, actionFilter));
      }
      if (resourceTypeFilter && resourceTypeFilter !== 'all') {
        conditions.push(eq(auditEvents.resourceType, resourceTypeFilter));
      }
      if (actorEmailFilter) {
        conditions.push(ilike(auditEvents.actorEmail, `%${actorEmailFilter}%`));
      }
      if (tenantIdFilter && tenantIdFilter !== 'all') {
        if (isValidUuid(tenantIdFilter)) {
          conditions.push(eq(auditEvents.tenantId, tenantIdFilter));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const logs = await db
        .select({
          id: auditEvents.id,
          tenantId: auditEvents.tenantId,
          collegeName: tenants.name,
          actorId: auditEvents.actorId,
          actorEmail: auditEvents.actorEmail,
          action: auditEvents.action,
          resourceType: auditEvents.resourceType,
          resourceId: auditEvents.resourceId,
          changesDiff: auditEvents.changesDiff,
          ipAddress: auditEvents.ipAddress,
          timestamp: auditEvents.timestamp
        })
        .from(auditEvents)
        .leftJoin(tenants, eq(auditEvents.tenantId, tenants.id))
        .where(whereClause)
        .orderBy(desc(auditEvents.timestamp))
        .limit(limit);

      return c.json({
        success: true,
        count: logs.length,
        total: logs.length,
        auditLogs: logs
      });
    } catch (err: any) {
      console.error('Query audit logs database error:', err);
      return c.json(
        { success: false, error: 'Database error querying audit logs', details: err?.message },
        500
      );
    }
  }

  // Offline Mock Query
  let results = [...mockAuditLogs];

  if (actionFilter && actionFilter !== 'all') {
    results = results.filter((log) => log.action === actionFilter);
  }
  if (resourceTypeFilter && resourceTypeFilter !== 'all') {
    results = results.filter((log) => log.resourceType === resourceTypeFilter);
  }
  if (actorEmailFilter) {
    const q = actorEmailFilter.toLowerCase();
    results = results.filter((log) => log.actorEmail && log.actorEmail.toLowerCase().includes(q));
  }
  if (tenantIdFilter && tenantIdFilter !== 'all') {
    results = results.filter((log) => log.tenantId === tenantIdFilter);
  }

  const enrichedLogs = results.slice(0, limit).map((log) => {
    const col = mockColleges.find((c) => c.id === log.tenantId);
    return {
      ...log,
      collegeName: col?.name || 'Platform Wide'
    };
  });

  return c.json({
    success: true,
    count: enrichedLogs.length,
    total: results.length,
    auditLogs: enrichedLogs
  });
});

// ============================================================================
// 16. GET /settings & PATCH /settings — Platform Settings Controls
// ============================================================================

superAdminRoutes.get('/settings', (c) => {
  return c.json({
    success: true,
    settings: mockSettings
  });
});

superAdminRoutes.patch('/settings', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: 'Malformed JSON payload' }, 400);
  }

  if (body && typeof body === 'object') {
    mockSettings = {
      ...mockSettings,
      ...(body as Record<string, unknown>)
    };
  }

  await logAuditEvent(c, {
    action: 'PLATFORM_SETTINGS_UPDATED',
    resourceType: 'settings',
    resourceId: 'platform_settings',
    changesDiff: body as Record<string, unknown>
  });

  return c.json({
    success: true,
    message: 'Platform settings updated successfully',
    settings: mockSettings
  });
});

export { superAdminRoutes };
