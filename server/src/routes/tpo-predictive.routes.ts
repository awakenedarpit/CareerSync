/**
 * CarrerSync Phase 14 — Predictive Placement Analytics TPO REST API Routes
 *
 * Implements endpoints for:
 * 1. Placement Readiness Multi-Dimensional Synthesis
 * 2. Statistical Prediction Engine & Validation Metrics
 * 3. Diagnostic Student Support & Review Workflow
 * 4. Cohort & Departmental Analytics with Small-Group Suppression (N < 5)
 * 5. Phase 12 Mock Drive Intelligence & Progression
 * 6. Longitudinal Skill Improvement Tracking
 * 7. Historical Placement Trends & Corporate Recruiter Engagement
 * 8. Interpretable Placement Forecasting Engine
 * 9. Audit-Oriented Fairness Monitoring System (Zero Sensitive Attributes)
 * 10. Institutional TPO Interventions & Automated Reports
 *
 * Guards all routes with requireAuth, tenantMiddleware, and requireTpoAuthority.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';

import {
  readinessAnalyticsService,
  predictionEngineService,
  studentSupportService,
  cohortBatchAnalyticsService,
  mockDriveAnalyticsService,
  skillImprovementService,
  placementTrendsService,
  recruiterAnalyticsService,
  placementForecastingService,
  fairnessMonitoringService,
  tpoInterventionService,
  placementReportService,
  PredictionTarget,
  ReadinessTier,
  SupportCategory,
  InterventionStatus,
  ForecastMethod
} from '../analytics';

export const tpoPredictiveRoutes = Router();

tpoPredictiveRoutes.use(requireAuth);
tpoPredictiveRoutes.use(tenantMiddleware);

/**
 * Institutional Reviewer Authority check (TPO_ADMIN, COLLEGE_ADMIN, SUPER_ADMIN).
 * Denies access with 403 Forbidden to recruiters, students, and unauthorized users.
 */
export function requireTpoAuthority(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required before accessing predictive analytics',
      code: 'UNAUTHENTICATED'
    });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Predictive placement analytics requires TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }

  next();
}

tpoPredictiveRoutes.use(requireTpoAuthority);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ---------------------------------------------------------------------------
// 1. High-Level Predictive Analytics Overview
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/overview
 */
