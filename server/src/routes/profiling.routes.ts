/**
 * CarrerSync AI Student Profiling & Job Queue API Routes
 * Phase 09 — Hybrid AI Student Profiling Architecture
 *
 * Provides REST endpoints for:
 * 1. POST /api/v1/profiling/documents/:documentId/analyze (Queues document analysis job)
 * 2. GET  /api/v1/profiling/jobs/:jobId (Polls job execution status)
 * 3. POST /api/v1/profiling/jobs/:jobId/process (Triggers job execution)
 * 4. GET  /api/v1/profiling/extractions/:id (Retrieves extraction payload)
 * 5. GET  /api/v1/profiling/students/:studentId/proposed-profile (Lists pending extractions)
 * 6. POST /api/v1/profiling/extractions/:id/approve (Approves skills -> creates evidence rows)
 * 7. POST /api/v1/profiling/extractions/:id/reject (Rejects proposed extraction)
 * 8. GET  /api/v1/profiling/students/:studentId/evidence (Inspects verified & pending evidence)
 *
 * Enforces strict 5-role RBAC, anti-spoofing tenant isolation, and auditEvent logging.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { jobQueueService } from '../services/job-queue.service';
import { profilingService } from '../services/profiling.service';
import { inMemoryDocuments } from './file.routes';
import { getDb } from '../db/client';
import { documents, auditEvents } from '../db/schema';
import type { AuthUserContext } from '../types';

const router = Router();

// Apply auth and tenant middleware globally to profiling routes
router.use(requireAuth);
router.use(tenantMiddleware);

/**
 * Resolves a route param as string safely.
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param) : '';
}

/**
 * Resolves document by ID from in-memory cache or PostgreSQL database.
 */
async function resolveDocument(documentId: string): Promise<any | null> {
  const memDoc = inMemoryDocuments.get(documentId);
  if (memDoc) return memDoc;

  try {
    const db = getDb();
    const rows = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    if (rows && rows.length > 0) {
      return rows[0];
    }
  } catch {
    // Database offline fallback
  }

  return null;
}

/**
 * Records an audit event in PostgreSQL (non-blocking in tests).
 */
async function logAuditEvent(
  user: AuthUserContext,
  action: string,
  resourceType: string,
  resourceId: string,
  changesDiff: Record<string, unknown> = {}
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditEvents).values({
      tenantId: user.tenantId,
      actorId: user.id,
      actorEmail: user.email,
      action,
      resourceType,
      resourceId,
      changesDiff
    });
  } catch {
    // Non-blocking in offline test environments
  }
}

// ============================================================================
// 1. POST /documents/:documentId/analyze
// ============================================================================

/**
 * Enqueues a document analysis job for AI extraction.
 * Roles: student (own document), college_admin, tpo_admin, faculty_coordinator, superadmin.
 * Rejects recruiters and cross-tenant access.
 */
