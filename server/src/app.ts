import express, { type Express } from 'express';
import cors from 'cors';
import env from './config/env';
import { tenantMiddleware } from './middleware/tenant';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { superAdminRoutes } from './routes/superadmin.routes';
import fileRoutes from './routes/file.routes';
import { profilingRoutes } from './routes/profiling.routes';
import { tpoVerificationRoutes, studentEvidenceRoutes } from './routes/tpo.routes';
import { readinessRoutes, tpoReadinessRoutes } from './routes/readiness.routes';
import { jobRoutes } from './routes/job.routes';
import { recruiterRoutes } from './routes/recruiter.routes';
import { tpoApprovalRoutes } from './routes/tpo-approvals.routes';
import { studentOfferRoutes } from './routes/student-offers.routes';
import { studentAssessmentRoutes } from './routes/student-assessment.routes';
import { studentLearningRoutes } from './routes/student-learning.routes';
import { tpoMockDriveRoutes } from './routes/tpo-mock-drive.routes';
import { tpoIndustryRoutes } from './routes/tpo-industry.routes';
import { studentCareerRoutes } from './routes/student-career.routes';
import { tpoPredictiveRoutes } from './routes/tpo-predictive.routes';
import { orchestrationRoutes } from './routes/orchestration.routes';
import { notificationRoutes } from './routes/notification.routes';
import { alumniRoutes, mentorshipRoutes, tpoAlumniRoutes } from './routes/alumni.routes';
import { peerInterviewRoutes } from './routes/peer-interview.routes';
import { collaborationRoutes } from './routes/collaboration.routes';
import { moderationRoutes, tpoModerationRoutes } from './routes/moderation.routes';
import { getHealthData, getApiHealthData } from './routes/health.routes';

const app: Express = express();

// ---------------------------------------------------------------------------
// Global Middleware & Security Headers
// ---------------------------------------------------------------------------

// Security headers middleware (Defense-in-depth against MIME sniffing and clickjacking)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

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
      return callback(null, false);
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
app.use('/api/v1/profiling', profilingRoutes);

// Phase 10 — TPO Verification, Readiness Intelligence & Job Eligibility Routes
app.use('/api/v1/tpo/verification', tpoVerificationRoutes);
app.use('/api/v1/tpo/readiness', tpoReadinessRoutes);
app.use('/api/v1/students/me', studentEvidenceRoutes);
app.use('/api/v1/readiness', readinessRoutes);
app.use('/api/v1/jobs', jobRoutes);

// Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Routes
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/tpo/approvals', tpoApprovalRoutes);
app.use('/api/v1/student/offers', studentOfferRoutes);

// Phase 12 — Student Mock Drive, Assessment Engine & Personalized Learning Intelligence Routes
app.use('/api/v1/student/learning-path', studentLearningRoutes);
app.use('/api/v1/student', studentAssessmentRoutes);
app.use('/api/v1/tpo/mock-drives', tpoMockDriveRoutes);

// Phase 16 — Alumni & Moderation TPO Institutional Routes (mounted before broad /api/v1/tpo)
app.use('/api/v1/tpo/alumni', tpoAlumniRoutes);
app.use('/api/v1/tpo/moderation', tpoModerationRoutes);

// Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine Routes
app.use('/api/v1/tpo', tpoIndustryRoutes);
app.use('/api/v1/student', studentCareerRoutes);

// Phase 14 — Predictive Placement Analytics Agent Routes
app.use('/api/v1/tpo/predictive-analytics', tpoPredictiveRoutes);

// Phase 15 — Autonomous Placement Orchestration, Multi-Agent Workflows & Notifications
app.use('/api/v1/orchestration', orchestrationRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Phase 16 — Alumni Mentorship Network, Live Peer Mock Interviews & Realtime Collaboration
app.use('/api/v1/alumni', alumniRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/peer-interviews', peerInterviewRoutes);
app.use('/api/v1/collaboration', collaborationRoutes);
app.use('/api/v1/moderation', moderationRoutes);

// ---------------------------------------------------------------------------
// 404 & Centralized Error Handlers
// ---------------------------------------------------------------------------

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