tpoPredictiveRoutes.get('/overview', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const readinessOverview = readinessAnalyticsService.getReadinessOverview(tenantId);
    const recruiterOverview = recruiterAnalyticsService.getRecruiterOverview(tenantId);
    const activeForecast = placementForecastingService.getForecastOverview(tenantId);
    const fairnessAudit = fairnessMonitoringService.runFairnessAudit(tenantId);
    const activeInterventions = tpoInterventionService.listInterventions(tenantId);

    return res.json({
      success: true,
      overview: {
        tenantId,
        readiness: readinessOverview,
        recruiterPipeline: recruiterOverview.pipelineSummary,
        forecast: activeForecast,
        fairness: {
          status: fairnessAudit.fairnessStatus,
          disparateImpactRatio: fairnessAudit.disparateImpactRatio,
          zeroSensitiveAttributesVerified: fairnessAudit.zeroSensitiveAttributesVerified
        },
        activeInterventionsCount: activeInterventions.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 2. Student Placement Readiness Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/readiness
 */
tpoPredictiveRoutes.get('/readiness', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const department = getParam(req.query.department as any);
    const batchYear = getParam(req.query.batchYear as any);
    const readinessTier = getParam(req.query.readinessTier as any) as ReadinessTier;
    const targetRole = getParam(req.query.targetRole as any);
    const minCoverage = req.query.minCoverage ? parseInt(String(req.query.minCoverage), 10) : undefined;

    const filters = {
      department: department || undefined,
      batchYear: batchYear || undefined,
      readinessTier: readinessTier || undefined,
      targetRole: targetRole || undefined,
      minCoverage
    };

    const overview = readinessAnalyticsService.getReadinessOverview(tenantId, filters);
    const students = readinessAnalyticsService.listStudentReadiness(tenantId, filters);

    return res.json({
      success: true,
      overview,
      students
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/tpo/predictive-analytics/readiness/:studentId
 */
tpoPredictiveRoutes.get('/readiness/:studentId', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const studentId = req.params.studentId as string;

    const readiness = readinessAnalyticsService.getStudentReadiness(studentId, tenantId);
    if (!readiness) {
      return res.status(404).json({
        success: false,
        error: `Student readiness record not found for studentId: ${studentId}`,
        code: 'STUDENT_READINESS_NOT_FOUND'
      });
    }

    return res.json({ success: true, readiness });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 3. Statistical Predictions Routes
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/tpo/predictive-analytics/predictions/run
 */
tpoPredictiveRoutes.post('/predictions/run', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const target = (req.body.target as PredictionTarget) || 'PLACEMENT_OFFER';
    const department = req.body.department as string | undefined;
    const batchYear = req.body.batchYear as string | undefined;

    const result = predictionEngineService.runBatchPredictions({
      tenantId,
      target,
      department,
      batchYear
    });

    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/tpo/predictive-analytics/predictions
 */
tpoPredictiveRoutes.get('/predictions', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const department = getParam(req.query.department as any);
    const batchYear = getParam(req.query.batchYear as any);
    const target = (getParam(req.query.target as any) as PredictionTarget) || 'PLACEMENT_OFFER';

    const predictions = predictionEngineService.listPredictions(tenantId, {
      department: department || undefined,
      batchYear: batchYear || undefined
    });
    const validationMetrics = predictionEngineService.getValidationMetrics(target);

    return res.json({
      success: true,
      validationMetrics,
      predictions
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/tpo/predictive-analytics/predictions/:id
 */
tpoPredictiveRoutes.get('/predictions/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const prediction = predictionEngineService.getPredictionById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: `Prediction record not found for id: ${id}`,
        code: 'PREDICTION_NOT_FOUND'
      });
    }

    return res.json({ success: true, prediction });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 4. Diagnostic Student Support & Review Workflow
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/student-support
 */
tpoPredictiveRoutes.get('/student-support', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const department = getParam(req.query.department as any);
    const batchYear = getParam(req.query.batchYear as any);
    const supportCategory = getParam(req.query.supportCategory as any) as SupportCategory;
    const interventionStatus = getParam(req.query.interventionStatus as any) as InterventionStatus;

    const supportItems = studentSupportService.listSupportItems(tenantId, {
      department: department || undefined,
      batchYear: batchYear || undefined,
      supportCategory: supportCategory || undefined,
      interventionStatus: interventionStatus || undefined
    });

    return res.json({ success: true, supportItems });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/tpo/predictive-analytics/student-support/:id/review
 */
tpoPredictiveRoutes.post('/student-support/:id/review', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const id = req.params.id as string;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: status is required to review support item',
        code: 'MISSING_STATUS'
      });
    }

    const updated = studentSupportService.reviewSupportItem(id, {
      status,
      reviewerId: user.email || user.id,
      notes
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Support item not found for id: ${id}`,
        code: 'SUPPORT_ITEM_NOT_FOUND'
      });
    }

    return res.json({ success: true, supportItem: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 5. Cohort, Batch & Departmental Analytics
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/batches
 */
tpoPredictiveRoutes.get('/batches', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const department = getParam(req.query.department as any);

    const batches = cohortBatchAnalyticsService.getBatchComparison(
      tenantId,
      department || undefined
    );
    const yoyTrends = cohortBatchAnalyticsService.getYoyTrends(tenantId);

    return res.json({
      success: true,
      batches,
      yoyTrends
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/tpo/predictive-analytics/departments
 */
tpoPredictiveRoutes.get('/departments', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const batchYear = getParam(req.query.batchYear as any) || '2026';

    const departments = cohortBatchAnalyticsService.listAllDepartmentSummaries(
      tenantId,
      batchYear
    );

    return res.json({ success: true, departments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 6. Phase 12 Mock Drive Analytics
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/mock-drives
 */
tpoPredictiveRoutes.get('/mock-drives', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const mockDrives = mockDriveAnalyticsService.getMockDriveAnalytics(tenantId);
    return res.json({ success: true, mockDrives });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 7. Longitudinal Skill Improvement
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/skill-improvement
 */
tpoPredictiveRoutes.get('/skill-improvement', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const department = getParam(req.query.department as any);
    const batchYear = getParam(req.query.batchYear as any);

    const skillImprovement = skillImprovementService.getCohortSkillImprovement(
      tenantId,
      department || undefined,
      batchYear || undefined
    );

    return res.json({ success: true, skillImprovement });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 8. Historical Placement Trends & Recruiter Analytics
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/trends
 */
tpoPredictiveRoutes.get('/trends', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const trends = placementTrendsService.getHistoricalPlacementTrends(tenantId);
    return res.json({ success: true, trends });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/tpo/predictive-analytics/recruiters
 */
tpoPredictiveRoutes.get('/recruiters', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const overview = recruiterAnalyticsService.getRecruiterOverview(tenantId);
    const companies = recruiterAnalyticsService.listCompanyEngagementMetrics(tenantId);

    return res.json({
      success: true,
      ...overview,
      companies
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 9. Placement Forecasting Engine
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/tpo/predictive-analytics/forecasts/run
 */
tpoPredictiveRoutes.post('/forecasts/run', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const { targetPeriod, method, historicalData } = req.body;

    const forecast = placementForecastingService.generateForecast({
      tenantId,
      targetPeriod,
      method: method as ForecastMethod,
      historicalData
    });

    return res.json({ success: true, forecast });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/tpo/predictive-analytics/forecasts
 */
tpoPredictiveRoutes.get('/forecasts', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const forecast = placementForecastingService.getForecastOverview(tenantId);
    return res.json({ success: true, forecast });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 10. Audit-Oriented Fairness Monitoring
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/fairness
 */
tpoPredictiveRoutes.get('/fairness', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const fairness = fairnessMonitoringService.runFairnessAudit(tenantId);
    return res.json({ success: true, fairness });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 11. Institutional TPO Interventions
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/interventions
 */
tpoPredictiveRoutes.get('/interventions', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const status = getParam(req.query.status as any) as InterventionStatus;
    const priority = getParam(req.query.priority as any);
    const department = getParam(req.query.department as any);

    const interventions = tpoInterventionService.listInterventions(tenantId, {
      status: status || undefined,
      priority: priority || undefined,
      department: department || undefined
    });

    return res.json({ success: true, interventions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/tpo/predictive-analytics/interventions
 */
tpoPredictiveRoutes.post('/interventions', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const {
      title,
      reason,
      aggregateEvidence,
      targetCohort,
      objective,
      priority,
      estimatedImpact,
      suggestedActionPlan,
      assignedLead
    } = req.body;

    if (!title || !reason || !aggregateEvidence || !objective) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, reason, aggregateEvidence, and objective are mandatory',
        code: 'MISSING_INTERVENTION_FIELDS'
      });
    }

    const intervention = tpoInterventionService.createIntervention({
      tenantId,
      title,
      reason,
      aggregateEvidence,
      targetCohort: targetCohort || { studentCount: 0 },
      objective,
      priority: priority || 'MEDIUM',
      estimatedImpact: estimatedImpact || 'Projected placement performance elevation',
      suggestedActionPlan: suggestedActionPlan || [],
      assignedLead
    });

    return res.status(201).json({ success: true, intervention });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/v1/tpo/predictive-analytics/interventions/:id/status
 */
tpoPredictiveRoutes.patch('/interventions/:id/status', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const id = req.params.id as string;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing status in request body',
        code: 'MISSING_STATUS'
      });
    }

    const updated = tpoInterventionService.updateInterventionStatus(id, {
      status,
      reviewerId: user.email || user.id,
      notes
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Intervention not found for id: ${id}`,
        code: 'INTERVENTION_NOT_FOUND'
      });
    }

    return res.json({ success: true, intervention: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 12. Automated Placement Audit Reporting
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/tpo/predictive-analytics/reports
 */
tpoPredictiveRoutes.get('/reports', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const reports = placementReportService.listReports(tenantId);
    return res.json({ success: true, reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/tpo/predictive-analytics/reports/generate
 */
tpoPredictiveRoutes.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const { academicYear } = req.body;

    const report = placementReportService.generatePlacementReport(
      tenantId,
      academicYear || '2025-2026',
      user.email || user.id
    );

    return res.status(201).json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
