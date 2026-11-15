/**
 * CarrerSync Phase 12 — Student Personalized Learning Intelligence Routes
 *
 * Endpoints for:
 * 1. GET   /api/v1/student/learning-path
 * 2. POST  /api/v1/student/learning-path/generate
 * 3. PATCH /api/v1/student/learning-path/tasks/:taskId/status
 * 4. POST  /api/v1/student/learning-path/tasks/:taskId/submit
 *
 * Adheres strictly to the platform policy:
 * Learning task completion does NOT automatically grant VERIFIED skill status;
 * authorized TPO/faculty retain verification authority.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { learningPathService } from '../assessment/learning-path.service';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';

export const studentLearningRoutes = Router();

studentLearningRoutes.use(requireAuth);
studentLearningRoutes.use(tenantMiddleware);

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
      error: 'Forbidden: Recruiter accounts cannot access student learning pathways',
      code: 'FORBIDDEN_ROLE'
    });
  }

  next();
}

studentLearningRoutes.use(requireStudentOrAdmin);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

/**
 * GET / or /learning-path
 * Retrieves current personalized learning pathway for student.
 */
const getLearningPathHandler = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const path = await learningPathService.getLearningPath(user.id, tenantId);
    return res.json({ success: true, learningPath: path });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

studentLearningRoutes.get('/', getLearningPathHandler);
studentLearningRoutes.get('/learning-path', getLearningPathHandler);

/**
 * POST /generate or /learning-path/generate
 * Triggers re-generation of personalized learning path based on latest assessment weaknesses.
 */
const generatePathHandler = async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const { targetRole = 'Software Engineer' } = req.body || {};

    const path = await learningPathService.generatePersonalizedPath({
      studentId: user.id,
      tenantId,
      targetRole
    });

    return res.status(201).json({
      success: true,
      message: 'Personalized learning pathway synthesized from latest assessment analytics',
      learningPath: path
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

studentLearningRoutes.post('/generate', generatePathHandler);
studentLearningRoutes.post('/learning-path/generate', generatePathHandler);

/**
 * PATCH /tasks/:taskId/status or /learning-path/tasks/:taskId/status
 * Updates learning task status (RECOMMENDED -> IN_PROGRESS -> PAUSED).
 */
const updateTaskStatusHandler = (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const taskId = getParam(req.params.taskId);
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const task = learningPathService.updateTaskStatus({
      studentId: user.id,
      tenantId,
      taskId,
      status
    });

    return res.json({
      success: true,
      message: `Task status updated to ${status}`,
      task
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

studentLearningRoutes.patch('/tasks/:taskId/status', updateTaskStatusHandler);
studentLearningRoutes.patch('/learning-path/tasks/:taskId/status', updateTaskStatusHandler);

/**
 * POST /tasks/:taskId/submit or /learning-path/tasks/:taskId/submit
 * Submits evidence for review (Repository link, documentation, code, certificate).
 * Enforces policy: Task status becomes SUBMITTED_FOR_REVIEW; NEVER auto-VERIFIED!
 */
const submitTaskEvidenceHandler = (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const taskId = getParam(req.params.taskId);
    const { submissionType, urlOrContent, notes } = req.body || {};

    if (!submissionType || !urlOrContent) {
      return res.status(400).json({
        success: false,
        error: 'submissionType (REPOSITORY, DOCUMENTATION, CODE, CERTIFICATE) and urlOrContent are required'
      });
    }

    const task = learningPathService.submitTaskEvidence({
      studentId: user.id,
      tenantId,
      taskId,
      submissionType,
      urlOrContent,
      notes
    });

    return res.json({
      success: true,
      message: 'Learning task evidence submitted for review. Verification authority remains with authorized faculty/TPO.',
      task
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

studentLearningRoutes.post('/tasks/:taskId/submit', submitTaskEvidenceHandler);
studentLearningRoutes.post('/learning-path/tasks/:taskId/submit', submitTaskEvidenceHandler);
