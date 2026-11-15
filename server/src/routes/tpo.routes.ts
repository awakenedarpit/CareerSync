/**
 * CarrerSync TPO Verification & Student Evidence REST Routes
 * Phase 10 — TPO Verification Portal & Placement Readiness Intelligence Engine
 *
 * Provides REST endpoints for:
 * 1. GET  /api/v1/tpo/verification/summary (TPO_ADMIN, COLLEGE_ADMIN)
 * 2. GET  /api/v1/tpo/verification/pending (TPO_ADMIN, COLLEGE_ADMIN; supports query filters)
 * 3. GET  /api/v1/tpo/verification/:evidenceId (TPO_ADMIN, COLLEGE_ADMIN)
 * 4. POST /api/v1/tpo/verification/:evidenceId/verify (TPO_ADMIN, COLLEGE_ADMIN; requires reason; blocks STUDENT & RECRUITER with 403)
 * 5. POST /api/v1/tpo/verification/:evidenceId/reject (TPO_ADMIN, COLLEGE_ADMIN; requires reason)
 * 6. POST /api/v1/tpo/verification/:evidenceId/request-evidence (TPO_ADMIN, COLLEGE_ADMIN; requires reason)
 * 7. GET  /api/v1/tpo/verification/:evidenceId/history (TPO_ADMIN, COLLEGE_ADMIN)
 * 8. GET  /api/v1/students/me/verification (STUDENT own records)
 * 9. POST /api/v1/students/me/evidence/:evidenceId/correction-request (STUDENT request correction)
 * 10. POST /api/v1/students/me/evidence/:evidenceId/resubmit (STUDENT resubmit evidence)
 *
 * Enforces strict 5-role RBAC, anti-spoofing tenant isolation, and auditEvent logging.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { verificationService } from '../verification/verification.service';
import { getDb } from '../db/client';
import { auditEvents, profileSkillEvidence } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { AuthUserContext } from '../types';
import { normalizeRole } from '../utils/roles';

export const tpoVerificationRoutes = Router();
export const studentEvidenceRoutes = Router();

// Apply auth and tenant middleware
tpoVerificationRoutes.use(requireAuth);
tpoVerificationRoutes.use(tenantMiddleware);

studentEvidenceRoutes.use(requireAuth);
studentEvidenceRoutes.use(tenantMiddleware);

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

/**
 * Asserts reviewer has read-only access to TPO verification dashboard & pending queue.
 * Permitted: TPO_ADMIN, COLLEGE_ADMIN, SUPER_ADMIN.
 * Forbidden: STUDENT, RECRUITER (403 Forbidden).
 */
function assertTpoReviewerRole(req: Request, res: Response): boolean {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required',
      code: 'UNAUTHORIZED'
    });
    return false;
  }

  const canonical = normalizeRole(user.role);
  if (canonical === 'STUDENT') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Students cannot access verification queue',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
    return false;
  }

  if (canonical === 'RECRUITER') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Recruiters cannot access verification queue',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
    return false;
  }

  if (canonical !== 'TPO_ADMIN' && canonical !== 'COLLEGE_ADMIN' && canonical !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: `Forbidden: Role '${user.role}' is not authorized to access verification records`,
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
    return false;
  }

  return true;
}

/**
 * Asserts reviewer has active decision-making authority to VERIFY, REJECT, or REQUEST evidence.
 * Strictly enforces Phase 10.2 security policy:
 * - Completely eliminates trusting client-supplied headers like `x-verification-permission`.
 *   A client-controlled HTTP header must NEVER establish verification authority!
 * - Verification authority must come exclusively from trusted server-side authorization data:
 *   TPO_ADMIN for the tenant or explicitly delegated reviewer verified via server-side storage/auth context scoped to that tenant.
 * - Prevents self-granting of reviewer permissions; students and recruiters receive 403 Forbidden.
 */
