import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import { moderationService } from '../moderation/moderation.service';

export const moderationRoutes = Router();
export const tpoModerationRoutes = Router();

const getParam = (p: string | string[] | undefined): string =>
  Array.isArray(p) ? p[0] : p || '';

moderationRoutes.use(requireAuth);
moderationRoutes.use(tenantMiddleware);

tpoModerationRoutes.use(requireAuth);
tpoModerationRoutes.use(tenantMiddleware);

/**
 * POST /api/v1/moderation/reports
 * Any authenticated participant can submit an incident report
 */
moderationRoutes.post('/reports', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const reporterUserId = req.user!.id;
    const { reportedUserId, entityType, entityId, reason, description, evidenceJson } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: reportedUserId and reason are mandatory'
      });
    }

    const report = await moderationService.createReport(tenantId, reporterUserId, {
      reportedUserId,
      entityType: entityType || 'MENTORSHIP',
      entityId: entityId || 'entity-default',
      reason,
      description: description || '',
      evidenceJson
    });

    return res.status(201).json({
      success: true,
      data: report,
      message: 'Moderation incident report filed and queued for TPO review'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to submit moderation report'
    });
  }
});

/**
 * POST /api/v1/moderation/block
 * Block a participant directly
 */
moderationRoutes.post('/block', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const blockerUserId = req.user!.id;
    const { blockedUserId, reason } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing blockedUserId'
      });
    }

    const blockRecord = await moderationService.blockParticipant(
      tenantId,
      blockerUserId,
      blockedUserId,
      reason
    );

    return res.json({
      success: true,
      data: blockRecord,
      message: 'Participant blocked successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to block participant'
    });
  }
});

// ============================================================================
// TPO MODERATION REVIEW QUEUE & ACTIONS (/api/v1/tpo/moderation)
// ============================================================================

/**
 * GET /api/v1/tpo/moderation/reports
 * TPO review queue for conduct and incident reports
 * Accessible ONLY to authorized TPO / Admin personnel
 */
const handleGetTpoReports = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userRole = normalizeRole(req.user?.role);

    // Stop-Gate: Only TPO, College Admin, or Super Admin
    if (
      userRole !== 'TPO_ADMIN' &&
      userRole !== 'COLLEGE_ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Moderation reports are visible only to authorized institutional administrators',
        code: 'TPO_AUTHORITY_REQUIRED'
      });
    }

    const { status, entityType } = req.query;
    const reports = await moderationService.getTpoReportQueue(tenantId, {
      status: status as any,
      entityType: entityType as string
    });

    return res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch moderation queue'
    });
  }
};

tpoModerationRoutes.get('/reports', handleGetTpoReports);
moderationRoutes.get('/tpo/reports', handleGetTpoReports);

/**
 * PATCH /api/v1/tpo/moderation/reports/:id
 * Resolve or dismiss incident report with administrative enforcement action
 */
const handleResolveReport = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userRole = normalizeRole(req.user?.role);

    if (
      userRole !== 'TPO_ADMIN' &&
      userRole !== 'COLLEGE_ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authorized institutional administrators can resolve moderation reports',
        code: 'TPO_AUTHORITY_REQUIRED'
      });
    }

    const reportId = getParam(req.params.id);
    const reviewerUserId = req.user!.id;
    const { status, actionType, notes, actionDurationHours } = req.body;

    if (!status || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: status and actionType are mandatory'
      });
    }

    const result = await moderationService.resolveReport(tenantId, reportId, reviewerUserId, {
      status,
      actionType,
      notes,
      actionDurationHours: actionDurationHours ? parseInt(actionDurationHours, 10) : undefined
    });

    return res.json({
      success: true,
      data: result,
      message: `Report resolved with status ${status} and action ${actionType}`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to resolve moderation report'
    });
  }
};

tpoModerationRoutes.patch('/reports/:id', handleResolveReport);
moderationRoutes.patch('/tpo/reports/:id', handleResolveReport);
