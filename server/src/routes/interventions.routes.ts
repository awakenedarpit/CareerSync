/**
 * CarrerSync Phase 17 — Training Interventions REST API Routes
 *
 * Endpoints:
 * 1. GET   /api/v1/tpo/interventions
 * 2. POST  /api/v1/tpo/interventions
 * 3. GET   /api/v1/tpo/interventions/:id
 * 4. PATCH /api/v1/tpo/interventions/:id
 *
 * Security: requireAuth, tenantMiddleware, requireTpoAuthority
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import { cohortSkillIntelligenceService } from '../institutional';

function requireTpoAuthority(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Training interventions management requires TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }
  return next();
}

export const interventionsRoutes = Router();

interventionsRoutes.use(requireAuth);
interventionsRoutes.use(tenantMiddleware);
interventionsRoutes.use(requireTpoAuthority);

// 1. GET /api/v1/tpo/interventions
interventionsRoutes.get('/', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { status } = req.query;
    const interventions = cohortSkillIntelligenceService.listInterventions(tenantId, status as string);

    return res.json({ success: true, data: interventions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to list interventions' });
  }
});

// 2. POST /api/v1/tpo/interventions
interventionsRoutes.post('/', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { title, description, targetSkill, targetDepartment, targetBatch, startDate, endDate, actionPlan } = req.body;

    if (!title || !targetSkill || !targetDepartment || !targetBatch || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, targetSkill, targetDepartment, targetBatch, startDate, endDate'
      });
    }

    const intervention = cohortSkillIntelligenceService.createIntervention(tenantId, req.user!.id, {
      title,
      description: description || '',
      targetSkill,
      targetDepartment,
      targetBatch: Number(targetBatch),
      startDate,
      endDate,
      actionPlan: actionPlan || ''
    });

    return res.status(201).json({ success: true, data: intervention });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create intervention' });
  }
});

// 3. GET /api/v1/tpo/interventions/:id
interventionsRoutes.get('/:id', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const interventionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const intervention = cohortSkillIntelligenceService.getInterventionById(tenantId, interventionId);
    if (!intervention) {
      return res.status(404).json({ success: false, error: `Intervention ${interventionId} not found` });
    }

    return res.json({ success: true, data: intervention });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve intervention' });
  }
});

// 4. PATCH /api/v1/tpo/interventions/:id
interventionsRoutes.patch('/:id', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const interventionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = cohortSkillIntelligenceService.updateIntervention(
      tenantId,
      interventionId,
      req.user!.id,
      req.body
    );

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to update intervention' });
  }
});

// Sub-route: POST /api/v1/tpo/interventions/:id/participants (submit project evidence)
interventionsRoutes.post('/:id/participants', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { studentId, rollNumber, department, projectEvidenceUrl, projectEvidenceDescription } = req.body;
    if (!studentId || !rollNumber || !projectEvidenceUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required participant evidence fields: studentId, rollNumber, projectEvidenceUrl'
      });
    }

    const interventionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = cohortSkillIntelligenceService.submitParticipantEvidence(tenantId, interventionId, {
      studentId,
      rollNumber,
      department: department || 'Engineering',
      projectEvidenceUrl,
      projectEvidenceDescription: projectEvidenceDescription || ''
    });

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err?.message?.includes('not found') ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to record participant evidence' });
  }
});

// Sub-route: POST /api/v1/tpo/interventions/:id/verify (TPO verifies mastery)
interventionsRoutes.post('/:id/verify', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { studentId, verified } = req.body;
    if (!studentId || typeof verified !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentId, verified (boolean)'
      });
    }

    const interventionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = cohortSkillIntelligenceService.verifyParticipantEvidence(
      tenantId,
      interventionId,
      studentId,
      req.user!.id,
      verified
    );

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const isPolicy = err?.message?.includes('Policy violation');
    const isNotFound = err?.message?.includes('not found');
    const status = isPolicy ? 422 : isNotFound ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to verify evidence' });
  }
});
