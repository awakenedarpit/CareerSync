import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { verifyJwtToken } from '../src/utils/crypto';
import env from '../src/config/env';

describe('Auth API Routes Integration (/api/v1/auth)', () => {
  const testTenantId = '33333333-3333-4333-8333-333333333333';
  const defaultSecret = 'carrersync_jwt_default_secret_dev_key_32_chars';

  beforeAll(() => {
    delete process.env.DATABASE_URL;
    env.DATABASE_URL = undefined;
    env.JWT_SECRET = defaultSecret;
    process.env.JWT_SECRET = defaultSecret;
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a student user and return 201 with JWT', async () => {
      const payload = {
        email: 'priya.sharma@apex.edu',
        password: 'SecurePassword123!',
        fullName: 'Priya Sharma',
        role: 'student',
        tenantId: testTenantId,
        rollNumber: 'CS-2025-089',
        department: 'Computer Science and Engineering',
        batchYear: 2025,
        degree: 'B.Tech',
        cgpa: 8.75,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(payload.email.toLowerCase());
      expect(data.user.fullName).toBe(payload.fullName);
      expect(data.user.role).toBe('student');
      expect(data.user.tenantId).toBe(testTenantId);

      // Verify JWT contents
      const decoded = await verifyJwtToken(data.token, defaultSecret);
      expect(decoded.sub).toBe(data.user.id);
      expect(decoded.tenant_id).toBe(testTenantId);
      expect(decoded.role).toBe('student');
      expect(decoded.email).toBe(payload.email.toLowerCase());
    });

    it('should register an admin user via x-tenant-id header', async () => {
      const payload = {
        email: 'tpo.admin@apex.edu',
        password: 'AdminPassword2026!',
        fullName: 'Dr. Rajesh Kumar',
        role: 'college_admin',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .set('x-tenant-id', testTenantId)
        .send(payload);

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('college_admin');
      expect(data.user.tenantId).toBe(testTenantId);
    });

    it('should accept tenantSlug when tenantId is not passed directly', async () => {
      const payload = {
        email: 'recruiter@techcorp.com',
        password: 'RecruiterPassword123!',
        fullName: 'Anita Roy',
        role: 'recruiter',
        tenantSlug: 'apex-institute',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('recruiter');
    });

    it('should reject registration when tenant context is completely missing', async () => {
      const payload = {
        email: 'notenant@example.com',
        password: 'ValidPassword123!',
        fullName: 'No Tenant User',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('TENANT_REQUIRED');
    });

    it('should reject registration with malformed JSON body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .set('x-tenant-id', testTenantId)
        .send('invalid-non-json-string{');

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Malformed JSON payload');
    });

    it('should reject registration with invalid email format', async () => {
      const payload = {
        email: 'invalid-email-address',
        password: 'ValidPassword123!',
        fullName: 'Test User',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject registration when password is shorter than 8 characters', async () => {
      const payload = {
        email: 'shortpass@apex.edu',
        password: 'short',
        fullName: 'Short Pass',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user and return 200 with JWT token', async () => {
      const loginPayload = {
        email: 'priya.sharma@apex.edu',
        password: 'SecurePassword123!',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(loginPayload);

      expect(res.status).toBe(200);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(loginPayload.email.toLowerCase());

      const decoded = await verifyJwtToken(data.token, defaultSecret);
      expect(decoded.sub).toBe(data.user.id);
      expect(decoded.tenant_id).toBe(testTenantId);
    });

    it('should reject login with malformed JSON body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{not valid json');

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Malformed JSON payload');
    });

    it('should reject login missing required email or password fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email: 'missing-pass@apex.edu' });

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when accessing /me without Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);

      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should return 200 with user profile and verified tenant when valid token is supplied', async () => {
      // First login to get a valid token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'priya.sharma@apex.edu',
          password: 'SecurePassword123!',
          tenantId: testTenantId,
        });

      const loginData = loginRes.body;
      const token = loginData.token;

      // Access /me with token
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      const meData = meRes.body;
      expect(meData.success).toBe(true);
      expect(meData.user.id).toBe(loginData.user.id);
      expect(meData.user.tenantId).toBe(testTenantId);
      expect(meData.tenant.id).toBe(testTenantId);
    });

    it('should return 401 when token has been tampered with', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'priya.sharma@apex.edu',
          password: 'SecurePassword123!',
          tenantId: testTenantId,
        });

      const loginData = loginRes.body;
      const validToken: string = loginData.token;
      // Invert characters in the signature segment
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx';

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('TOKEN_VERIFICATION_FAILED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 success on stateless logout', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged out successfully');
    });
  });
});
