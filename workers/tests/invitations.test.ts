import { describe, it, expect } from 'vitest';
import app from '../src/index';
import { createJwtToken, verifyJwtToken } from '../src/utils/crypto';

describe('Invitations & Lifecycle Audit Backend Integration (/api/v1/super-admin/invitations)', () => {
  const secret = 'carrersync_jwt_default_secret_dev_key_32_chars';
  const systemTenantId = '11111111-1111-4111-8111-111111111111';

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

      const res = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'college_admin',
          fullName: 'Prof. S. Ramanujan',
          tenantId: systemTenantId,
          expiresInDays: 7
        })
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
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

      const res = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'recruiter',
          fullName: 'Samantha Reed',
          tenantId: systemTenantId,
          expiresInDays: 14,
          metadataJson: { companyName: 'Global Tech Corp', tier: 'Partner' }
        })
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.invitation.token).toMatch(/^inv_/);
      expect(data.invitation.role).toBe('recruiter');
      expect(data.invitation.status).toBe('pending');
      expect(data.invitation.metadataJson.companyName).toBe('Global Tech Corp');
    });

    it('should create a secure expiring invitation for Student role', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `student.invite.${Date.now()}@apex.edu`;

      const res = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'student',
          fullName: 'Rohit Verma',
          tenantId: systemTenantId,
          expiresInDays: 30,
          metadataJson: { batchYear: 2026, department: 'Mechanical' }
        })
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.invitation.role).toBe('student');
      expect(data.invitation.status).toBe('pending');
    });

    it('should create a secure expiring invitation for TPO Admin role', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `tpo.invite.${Date.now()}@apex.edu`;

      const res = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'tpo_admin',
          fullName: 'Dr. Meenakshi Sundaram',
          tenantId: systemTenantId,
          expiresInDays: 5
        })
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.invitation.role).toBe('tpo_admin');
      expect(data.invitation.status).toBe('pending');
    });

    it('should reject duplicate pending invitation to the same email with 409 INVITATION_ALREADY_EXISTS', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `duplicate.inv.${Date.now()}@apex.edu`;

      // First invite
      const res1 = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'tpo_admin',
          fullName: 'First Invitee',
          tenantId: systemTenantId
        })
      });
      expect(res1.status).toBe(201);

      // Duplicate invite
      const res2 = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'tpo_admin',
          fullName: 'Duplicate Invitee',
          tenantId: systemTenantId
        })
      });
      expect(res2.status).toBe(409);
      const data = (await res2.json()) as any;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVITATION_ALREADY_EXISTS');
    });

    it('should reject invitation creation when user already exists with 409 USER_ALREADY_EXISTS', async () => {
      const saToken = await makeSuperAdminToken();
      // admin@apex.edu is already an existing user in mock data
      const res = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email: 'admin@apex.edu',
          role: 'college_admin',
          fullName: 'Existing Admin',
          tenantId: systemTenantId
        })
      });

      expect(res.status).toBe(409);
      const data = (await res.json()) as any;
      expect(data.success).toBe(false);
      expect(data.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should reject invitation creation with invalid college assignment with 400 INVALID_COLLEGE', async () => {
      const saToken = await makeSuperAdminToken();
      const invalidCollegeId = '99999999-9999-4999-8999-999999999999';

      const res = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email: `orphan.${Date.now()}@ghostcollege.edu`,
          role: 'college_admin',
          fullName: 'Orphan Admin',
          tenantId: invalidCollegeId
        })
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
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

      const createRes = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'tpo_admin',
          fullName: 'Validation Candidate',
          tenantId: systemTenantId
        })
      });
      expect(createRes.status).toBe(201);
      const { invitation } = (await createRes.json()) as any;

      // Public verification endpoint
      const valRes = await app.request(`/api/v1/auth/invitation/${invitation.token}`);
      expect(valRes.status).toBe(200);
      const valData = (await valRes.json()) as any;
      expect(valData.success).toBe(true);
      expect(valData.valid).toBe(true);
      expect(valData.invitation.email).toBe(email.toLowerCase());
      expect(valData.invitation.role).toBe('tpo_admin');
      expect(valData.invitation.status).toBe('pending');

      // Super admin validation endpoint
      const saValRes = await app.request(
        `/api/v1/super-admin/invitations/validate/${invitation.token}`,
        { headers: { Authorization: `Bearer ${saToken}` } }
      );
      expect(saValRes.status).toBe(200);
    });

    it('should successfully accept invitation, activate user, and issue JWT token', async () => {
      const saToken = await makeSuperAdminToken();
      const email = `accept.test.${Date.now()}@apex.edu`;

      const createRes = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'tpo_admin',
          fullName: 'Kavita Chawla',
          tenantId: systemTenantId
        })
      });
      const { invitation } = (await createRes.json()) as any;

      // Accept token
      const acceptRes = await app.request('/api/v1/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.token,
          password: 'SecurePassword123!',
          fullName: 'Kavita Chawla (Verified)'
        })
      });

      expect(acceptRes.status).toBe(201);
      const acceptData = (await acceptRes.json()) as any;
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

      const createRes = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'recruiter',
          fullName: 'Single Use User',
          tenantId: systemTenantId
        })
      });
      const { invitation } = (await createRes.json()) as any;

      // First acceptance — SUCCESS
      const firstAccept = await app.request('/api/v1/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.token,
          password: 'Password1234!'
        })
      });
      expect(firstAccept.status).toBe(201);

      // Second acceptance attempt with the same token — REJECTED
      const secondAccept = await app.request('/api/v1/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.token,
          password: 'AnotherPassword999!'
        })
      });
      expect(secondAccept.status).toBe(410);
      const secondData = (await secondAccept.json()) as any;
      expect(secondData.success).toBe(false);
      expect(secondData.code).toBe('INVITATION_ALREADY_USED');

      // Validation check also confirms token is already used
      const valRes = await app.request(`/api/v1/auth/invitation/${invitation.token}`);
      expect(valRes.status).toBe(410);
      const valData = (await valRes.json()) as any;
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
      const valRes = await app.request(`/api/v1/auth/invitation/${expiredToken}`);
      expect(valRes.status).toBe(410);
      const valData = (await valRes.json()) as any;
      expect(valData.success).toBe(false);
      expect(valData.code).toBe('INVITATION_EXPIRED');

      // 2. Acceptance attempt
      const acceptRes = await app.request('/api/v1/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: expiredToken,
          password: 'ValidPassword123!'
        })
      });
      expect(acceptRes.status).toBe(410);
      const acceptData = (await acceptRes.json()) as any;
      expect(acceptData.success).toBe(false);
      expect(acceptData.code).toBe('INVITATION_EXPIRED');
    });

    it('should allow Super Admin to resend and refresh an expired invitation token', async () => {
      const saToken = await makeSuperAdminToken();
      const expiredInvitationId = 'inv-00000000-0000-4000-8000-000000000003';

      const resendRes = await app.request(
        `/api/v1/super-admin/invitations/${expiredInvitationId}/resend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${saToken}`
          },
          body: JSON.stringify({ expiresInDays: 7 })
        }
      );

      expect(resendRes.status).toBe(200);
      const resendData = (await resendRes.json()) as any;
      expect(resendData.success).toBe(true);
      expect(resendData.invitation.status).toBe('pending');
      expect(resendData.invitation.token).not.toBe('inv_expired_token_sample_1234567890');
      expect(resendData.invitation.token).toMatch(/^inv_/);

      // Newly refreshed token should now be valid and accepted
      const refreshedToken = resendData.invitation.token;
      const valRes = await app.request(`/api/v1/auth/invitation/${refreshedToken}`);
      expect(valRes.status).toBe(200);
      const valData = (await valRes.json()) as any;
      expect(valData.valid).toBe(true);

      // Now accept with newly refreshed token
      const acceptRes = await app.request('/api/v1/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: refreshedToken,
          password: 'FreshPassword123!'
        })
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

      const createRes = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email,
          role: 'student',
          fullName: 'Candidate for Revocation',
          tenantId: systemTenantId
        })
      });
      const { invitation } = (await createRes.json()) as any;

      // Revoke
      const revokeRes = await app.request(
        `/api/v1/super-admin/invitations/${invitation.id}/revoke`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${saToken}` }
        }
      );
      expect(revokeRes.status).toBe(200);
      const revokeData = (await revokeRes.json()) as any;
      expect(revokeData.success).toBe(true);
      expect(revokeData.invitation.status).toBe('revoked');

      // Attempting to validate revoked token returns 410 INVITATION_REVOKED
      const valRes = await app.request(`/api/v1/auth/invitation/${invitation.token}`);
      expect(valRes.status).toBe(410);
      const valData = (await valRes.json()) as any;
      expect(valData.success).toBe(false);
      expect(valData.code).toBe('INVITATION_REVOKED');

      // Attempting to accept revoked token returns 410 INVITATION_REVOKED
      const acceptRes = await app.request('/api/v1/auth/invitation/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: invitation.token,
          password: 'Password123!'
        })
      });
      expect(acceptRes.status).toBe(410);
      const acceptData = (await acceptRes.json()) as any;
      expect(acceptData.code).toBe('INVITATION_REVOKED');
    });

    it('should reject revocation of an invitation that has already been accepted with 400', async () => {
      const saToken = await makeSuperAdminToken();
      // 'inv-00000000-0000-4000-8000-000000000002' is an accepted invitation in mock store
      const acceptedInvitationId = 'inv-00000000-0000-4000-8000-000000000002';

      const revokeRes = await app.request(
        `/api/v1/super-admin/invitations/${acceptedInvitationId}/revoke`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${saToken}` }
        }
      );

      expect(revokeRes.status).toBe(400);
      const revokeData = (await revokeRes.json()) as any;
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
      const collegeRes = await app.request('/api/v1/super-admin/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          name: `Audit College ${uniqueSuffix}`,
          slug: collegeSlug,
          location: 'Hyderabad, Telangana'
        })
      });
      expect(collegeRes.status).toBe(201);
      const { college } = (await collegeRes.json()) as any;

      // 2. Create a user
      const userRes = await app.request('/api/v1/super-admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email: `audit.user.${uniqueSuffix}@${collegeSlug}.edu`,
          password: 'Password123!',
          fullName: `Audit User ${uniqueSuffix}`,
          role: 'student',
          tenantId: college.id
        })
      });
      expect(userRes.status).toBe(201);
      const { user } = (await userRes.json()) as any;

      // 3. Suspend user
      const suspendRes = await app.request(`/api/v1/super-admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({ isActive: false })
      });
      expect(suspendRes.status).toBe(200);

      // 4. Create an invitation
      const inviteRes = await app.request('/api/v1/super-admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${saToken}`
        },
        body: JSON.stringify({
          email: `audit.inv.${uniqueSuffix}@${collegeSlug}.edu`,
          role: 'tpo_admin',
          fullName: 'Audit Invitee',
          tenantId: college.id
        })
      });
      expect(inviteRes.status).toBe(201);
      const { invitation } = (await inviteRes.json()) as any;

      // 5. Query Audit Logs stream
      const logsRes = await app.request('/api/v1/super-admin/audit-logs?limit=50', {
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(logsRes.status).toBe(200);
      const logsData = (await logsRes.json()) as any;
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
