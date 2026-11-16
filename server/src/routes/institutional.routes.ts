/**
 * CarrerSync Phase 17 — Institutional Intelligence REST API Routes
 *
 * Endpoints:
 * 1. GET /api/v1/tpo/institutional/overview
 * 2. GET /api/v1/tpo/institutional/cohort
 * 3. GET /api/v1/tpo/institutional/skills
 * 4. GET /api/v1/tpo/institutional/placements
 * 5. GET /api/v1/tpo/institutional/recruiters
 * 6. GET /api/v1/college-admin/institutional/overview
 *
 * Security: requireAuth, tenantMiddleware, requireTpoAuthority / requireRole(['college_admin', 'superadmin'])
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import {
  institutionalKpiService,
  cohortSkillIntelligenceService,
  fairnessGovernanceService,
  recruiterOutreachService,
  HeatmapType
} from '../institutional';

export function requireTpoAuthority(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Institutional intelligence requires TPO_ADMIN, COLLEGE_ADMIN, or SUPER_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }
  return next();
}

// ---------------------------------------------------------------------------
// TPO Institutional Router
// Mounted at /api/v1/tpo/institutional
// ---------------------------------------------------------------------------
export const institutionalRoutes = Router();

institutionalRoutes.use(requireAuth);
institutionalRoutes.use(tenantMiddleware);
institutionalRoutes.use(requireTpoAuthority);

// 1. GET /api/v1/tpo/institutional/overview
institutionalRoutes.get('/overview', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { academicYear, batchYear, department, startDate, endDate } = req.query;
    const overview = institutionalKpiService.getInstitutionalOverview(tenantId, {
      academicYear: academicYear as string,
      batchYear: batchYear ? Number(batchYear) : undefined,
      department: department as string,
      startDate: startDate as string,
      endDate: endDate as string
    });

    return res.json({ success: true, data: overview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to compute institutional overview' });
  }
});

// 2. GET /api/v1/tpo/institutional/cohort
institutionalRoutes.get('/cohort', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { department, batchYear } = req.query;
    const supportProfiles = cohortSkillIntelligenceService.getStudentSupportOverview(tenantId, {
      department: department as string,
      batchYear: batchYear ? Number(batchYear) : undefined
    });

    return res.json({ success: true, data: supportProfiles });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch cohort support intelligence' });
  }
});

// 3. GET /api/v1/tpo/institutional/skills
institutionalRoutes.get('/skills', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const heatmapType = (req.query.type as HeatmapType) || 'department_vs_skill';
    const { department, batchYear } = req.query;

    const heatmap = cohortSkillIntelligenceService.generateHeatmap(tenantId, heatmapType, {
      department: department as string,
      batchYear: batchYear ? Number(batchYear) : undefined
    });

    return res.json({ success: true, data: heatmap });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to generate cohort skill heatmap' });
  }
});

// 4. GET /api/v1/tpo/institutional/placements
institutionalRoutes.get('/placements', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { batchYear, department } = req.query;
    const overview = institutionalKpiService.getInstitutionalOverview(tenantId, {
      batchYear: batchYear ? Number(batchYear) : undefined,
      department: department as string
    });
    const funnel = fairnessGovernanceService.getSelectionFunnel(tenantId, {
      batchYear: batchYear ? Number(batchYear) : undefined,
      department: department as string
    });

    return res.json({
      success: true,
      data: {
        placementRate: overview.placementRate,
        departmentBreakdown: overview.departmentBreakdown,
        shortlistToOfferRatio: overview.shortlistToOfferRatio,
        funnel
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch placement intelligence' });
  }
});

// 5. GET /api/v1/tpo/institutional/recruiters
institutionalRoutes.get('/recruiters', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const overview = institutionalKpiService.getInstitutionalOverview(tenantId, req.query);
    const contacts = recruiterOutreachService.listContacts(tenantId);

    return res.json({
      success: true,
      data: {
        recruiterEngagement: overview.recruiterEngagement,
        timeToShortlist: overview.timeToShortlist,
        contactsCount: contacts.length,
        contactsSample: contacts.slice(0, 5)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch recruiter engagement intelligence' });
  }
});

// ---------------------------------------------------------------------------
// College Admin Institutional Router
// Mounted at /api/v1/college-admin/institutional
// ---------------------------------------------------------------------------
export const collegeAdminInstitutionalRoutes = Router();

collegeAdminInstitutionalRoutes.use(requireAuth);
collegeAdminInstitutionalRoutes.use(tenantMiddleware);
collegeAdminInstitutionalRoutes.use(requireRole(['college_admin', 'superadmin']));

// 6. GET /api/v1/college-admin/institutional/overview
collegeAdminInstitutionalRoutes.get('/overview', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { academicYear, batchYear, department } = req.query;
    const overview = institutionalKpiService.getInstitutionalOverview(tenantId, {
      academicYear: academicYear as string,
      batchYear: batchYear ? Number(batchYear) : undefined,
      department: department as string
    });

    return res.json({ success: true, data: overview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch college admin overview' });
  }
});
