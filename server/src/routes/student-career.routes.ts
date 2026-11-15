/**
 * CarrerSync Phase 13 — Student Career Intelligence, Recommendations & Skill-Gap Analysis Routes
 *
 * Endpoints for:
 * 1. GET   /api/v1/student/skill-gap
 * 2. GET   /api/v1/student/skill-gap/:roleId
 * 3. POST  /api/v1/student/skill-gap/recalculate
 * 4. GET   /api/v1/student/career-recommendations
 * 5. POST  /api/v1/student/career-recommendations/generate
 * 6. PATCH /api/v1/student/career-recommendations/:id
 * 7. GET   /api/v1/student/company-intelligence
 * 8. GET   /api/v1/student/company-intelligence/:companyId
 *
 * Adheres strictly to the platform policy:
 * - Deterministic, explainable scoring matching verified skills, evidence, and assessment scores.
 * - Non-coercive advisory recommendations with full student agency.
 * - Recruiter accounts receive 403 Forbidden.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import { studentSkillGapService } from '../industry/student-skill-gap.service';
import { careerRecommendationService } from '../industry/career-recommendation.service';

export const studentCareerRoutes = Router();

studentCareerRoutes.use(requireAuth);
studentCareerRoutes.use(tenantMiddleware);

// Middleware: Student access check
function requireStudentOrAdmin(req: Request, res: Response, next: Function) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role === 'RECRUITER') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Recruiter accounts cannot access student career pathways',
      code: 'FORBIDDEN_ROLE'
    });
  }

  next();
}

studentCareerRoutes.use(requireStudentOrAdmin);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ---------------------------------------------------------------------------
// Student Skill-Gap Diagnostic Routes
// ---------------------------------------------------------------------------

/**
 * Common handler for retrieving student skill gap diagnosis.
 */
const getSkillGapHandler = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const roleId = getParam(req.params.roleId) || getParam(req.query.roleId as any) || getParam(req.query.role as any);

    const report = await studentSkillGapService.diagnoseStudentSkillGap({
      studentId: user.id,
      tenantId,
      roleIdOrName: roleId || undefined
    });

    return res.json({ success: true, skillGap: report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

studentCareerRoutes.get('/skill-gap', getSkillGapHandler);
studentCareerRoutes.get('/skill-gap/:roleId', getSkillGapHandler);

/**
 * POST /skill-gap/recalculate
 */
studentCareerRoutes.post('/skill-gap/recalculate', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const { roleId, targetRole } = req.body || {};

    const report = await studentSkillGapService.diagnoseStudentSkillGap({
      studentId: user.id,
      tenantId,
      roleIdOrName: roleId || targetRole || undefined
    });

    return res.json({
      success: true,
      message: 'Student skill-gap diagnosis recalculated successfully',
      skillGap: report
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Career Recommendations Routes
// ---------------------------------------------------------------------------

/**
 * GET /career-recommendations
 */
studentCareerRoutes.get('/career-recommendations', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const recommendations = await careerRecommendationService.getRecommendations(
      user.id,
      tenantId
    );

    return res.json({ success: true, recommendations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /career-recommendations/generate
 */
studentCareerRoutes.post('/career-recommendations/generate', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const recommendations = await careerRecommendationService.generateRecommendations(
      user.id,
      tenantId
    );

    return res.status(201).json({
      success: true,
      message: 'Explainable career recommendations synthesized across 14 standard placement roles',
      recommendations
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /career-recommendations/:id
 */
studentCareerRoutes.patch('/career-recommendations/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const id = getParam(req.params.id);
    const { status } = req.body || {};

    if (!status || !['ACTIVE', 'SAVED', 'DISMISSED', 'PRIMARY_GOAL'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of ACTIVE, SAVED, DISMISSED, PRIMARY_GOAL'
      });
    }

    const updated = careerRecommendationService.updateRecommendationStatus({
      id,
      studentId: user.id,
      status
    });

    return res.json({
      success: true,
      message: `Career recommendation marked as ${status}`,
      recommendation: updated
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Company-Specific Skill Intelligence Routes
// ---------------------------------------------------------------------------

/**
 * GET /company-intelligence
 */
studentCareerRoutes.get('/company-intelligence', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const companies = studentSkillGapService.listCompaniesWithIntelligence(tenantId);
    return res.json({ success: true, companies });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /company-intelligence/:companyId
 */
studentCareerRoutes.get('/company-intelligence/:companyId', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const companyId = getParam(req.params.companyId);

    const intel = await studentSkillGapService.getCompanySkillIntelligence({
      companyNameOrId: companyId,
      studentId: user.id,
      tenantId
    });

    return res.json({ success: true, companyIntelligence: intel });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
