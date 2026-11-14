import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken, verifyJwtToken } from '../src/utils/crypto';
import env from '../src/config/env';

describe('Invitations & Lifecycle Audit Backend Integration (/api/v1/super-admin/invitations)', () => {
  const secret = 'carrersync_jwt_default_secret_dev_key_32_chars';
  const systemTenantId = '11111111-1111-4111-8111-111111111111';

  beforeAll(() => {
    delete process.env.DATABASE_URL;
    env.DATABASE_URL = undefined;
    env.JWT_SECRET = secret;
    process.env.JWT_SECRET = secret;
  });

  async function makeSuperAdminToken() {
    return createJwtToken(
      {
        sub: 'superadmin-test-uuid',
        tenant_id: systemTenantId,
        role: 'superadmin',
        email: 'superadmin@carrersync.com'
      },
      secret
    );
  }

  // =========================================================================
  // 1. Creation of Secure Expiring Invitations Across Roles
  // =========================================================================
  describe('Invitation Creation Across Platform Roles', () => {
    it('should create a secure expiring invitation for College Admin role', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `admin.invite.${Date.now()}@apex.edu`;

      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'college_admin',
          fullName: 'Prof. S. Ramanujan',
          tenantId: systemTenantId,
          expiresInDays: 7
        });

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.invitation).toBeDefined();
      expect(data.invitation.token).toMatch(/^inv_[a-f0-9]{48}$/);
      expect(data.invitation.status).toBe('pending');
      expect(data.invitation.role).toBe('college_admin');
      expect(data.invitation.email).toBe(email.toLowerCase());
      expect(data.inviteLink).toContain(data.invitation.token);

      const expiresAt = new Date(data.invitation.expiresAt).getTime();
      expect(expiresAt).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    });

    it('should create a secure expiring invitation for Recruiter role', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `recruiter.invite.${Date.now()}@globaltech.com`;

      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'recruiter',
          fullName: 'Samantha Reed',
          tenantId: systemTenantId,
          expiresInDays: 14,
          metadataJson: { companyName: 'Global Tech Corp', tier: 'Partner' }
        });

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.invitation.token).toMatch(/^inv_/);
      expect(data.invitation.role).toBe('recruiter');
      expect(data.invitation.status).toBe('pending');
      expect(data.invitation.metadataJson.companyName).toBe('Global Tech Corp');
    });

    it('should create a secure expiring invitation for Student role', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `student.invite.${Date.now()}@apex.edu`;

      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'student',
          fullName: 'Rohit Verma',
          tenantId: systemTenantId,
          expiresInDays: 30,
          metadataJson: { batchYear: 2026, department: 'Mechanical' }
        });

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.invitation.role).toBe('student');
      expect(data.invitation.status).toBe('pending');
    });

    it('should create a secure expiring invitation for TPO Admin role', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `tpo.invite.${Date.now()}@apex.edu`;

      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'tpo_admin',
          fullName: 'Dr. Meenakshi Sundaram',
          tenantId: systemTenantId,
          expiresInDays: 5
        });

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.invitation.role).toBe('tpo_admin');
      expect(data.invitation.status).toBe('pending');
    });

    it('should reject duplicate pending invitation to the same email with 409 INVITATION_ALREADY_EXISTS', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `duplicate.inv.${Date.now()}@apex.edu`;

      // First invite
      const res1 = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'tpo_admin',
          fullName: 'First Invitee',
          tenantId: systemTenantId
        });
      expect(res1.status).toBe(201);

      // Duplicate invite
      const res2 = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'tpo_admin',
          fullName: 'Duplicate Invitee',
          tenantId: systemTenantId
        });
      expect(res2.status).toBe(409);
      const data = res2.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVITATION_ALREADY_EXISTS');
    });

    it('should reject invitation creation when user already exists with 409 USER_ALREADY_EXISTS', async () => {
      const saToken = await makeSuperAdminToken();
      // admin@apex.edu is already an existing user in mock data
      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email: 'admin@apex.edu',
          role: 'college_admin',
          fullName: 'Existing Admin',
          tenantId: systemTenantId
        });

      expect(res.status).toBe(409);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should reject invitation creation with invalid college assignment with 400 INVALID_COLLEGE', async () => {
      const saToken = await makeSuperAdminToken();
      const invalidCollegeId = '99999999-9999-4999-8999-999999999999';

      const res = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email: `orphan.${Date.now()}@ghostcollege.edu`,
          role: 'college_admin',
          fullName: 'Orphan Admin',
          tenantId: invalidCollegeId
        });

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_COLLEGE');
    });
  });

  // =========================================================================
  // 2. Single-Use Token Validity & Acceptance Flow
  // =========================================================================
  describe('Single-Use Cryptographic Token Validity', () => {
    it('should allow validating a pending invitation token prior to acceptance', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `validate.token.${Date.now()}@apex.edu`;

      const createRes = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'tpo_admin',
          fullName: 'Validation Candidate',
          tenantId: systemTenantId
        });
      expect(createRes.status).toBe(201);
      const { invitation } = createRes.body;

      // Public verification endpoint
      const valRes = await request(app).get(`/api/v1/auth/invitation/${invitation.token}`);
      expect(valRes.status).toBe(200);
      const valData = valRes.body;
      expect(valData.success).toBe(true);
      expect(valData.valid).toBe(true);
      expect(valData.invitation.email).toBe(email.toLowerCase());
      expect(valData.invitation.role).toBe('tpo_admin');
      expect(valData.invitation.status).toBe('pending');

      // Super admin validation endpoint
      const saValRes = await request(app)
        .get(`/api/v1/super-admin/invitations/validate/${invitation.token}`)
        .set('Authorization', `Bearer ${saToken}`);
      expect(saValRes.status).toBe(200);
    });

    it('should successfully accept invitation, activate user, and issue JWT token', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `accept.test.${Date.now()}@apex.edu`;

      const createRes = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'tpo_admin',
          fullName: 'Kavita Chawla',
          tenantId: systemTenantId
        });
      const { invitation } = createRes.body;

      // Accept token
      const acceptRes = await request(app)
        .post('/api/v1/auth/invitation/accept')
        .set('Content-Type', 'application/json')
        .send({
          token: invitation.token,
          password: 'SecurePassword123!',
          fullName: 'Kavita Chawla (Verified)'
        });

      expect(acceptRes.status).toBe(201);
      const acceptData = acceptRes.body;
      expect(acceptData.success).toBe(true);
      expect(acceptData.token).toBeDefined();
      expect(acceptData.user.email).toBe(email.toLowerCase());
      expect(acceptData.user.role).toBe('tpo_admin');
      expect(acceptData.user.isActive).toBe(true);

      // Verify JWT token is signed and valid
      const decoded = await verifyJwtToken(acceptData.token, secret);
      expect(decoded.email).toBe(email.toLowerCase());
      expect(decoded.role).toBe('tpo_admin');
    });

    it('should strictly reject re-use of an already accepted token (Single-Use Guarantee)', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `singleuse.${Date.now()}@apex.edu`;

      const createRes = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'recruiter',
          fullName: 'Single Use User',
          tenantId: systemTenantId
        });
      const { invitation } = createRes.body;

      // First acceptance — SUCCESS
      const firstAccept = await request(app)
        .post('/api/v1/auth/invitation/accept')
        .set('Content-Type', 'application/json')
        .send({
          token: invitation.token,
          password: 'Password1234!'
        });
      expect(firstAccept.status).toBe(201);

      // Second acceptance attempt with the same token — REJECTED
      const secondAccept = await request(app)
        .post('/api/v1/auth/invitation/accept')
        .set('Content-Type', 'application/json')
        .send({
          token: invitation.token,
          password: 'AnotherPassword999!'
        });
      expect(secondAccept.status).toBe(410);
      const secondData = secondAccept.body;
      expect(secondData.success).toBe(false);
      expect(secondData.code).toBe('INVITATION_ALREADY_USED');

      // Validation check also confirms token is already used
      const valRes = await request(app).get(`/api/v1/auth/invitation/${invitation.token}`);
      expect(valRes.status).toBe(410);
      const valData = valRes.body;
      expect(valData.code).toBe('INVITATION_ALREADY_USED');
    });
  });

  // =========================================================================
  // 3. Expired Invitation Rejection & Token Refresh
  // =========================================================================
  describe('Expired Invitation Handling & Token Refresh', () => {
    it('should reject validation and acceptance for an expired invitation token with 410 INVITATION_EXPIRED', async () => {
      const expiredToken = 'inv_expired_token_sample_1234567890';

      // 1. Validation attempt
      const valRes = await request(app).get(`/api/v1/auth/invitation/${expiredToken}`);
      expect(valRes.status).toBe(410);
      const valData = valRes.body;
      expect(valData.success).toBe(false);
      expect(valData.code).toBe('INVITATION_EXPIRED');

      // 2. Acceptance attempt
      const acceptRes = await request(app)
        .post('/api/v1/auth/invitation/accept')
        .set('Content-Type', 'application/json')
        .send({
          token: expiredToken,
          password: 'ValidPassword123!'
        });
      expect(acceptRes.status).toBe(410);
      const acceptData = acceptRes.body;
      expect(acceptData.success).toBe(false);
      expect(acceptData.code).toBe('INVITATION_EXPIRED');
    });

    it('should allow Super Admin to resend and refresh an expired invitation token', async () => {
      const saToken = await makeSuperAdminToken();
      const expiredInvitationId = 'inv-00000000-0000-4000-8000-000000000003';

      const resendRes = await request(app)
        .post(`/api/v1/super-admin/invitations/${expiredInvitationId}/resend`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ expiresInDays: 7 });

      expect(resendRes.status).toBe(200);
      const resendData = resendRes.body;
      expect(resendData.success).toBe(true);
      expect(resendData.invitation.status).toBe('pending');
      expect(resendData.invitation.token).not.toBe('inv_expired_token_sample_1234567890');
      expect(resendData.invitation.token).toMatch(/^inv_/);

      // Newly refreshed token should now be valid and accepted
      const refreshedToken = resendData.invitation.token;
      const valRes = await request(app).get(`/api/v1/auth/invitation/${refreshedToken}`);
      expect(valRes.status).toBe(200);
      const valData = valRes.body;
      expect(valData.valid).toBe(true);

      // Now accept with newly refreshed token
      const acceptRes = await request(app)
        .post('/api/v1/auth/invitation/accept')
        .set('Content-Type', 'application/json')
        .send({
          token: refreshedToken,
          password: 'FreshPassword123!'
        });
      expect(acceptRes.status).toBe(201);
    });
  });

  // =========================================================================
  // 4. Invitation Revocation by Super Admin
  // =========================================================================
  describe('Invitation Revocation by Super Admin', () => {
    it('should allow Super Admin to revoke a pending invitation', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `to.be.revoked.${Date.now()}@apex.edu`;

      const createRes = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email,
          role: 'student',
          fullName: 'Candidate for Revocation',
          tenantId: systemTenantId
        });
      const { invitation } = createRes.body;

      // Revoke
      const revokeRes = await request(app)
        .post(`/api/v1/super-admin/invitations/${invitation.id}/revoke`)
        .set('Authorization', `Bearer ${saToken}`);
      expect(revokeRes.status).toBe(200);
      const revokeData = revokeRes.body;
      expect(revokeData.success).toBe(true);
      expect(revokeData.invitation.status).toBe('revoked');

      // Attempting to validate revoked token returns 410 INVITATION_REVOKED
      const valRes = await request(app).get(`/api/v1/auth/invitation/${invitation.token}`);
      expect(valRes.status).toBe(410);
      const valData = valRes.body;
      expect(valData.success).toBe(false);
      expect(valData.code).toBe('INVITATION_REVOKED');

      // Attempting to accept revoked token returns 410 INVITATION_REVOKED
      const acceptRes = await request(app)
        .post('/api/v1/auth/invitation/accept')
        .set('Content-Type', 'application/json')
        .send({
          token: invitation.token,
          password: 'Password123!'
        });
      expect(acceptRes.status).toBe(410);
      const acceptData = acceptRes.body;
      expect(acceptData.code).toBe('INVITATION_REVOKED');
    });

    it('should reject revocation of an invitation that has already been accepted with 400', async () => {
      const saToken = await makeSuperAdminToken();
      // 'inv-00000000-0000-4000-8000-000000000002' is an accepted invitation in mock store
      const acceptedInvitationId = 'inv-00000000-0000-4000-8000-000000000002';

      const revokeRes = await request(app)
        .post(`/api/v1/super-admin/invitations/${acceptedInvitationId}/revoke`)
        .set('Authorization', `Bearer ${saToken}`);

      expect(revokeRes.status).toBe(400);
      const revokeData = revokeRes.body;
      expect(revokeData.success).toBe(false);
      expect(revokeData.error).toContain('Cannot revoke an invitation that has already been accepted');
    });
  });

  // =========================================================================
  // 5. Audit Log Record Creation on Lifecycle Actions
  // =========================================================================
  describe('Platform Audit Trail Generation', () => {
    it('should create audit log records for college provisioning, user creation, suspension, and invitation creation', async () => {
      const saToken = await makeSuperAdminToken();
      const uniqueSuffix = Date.now().toString().slice(-6);

      // 1. Provision a college
      const collegeSlug = `audit-college-${uniqueSuffix}`;
      const collegeRes = await request(app)
        .post('/api/v1/super-admin/colleges')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          name: `Audit College ${uniqueSuffix}`,
          slug: collegeSlug,
          location: 'Hyderabad, Telangana'
        });
      expect(collegeRes.status).toBe(201);
      const { college } = collegeRes.body;

      // 2. Create a user
      const userRes = await request(app)
        .post('/api/v1/super-admin/users')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email: `audit.user.${uniqueSuffix}@${collegeSlug}.edu`,
          password: 'Password123!',
          fullName: `Audit User ${uniqueSuffix}`,
          role: 'student',
          tenantId: college.id
        });
      expect(userRes.status).toBe(201);
      const { user } = userRes.body;

      // 3. Suspend user
      const suspendRes = await request(app)
        .patch(`/api/v1/super-admin/users/${user.id}/status`)
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({ isActive: false });
      expect(suspendRes.status).toBe(200);

      // 4. Create an invitation
      const inviteRes = await request(app)
        .post('/api/v1/super-admin/invitations')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${saToken}`)
        .send({
          email: `audit.inv.${uniqueSuffix}@${collegeSlug}.edu`,
          role: 'tpo_admin',
          fullName: 'Audit Invitee',
          tenantId: college.id
        });
      expect(inviteRes.status).toBe(201);
      const { invitation } = inviteRes.body;

      // 5. Query Audit Logs stream
      const logsRes = await request(app)
        .get('/api/v1/super-admin/audit-logs?limit=50')
        .set('Authorization', `Bearer ${saToken}`);
      expect(logsRes.status).toBe(200);
      const logsData = logsRes.body;
      expect(logsData.success).toBe(true);
      expect(Array.isArray(logsData.auditLogs)).toBe(true);

      const actions = logsData.auditLogs.map((log: any) => log.action);

      // Verify all required lifecycle actions exist in the audit log
      expect(actions).toContain('COLLEGE_PROVISIONED');
      expect(actions).toContain('USER_CREATED');
      expect(actions).toContain('USER_SUSPENDED');
      expect(actions).toContain('INVITATION_CREATED');

      // Verify audit log item properties
      const collegeLog = logsData.auditLogs.find((l: any) => l.action === 'COLLEGE_PROVISIONED');
      expect(collegeLog).toBeDefined();
      expect(collegeLog.resourceType).toBe('college');
      expect(collegeLog.actorEmail).toBeDefined();
      expect(collegeLog.timestamp).toBeDefined();
    });
  });
});