router.post(
  '/documents/:documentId/analyze',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      // Role check: Recruiters cannot request document profiling
      if (user.role === 'recruiter') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Recruiters cannot initiate document profiling analysis',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const documentId = getParam(req.params.documentId);
      const doc = await resolveDocument(documentId);

      if (!doc) {
        res.status(404).json({
          success: false,
          error: `Document not found with ID: ${documentId}`,
          code: 'DOCUMENT_NOT_FOUND'
        });
        return;
      }

      // Anti-spoofing tenant isolation check
      if (user.role !== 'superadmin' && doc.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Cross-tenant document access forbidden: document belongs to another institution',
          code: 'CROSS_TENANT_ACCESS_FORBIDDEN'
        });
        return;
      }

      // Student ownership check
      if (user.role === 'student' && doc.ownerUserId !== user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students may only initiate profiling on their own documents',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      // Enqueue job with idempotent guarantees
      const job = await jobQueueService.enqueueJob(doc.tenantId, doc.id, doc.ownerUserId, {
        documentType: doc.documentType,
        originalFilename: doc.originalFilename,
        requestedBy: user.id,
        requesterRole: user.role
      });

      // Audit event
      await logAuditEvent(user, 'DOCUMENT_ANALYSIS_REQUESTED', 'document_processing_job', job.id, {
        documentId: doc.id,
        documentType: doc.documentType
      });

      // If ?sync=true is requested, process immediately; otherwise dispatch to background
      const isSync = req.query.sync === 'true';
      if (isSync) {
        const processedJob = await jobQueueService.processJob(job.id, doc.tenantId);
        res.status(200).json({
          success: true,
          message: 'Document analysis processed successfully',
          job: processedJob
        });
        return;
      }

      // Asynchronous background processing trigger
      setImmediate(() => {
        jobQueueService.processJob(job.id, doc.tenantId).catch((err) => {
          if (err instanceof Error && err.message.includes('not found')) {
            return;
          }
          console.error(`[JobQueue] Async background error on job ${job.id}:`, err);
        });
      });

      res.status(202).json({
        success: true,
        message: 'Document analysis job queued successfully',
        job
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 2. GET /jobs/:jobId
// ============================================================================

/**
 * Checks the status and result of a document processing job.
 */
router.get(
  '/jobs/:jobId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      const jobId = getParam(req.params.jobId);
      const job = await jobQueueService.getJob(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: `Job not found: ${jobId}`,
          code: 'JOB_NOT_FOUND'
        });
        return;
      }

      // Tenant isolation
      if (user.role !== 'superadmin' && job.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Cross-tenant access forbidden',
          code: 'CROSS_TENANT_ACCESS_FORBIDDEN'
        });
        return;
      }

      // Student ownership check
      if (user.role === 'student' && job.userId !== user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students may only view status of their own jobs',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      res.status(200).json({
        success: true,
        job
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 3. POST /jobs/:jobId/process (Explicit synchronous processing trigger)
// ============================================================================

/**
 * Manually or synchronously processes a queued job.
 */
router.post(
  '/jobs/:jobId/process',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      const jobId = getParam(req.params.jobId);
      const job = await jobQueueService.getJob(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: `Job not found: ${jobId}`,
          code: 'JOB_NOT_FOUND'
        });
        return;
      }

      if (user.role !== 'superadmin' && job.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Cross-tenant access forbidden',
          code: 'CROSS_TENANT_ACCESS_FORBIDDEN'
        });
        return;
      }

      const processedJob = await jobQueueService.processJob(jobId, job.tenantId);

      res.status(200).json({
        success: true,
        message: 'Job processed successfully',
        job: processedJob
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 4. GET /extractions/:id
// ============================================================================

/**
 * Retrieves an extraction result by ID.
 */
router.get(
  '/extractions/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      const id = getParam(req.params.id);
      const extraction = await profilingService.getExtraction(id);

      if (!extraction) {
        res.status(404).json({
          success: false,
          error: `Extraction not found: ${id}`,
          code: 'EXTRACTION_NOT_FOUND'
        });
        return;
      }

      // Tenant isolation
      if (user.role !== 'superadmin' && extraction.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Cross-tenant access forbidden',
          code: 'CROSS_TENANT_ACCESS_FORBIDDEN'
        });
        return;
      }

      // Student ownership check
      if (user.role === 'student' && extraction.userId !== user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students may only view their own extractions',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      res.status(200).json({
        success: true,
        extraction
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 5. GET /students/:studentId/proposed-profile
// ============================================================================

/**
 * Returns unapproved / pending extractions for a student.
 * Students can only view their own; tenant staff can inspect within their tenant.
 * Recruiters are prohibited from accessing unapproved proposed profiles.
 */
router.get(
  '/students/:studentId/proposed-profile',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      if (user.role === 'recruiter') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Recruiters cannot view unapproved student proposals',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const studentId = getParam(req.params.studentId);

      if (user.role === 'student' && user.id !== studentId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students may only view their own proposed profile',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      const extractions = await profilingService.getStudentProposedProfile(studentId, user.tenantId);

      res.status(200).json({
        success: true,
        studentId,
        extractions
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 6. POST /extractions/:id/approve
// ============================================================================

/**
 * Approves extracted skills, recording them into profileSkillEvidence rows.
 * Guarantees skills are marked 'EVIDENCE_FOUND' or 'PENDING_REVIEW' and never auto-VERIFIED.
 * Students can only approve their own profile; college admins can approve student profiles within tenant.
 * Recruiters are strictly prohibited from approving extractions.
 */
router.post(
  '/extractions/:id/approve',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      if (user.role === 'recruiter') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Recruiters are not authorized to approve student profiles',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const id = getParam(req.params.id);
      const extraction = await profilingService.getExtraction(id);

      if (!extraction) {
        res.status(404).json({
          success: false,
          error: `Extraction not found: ${id}`,
          code: 'EXTRACTION_NOT_FOUND'
        });
        return;
      }

      // Tenant isolation
      if (user.role !== 'superadmin' && extraction.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Cross-tenant access forbidden',
          code: 'CROSS_TENANT_ACCESS_FORBIDDEN'
        });
        return;
      }

      // Student ownership check: Student cannot approve another student's profile
      if (user.role === 'student' && extraction.userId !== user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students cannot approve another student\'s profile',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      const { approvedSkillNames } = req.body || {};

      const approvalResult = await profilingService.approveExtraction(
        id,
        user.id,
        extraction.tenantId,
        approvedSkillNames,
        user.role
      );

      // Compliance audit event
      await logAuditEvent(user, 'PROFILE_EXTRACTION_APPROVED', 'profile_extraction', id, {
        approvedSkillNames,
        studentId: extraction.userId,
        approvedCount: approvalResult.approvedCount
      });

      res.status(200).json({
        message: 'Extraction approved and skill evidence recorded successfully',
        ...approvalResult
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 7. POST /extractions/:id/reject
// ============================================================================

/**
 * Rejects an extraction, marking it REJECTED and logging review events.
 * Students can only reject their own profile; college staff can reject within tenant.
 * Recruiters are strictly prohibited.
 */
router.post(
  '/extractions/:id/reject',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      if (user.role === 'recruiter') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Recruiters are not authorized to reject student profiles',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const id = getParam(req.params.id);
      const extraction = await profilingService.getExtraction(id);

      if (!extraction) {
        res.status(404).json({
          success: false,
          error: `Extraction not found: ${id}`,
          code: 'EXTRACTION_NOT_FOUND'
        });
        return;
      }

      // Tenant isolation
      if (user.role !== 'superadmin' && extraction.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Cross-tenant access forbidden',
          code: 'CROSS_TENANT_ACCESS_FORBIDDEN'
        });
        return;
      }

      // Student ownership check
      if (user.role === 'student' && extraction.userId !== user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students cannot reject another student\'s profile',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      const { rejectedSkillNames, reason } = req.body || {};

      const rejectResult = await profilingService.rejectExtraction(
        id,
        user.id,
        extraction.tenantId,
        rejectedSkillNames,
        reason || 'User rejected proposed extraction',
        user.role
      );

      // Compliance audit event
      await logAuditEvent(user, 'PROFILE_EXTRACTION_REJECTED', 'profile_extraction', id, {
        rejectedSkillNames,
        reason,
        studentId: extraction.userId
      });

      res.status(200).json({
        message: 'Extraction rejected successfully',
        ...rejectResult
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// ============================================================================
// 8. GET /students/:studentId/evidence
// ============================================================================

/**
 * Returns verified, pending, and evidence-supported skills for a student.
 * Roles: student (own evidence), recruiter (within institutional tenant), college staff, superadmin.
 */
router.get(
  '/students/:studentId/evidence',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
      }

      const studentId = getParam(req.params.studentId);

      // Student can only view own evidence
      if (user.role === 'student' && user.id !== studentId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students may only view their own skill evidence',
          code: 'FORBIDDEN_OWNERSHIP_MISMATCH'
        });
        return;
      }

      const evidence = await profilingService.getStudentEvidence(studentId, user.tenantId);

      res.status(200).json({
        success: true,
        studentId,
        evidence
      });
    } catch (err: unknown) {
      next(err);
    }
  }
);

export default router;
export { router as profilingRoutes };
