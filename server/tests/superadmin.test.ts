import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import env from '../src/config/env';

describe('Super Admin Portal Backend API (/api/v1/super-admin)', () => {
  const secret = 'carrersync_jwt_default_secret_dev_key_32_chars';
  const systemTenantId = '11111111-1111-4111-8111-111111111111';

  beforeAll(() => {
    delete process.env.DATABASE_URL;
    env.DATABASE_URL = undefined;
    env.JWT_SECRET = secret;
    process.env.JWT_SECRET = secret;
  });

  async function makeToken(role: string, tenantId = systemTenantId, email = 'user@example.com') {
    return createJwtToken(
      {
        sub: 'user-' + crypto.randomUUID().slice(0, 8),
        tenant_id: tenantId,
        role,
        email
      },
      secret
    );
  }

  // -------------------------------------------------------------------------
  // 1. RBAC & Security Isolation
  // -------------------------------------------------------------------------
  describe('RBAC & Route Protection', () => {
    it('should reject unauthenticated request with 401 MISSING_BEARER_TOKEN', async () => {
      const res = await request(app).get('/api/v1/super-admin/stats');
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should reject non-superadmin roles (student, college_admin, recruiter) with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const roles = ['student', 'college_admin', 'tpo_admin', 'recruiter', 'faculty_coordinator'];
      for (const role of roles) {
        const token = await makeToken(role);
        const res = await request(app)
          .get('/api/v1/super-admin/stats')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);

        const body = res.body;
        expect(body.success).toBe(false);
        expect(body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      }
    });

    it('should grant access to superadmin role', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.stats).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /stats
  // -------------------------------------------------------------------------
  describe('GET /api/v1/super-admin/stats', () => {
    it('should return all 8 platform aggregate metrics', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/stats')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      const { stats } = body;
      expect(typeof stats.totalColleges).toBe('number');
      expect(typeof stats.totalStudents).toBe('number');
      expect(typeof stats.totalRecruiters).toBe('number');
      expect(typeof stats.totalCollegeAdmins).toBe('number');
      expect(typeof stats.totalTpoAdmins).toBe('number');
      expect(typeof stats.activeUsers).toBe('number');
      expect(typeof stats.suspendedUsers).toBe('number');
      expect(typeof stats.pendingInvitations).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // 3. College Management (GET, POST, GET/:id, PATCH/:id/status, PATCH/:id)
  // -------------------------------------------------------------------------
  describe('Colleges Management API', () => {
    it('GET /colleges should return list of colleges with student and admin counts', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/colleges')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.colleges)).toBe(true);
      expect(body.colleges.length).toBeGreaterThan(0);

      const first = body.colleges[0];
      expect(first.name).toBeDefined();
      expect(first.slug).toBeDefined();
      expect(typeof first.studentCount).toBe('number');
      expect(typeof first.adminCount).toBe('number');
    });

    it('GET /colleges with search query should filter by name or slug', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/colleges?q=Apex')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.colleges.some((c: any) => c.name.includes('Apex'))).toBe(true);
    });

    it('POST /colleges should validate slug and provision a new college', async () => {
      const token = await makeToken('superadmin');
      const uniqueSlug = 'test-uni-' + Date.now().toString().slice(-6);

      const res = await request(app)
        .post('/api/v1/super-admin/colleges')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test University ' + uniqueSlug,
          slug: uniqueSlug,
          domain: `${uniqueSlug}.edu`,
          location: 'Pune, Maharashtra',
          contactEmail: `admin@${uniqueSlug}.edu`,
          contactPhone: '+91 20 1234 5678'
        });

      expect(res.status).toBe(201);
      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.college.slug).toBe(uniqueSlug);
      expect(body.college.location).toBe('Pune, Maharashtra');

      // Duplicate slug should be rejected with 409
      const dupRes = await request(app)
        .post('/api/v1/super-admin/colleges')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Another College with Same Slug',
          slug: uniqueSlug
        });
      expect(dupRes.status).toBe(409);

      // Duplicate name should also be rejected with 409
      const dupNameRes = await request(app)
        .post('/api/v1/super-admin/colleges')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test University ' + uniqueSlug,
          slug: 'another-slug-' + uniqueSlug
        });
      expect(dupNameRes.status).toBe(409);
    });

    it('GET /colleges/:id should return details with administrators and stats', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/colleges/apex-institute')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.college.name).toContain('Apex');
      expect(Array.isArray(body.college.administrators)).toBe(true);
      expect(body.college.stats).toBeDefined();
    });

    it('PATCH /colleges/:id/status should suspend and reactivate college', async () => {
      const token = await makeToken('superadmin');
      // Suspend
      const suspendRes = await request(app)
        .patch('/api/v1/super-admin/colleges/apex-institute/status')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'suspended' });
      expect(suspendRes.status).toBe(200);
      const suspendBody = suspendRes.body;
      expect(suspendBody.college.status).toBe('suspended');
      expect(suspendBody.college.isSuspended).toBe(true);

      // Reactivate
      const activateRes = await request(app)
        .patch('/api/v1/super-admin/colleges/apex-institute/status')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'active' });
      expect(activateRes.status).toBe(200);
      const activateBody = activateRes.body;
      expect(activateBody.college.status).toBe('active');
      expect(activateBody.college.isActive).toBe(true);
    });

    it('PATCH /colleges/:id should update college information', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .patch('/api/v1/super-admin/colleges/apex-institute')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Bengaluru Tech Park, Karnataka' });
      expect(res.status).toBe(200);
      const body = res.body;
      expect(body.college.location).toBe('Bengaluru Tech Park, Karnataka');
    });
  });

  // -------------------------------------------------------------------------
  // 4. User Management (GET, POST, PATCH/:id/status, PATCH/:id/role)
  // -------------------------------------------------------------------------
  describe('User Management API', () => {
    it('GET /users should list platform users with filters', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/users?role=all&status=all')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.users)).toBe(true);
      expect(body.users.length).toBeGreaterThan(0);
    });

    it('POST /users should validate password length and create a new TPO Admin user', async () => {
      const token = await makeToken('superadmin');
      const testEmail = `tpo.test.${Date.now()}@apex.edu`;

      // Password too short
      const shortPwRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testEmail,
          password: 'short',
          fullName: 'Test TPO',
          role: 'tpo_admin'
        });
      expect(shortPwRes.status).toBe(400);

      // Valid creation
      const res = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testEmail,
          password: 'SecurePassword123!',
          fullName: 'New TPO Admin',
          role: 'tpo_admin',
          tenantId: systemTenantId
        });

      expect(res.status).toBe(201);
      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.user.email).toBe(testEmail.toLowerCase());
      expect(body.user.role).toBe('tpo_admin');
    });

    it('POST /users should support creating users across all roles (college_admin, recruiter, student, tpo_admin)', async () => {
      const token = await makeToken('superadmin');
      const timestamp = Date.now();

      // 1. College Admin
      const adminRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `college.admin.${timestamp}@apex.edu`,
          password: 'AdminPassword2026!',
          fullName: 'Prof. Ananya Sen',
          role: 'college_admin',
          tenantId: systemTenantId
        });
      expect(adminRes.status).toBe(201);
      const adminBody = adminRes.body;
      expect(adminBody.user.role).toBe('college_admin');

      // 2. Recruiter
      const recruiterRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `recruiter.${timestamp}@techgiant.com`,
          password: 'RecruiterSecure2026!',
          fullName: 'Vikram Mehta',
          role: 'recruiter',
          tenantId: systemTenantId
        });
      expect(recruiterRes.status).toBe(201);
      const recruiterBody = recruiterRes.body;
      expect(recruiterBody.user.role).toBe('recruiter');

      // 3. Student
      const studentRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `student.${timestamp}@apex.edu`,
          password: 'StudentPassword2026!',
          fullName: 'Rahul Bose',
          role: 'student',
          tenantId: systemTenantId,
          rollNumber: `CS-${timestamp.toString().slice(-4)}`,
          department: 'Information Science',
          batchYear: 2026,
          cgpa: 8.95
        });
      expect(studentRes.status).toBe(201);
      const studentBody = studentRes.body;
      expect(studentBody.user.role).toBe('student');
    });

    it('POST /users should reject duplicate email with 409 USER_EXISTS', async () => {
      const token = await makeToken('superadmin');
      const testEmail = `duplicate.user.${Date.now()}@apex.edu`;

      // First creation
      const firstRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testEmail,
          password: 'Password123!',
          fullName: 'Original User',
          role: 'student',
          tenantId: systemTenantId
        });
      expect(firstRes.status).toBe(201);

      // Duplicate creation attempt
      const dupRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testEmail,
          password: 'AnotherPassword123!',
          fullName: 'Duplicate User',
          role: 'student',
          tenantId: systemTenantId
        });
      expect(dupRes.status).toBe(409);
      const dupBody = dupRes.body;
      expect(dupBody.success).toBe(false);
      expect(dupBody.code).toBe('USER_EXISTS');
    });

    it('POST /users should reject invalid college assignment with 400 INVALID_COLLEGE', async () => {
      const token = await makeToken('superadmin');
      const nonExistentCollegeId = '99999999-9999-4999-8999-999999999999';

      const res = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: `invalid.college.${Date.now()}@unknown.edu`,
          password: 'Password123!',
          fullName: 'Orphan User',
          role: 'student',
          collegeId: nonExistentCollegeId
        });

      expect(res.status).toBe(400);
      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('INVALID_COLLEGE');
    });

    it('PATCH /users/:id/status should suspend and reactivate user account', async () => {
      const token = await makeToken('superadmin');
      const targetUserId = 'user-11111111-1111-4111-8111-000000000003';

      // Suspend
      const suspendRes = await request(app)
        .patch(`/api/v1/super-admin/users/${targetUserId}/status`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false });
      expect(suspendRes.status).toBe(200);
      const suspendBody = suspendRes.body;
      expect(suspendBody.user.isActive).toBe(false);

      // Reactivate
      const activateRes = await request(app)
        .patch(`/api/v1/super-admin/users/${targetUserId}/status`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: true });
      expect(activateRes.status).toBe(200);
      const activateBody = activateRes.body;
      expect(activateBody.user.isActive).toBe(true);
    });

    it('PATCH /users/:id/role should update user role', async () => {
      const token = await makeToken('superadmin');
      const targetUserId = 'user-11111111-1111-4111-8111-000000000002';

      const res = await request(app)
        .patch(`/api/v1/super-admin/users/${targetUserId}/role`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'college_admin' });
      expect(res.status).toBe(200);
      const body = res.body;
      expect(body.user.role).toBe('college_admin');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Invitations API (GET, POST, POST/:id/revoke, POST/:id/resend)
  // -------------------------------------------------------------------------
  describe('Invitations API', () => {
    it('GET /invitations should list invitations', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/invitations')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.invitations)).toBe(true);
    });

    it('POST /invitations should create a secure expiring invitation token', async () => {
      const token = await makeToken('superadmin');
      const inviteEmail = `invite.${Date.now()}@svu.edu`;

      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: inviteEmail,
          role: 'tpo_admin',
          fullName: 'Prospective TPO',
          tenantId: '22222222-2222-4222-8222-222222222222',
          expiresInDays: 14
        });

      expect(res.status).toBe(201);
      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.invitation.token).toMatch(/^inv_/);
      expect(body.invitation.status).toBe('pending');
      expect(body.inviteLink).toContain(body.invitation.token);

      // Revoke the invitation
      const revokeRes = await request(app)
        .post(`/api/v1/super-admin/invitations/${body.invitation.id}/revoke`)
        .set('Authorization', `Bearer ${token}`);
      expect(revokeRes.status).toBe(200);
      const revokeBody = revokeRes.body;
      expect(revokeBody.invitation.status).toBe('revoked');

      // Resend the invitation
      const resendRes = await request(app)
        .post(`/api/v1/super-admin/invitations/${body.invitation.id}/resend`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ expiresInDays: 7 });
      expect(resendRes.status).toBe(200);
      const resendBody = resendRes.body;
      expect(resendBody.invitation.status).toBe('pending');
      expect(resendBody.invitation.token).not.toBe(body.invitation.token);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Audit Trail & Platform Settings
  // -------------------------------------------------------------------------
  describe('Audit Trail & Platform Settings', () => {
    it('GET /audit-logs should return platform compliance audit events', async () => {
      const token = await makeToken('superadmin');
      const res = await request(app)
        .get('/api/v1/super-admin/audit-logs?limit=20')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.auditLogs)).toBe(true);
      expect(body.auditLogs.length).toBeGreaterThan(0);
    });

    it('GET /settings and PATCH /settings should get and update platform configuration', async () => {
      const token = await makeToken('superadmin');

      const getRes = await request(app)
        .get('/api/v1/super-admin/settings')
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      const getBody = getRes.body;
      expect(getBody.settings).toBeDefined();

      const patchRes = await request(app)
        .patch('/api/v1/super-admin/settings')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({ allowSelfRegistration: false });
      expect(patchRes.status).toBe(200);
      const patchBody = patchRes.body;
      expect(patchBody.settings.allowSelfRegistration).toBe(false);
    });
  });
});
