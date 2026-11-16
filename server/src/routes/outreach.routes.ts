/**
 * CarrerSync Phase 17 — Recruiter Outreach & ₹0 Cardless Campaign REST API Routes
 *
 * Endpoints:
 * 1. GET  /api/v1/tpo/outreach/campaigns
 * 2. POST /api/v1/tpo/outreach/campaigns
 * 3. POST /api/v1/tpo/outreach/campaigns/:id/preview
 * 4. POST /api/v1/tpo/outreach/campaigns/:id/approve
 * 5. POST /api/v1/tpo/outreach/campaigns/:id/send
 *
 * Additional Fallback & Directory Endpoints:
 * - GET  /api/v1/tpo/outreach/campaigns/:id/export (CSV export fallback)
 * - GET  /api/v1/tpo/outreach/contacts
 * - POST /api/v1/tpo/outreach/contacts
 *
 * Security: requireAuth, tenantMiddleware, requireTpoAuthority
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';
import { recruiterOutreachService, OutreachCampaignStatus } from '../institutional';

function requireTpoAuthority(req: Request, res: Response, next: NextFunction) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Recruiter outreach campaigns require TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }
  return next();
}

export const outreachRoutes = Router();

outreachRoutes.use(requireAuth);
outreachRoutes.use(tenantMiddleware);
outreachRoutes.use(requireTpoAuthority);

// 1. GET /api/v1/tpo/outreach/campaigns
outreachRoutes.get('/campaigns', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { status } = req.query;
    const campaigns = recruiterOutreachService.listCampaigns(tenantId, status as OutreachCampaignStatus);

    return res.json({ success: true, data: campaigns });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to list outreach campaigns' });
  }
});

// 2. POST /api/v1/tpo/outreach/campaigns
outreachRoutes.post('/campaigns', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { title, subject, bodyTemplate, targetAudience } = req.body;
    if (!title || !subject || !bodyTemplate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required campaign fields: title, subject, bodyTemplate'
      });
    }

    const campaign = recruiterOutreachService.createCampaign(tenantId, req.user!.id, {
      title,
      subject,
      bodyTemplate,
      targetAudience
    });

    return res.status(201).json({ success: true, data: campaign });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create campaign' });
  }
});

// 3. POST /api/v1/tpo/outreach/campaigns/:id/preview
outreachRoutes.post('/campaigns/:id/preview', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const campaignId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const preview = recruiterOutreachService.previewCampaign(tenantId, campaignId);
    return res.json({ success: true, data: preview });
  } catch (err: any) {
    const isNotFound = err?.message?.includes('not found');
    const status = isNotFound ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to generate campaign preview' });
  }
});

// 4. POST /api/v1/tpo/outreach/campaigns/:id/approve
outreachRoutes.post('/campaigns/:id/approve', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const campaignId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { notes } = req.body;
    const approved = recruiterOutreachService.approveCampaign(
      tenantId,
      campaignId,
      req.user!.id,
      notes || 'Human TPO approval confirmed for campaign dispatch.'
    );

    return res.json({ success: true, data: approved });
  } catch (err: any) {
    const isNotFound = err?.message?.includes('not found');
    const status = isNotFound ? 404 : 400;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to approve campaign' });
  }
});

// 5. POST /api/v1/tpo/outreach/campaigns/:id/send
outreachRoutes.post('/campaigns/:id/send', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const campaignId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = recruiterOutreachService.sendCampaign(tenantId, campaignId, req.user!.id);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    const isApprovalErr = err?.message?.includes('CAMPAIGN_NOT_APPROVED');
    const isNotFound = err?.message?.includes('not found');
    const status = isApprovalErr ? 422 : isNotFound ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to send campaign' });
  }
});

// Fallback CSV Export: GET /api/v1/tpo/outreach/campaigns/:id/export
outreachRoutes.get('/campaigns/:id/export', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const campaignId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const csvData = recruiterOutreachService.generateCampaignCsvExport(tenantId, campaignId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=campaign_${campaignId}.csv`);
    return res.send(csvData);
  } catch (err: any) {
    const isNotFound = err?.message?.includes('not found');
    const status = isNotFound ? 404 : 500;
    return res.status(status).json({ success: false, error: err?.message || 'Failed to export campaign CSV' });
  }
});

// Directory: GET /api/v1/tpo/outreach/contacts
outreachRoutes.get('/contacts', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { industry, verifiedOnly } = req.query;
    const contacts = recruiterOutreachService.listContacts(tenantId, {
      industry: industry as string,
      verifiedOnly: verifiedOnly === 'true'
    });

    return res.json({ success: true, data: contacts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to list contacts' });
  }
});

// Directory: POST /api/v1/tpo/outreach/contacts
outreachRoutes.post('/contacts', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context missing' });
    }

    const { companyName, contactName, email, designation, industry, phone } = req.body;
    if (!companyName || !contactName || !email || !designation || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required contact fields: companyName, contactName, email, designation, industry'
      });
    }

    const contact = recruiterOutreachService.addContact(tenantId, {
      companyName,
      contactName,
      email,
      phone,
      designation,
      industry,
      verificationStatus: 'VERIFIED',
      isUnsubscribed: false,
      pastDriveCount: 0
    });

    return res.status(201).json({ success: true, data: contact });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to add contact' });
  }
});
