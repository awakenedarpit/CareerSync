/**
 * CarrerSync Student Offer Response REST API Routes
 * Phase 11 — Placement Offer Acceptance & Student Interaction
 *
 * Implements endpoints for:
 * 1. GET  /api/v1/student/offers (list offers released to the authenticated student)
 * 2. POST /api/v1/student/offers/:id/respond (student records acceptance or decline)
 *
 * Enforces student-ownership verification, status validation, and offer history logging.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { recruiterService } from '../recruiter/recruiter.service';
import type { AuthUserContext } from '../types';

export const studentOfferRoutes = Router();

studentOfferRoutes.use(requireAuth);
studentOfferRoutes.use(tenantMiddleware);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// 1. Get offers released to current student
studentOfferRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const offers = await recruiterService.listOffers(user.tenantId, user.id);
    // Filter to only visible offers (RELEASED, ACCEPTED, DECLINED, EXPIRED)
    const visibleOffers = offers.filter(
      (o) => o.status === 'RELEASED' || o.status === 'ACCEPTED' || o.status === 'DECLINED' || o.status === 'EXPIRED'
    );
    return res.json({ success: true, count: visibleOffers.length, data: visibleOffers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Respond to offer
studentOfferRoutes.post('/:id/respond', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { decision, notes } = req.body;

    if (!decision || (decision !== 'ACCEPTED' && decision !== 'DECLINED')) {
      return res.status(400).json({ success: false, error: 'decision must be either ACCEPTED or DECLINED' });
    }

    const updated = await recruiterService.studentRespondToOffer(user.tenantId, user.id, getParam(req.params.id), {
      decision,
      notes
    });

    return res.json({
      success: true,
      message: `Offer successfully ${decision.toLowerCase()}`,
      data: updated
    });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
});
