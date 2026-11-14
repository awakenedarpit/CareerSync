import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  isValidUuid,
  tenantMiddleware,
  requireTenant,
  enforceTenantIsolation,
} from '../src/middleware/tenant';
import { requireAuth } from '../src/middleware/auth';
import { createJwtToken } from '../src/utils/crypto';
import app from '../src/app';
import env from '../src/config/env';

describe('Multi-Tenant Isolation & Anti-Spoofing Architecture', () => {
  const secret = 'carrersync_jwt_default_secret_dev_key_32_chars';
  const collegeAId = '11111111-1111-4111-8111-111111111111';
  const collegeBId = '22222222-2222-4222-8222-222222222222';

  beforeAll(() => {
    env.JWT_SECRET = secret;
    process.env.JWT_SECRET = secret;
  });

  async function makeCollegeToken(tenantId: string, role = 'student') {
    return createJwtToken(
      {
        sub: 'user-' + tenantId.slice(0, 8),
        tenant_id: tenantId,
        role,
        email: `student@${tenantId.slice(0, 8)}.edu`,
      },
      secret
    );
  }

  describe('UUID Format Validation (isValidUuid)', () => {
    it('should validate standard RFC4122 v4 UUIDs', () => {
      expect(isValidUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
      expect(isValidUuid('a0b1c2d3-e4f5-4a6b-8c7d-e8f9a0b1c2d3')).toBe(true);
      expect(isValidUuid('A0B1C2D3-E4F5-4A6B-8C7D-E8F9A0B1C2D3')).toBe(true); // Case-insensitive
    });

    it('should reject invalid or malicious tenant identifier strings', () => {
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid("11111111-1111-1111-1111-111111111111' OR '1'='1")).toBe(false);
      expect(isValidUuid('12345')).toBe(false);
      expect(isValidUuid('11111111-1111-1111-1111-11111111111')).toBe(false); // Truncated
    });
  });

  describe('enforceTenantIsolation Function', () => {
    it('should allow access when current tenant matches target tenant', () => {
      expect(() => {
        enforceTenantIsolation(collegeAId, collegeAId);
      }).not.toThrow();
    });

    it('should throw HTTP 403 CROSS_TENANT_VIOLATION when accessing another college records', () => {
      try {
        enforceTenantIsolation(collegeAId, collegeBId);
        expect.fail('Expected enforceTenantIsolation to throw');
      } catch (err: any) {
        expect(err.status).toBe(403);
        expect(err.code).toBe('CROSS_TENANT_VIOLATION');
        expect(err.message).toBe('Cross-tenant data access violation');
      }
    });
  });

  describe('requireTenant Middleware', () => {
    it('should return 400 MISSING_TENANT_CONTEXT when no tenantId in context', async () => {
      const testApp = express();
      testApp.get('/test-tenant', requireTenant, (req, res) => res.json({ success: true }));

      const res = await request(testApp).get('/test-tenant');
      expect(res.status).toBe(400);

      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('MISSING_TENANT_CONTEXT');
    });

    it('should proceed when tenantId is present in context', async () => {
      const testApp = express();
      testApp.use((req, res, next) => {
        req.tenantId = collegeAId;
        next();
      });
      testApp.get('/test-tenant', requireTenant, (req, res) =>
        res.json({ success: true, tenantId: req.tenantId })
      );

      const res = await request(testApp).get('/test-tenant');
      expect(res.status).toBe(200);

      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.tenantId).toBe(collegeAId);
    });
  });

  describe('Tenant Spoofing Prevention via Header (tenantMiddleware)', () => {
    it('should reject request with 403 when authenticated College A user supplies x-tenant-id for College B', async () => {
      const collegeAToken = await makeCollegeToken(collegeAId);

      // Make request to /api/v1/auth/me with College A token and College B header
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .set('x-tenant-id', collegeBId); // Spoof attempt

      expect(res.status).toBe(403);
      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('should accept request when authenticated user supplies matching x-tenant-id', async () => {
      const collegeAToken = await makeCollegeToken(collegeAId);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${collegeAToken}`)
        .set('x-tenant-id', collegeAId); // Legitimate matching header

      expect(res.status).toBe(200);
      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.user.tenantId).toBe(collegeAId);
    });

    it('should automatically bind to token tenantId when no x-tenant-id header is sent', async () => {
      const collegeAToken = await makeCollegeToken(collegeAId);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${collegeAToken}`);

      expect(res.status).toBe(200);
      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.user.tenantId).toBe(collegeAId);
    });

    it('should reject unauthenticated request with 400 INVALID_TENANT_ID when x-tenant-id is not a valid UUID', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .set('x-tenant-id', 'malformed-sql-injection-or-bad-id')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
        });

      expect(res.status).toBe(400);
      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('INVALID_TENANT_ID');
    });
  });

  describe('Tenant Spoofing Prevention via Request Body', () => {
    it('should reject mutating request with 403 when authenticated user attempts to pass mismatched tenantId in body', async () => {
      // Test app with tenantMiddleware + an authenticated POST route
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api', tenantMiddleware);
      testApp.post('/api/records', requireAuth, async (req, res) => {
        return res.json({ success: true });
      });

      const tokenA = await makeCollegeToken(collegeAId);

      const res = await request(testApp)
        .post('/api/records')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenantId: collegeBId, // Spoofing attempt in body
          someData: 'classified record',
        });

      expect(res.status).toBe(403);
      const body = res.body;
      expect(body.success).toBe(false);
      expect(body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('should reject mutating request with 403 when authenticated user passes mismatched snake_case tenant_id in body', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api', tenantMiddleware);
      testApp.post('/api/records', requireAuth, async (req, res) => {
        return res.json({ success: true });
      });

      const tokenA = await makeCollegeToken(collegeAId);

      const res = await request(testApp)
        .post('/api/records')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenant_id: collegeBId, // Snake_case spoofing attempt
        });

      expect(res.status).toBe(403);
      const body = res.body;
      expect(body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('should accept mutating request when body tenantId matches token tenantId', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api', tenantMiddleware);
      testApp.post('/api/records', requireAuth, async (req, res) => {
        return res.json({ success: true, savedTenant: req.tenantId });
      });

      const tokenA = await makeCollegeToken(collegeAId);

      const res = await request(testApp)
        .post('/api/records')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          tenantId: collegeAId, // Matching tenantId
          someData: 'valid college A data',
        });

      expect(res.status).toBe(200);
      const body = res.body;
      expect(body.success).toBe(true);
      expect(body.savedTenant).toBe(collegeAId);
    });
  });

  describe('Cross-Tenant Data Isolation Enforcement', () => {
    it('should ensure College A user cannot access College B student records', async () => {
      // Mock student record database scoped to College B
      const mockDatabase = [
        { id: 'student-1', tenantId: collegeAId, name: 'Alice (College A)' },
        { id: 'student-2', tenantId: collegeBId, name: 'Bob (College B)' },
      ];

      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api', tenantMiddleware);

      // Endpoint querying student by id with tenant isolation enforced
      testApp.get('/api/students/:id', requireAuth, async (req, res, next) => {
        try {
          const studentId = req.params.id;
          const currentTenantId = req.tenantId!;

          const record = mockDatabase.find((s) => s.id === studentId);
          if (!record) {
            return res.status(404).json({ success: false, error: 'Student not found' });
          }

          // Enforce that record belongs to caller's tenant
          enforceTenantIsolation(currentTenantId, record.tenantId);

          return res.json({ success: true, student: record });
        } catch (err) {
          next(err);
        }
      });

      // Handle custom error status in testApp
      testApp.use((err: any, req: any, res: any, next: any) => {
        return res.status(err.status || 500).json({
          success: false,
          error: err.message,
          code: err.code || 'INTERNAL_ERROR',
        });
      });

      const tokenA = await makeCollegeToken(collegeAId);

      // College A accessing College A student -> Success
      const okRes = await request(testApp)
        .get('/api/students/student-1')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(okRes.status).toBe(200);
      const okBody = okRes.body;
      expect(okBody.student.name).toBe('Alice (College A)');

      // College A accessing College B student -> Blocked with 403 CROSS_TENANT_VIOLATION
      const blockedRes = await request(testApp)
        .get('/api/students/student-2')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(blockedRes.status).toBe(403);
      const blockedBody = blockedRes.body;
      expect(blockedBody.success).toBe(false);
      expect(blockedBody.code).toBe('CROSS_TENANT_VIOLATION');
    });
  });
});
