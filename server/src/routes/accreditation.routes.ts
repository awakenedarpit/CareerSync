/**
 * CarrerSync Phase 17 — Accreditation Reporting & Traceability REST API Routes
 *
 * Endpoints:
 * 1. GET  /api/v1/tpo/accreditation/templates
 * 2. POST /api/v1/tpo/accreditation/reports/preview
 * 3. POST /api/v1/tpo/accreditation/reports/export
 * 4. GET  /api/v1/tpo/accreditation/reports/:id
 *
 * Security: requireAuth, tenantMiddleware, requireTpoAuthority
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import { accreditationReportingService } from '../institutional';

function requireTpoAuthority(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Accreditation reporting requires TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }
  return next();
}

export const accreditationRoutes = Router();

accreditationRoutes.use(requireAuth);
accreditationRoutes.use(tenantMiddleware);
accreditationRoutes.use(requireTpoAuthority);

// 1. GET /api/v1/tpo/accreditation/templates
accreditationRoutes.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = accreditationReportingService.listTemplates();
    return res.json({ success: true, data: templates });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to list templates' });
  }
});

// 2. POST /api/v1/tpo/accreditation/reports/preview
accreditationRoutes.post('/reports/preview', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { templateCode, filters } = req.body;
    if (!templateCode) {
      return res.status(400).json({ success: false, error: 'Missing required field: templateCode' });
    }

    const preview = accreditationReportingService.previewReport(tenantId, templateCode, filters || {});
    return res.json({ success: true, data: preview });
  } catch (err: any) {
    const isNotFound = err?.message?.includes('not recognized');
    const status = isNotFound ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to generate report preview' });
  }
});

// 3. POST /api/v1/tpo/accreditation/reports/export
accreditationRoutes.post('/reports/export', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { templateCode, filters, format } = req.body;
    if (!templateCode) {
      return res.status(400).json({ success: false, error: 'Missing required field: templateCode' });
    }

    const exported = accreditationReportingService.exportReport(
      tenantId,
      templateCode,
      filters || {},
      format || 'JSON',
      req.user!.id
    );

    return res.status(201).json({ success: true, data: exported });
  } catch (err: any) {
    const isNotFound = err?.message?.includes('not recognized');
    const status = isNotFound ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to export report' });
  }
});

// 4. GET /api/v1/tpo/accreditation/reports/:id
accreditationRoutes.get('/reports/:id', (req: Request, res: Response) => {
  try {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const tenantId = req.tenantId || req.user?.tenantId;
    const report = accreditationReportingService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, error: `Report ${reportId} not found` });
    }

    if (tenantId && report.tenantId && report.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cannot access reports belonging to another tenant',
        code: 'FORBIDDEN_TENANT_ACCESS'
      });
    }

    return res.json({ success: true, data: report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve report' });
  }
});