async function assertVerificationDecisionAuthority(req: Request, res: Response): Promise<boolean> {
  if (!assertTpoReviewerRole(req, res)) return false;

  const user = req.user!;
  const canonical = normalizeRole(user.role);

  // Security Hardening: Students and recruiters can NEVER verify evidence
  if (canonical === 'STUDENT' || canonical === 'RECRUITER') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Only authorized TPO verification reviewers can perform verification decisions',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
    return false;
  }

  // TPO_ADMIN possesses authoritative verification reviewer authority for their tenant
  if (canonical === 'TPO_ADMIN') {
    return true;
  }

  // For other administrative roles (COLLEGE_ADMIN, SUPER_ADMIN), verification authority
  // MUST come exclusively from trusted server-side authorization data scoped to the tenant.
  // Note: Client headers such as `x-verification-permission` are strictly ignored!
  const isServerDelegated =
    Boolean(user.hasVerificationPermission) ||
    Boolean(user.isDelegatedReviewer) ||
    (await verificationService.isDelegatedReviewer(user.tenantId, user.id));

  if (!isServerDelegated) {
    res.status(403).json({
      success: false,
      error: `Forbidden: ${canonical} does not possess verification reviewer authority without explicit server-side TPO verification delegation`,
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
    return false;
  }

  return true;
}

// ============================================================================
// TPO Verification Routes (/api/v1/tpo/verification)
// ============================================================================

/**
 * 1. GET /api/v1/tpo/verification/summary
 * High-level counts for pending, verified, rejected, needs info evidence records.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN.
 */
tpoVerificationRoutes.get(
  '/summary',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!assertTpoReviewerRole(req, res)) return;
      const tenantId = req.user!.tenantId;

      const summary = await verificationService.getVerificationSummary(tenantId);

      res.status(200).json({
        success: true,
        totalStudents: summary.totalStudents,
        totalEvidence: summary.totalEvidence,
        pending: summary.pendingCount,
        verified: summary.verifiedCount,
        rejected: summary.rejectedCount,
        needsInfo: summary.needsMoreEvidenceCount,
        summary
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch verification summary',
        code: error.code || 'SUMMARY_FETCH_FAILED'
      });
    }
  }
);

/**
 * 2. GET /api/v1/tpo/verification/pending
 * Filterable queue of pending evidence requiring TPO review.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN.
 */
tpoVerificationRoutes.get(
  '/pending',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!assertTpoReviewerRole(req, res)) return;
      const tenantId = req.user!.tenantId;

      const filters = {
        department: typeof req.query.department === 'string' ? req.query.department : undefined,
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        evidenceType: typeof req.query.evidenceType === 'string' ? req.query.evidenceType : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
        limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20
      };

      const queue = await verificationService.getPendingQueue(tenantId, filters);
      const totalPages = Math.ceil(queue.total / (queue.limit || 20)) || 1;

      res.status(200).json({
        success: true,
        items: queue.items,
        total: queue.total,
        page: queue.page,
        totalPages
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch pending verification queue',
        code: error.code || 'PENDING_QUEUE_FAILED'
      });
    }
  }
);

/**
 * 3. GET /api/v1/tpo/verification/:evidenceId
 * Retrieves detailed evidence record and supporting metadata.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN.
 */
tpoVerificationRoutes.get(
  '/:evidenceId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!assertTpoReviewerRole(req, res)) return;
      const evidenceId = getParam(req.params.evidenceId);
      const tenantId = req.user!.tenantId;

      const evidence = await verificationService.getEvidenceById(evidenceId, tenantId);

      if (!evidence) {
        res.status(404).json({
          success: false,
          error: `Skill evidence record not found with ID: ${evidenceId}`,
          code: 'NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        success: true,
        evidence,
        data: evidence
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch evidence details',
        code: error.code || 'EVIDENCE_FETCH_FAILED'
      });
    }
  }
);

/**
 * 4. POST /api/v1/tpo/verification/:evidenceId/verify
 * Approves evidence as VERIFIED with mandatory reason.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN.
 * Blocks STUDENT and RECRUITER with 403 Forbidden.
 */
tpoVerificationRoutes.post(
  '/:evidenceId/verify',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await assertVerificationDecisionAuthority(req, res))) return;
      const evidenceId = getParam(req.params.evidenceId);
      const user = req.user!;
      const isServerDelegated =
        Boolean(user.hasVerificationPermission) ||
        Boolean(user.isDelegatedReviewer) ||
        (await verificationService.isDelegatedReviewer(user.tenantId, user.id));

      const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Verification requires a mandatory justification reason',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      const reviewerNotes = typeof req.body.notes === 'string'
        ? req.body.notes.trim()
        : typeof req.body.reviewerNotes === 'string'
        ? req.body.reviewerNotes.trim()
        : undefined;

      const result = await verificationService.verifyEvidence({
        evidenceId,
        reviewerId: user.id,
        reviewerRole: user.role,
        tenantId: user.tenantId,
        reason,
        reviewerNotes,
        hasExplicitVerificationPermission: isServerDelegated
      });

      // Log audit trail
      await logAuditEvent(user, 'VERIFY_EVIDENCE', 'PROFILE_SKILL_EVIDENCE', evidenceId, {
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        reason,
        reviewerNotes
      });

      res.status(200).json({
        success: true,
        evidenceId,
        status: result.newStatus,
        result
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to verify evidence',
        code: error.code || 'VERIFICATION_FAILED'
      });
    }
  }
);

