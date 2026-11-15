/**
 * CarrerSync Job Requirement Specification & Eligibility REST Routes
 * Phase 10 — Job Requirement Specification & Eligibility Determination Engine
 *
 * Provides REST endpoints for:
 * 1. POST /api/v1/jobs (TPO_ADMIN, COLLEGE_ADMIN, RECRUITER)
 * 2. GET  /api/v1/jobs (list tenant active jobs)
 * 3. GET  /api/v1/jobs/:jobId (job details)
 * 4. PUT  /api/v1/jobs/:jobId (update job)
 * 5. POST /api/v1/jobs/:jobId/evaluate (evaluate cohort or specific student)
 * 6. GET  /api/v1/jobs/:jobId/eligibility (eligibility summary list)
 * 7. POST /api/v1/jobs/:jobId/eligibility/:studentId/review (TPO override with reason)
 *
 * Enforces strict 5-role RBAC, anti-spoofing tenant isolation, and auditEvent logging.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { eligibilityService } from '../eligibility/eligibility.service';
import { getDb } from '../db/client';
import { auditEvents } from '../db/schema';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import type { EligibilityResult, RecruitmentJobStatus } from '../eligibility/eligibility.types';

export const jobRoutes = Router();

// Apply auth and tenant middleware
jobRoutes.use(requireAuth);
jobRoutes.use(tenantMiddleware);

/**
 * Helper to record audit events in PostgreSQL (non-blocking in offline/test environments).
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

/**
 * Resolves route param string safely.
 */
function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ============================================================================
// Job Specification Endpoints
// ============================================================================

/**
 * 1. POST /api/v1/jobs
 * Creates a new declarative job requirement listing.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, RECRUITER, SUPERADMIN.
 * Blocks STUDENT with 403 Forbidden.
 */
jobRoutes.post(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const canonicalRole = normalizeRole(user.role);
      if (canonicalRole === 'STUDENT') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students cannot create job requirements',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      // Prompt 10.1: Jobs created by recruiters must default to DRAFT status and require explicit TPO activation
      const jobPayload = { ...req.body };
      if (canonicalRole === 'RECRUITER') {
        jobPayload.status = 'DRAFT';
      }

      const job = await eligibilityService.createJob(
        jobPayload,
        user.id,
        user.tenantId
      );

      await logAuditEvent(user, 'CREATE_JOB_REQUIREMENT', 'JOB_REQUIREMENT', job.id, {
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        status: job.status
      });

      res.status(201).json({
        success: true,
        id: job.id,
        title: job.jobTitle,
        company: job.companyName,
        job
      });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to create job requirement',
        code: error.code || 'JOB_CREATION_FAILED'
      });
    }
  }
);

/**
 * 2. GET /api/v1/jobs
 * Lists active job postings for the current institution tenant.
 * Roles: all authenticated tenant users (student, tpo_admin, college_admin, recruiter, superadmin).
 */
jobRoutes.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const canonicalRole = normalizeRole(user.role);
      const requestedStatus = (req.query.status as RecruitmentJobStatus) || undefined;
      // Prompt 10.1: Students can only view ACTIVE jobs (DRAFT requires TPO activation)
      const effectiveStatus = canonicalRole === 'STUDENT' ? ('ACTIVE' as RecruitmentJobStatus) : requestedStatus;

      const filters = {
        status: effectiveStatus,
        companyName: typeof req.query.companyName === 'string' ? req.query.companyName : undefined,
        department: typeof req.query.department === 'string' ? req.query.department : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined
      };

      const jobs = await eligibilityService.listJobs(user.tenantId, filters);

      res.status(200).json({
        success: true,
        jobs,
        total: jobs.length
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to list job requirements',
        code: error.code || 'JOB_LIST_FAILED'
      });
    }
  }
);

/**
 * 3. GET /api/v1/jobs/:jobId
 * Retrieves full details of a specific job requirement.
 * Roles: all authenticated tenant users.
 */
jobRoutes.get(
  '/:jobId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const jobId = getParam(req.params.jobId);

      const job = await eligibilityService.getJobById(jobId, user.tenantId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: `Job requirement not found with ID: ${jobId}`,
          code: 'NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        job
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch job details',
        code: error.code || 'JOB_FETCH_FAILED'
      });
    }
  }
);

