import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../src/middleware/auth';
import { createJwtToken } from '../src/utils/crypto';
import type { UserRole } from '../src/types';
import env from '../src/config/env';

describe('RBAC & Authentication Middleware', () => {
  const secret = 'test_jwt_secret_key_32_characters_long!';
  const tenantId = '11111111-2222-4333-8444-555566667777';

  beforeAll(() => {
    env.JWT_SECRET = secret;
    process.env.JWT_SECRET = secret;
  });

  // Helper to create token with standard secret
  async function makeToken(role: UserRole, customClaims: Record<string, any> = {}) {
    return createJwtToken(
      {
        sub: 'user-uuid-1234-4567-8901',
        tenant_id: tenantId,
        role,
        email: `${role}@university.edu`,
        ...customClaims,
      },
      secret
    );
  }

  // Create a dedicated Express test application configuring routes for all roles
  function createTestApp() {
    const app = express();
    app.use(express.json());

    // Route requiring authentication only
    app.get('/api/protected', requireAuth, (req, res) => {
      const user = req.user;
      return res.json({ success: true, user });
    });

    // Student only
    app.get('/api/student-portal', requireAuth, requireRole(['student']), (req, res) => {
      return res.json({ success: true, message: 'Welcome Student' });
    });

    // College admin & Superadmin only
    app.get(
      '/api/admin-dashboard',
      requireAuth,
      requireRole(['college_admin', 'superadmin']),
      (req, res) => {
        return res.json({ success: true, message: 'Welcome Admin' });
      }
    );

    // Recruiter only
    app.get('/api/recruiter-candidates', requireAuth, requireRole(['recruiter']), (req, res) => {
      return res.json({ success: true, message: 'Welcome Recruiter' });
    });

    // Superadmin only
    app.get('/api/system-root', requireAuth, requireRole(['superadmin']), (req, res) => {
      return res.json({ success: true, message: 'Welcome SuperAdmin' });
    });

    // Faculty & College Admin
    app.get(
      '/api/faculty-review',
      requireAuth,
      requireRole(['faculty_coordinator', 'college_admin']),
      (req, res) => {
        return res.json({ success: true, message: 'Welcome Faculty Coordinator' });
      }
    );

    // Misconfigured route: requireRole called WITHOUT prior requireAuth
    app.get('/api/misconfigured', requireRole(['student']), (req, res) => {
      return res.json({ success: true });
    });

    return app;
  }

  const app = createTestApp();

  describe('requireAuth Middleware', () => {
    it('should return 401 MISSING_BEARER_TOKEN when Authorization header is absent', async () => {
      const res = await request(app).get('/api/protected');
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should return 401 MISSING_BEARER_TOKEN when scheme is not Bearer', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should return 401 EMPTY_BEARER_TOKEN when Bearer token is whitespace or empty', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer   ');
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.code).toBe('EMPTY_BEARER_TOKEN');
    });

    it('should return 401 TOKEN_VERIFICATION_FAILED for invalid or corrupted token', async () => {
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer this.is.invalid');
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should return 401 TOKEN_VERIFICATION_FAILED for expired token', async () => {
      const expiredToken = await createJwtToken(
        {
          sub: 'user-1',
          tenant_id: tenantId,
          role: 'student',
        },
        secret,
        -60 // expired 60 seconds ago
      );

      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should return 401 MALFORMED_CLAIMS when token lacks required claims', async () => {
      // Craft token missing `role` or `tenant_id`
      const incompletePayload = {
        sub: 'user-no-role',
        // missing tenant_id and role
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const incompleteToken = jwt.sign(incompletePayload, secret, { algorithm: 'HS256' });

      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${incompleteToken}`);
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.code).toBe('MALFORMED_CLAIMS');
    });

    it('should successfully authenticate and populate user context on valid token', async () => {
      const token = await makeToken('student');
      const res = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.user.role).toBe('student');
      expect(body.user.tenantId).toBe(tenantId);
    });
  });

  describe('requireRole Middleware (Role Enforcement & 403 Forbidden)', () => {
    it('should return 401 UNAUTHENTICATED when requireRole is evaluated without authenticated user', async () => {
      const res = await request(app).get('/api/misconfigured');
      expect(res.status).toBe(401);

      const body = res.body;
      expect(body.code).toBe('UNAUTHENTICATED');
    });

    it('should allow student role to access student portal', async () => {
      const token = await makeToken('student');
      const res = await request(app)
        .get('/api/student-portal')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.message).toBe('Welcome Student');
    });

    it('should forbid student role from accessing admin dashboard (403)', async () => {
      const token = await makeToken('student');
      const res = await request(app)
        .get('/api/admin-dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);

      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      expect(body.error).toContain("Role 'student' is not authorized");
    });

    it('should forbid student role from accessing recruiter candidates (403)', async () => {
      const token = await makeToken('student');
      const res = await request(app)
        .get('/api/recruiter-candidates')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);

      const body = res.body;
      expect(body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should allow college_admin to access admin dashboard', async () => {
      const token = await makeToken('college_admin');
      const res = await request(app)
        .get('/api/admin-dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.message).toBe('Welcome Admin');
    });

    it('should forbid college_admin from accessing superadmin-only root (403)', async () => {
      const token = await makeToken('college_admin');
      const res = await request(app)
        .get('/api/system-root')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);

      const body = res.body;
      expect(body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      expect(body.error).toContain("Role 'college_admin' is not authorized");
    });

    it('should allow recruiter to access recruiter candidates', async () => {
      const token = await makeToken('recruiter');
      const res = await request(app)
        .get('/api/recruiter-candidates')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.message).toBe('Welcome Recruiter');
    });

    it('should forbid recruiter from accessing admin dashboard (403)', async () => {
      const token = await makeToken('recruiter');
      const res = await request(app)
        .get('/api/admin-dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);

      const body = res.body;
      expect(body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should allow superadmin to access both admin-dashboard and system-root', async () => {
      const token = await makeToken('superadmin');

      const adminRes = await request(app)
        .get('/api/admin-dashboard')
        .set('Authorization', `Bearer ${token}`);
      expect(adminRes.status).toBe(200);

      const rootRes = await request(app)
        .get('/api/system-root')
        .set('Authorization', `Bearer ${token}`);
      expect(rootRes.status).toBe(200);
      const rootBody = rootRes.body;
      expect(rootBody.message).toBe('Welcome SuperAdmin');
    });

    it('should allow faculty_coordinator to access faculty review route', async () => {
      const token = await makeToken('faculty_coordinator');
      const res = await request(app)
        .get('/api/faculty-review')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('should forbid faculty_coordinator from accessing superadmin root (403)', async () => {
      const token = await makeToken('faculty_coordinator');
      const res = await request(app)
        .get('/api/system-root')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});
