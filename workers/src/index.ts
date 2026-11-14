import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from './types';
import { tenantMiddleware } from './middleware/tenant';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { superAdminRoutes } from './routes/superadmin.routes';

// ============================================================================
// CarrerSync — Cloudflare Workers Edge API
// Main Hono application entry point
// ============================================================================

const app = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// CORS — allow frontend origins (Vite dev + Vercel production)
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://carrersync.vercel.app',
      'https://*.vercel.app'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400
  })
);

// Request logger (development aid; lightweight for edge)
app.use('*', logger());

// Multi-tenant context extraction on all API routes
app.use('/api/*', tenantMiddleware);

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'carrersync-workers',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development'
  });
});

app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'carrersync-workers',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development',
    database: c.env?.DATABASE_URL ? 'configured' : 'not-configured'
  });
});

// ---------------------------------------------------------------------------
// API v1 Routes
// ---------------------------------------------------------------------------

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/tenants', tenantRoutes);
app.route('/api/v1/super-admin', superAdminRoutes);

// ---------------------------------------------------------------------------
// 404 Catch-all
// ---------------------------------------------------------------------------

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: `Route not found: ${c.req.method} ${c.req.url}`,
      code: 'NOT_FOUND'
    },
    404
  );
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------

app.onError((err, c) => {
  console.error(`[CarrerSync Error] ${c.req.method} ${c.req.url}:`, err);

  // If the error has a status code (e.g. from enforceTenantIsolation), use it
  const status = (err as any).status || 500;
  const code = (err as any).code || 'INTERNAL_SERVER_ERROR';

  return c.json(
    {
      success: false,
      error: err.message || 'An unexpected error occurred',
      code,
      ...(c.env?.ENVIRONMENT === 'development' ? { stack: err.stack } : {})
    },
    status
  );
});

export default app;