/**
 * 4. PUT /api/v1/jobs/:jobId
 * Updates an existing job requirement specification.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, RECRUITER, SUPERADMIN.
 * Blocks STUDENT with 403 Forbidden.
 */
jobRoutes.put(
  '/:jobId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const canonicalRole = normalizeRole(user.role);
      if (canonicalRole === 'STUDENT') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students cannot update job requirements',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const jobId = getParam(req.params.jobId);
      const existingJob = await eligibilityService.findJobById(jobId);
      if (!existingJob) {
        res.status(404).json({
          success: false,
          error: `Job requirement not found with ID: ${jobId}`,
          code: 'NOT_FOUND'
        });
        return;
      }

      if (existingJob.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied. Cannot modify job requirements belonging to another institution tenant',
          code: 'FORBIDDEN_TENANT_MISMATCH'
        });
        return;
      }

      // Recruiters can only edit drafts; active job postings cannot be modified directly by recruiters
      if (canonicalRole === 'RECRUITER') {
        if (existingJob.status !== 'DRAFT') {
          res.status(403).json({
            success: false,
            error: 'Forbidden: Recruiters can only edit draft job postings; active postings require TPO review',
            code: 'FORBIDDEN_RECRUITER_DRAFT_ONLY'
          });
          return;
        }

        if (req.body.status && req.body.status !== 'DRAFT') {
          res.status(403).json({
            success: false,
            error: 'Forbidden: Recruiters cannot activate job postings directly; requires TPO approval',
            code: 'FORBIDDEN_TPO_APPROVAL_REQUIRED'
          });
          return;
        }
      }

      const job = await eligibilityService.updateJob(jobId, req.body, user.tenantId);

      await logAuditEvent(user, 'UPDATE_JOB_REQUIREMENT', 'JOB_REQUIREMENT', jobId, {
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        status: job.status
      });

      res.status(200).json({
        success: true,
        job
      });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to update job requirement',
        code: error.code || 'JOB_UPDATE_FAILED'
      });
    }
  }
);

/**
 * 4b. POST /api/v1/jobs/:jobId/activate
 * Activates a draft job posting.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN (scoped to tenant).
 * Blocks RECRUITER and STUDENT with 403 Forbidden.
 * Strictly denies cross-tenant activation with 403 Forbidden.
 */
jobRoutes.post(
  '/:jobId/activate',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const canonicalRole = normalizeRole(user.role);

      // 1. Strict RBAC: Recruiters and students cannot activate jobs
      if (canonicalRole !== 'TPO_ADMIN' && canonicalRole !== 'COLLEGE_ADMIN' && canonicalRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only TPO or administrative authorities can activate job postings',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const jobId = getParam(req.params.jobId);

      // 2. Tenant isolation: verify job exists and belongs to the user's tenant
      const jobRecord = await eligibilityService.findJobById(jobId);
      if (!jobRecord) {
        res.status(404).json({
          success: false,
          error: `Job requirement not found with ID: ${jobId}`,
          code: 'NOT_FOUND'
        });
        return;
      }

      if (jobRecord.tenantId !== user.tenantId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Access denied. Cannot activate job requirements belonging to another institution tenant',
          code: 'FORBIDDEN_TENANT_MISMATCH'
        });
        return;
      }

      const job = await eligibilityService.updateJob(jobId, { status: 'ACTIVE' }, user.tenantId);

      await logAuditEvent(user, 'ACTIVATE_JOB_REQUIREMENT', 'JOB_REQUIREMENT', jobId, {
        previousStatus: jobRecord.status,
        newStatus: 'ACTIVE'
      });

      res.status(200).json({
        success: true,
        message: 'Job posting activated successfully',
        job
      });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to activate job posting',
        code: error.code || 'JOB_ACTIVATION_FAILED'
      });
    }
  }
);

/**
 * 5. POST /api/v1/jobs/:jobId/evaluate
 * Triggers eligibility evaluation against a specific student or full cohort.
 * Roles:
 * - Specific student: student (own profile), TPO_ADMIN, COLLEGE_ADMIN, RECRUITER.
 * - Entire cohort: TPO_ADMIN, COLLEGE_ADMIN, RECRUITER, SUPERADMIN (blocks student).
 */
