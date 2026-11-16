import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { verifyJwtToken, hashPassword, createJwtToken } from '../src/utils/crypto';
import { getTableName } from 'drizzle-orm';
import * as dbClientModule from '../src/db/client';
import env from '../src/config/env';

// Mock the database client module
vi.mock('../src/db/client', () => {
  return {
    getDb: vi.fn(),
    withTenantContext: vi.fn(),
  };
});

describe('Auth API Routes Integration (/api/v1/auth)', () => {
  const testTenantId = '33333333-3333-4333-8333-333333333333';
  const defaultSecret = 'carrersync_jwt_default_secret_dev_key_32_chars';
  const mockDbUrl = 'postgresql://mock_user:mock_pass@mock-neon.tech/neondb';

  let mockDbUsers: any[] = [];
  let mockDbTenants: any[] = [];
  let mockDbStudents: any[] = [];
  let mockDbInvitations: any[] = [];

  const getTableNameSafe = (table: any): string => {
    try {
      if (table) return getTableName(table);
    } catch {
      // Fallback
    }
    return table?._?.name || table?.name || '';
  };

  const setupMockDb = () => {
    mockDbTenants = [
      {
        id: testTenantId,
        name: 'Apex Institute of Technology',
        slug: 'apex-institute',
        domain: 'apex.edu',
        isActive: true,
      },
    ];

    mockDbInvitations = [
      {
        id: 'inv-uuid-001',
        token: 'valid-admin-invite-token-123',
        tenantId: testTenantId,
        role: 'college_admin',
        email: 'tpo.admin@apex.edu',
        fullName: 'Dr. Rajesh Kumar',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    ];

    const mockDb = {
      select: vi.fn().mockImplementation((_fields?: any) => ({
        from: vi.fn().mockImplementation((table: any) => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(async () => {
              const tableName = getTableNameSafe(table);
              if (tableName === 'tenants') {
                return mockDbTenants;
              }
              if (tableName === 'invitations') {
                return mockDbInvitations.filter((i) => i.status === 'pending');
              }
              if (tableName === 'users') {
                return mockDbUsers;
              }
              if (tableName === 'students') {
                return mockDbStudents;
              }
              return [];
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation((table: any) => ({
        values: vi.fn().mockImplementation((val: any) => ({
          returning: vi.fn().mockImplementation(async () => {
            const row = { id: `id-${Date.now()}-${Math.random()}`, ...val };
            const tableName = getTableNameSafe(table);
            if (tableName === 'users') mockDbUsers.push(row);
            if (tableName === 'students') mockDbStudents.push(row);
            return [row];
          }),
        })),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([{}]),
        })),
      })),
    };

    vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    env.DATABASE_URL = mockDbUrl;
    process.env.DATABASE_URL = mockDbUrl;
    env.JWT_SECRET = defaultSecret;
    process.env.JWT_SECRET = defaultSecret;

    const testPasswordHash = await hashPassword('SecurePassword123!');
    mockDbUsers = [
      {
        id: 'user-priya-uuid',
        tenantId: testTenantId,
        email: 'priya.sharma@apex.edu',
        passwordHash: testPasswordHash,
        fullName: 'Priya Sharma',
        role: 'student',
        isActive: true,
        isVerified: true,
      },
    ];

    mockDbStudents = [
      {
        id: 'student-profile-uuid',
        tenantId: testTenantId,
        userId: 'user-priya-uuid',
        rollNumber: 'CS-2025-089',
        department: 'Computer Science and Engineering',
        batchYear: 2025,
        degree: 'B.Tech',
        cgpa: '8.75',
      },
    ];

    setupMockDb();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a student user and return 201 with JWT', async () => {
      // Clear users so priya is not duplicate for registration test
      mockDbUsers = [];

      const payload = {
        email: 'new.student@apex.edu',
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

    it('should block self-registration for college_admin without invitation token (403 INVITATION_REQUIRED)', async () => {
      const payload = {
        email: 'tpo.admin@apex.edu',
        password: 'AdminPassword2026!',
        fullName: 'Dr. Rajesh Kumar',
        role: 'college_admin',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(403);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVITATION_REQUIRED');
      expect(data.error).toContain('Self-registration is only permitted for students');
    });

    it('should block self-registration for recruiter without invitation token (403 INVITATION_REQUIRED)', async () => {
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

      expect(res.status).toBe(403);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVITATION_REQUIRED');
    });

    it('should allow privileged registration when a valid invitation token is provided', async () => {
      mockDbUsers = [];

      const payload = {
        email: 'tpo.admin@apex.edu',
        password: 'AdminPassword2026!',
        fullName: 'Dr. Rajesh Kumar',
        role: 'college_admin',
        invitationToken: 'valid-admin-invite-token-123',
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('college_admin');
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

    it('should reject public registration for superadmin role with 403 SUPERADMIN_REGISTRATION_PROHIBITED', async () => {
      const payload = {
        email: 'attacker@carrersync.io',
        password: 'AttackerPassword123!',
        fullName: 'Attacker Super Admin',
        role: 'superadmin',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(403);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('SUPERADMIN_REGISTRATION_PROHIBITED');
      expect(data.error).toContain('Super Admin registration is prohibited');
    });

    it('should return 503 DATABASE_UNAVAILABLE when database is not configured', async () => {
      delete process.env.DATABASE_URL;
      env.DATABASE_URL = undefined;

      const payload = {
        email: 'student@apex.edu',
        password: 'SecurePassword123!',
        fullName: 'Offline Student',
        role: 'student',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('DATABASE_UNAVAILABLE');
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

    it('should reject login with wrong password (401 INVALID_CREDENTIALS)', async () => {
      const loginPayload = {
        email: 'priya.sharma@apex.edu',
        password: 'WrongPassword!',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(loginPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with nonexistent user (401 INVALID_CREDENTIALS)', async () => {
      mockDbUsers = [];

      const loginPayload = {
        email: 'nonexistent@apex.edu',
        password: 'SecurePassword123!',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(loginPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 503 DATABASE_UNAVAILABLE when database is not configured on login', async () => {
      delete process.env.DATABASE_URL;
      env.DATABASE_URL = undefined;

      const loginPayload = {
        email: 'priya.sharma@apex.edu',
        password: 'SecurePassword123!',
        tenantId: testTenantId,
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send(loginPayload);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('DATABASE_UNAVAILABLE');
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
      const token = await createJwtToken(
        {
          sub: 'user-priya-uuid',
          tenant_id: testTenantId,
          role: 'student',
          email: 'priya.sharma@apex.edu',
        },
        defaultSecret
      );

      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      const meData = meRes.body;
      expect(meData.success).toBe(true);
      expect(meData.user.id).toBe('user-priya-uuid');
      expect(meData.user.tenantId).toBe(testTenantId);
      expect(meData.tenant.id).toBe(testTenantId);
    });

    it('should return 401 when token has been tampered with', async () => {
      const validToken = await createJwtToken(
        {
          sub: 'user-priya-uuid',
          tenant_id: testTenantId,
          role: 'student',
          email: 'priya.sharma@apex.edu',
        },
        defaultSecret
      );
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
