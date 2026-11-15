import express, { type Express } from 'express';
import cors from 'cors';
import env from './config/env';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { superAdminRoutes } from './routes/superadmin.routes';
import fileRoutes from './routes/file.routes';
import { getHealthData, getApiHealthData } from './routes/health.routes';

const app: Express = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

// CORS configuration — Vite dev, Vercel production, and client URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://carrersync.vercel.app',
  env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger middleware
app.use((req, res, next) => {
  if (env.NODE_ENV !== 'test') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl || req.url}`);
  }
  next();
});

// ---------------------------------------------------------------------------
// Health & Info Routes
// ---------------------------------------------------------------------------

app.get('/health', (req, res) => {
  return res.json(getHealthData());
});

app.get('/api/health', (req, res) => {
  return res.json(getApiHealthData());
});

app.get('/api/v1/health', (req, res) => {
  return res.json(getApiHealthData());
});

app.get('/', (req, res) => {
  return res.json({
    name: 'CarrerSync API',
    version: '1.0.0',
    description: 'Agentic Placement Intelligence Platform',
    health: '/api/v1/health'
  });
});

// ---------------------------------------------------------------------------
// API v1 Routes with Multi-Tenant Isolation
// ---------------------------------------------------------------------------

app.use('/api', tenantMiddleware);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/files', fileRoutes);

// ---------------------------------------------------------------------------
// 404 & Centralized Error Handlers
// ---------------------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