jobRoutes.post(
  '/:jobId/evaluate',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const jobId = getParam(req.params.jobId);

      const targetStudentId = typeof req.body.studentId === 'string'
        ? req.body.studentId.trim()
        : typeof req.query.studentId === 'string'
        ? (req.query.studentId as string).trim()
        : undefined;

      if (targetStudentId) {
        // Evaluating a specific student
        if (user.role === 'student' && user.id !== targetStudentId) {
          res.status(403).json({
            success: false,
            error: 'Forbidden: Students can only evaluate their own job eligibility',
            code: 'FORBIDDEN_STUDENT_ACCESS'
          });
          return;
        }

        const evaluation = await eligibilityService.evaluateStudent(
          jobId,
          targetStudentId,
          user.tenantId
        );

        res.status(200).json({
          success: true,
          jobId,
          studentId: targetStudentId,
          evaluation
        });
        return;
      }

      // Evaluating entire cohort
      if (user.role === 'student') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students cannot run cohort-wide eligibility evaluations',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const breakdown = await eligibilityService.evaluateCohort(jobId, user.tenantId);

      res.status(200).json({
        success: true,
        jobId,
        evaluatedCount: breakdown.totalEvaluated,
        eligibleCount: breakdown.eligibleCount,
        ineligibleCount: breakdown.ineligibleCount,
        needsReviewCount: breakdown.needsReviewCount,
        insufficientDataCount: breakdown.insufficientDataCount,
        breakdown
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to evaluate job eligibility',
        code: error.code || 'JOB_EVALUATION_FAILED'
      });
    }
  }
);

/**
 * 6. GET /api/v1/jobs/:jobId/eligibility
 * Retrieves the candidate eligibility matrix and rule-by-rule breakdowns.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, RECRUITER, SUPERADMIN.
 * Blocks STUDENT with 403 Forbidden.
 */
jobRoutes.get(
  '/:jobId/eligibility',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role === 'student') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Students cannot view candidate eligibility lists',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const jobId = getParam(req.params.jobId);
      const eligibility = await eligibilityService.getJobEligibility(jobId, user.tenantId);

      res.status(200).json({
        success: true,
        jobId,
        ...eligibility
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch candidate eligibility matrix',
        code: error.code || 'ELIGIBILITY_FETCH_FAILED'
      });
    }
  }
);

/**
 * 7. POST /api/v1/jobs/:jobId/eligibility/:studentId/review
 * Records a human-in-the-loop TPO override of student eligibility with mandatory reason.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN.
 * Blocks STUDENT and RECRUITER with 403 Forbidden.
 */
jobRoutes.post(
  '/:jobId/eligibility/:studentId/review',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role === 'student' || user.role === 'recruiter') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only placement administrators can override eligibility decisions',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const jobId = getParam(req.params.jobId);
      const studentId = getParam(req.params.studentId);

      const targetStatus: EligibilityResult = (
        req.body.status || req.body.newResult || ''
      ).toUpperCase();

      const validStatuses: EligibilityResult[] = [
        'ELIGIBLE',
        'INELIGIBLE',
        'NEEDS_REVIEW',
        'INSUFFICIENT_DATA'
      ];

      if (!validStatuses.includes(targetStatus)) {
        res.status(400).json({
          success: false,
          error: `Invalid eligibility status: '${targetStatus}'. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        });
        return;
      }

      const reason = typeof req.body.reason === 'string'
        ? req.body.reason.trim()
        : typeof req.body.overrideReason === 'string'
        ? req.body.overrideReason.trim()
        : '';

      if (!reason || reason.length < 10) {
        res.status(400).json({
          success: false,
          error: 'A detailed justification reason (minimum 10 characters) is required for TPO override',
          code: 'REASON_TOO_SHORT'
        });
        return;
      }

      const updatedEvaluation = await eligibilityService.overrideEvaluation(
        jobId,
        studentId,
        targetStatus,
        reason,
        user.id,
        user.tenantId
      );

      await logAuditEvent(
        user,
        'OVERRIDE_JOB_ELIGIBILITY',
        'JOB_ELIGIBILITY_EVALUATION',
        `${jobId}:${studentId}`,
        {
          newResult: targetStatus,
          overrideReason: reason,
          reviewerNotes: req.body.notes || null
        }
      );

      res.status(200).json({
        success: true,
        jobId,
        studentId,
        updatedStatus: targetStatus,
        status: targetStatus,
        evaluation: updatedEvaluation
      });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to override job eligibility',
        code: error.code || 'OVERRIDE_FAILED'
      });
    }
  }
);
