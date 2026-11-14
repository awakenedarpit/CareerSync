import { Router, type Request, type Response } from 'express';
import env from '../config/env';

const router = Router();

export const getHealthData = () => ({
  status: 'healthy',
  service: 'carrersync-server',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  environment: env.ENVIRONMENT || env.NODE_ENV || 'development'
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
  return res.json(getApiHealthData());
});

export { router as healthRoutes };
