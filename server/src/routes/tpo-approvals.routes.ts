/**
 * CarrerSync TPO Governance Unified Approvals REST API Routes
 * Phase 11 — Institutional Approvals Queue for Corporate Recruitment
 *
 * Implements endpoints for:
 * 1. GET  /api/v1/tpo/approvals (unified queue for companies, jobs, drives, shortlists, offers)
 * 2. POST /api/v1/tpo/companies/:id/review (company corporate verification)
 * 3. POST /api/v1/tpo/jobs/:id/approve (job requirement activation)
 * 4. POST /api/v1/tpo/jobs/:id/reject (job requirement rejection with reason)
 * 5. POST /api/v1/tpo/drives/:id/approve (placement drive schedule approval)
 * 6. POST /api/v1/tpo/drives/:id/reject (placement drive cancellation with reason)
 * 7. POST /api/v1/tpo/shortlists/:id/review (candidate shortlist endorsement)
 * 8. POST /api/v1/tpo/offers/:id/review (placement offer release authorization)
 *
 * Enforces strict TPO authority, tenant isolation, and audit trail generation.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { recruiterService } from '../recruiter/recruiter.service';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import type { TpoApprovalCategory } from '../recruiter/recruiter.types';

export const tpoApprovalRoutes = Router();

tpoApprovalRoutes.use(requireAuth);
tpoApprovalRoutes.use(tenantMiddleware);

/**
 * Gating: Institutional reviewer authority (TPO_ADMIN, COLLEGE_ADMIN, SUPER_ADMIN).
 * RECRUITER and STUDENT receive 403 Forbidden.
 */
function requireTpoReviewAuthority(req: Request, res: Response, next: Function) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Institutional approval authority required (TPO_ADMIN or COLLEGE_ADMIN)',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }

  next();
}

tpoApprovalRoutes.use(requireTpoReviewAuthority);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// 1. Unified Approvals Queue
tpoApprovalRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const category = req.query.category as TpoApprovalCategory | undefined;
    const items = await recruiterService.getTpoApprovalQueue(user.tenantId, category);
    return res.json({ success: true, count: items.length, data: items });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Company Review
tpoApprovalRoutes.post('/companies/:id/review', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { decision, reviewNotes } = req.body;

    if (!decision || !reviewNotes) {
      return res.status(400).json({ success: false, error: 'decision (VERIFIED|REJECTED|UNDER_REVIEW) and reviewNotes are required' });
    }

    const reviewed = await recruiterService.reviewCompanyVerification(user.tenantId, user.id, getParam(req.params.id), {
      decision,
      reviewNotes
    });

    return res.json({ success: true, message: `Company verification set to ${decision}`, data: reviewed });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Job Approve
tpoApprovalRoutes.post('/jobs/:id/approve', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const reason = req.body.reason || 'Job approved and activated by placement committee';
    const approved = await recruiterService.tpoReviewJob(user.tenantId, user.id, getParam(req.params.id), 'APPROVED', reason);
    return res.json({ success: true, message: 'Job requirement approved and activated', data: approved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Job Reject
tpoApprovalRoutes.post('/jobs/:id/reject', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const rejected = await recruiterService.tpoReviewJob(user.tenantId, user.id, getParam(req.params.id), 'REJECTED', reason);
    return res.json({ success: true, message: 'Job requirement rejected', data: rejected });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Drive Approve
tpoApprovalRoutes.post('/drives/:id/approve', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const reason = req.body.reason || 'Placement drive approved and scheduled';
    const approved = await recruiterService.tpoReviewDrive(user.tenantId, user.id, getParam(req.params.id), 'APPROVED', reason);
    return res.json({ success: true, message: 'Placement drive approved and scheduled', data: approved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Drive Reject
tpoApprovalRoutes.post('/drives/:id/reject', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required' });
    }

    const rejected = await recruiterService.tpoReviewDrive(user.tenantId, user.id, getParam(req.params.id), 'REJECTED', reason);
    return res.json({ success: true, message: 'Placement drive rejected / cancelled', data: rejected });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Shortlist Review
tpoApprovalRoutes.post('/shortlists/:id/review', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { decision, reason } = req.body;
    if (!decision || !reason) {
      return res.status(400).json({ success: false, error: 'decision (APPROVED|REJECTED) and reason are required' });
    }

    const reviewed = await recruiterService.tpoReviewShortlist(user.tenantId, user.id, getParam(req.params.id), {
      decision,
      reason
    });

    return res.json({ success: true, message: `Shortlist recommendation ${decision.toLowerCase()}`, data: reviewed });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Offer Review
tpoApprovalRoutes.post('/offers/:id/review', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { decision, reason } = req.body;
    if (!decision || !reason) {
      return res.status(400).json({ success: false, error: 'decision (APPROVED|REJECTED) and reason are required' });
    }

    const reviewed = await recruiterService.tpoReviewOffer(user.tenantId, user.id, getParam(req.params.id), {
      decision,
      reason
    });

    // If approved, release offer
    if (decision === 'APPROVED') {
      await recruiterService.releaseOffer(user.tenantId, user.id, getParam(req.params.id));
    }

    return res.json({
      success: true,
      message: `Offer ${decision === 'APPROVED' ? 'approved and released to student' : 'rejected'}`,
      data: reviewed
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
