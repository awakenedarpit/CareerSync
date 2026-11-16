import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authRoutes } from '../src/routes/auth.routes';
import { tenantRoutes } from '../src/routes/tenant.routes';
import { tenantMiddleware } from '../src/middleware/tenant';
import * as dbClientModule from '../src/db/client';
import { hashPassword, createJwtToken } from '../src/utils/crypto';
import env from '../src/config/env';

// Mock the db client
vi.mock('../src/db/client', () => {
  return {
    getDb: vi.fn(),
    withTenantContext: vi.fn(),
  };
});

describe('Database Integration & Conflict Handling Branch Tests', () => {
  const mockTenantId = '44444444-4444-4444-8444-444444444444';
  const mockDbUrl = 'postgres://mock_user:mock_pass@mock-neon.tech/neondb';
  const mockJwtSecret = 'carrersync_jwt_default_secret_dev_key_32_chars';

  let app: express.Express;

  beforeAll(() => {
    env.DATABASE_URL = mockDbUrl;
    process.env.DATABASE_URL = mockDbUrl;
    env.JWT_SECRET = mockJwtSecret;
    process.env.JWT_SECRET = mockJwtSecret;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api', tenantMiddleware);
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/tenants', tenantRoutes);
  });

  describe('Registration Database Scenarios', () => {
    it('should return 404 when target tenant does not exist in DB', async () => {
      // Mock db returns empty tenant
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // tenant not found
            }),
          }),
        }),
      };
      vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          email: 'student@unknown-college.edu',
          password: 'Password123!',
          fullName: 'Unknown Student',
          tenantId: mockTenantId,
        });

      expect(res.status).toBe(404);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toContain('Target tenant does not exist');
    });

    it('should return 403 when target tenant is deactivated', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: mockTenantId, name: 'Deactivated College', isActive: false },
              ]),
            }),
          }),
        }),
      };
      vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          email: 'student@deactivated.edu',
          password: 'Password123!',
          fullName: 'Deactivated College Student',
          tenantId: mockTenantId,
        });

      expect(res.status).toBe(403);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toContain('Tenant is currently deactivated');
    });

    it('should return 409 when user with email already exists in this tenant', async () => {
      let callCount = 0;
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  // 1st query: target tenant found and active
                  return Promise.resolve([
                    { id: mockTenantId, name: 'Apex Institute', isActive: true },
                  ]);
                }
                // 2nd query: duplicate user found
                return Promise.resolve([
                  {
                    id: 'existing-user-uuid',
                    email: 'priya@apex.edu',
                    tenantId: mockTenantId,
                  },
                ]);
              }),
            }),
          }),
        }),
      };
      vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          email: 'priya@apex.edu',
          password: 'Password123!',
          fullName: 'Priya Sharma',
          tenantId: mockTenantId,
        });

      expect(res.status).toBe(409);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists in this institution');
    });
  });

  describe('Login Database Scenarios', () => {
    it('should return 401 INVALID_CREDENTIALS when user is not found or inactive', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]), // no active user found
            }),
          }),
        }),
      };
      vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'nonexistent@apex.edu',
          password: 'Password123!',
          tenantId: mockTenantId,
        });

      expect(res.status).toBe(401);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 INVALID_CREDENTIALS when password does not match hash', async () => {
      const passwordHash = await hashPassword('CorrectPassword123!');
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 'user-123',
                  email: 'student@apex.edu',
                  passwordHash,
                  isActive: true,
                  tenantId: mockTenantId,
                  role: 'student',
                },
              ]),
            }),
          }),
        }),
      };
      vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          email: 'student@apex.edu',
          password: 'WrongPassword!',
          tenantId: mockTenantId,
        });

      expect(res.status).toBe(401);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Tenant Provisioning Database Scenarios', () => {
    it('should return 409 TENANT_CONFLICT when slug or name already exists in DB', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: 'existing-id', name: 'Apex Institute', slug: 'apex-institute' },
              ]),
            }),
          }),
        }),
      };
      vi.mocked(dbClientModule.getDb).mockReturnValue(mockDb as any);

      const adminToken = await createJwtToken(
        { sub: 'admin-uuid', tenant_id: mockTenantId, role: 'superadmin', email: 'admin@test.com' },
        mockJwtSecret
      );

      const res = await request(app)
        .post('/api/v1/tenants')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Apex Institute',
          slug: 'apex-institute',
        });

      expect(res.status).toBe(409);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('TENANT_CONFLICT');
    });
  });
});