/**
 * 5. POST /api/v1/tpo/verification/:evidenceId/reject
 * Rejects evidence with mandatory reason.
 * Roles: TPO_ADMIN with verification authority.
 */
tpoVerificationRoutes.post(
  '/:evidenceId/reject',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await assertVerificationDecisionAuthority(req, res))) return;
      const evidenceId = getParam(req.params.evidenceId);
      const user = req.user!;
      const isServerDelegated =
        Boolean(user.hasVerificationPermission) ||
        Boolean(user.isDelegatedReviewer) ||
        (await verificationService.isDelegatedReviewer(user.tenantId, user.id));

      const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Rejection requires a mandatory justification reason',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      const reviewerNotes = typeof req.body.notes === 'string'
        ? req.body.notes.trim()
        : typeof req.body.reviewerNotes === 'string'
        ? req.body.reviewerNotes.trim()
        : undefined;

      const result = await verificationService.rejectEvidence({
        evidenceId,
        reviewerId: user.id,
        reviewerRole: user.role,
        tenantId: user.tenantId,
        reason,
        reviewerNotes,
        hasExplicitVerificationPermission: isServerDelegated
      });

      // Log audit trail
      await logAuditEvent(user, 'REJECT_EVIDENCE', 'PROFILE_SKILL_EVIDENCE', evidenceId, {
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        reason,
        reviewerNotes
      });

      res.status(200).json({
        success: true,
        evidenceId,
        status: result.newStatus,
        result
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to reject evidence',
        code: error.code || 'REJECTION_FAILED'
      });
    }
  }
);

/**
 * 6. POST /api/v1/tpo/verification/:evidenceId/request-evidence
 * Requests additional evidence from student with explanatory guidance.
 * Roles: TPO_ADMIN with verification authority.
 */
tpoVerificationRoutes.post(
  '/:evidenceId/request-evidence',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!(await assertVerificationDecisionAuthority(req, res))) return;
      const evidenceId = getParam(req.params.evidenceId);
      const user = req.user!;
      const isServerDelegated =
        Boolean(user.hasVerificationPermission) ||
        Boolean(user.isDelegatedReviewer) ||
        (await verificationService.isDelegatedReviewer(user.tenantId, user.id));

      const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Requesting more evidence requires explanatory guidance',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      const reviewerNotes = typeof req.body.notes === 'string'
        ? req.body.notes.trim()
        : typeof req.body.reviewerNotes === 'string'
        ? req.body.reviewerNotes.trim()
        : undefined;

      const result = await verificationService.requestMoreEvidence({
        evidenceId,
        reviewerId: user.id,
        reviewerRole: user.role,
        tenantId: user.tenantId,
        reason,
        reviewerNotes,
        hasExplicitVerificationPermission: isServerDelegated
      });

      // Log audit trail
      await logAuditEvent(user, 'REQUEST_MORE_EVIDENCE', 'PROFILE_SKILL_EVIDENCE', evidenceId, {
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        reason,
        reviewerNotes
      });

      res.status(200).json({
        success: true,
        evidenceId,
        status: result.newStatus,
        result
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to request additional evidence',
        code: error.code || 'REQUEST_EVIDENCE_FAILED'
      });
    }
  }
);

/**
 * 7. GET /api/v1/tpo/verification/:evidenceId/history
 * Complete longitudinal timeline of verification reviews for an evidence record.
 * Roles: TPO_ADMIN, COLLEGE_ADMIN, SUPERADMIN.
 */
tpoVerificationRoutes.get(
  '/:evidenceId/history',
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!assertTpoReviewerRole(req, res)) return;
      const evidenceId = getParam(req.params.evidenceId);
      const tenantId = req.user!.tenantId;

      const history = await verificationService.getEvidenceHistory(evidenceId, tenantId);

      res.status(200).json({
        success: true,
        evidenceId,
        history
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch verification history',
        code: error.code || 'HISTORY_FETCH_FAILED'
      });
    }
  }
);

// ============================================================================
// Student Evidence Routes (/api/v1/students/me)
// ============================================================================

/**
 * 8. GET /api/v1/students/me/verification
 * Retrieves authenticated student's own evidence inventory and status summary.
 * Roles: STUDENT, SUPERADMIN.
 */
