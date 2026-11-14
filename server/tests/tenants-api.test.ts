import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import env from '../src/config/env';

describe('Tenants API & Platform Health Routes', () => {
  beforeAll(() => {
    delete process.env.DATABASE_URL;
    env.DATABASE_URL = undefined;
  });

  describe('GET /api/v1/tenants', () => {
    it('should return 200 with list of active tenants', async () => {
      const res = await request(app).get('/api/v1/tenants');
      expect(res.status).toBe(200);

      const data = res.body;
      expect(data.success).toBe(true);
      expect(Array.isArray(data.tenants)).toBe(true);
      expect(data.tenants.length).toBeGreaterThan(0);
      expect(data.tenants[0].name).toBeDefined();
      expect(data.tenants[0].slug).toBeDefined();
    });
  });

  describe('POST /api/v1/tenants', () => {
    it('should successfully provision a new college tenant with valid data', async () => {
      const newTenant = {
        name: 'National Institute of Engineering',
        slug: 'nie-mysore',
        domain: 'nie.ac.in',
        settings: {
          allowedDomains: ['nie.ac.in'],
          enableAptitudeTests: true,
        },
      };

      const res = await request(app)
        .post('/api/v1/tenants')
        .set('Content-Type', 'application/json')
        .send(newTenant);

      expect(res.status).toBe(201);
      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.message).toContain('Tenant provisioned successfully');
      expect(data.tenant).toBeDefined();
      expect(data.tenant.slug).toBe(newTenant.slug);
      expect(data.tenant.name).toBe(newTenant.name);
      expect(data.tenant.isActive).toBe(true);
    });

    it('should reject tenant creation with uppercase or space in slug', async () => {
      const invalidSlugTenant = {
        name: 'Invalid Slug College',
        slug: 'Invalid Slug 123!',
      };

      const res = await request(app)
        .post('/api/v1/tenants')
        .set('Content-Type', 'application/json')
        .send(invalidSlugTenant);

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
      expect(data.details[0].message).toContain('lowercase alphanumeric characters and hyphens');
    });

    it('should reject tenant creation with name shorter than 2 characters', async () => {
      const invalidNameTenant = {
        name: 'A',
        slug: 'valid-slug',
      };

      const res = await request(app)
        .post('/api/v1/tenants')
        .set('Content-Type', 'application/json')
        .send(invalidNameTenant);

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject tenant creation with malformed JSON payload', async () => {
      const res = await request(app)
        .post('/api/v1/tenants')
        .set('Content-Type', 'application/json')
        .send('{not valid json');

      expect(res.status).toBe(400);
      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Malformed JSON payload');
    });
  });

  describe('GET /api/v1/tenants/:id', () => {
    it('should retrieve tenant details by valid UUID', async () => {
      const tenantId = '11111111-1111-4111-8111-111111111111';
      const res = await request(app).get(`/api/v1/tenants/${tenantId}`);
      expect(res.status).toBe(200);

      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.tenant.id).toBe(tenantId);
    });

    it('should retrieve tenant details by unique slug', async () => {
      const slug = 'apex-institute';
      const res = await request(app).get(`/api/v1/tenants/${slug}`);
      expect(res.status).toBe(200);

      const data = res.body;
      expect(data.success).toBe(true);
      expect(data.tenant.slug).toBe(slug);
    });
  });

  describe('System Health & Global Handlers', () => {
    it('GET /health should return 200 with service status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);

      const data = res.body;
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('carrersync-server');
      expect(data.version).toBe('1.0.0');
    });

    it('GET /api/v1/health should return 200 with api status and environment', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);

      const data = res.body;
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('carrersync-server');
    });

    it('should return 404 for unknown route', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);

      const data = res.body;
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
    });
  });
});
