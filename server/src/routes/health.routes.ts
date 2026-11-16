import { Router, type Request, type Response } from 'express';
import env from '../config/env';
import { getDb } from '../db/client';
import { sql } from 'drizzle-orm';

const router = Router();

export const getHealthData = () => ({
  status: 'healthy',
  service: 'carrersync-server',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  environment: env.ENVIRONMENT || env.NODE_ENV || 'development',
  database: (env.DATABASE_URL || process.env.DATABASE_URL) ? 'configured' : 'not-configured'
});

export const getApiHealthData = () => ({
  status: 'healthy',
  service: 'carrersync-server',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  environment: env.ENVIRONMENT || env.NODE_ENV || 'development',
  database: (env.DATABASE_URL || process.env.DATABASE_URL) ? 'configured' : 'not-configured'
});

router.get('/health', (req: Request, res: Response) => {
  return res.status(200).json(getApiHealthData());
});

router.get('/health/db', async (req: Request, res: Response) => {
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(503).json({
      status: 'unhealthy',
      connected: false,
      error: 'DATABASE_URL not configured'
    });
  }

  const start = Date.now();
  try {
    const db = getDb(dbUrl);
    await db.execute(sql`SELECT 1 as ping`);
    const latencyMs = Date.now() - start;
    return res.status(200).json({
      status: 'healthy',
      connected: true,
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return res.status(503).json({
      status: 'unhealthy',
      connected: false,
      latencyMs,
      error: err?.message?.includes('fetch failed') ? 'Database connectivity failed (fetch failed)' : 'Database query failed',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as healthRoutes };
