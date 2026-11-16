/**
 * CarrerSync Phase 17 — Algorithmic Fairness Governance REST API Routes
 *
 * Endpoints:
 * 1. GET   /api/v1/tpo/fairness
 * 2. POST  /api/v1/tpo/fairness/reviews
 * 3. PATCH /api/v1/tpo/fairness/reviews/:id
 *
 * Security: requireAuth, tenantMiddleware, requireTpoAuthority
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import { fairnessGovernanceService } from '../institutional';

function requireTpoAuthority(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Fairness governance requires TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }
  return next();
}

export const fairnessRoutes = Router();

fairnessRoutes.use(requireAuth);
fairnessRoutes.use(tenantMiddleware);
fairnessRoutes.use(requireTpoAuthority);

// 1. GET /api/v1/tpo/fairness
fairnessRoutes.get('/', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { batchYear, department } = req.query;
    const filter = {
      batchYear: batchYear ? Number(batchYear) : undefined,
      department: department as string
    };

    const funnel = fairnessGovernanceService.getSelectionFunnel(tenantId, filter);
    const disparities = fairnessGovernanceService.evaluateDisparities(tenantId, filter);
    const cases = fairnessGovernanceService.listFairnessCases(tenantId);

    return res.json({
      success: true,
      data: {
        funnel,
        disparities: disparities.evaluations,
        fourFifthsSummary: {
          flaggedCount: disparities.flaggedCount,
          suppressedCount: disparities.suppressedCount,
          disclaimer: disparities.disclaimer
        },
        reviewCases: cases
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve fairness governance intelligence' });
  }
});

// 2. POST /api/v1/tpo/fairness/reviews
fairnessRoutes.post('/reviews', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const {
      metricName,
      affectedGroup,
      referenceGroup,
      groupSelectionRate,
      referenceGroupSelectionRate,
      disparityRatio,
      driveId,
      cohortId,
      reviewerNotes
    } = req.body;

    if (!metricName || !affectedGroup || !referenceGroup || groupSelectionRate === undefined || referenceGroupSelectionRate === undefined || disparityRatio === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required review fields: metricName, affectedGroup, referenceGroup, groupSelectionRate, referenceGroupSelectionRate, disparityRatio'
      });
    }

    const reviewCase = fairnessGovernanceService.createFairnessCase(tenantId, req.user!.id, {
      metricName,
      affectedGroup,
      referenceGroup,
      groupSelectionRate: Number(groupSelectionRate),
      referenceGroupSelectionRate: Number(referenceGroupSelectionRate),
      disparityRatio: Number(disparityRatio),
      driveId,
      cohortId,
      reviewerNotes
    });

    return res.status(201).json({ success: true, data: reviewCase });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create fairness review case' });
  }
});

// 3. PATCH /api/v1/tpo/fairness/reviews/:id
fairnessRoutes.patch('/reviews/:id', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const caseId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = fairnessGovernanceService.updateFairnessCase(
      tenantId,
      caseId,
      req.user!.id,
      req.body
    );

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to update fairness review case' });
  }
});