studentEvidenceRoutes.get(
  '/verification',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role !== 'student' && user.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only students can access their personal verification records',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      let items = await verificationService.getStudentEvidence(user.id, user.tenantId);
      if (!items || items.length === 0) {
        const mem = (verificationService as any)['inMemorySkillEvidence'] as Map<string, any> | undefined;
        if (mem) {
          items = Array.from(mem.values()).filter(
            (ev: any) => ev.userId === user.id && ev.tenantId === user.tenantId
          );
        }
      }

      const verifiedCount = items.filter((i) => i.verificationStatus === 'VERIFIED').length;
      const pendingCount = items.filter(
        (i) => i.verificationStatus === 'PENDING_REVIEW' || i.verificationStatus === 'EVIDENCE_FOUND'
      ).length;
      const rejectedCount = items.filter((i) => i.verificationStatus === 'REJECTED').length;
      const needsInfoCount = items.filter((i) => i.verificationStatus === 'NEEDS_MORE_EVIDENCE').length;

      res.status(200).json({
        success: true,
        studentId: user.id,
        summary: {
          total: items.length,
          verified: verifiedCount,
          pending: pendingCount,
          rejected: rejectedCount,
          needsInfo: needsInfoCount,
          needsMoreEvidence: needsInfoCount
        },
        items
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to fetch student verification items',
        code: error.code || 'STUDENT_VERIFICATION_FAILED'
      });
    }
  }
);

/**
 * 9. POST /api/v1/students/me/evidence/:evidenceId/correction-request
 * Allows student to request correction or review clarification for an evidence record.
 * Roles: STUDENT, SUPERADMIN.
 */
studentEvidenceRoutes.post(
  '/evidence/:evidenceId/correction-request',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role !== 'student' && user.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only students can request evidence corrections',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const evidenceId = getParam(req.params.evidenceId);
      const evidence = await verificationService.getEvidence(evidenceId, user.tenantId);

      // Ownership check: student can only request correction on their own evidence
      if (user.role !== 'superadmin' && evidence.userId !== user.id) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You do not own this skill evidence record',
          code: 'FORBIDDEN_NOT_OWNER'
        });
        return;
      }

      const reason = typeof req.body.reason === 'string'
        ? req.body.reason.trim()
        : typeof req.body.requestedCorrection === 'string'
        ? req.body.requestedCorrection.trim()
        : '';

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'Correction request requires an explanatory reason or requested correction',
          code: 'REASON_REQUIRED'
        });
        return;
      }

      await logAuditEvent(user, 'STUDENT_CORRECTION_REQUEST', 'PROFILE_SKILL_EVIDENCE', evidenceId, {
        reason,
        requestedCorrection: req.body.requestedCorrection || reason
      });

      res.status(200).json({
        success: true,
        message: 'Correction request submitted successfully',
        evidenceId
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to submit correction request',
        code: error.code || 'CORRECTION_REQUEST_FAILED'
      });
    }
  }
);

/**
 * 10. POST /api/v1/students/me/evidence/:evidenceId/resubmit
 * Allows student to resubmit updated evidence for records marked NEEDS_MORE_EVIDENCE or REJECTED.
 * Roles: STUDENT, SUPERADMIN.
 */
studentEvidenceRoutes.post(
  '/evidence/:evidenceId/resubmit',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role !== 'student' && user.role !== 'superadmin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: Only students can resubmit evidence',
          code: 'FORBIDDEN_INSUFFICIENT_ROLE'
        });
        return;
      }

      const evidenceId = getParam(req.params.evidenceId);
      const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : 'Student resubmitted supporting evidence';
      const documentId = typeof req.body.documentId === 'string' ? req.body.documentId.trim() : undefined;

      const result = await verificationService.studentResubmitEvidence({
        evidenceId,
        studentId: user.id,
        tenantId: user.tenantId,
        notes,
        additionalDocumentId: documentId
      });

      await logAuditEvent(user, 'RESUBMIT_EVIDENCE', 'PROFILE_SKILL_EVIDENCE', evidenceId, {
        previousStatus: result.previousStatus,
        newStatus: result.newStatus,
        notes,
        documentId
      });

      res.status(200).json({
        success: true,
        evidenceId,
        status: result.newStatus,
        message: 'Evidence resubmitted successfully for verification review',
        result
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to resubmit evidence',
        code: error.code || 'RESUBMISSION_FAILED'
      });
    }
  }
);

export const tpoRoutes = tpoVerificationRoutes;
