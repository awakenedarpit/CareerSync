/**
 * CarrerSync Phase 13 — TPO Industry Intelligence & Cohort Analytics REST API Routes
 *
 * Endpoints for:
 * 1.  GET  /api/v1/tpo/industry-intelligence/overview
 * 2.  GET  /api/v1/tpo/industry-intelligence/skills
 * 3.  GET  /api/v1/tpo/industry-intelligence/trends
 * 4.  GET  /api/v1/tpo/industry-intelligence/roles
 * 5.  GET  /api/v1/tpo/job-descriptions
 * 6.  POST /api/v1/tpo/job-descriptions
 * 7.  POST /api/v1/tpo/job-descriptions/:id/analyze
 * 8.  POST /api/v1/tpo/job-descriptions/:id/review
 * 9.  GET  /api/v1/tpo/cohort-intelligence/overview
 * 10. GET  /api/v1/tpo/cohort-intelligence/skills
 * 11. GET  /api/v1/tpo/cohort-intelligence/gaps
 *
 * Strict institutional authority required (TPO_ADMIN, COLLEGE_ADMIN, SUPER_ADMIN).
 * RECRUITER and STUDENT receive 403 Forbidden.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import { industryIntelligenceService } from '../industry/industry-intelligence.service';
import { cohortIntelligenceService } from '../industry/cohort-intelligence.service';
import { SkillCategory } from '../industry/industry.types';

export const tpoIndustryRoutes = Router();

tpoIndustryRoutes.use(requireAuth);
tpoIndustryRoutes.use(tenantMiddleware);

// Middleware: Institutional Reviewer Authority check
function requireTpoAuthority(req: Request, res: Response, next: Function) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Industry and Cohort intelligence requires TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }

  next();
}

tpoIndustryRoutes.use(requireTpoAuthority);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ---------------------------------------------------------------------------
// Industry Demand & Emerging Trends Routes
// ---------------------------------------------------------------------------

/**
 * GET /industry-intelligence/overview
 */
tpoIndustryRoutes.get('/industry-intelligence/overview', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const overview = industryIntelligenceService.getIndustryOverview(tenantId);
    return res.json({ success: true, overview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /industry-intelligence/skills
 */
tpoIndustryRoutes.get('/industry-intelligence/skills', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const role = getParam(req.query.role as any);
    const category = getParam(req.query.category as any) as SkillCategory;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const skills = industryIntelligenceService.calculateDemandedSkills(tenantId, {
      role: role || undefined,
      category: category || undefined,
      limit
    });

    return res.json({ success: true, skills });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /industry-intelligence/trends
 */
tpoIndustryRoutes.get('/industry-intelligence/trends', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const category = getParam(req.query.category as any) as SkillCategory;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;

    const trends = industryIntelligenceService.calculateSkillTrends(tenantId, {
      category: category || undefined,
      limit
    });

    return res.json({ success: true, trends });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /industry-intelligence/roles
 */
tpoIndustryRoutes.get('/industry-intelligence/roles', async (req: Request, res: Response) => {
  try {
    const roles = industryIntelligenceService.getAllRoleTemplates();
    return res.json({ success: true, roles });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Job Description Collection & Management Routes
// ---------------------------------------------------------------------------

/**
 * GET /job-descriptions
 */
tpoIndustryRoutes.get('/job-descriptions', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const status = getParam(req.query.status as any) as any;
    const role = getParam(req.query.role as any);
    const company = getParam(req.query.company as any);
    const search = getParam(req.query.search as any);

    const jobDescriptions = industryIntelligenceService.listJobDescriptions(tenantId, {
      status: status || undefined,
      role: role || undefined,
      companyName: company || undefined,
      search: search || undefined
    });

    return res.json({ success: true, jobDescriptions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /job-descriptions
 */
tpoIndustryRoutes.post('/job-descriptions', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const {
      title,
      companyName,
      industryDomain,
      rawText,
      sourceProvenance = 'TPO_UPLOAD',
      autoAnalyze = true
    } = req.body || {};

    if (!title || !companyName || !rawText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, companyName, and rawText are mandatory'
      });
    }

    const { jd, isDuplicate } = await industryIntelligenceService.ingestJobDescription({
      tenantId,
      title,
      companyName,
      industryDomain,
      rawText,
      sourceProvenance,
      createdBy: user.id,
      autoAnalyze
    });

    return res.status(isDuplicate ? 200 : 201).json({
      success: true,
      isDuplicate,
      message: isDuplicate
        ? 'Duplicate job description detected; existing record returned'
        : 'Job description ingested and analyzed successfully',
      jobDescription: jd
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /job-descriptions/:id/analyze
 */
tpoIndustryRoutes.post('/job-descriptions/:id/analyze', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const jdId = getParam(req.params.id);

    const updated = await industryIntelligenceService.analyzeStoredJobDescription(jdId, tenantId);
    return res.json({
      success: true,
      message: 'Job description analyzed successfully',
      jobDescription: updated
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /job-descriptions/:id/review
 */
tpoIndustryRoutes.post('/job-descriptions/:id/review', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const jdId = getParam(req.params.id);

    const { correctedRole, addedSkills, removedSkills, notes } = req.body || {};

    const updated = industryIntelligenceService.reviewStoredJobDescription({
      id: jdId,
      tenantId,
      reviewedBy: user.id,
      reviewerName: user.email,
      correctedRole,
      addedSkills,
      removedSkills,
      notes
    });

    return res.json({
      success: true,
      message: 'Human review audit recorded and job description updated',
      jobDescription: updated
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Cohort Skill-Gap Analytics Routes
// ---------------------------------------------------------------------------

/**
 * GET /cohort-intelligence/overview
 */
tpoIndustryRoutes.get('/cohort-intelligence/overview', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const department = getParam(req.query.department as any);
    const batchYear = getParam(req.query.batchYear as any);

    const overview = cohortIntelligenceService.getCohortOverview({
      tenantId,
      department: department || undefined,
      batchYear: batchYear || undefined
    });

    return res.json({ success: true, cohortOverview: overview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /cohort-intelligence/skills
 */
tpoIndustryRoutes.get('/cohort-intelligence/skills', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const department = getParam(req.query.department as any);

    const skillCoverage = cohortIntelligenceService.getCohortSkillCoverage(
      tenantId,
      department || undefined
    );

    return res.json({ success: true, skillCoverage });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /cohort-intelligence/gaps
 */
tpoIndustryRoutes.get('/cohort-intelligence/gaps', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const department = getParam(req.query.department as any);

    const institutionalGaps = cohortIntelligenceService.getCohortInstitutionalGaps(
      tenantId,
      department || undefined
    );

    return res.json({ success: true, institutionalGaps });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
