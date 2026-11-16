import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getHealthData, getApiHealthData } from '../src/routes/health.routes';
import { closeDatabaseConnections } from '../src/db/client';

describe('Phase 19 — Deployment Configuration & Health Verification', () => {
  describe('Health Endpoints', () => {
    it('GET /health returns 200 OK with service and database status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('service', 'carrersync-server');
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('database');
      expect(['configured', 'not-configured']).toContain(res.body.database);
    });

    it('GET /api/v1/health returns 200 OK with service and database status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('service', 'carrersync-server');
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('database');
      expect(['configured', 'not-configured']).toContain(res.body.database);
    });

    it('GET /api/health returns 200 OK with service and database status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('database');
    });

    it('getHealthData helper includes database status field', () => {
      const data = getHealthData();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('database');
    });

    it('getApiHealthData helper includes database status field', () => {
      const data = getApiHealthData();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('database');
    });
  });

  describe('CORS Configuration', () => {
    it('allows requests from localhost:5173 (Vite dev server)', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('allows requests from vercel.app preview and production domains', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://carrersync.vercel.app')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://carrersync.vercel.app');
    });

    it('allows requests from custom vercel deployment subdomains', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://carrersync-git-feat-phase19.vercel.app')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://carrersync-git-feat-phase19.vercel.app');
    });

    it('rejects requests from unauthorized external origins', async () => {
      const res = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://malicious-attacker.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Database Pool Termination', () => {
    it('closeDatabaseConnections executes safely and empties pool cache', async () => {
      await expect(closeDatabaseConnections()).resolves.toBeUndefined();
    });
  });
});
