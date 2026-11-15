import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { normalizeRole } from '../utils/roles';
import { alumniService } from '../alumni/alumni.service';

export const alumniRoutes = Router();
export const mentorshipRoutes = Router();
export const tpoAlumniRoutes = Router();

const getParam = (p: string | string[] | undefined): string =>
  Array.isArray(p) ? p[0] : p || '';

// Apply auth & tenant isolation to all routers
alumniRoutes.use(requireAuth);
alumniRoutes.use(tenantMiddleware);

mentorshipRoutes.use(requireAuth);
mentorshipRoutes.use(tenantMiddleware);

tpoAlumniRoutes.use(requireAuth);
tpoAlumniRoutes.use(tenantMiddleware);

// ============================================================================
// ALUMNI ROUTES (/api/v1/alumni)
// ============================================================================

/**
 * GET /api/v1/alumni
 * Search verified mentors with multi-faceted filtering & explainable recommendations
 * Privacy: Zero exposure of personal email or phone numbers to students.
 */
alumniRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const {
      industry,
      role,
      domain,
      graduationYear,
      skills,
      mentorshipTopic,
      language,
      availability,
      studentInterests,
      studentTargetRole,
      studentDepartment
    } = req.query;

    const parsedSkills = typeof skills === 'string'
      ? skills.split(',').map((s) => s.trim())
      : Array.isArray(skills)
      ? (skills as string[])
      : undefined;

    const parsedInterests = typeof studentInterests === 'string'
      ? studentInterests.split(',').map((s) => s.trim())
      : Array.isArray(studentInterests)
      ? (studentInterests as string[])
      : undefined;

    const mentors = await alumniService.discoverMentors(tenantId, {
      industry: industry as string,
      role: role as string,
      domain: domain as string,
      graduationYear: graduationYear ? parseInt(graduationYear as string, 10) : undefined,
      skills: parsedSkills,
      mentorshipTopic: mentorshipTopic as string,
      language: language as string,
      availability: availability === 'true',
      studentInterests: parsedInterests,
      studentTargetRole: studentTargetRole as string,
      studentDepartment: studentDepartment as string
    });

    return res.json({
      success: true,
      data: mentors,
      count: mentors.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to search mentor directory'
    });
  }
});

/**
 * GET /api/v1/alumni/requests
 * Alumni views incoming mentorship requests
 */
alumniRoutes.get('/requests', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = req.user!.id;

    const requests = await alumniService.getMentorRequests(tenantId, userId);
    return res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch incoming mentorship requests'
    });
  }
});

/**
 * GET /api/v1/alumni/profile
 * Get current authenticated user's alumni profile
 */
alumniRoutes.get('/profile', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = req.user!.id;

    const profile = await alumniService.getProfileByUserId(tenantId, userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Alumni profile not found'
      });
    }

    return res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch profile'
    });
  }
});

/**
 * POST /api/v1/alumni/profile
 * PATCH /api/v1/alumni/profile
 * Create or update alumni profile
 */
const handleProfileSave = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = req.user!.id;

    const profile = await alumniService.createOrUpdateProfile(tenantId, userId, req.body);
    return res.json({
      success: true,
      data: profile,
      message: 'Alumni profile saved successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to save alumni profile'
    });
  }
};

alumniRoutes.post('/profile', handleProfileSave);
alumniRoutes.patch('/profile', handleProfileSave);

/**
 * GET /api/v1/alumni/:id
 * Get mentor profile details by ID
 */
alumniRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const profileId = getParam(req.params.id);

    const profile = await alumniService.getProfileById(tenantId, profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Alumni profile not found'
      });
    }

    // Sanitize contact email/phone for students
    const userRole = normalizeRole(req.user?.role);
    const sanitized = userRole === 'STUDENT'
      ? { ...profile, email: undefined, phone: undefined }
      : profile;

    return res.json({
      success: true,
      data: sanitized
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch alumni profile'
    });
  }
});

/**
 * POST /api/v1/alumni/:id/verify
 * TPO-only verification workflow
 * Students cannot verify alumni (403 Forbidden).
 */
alumniRoutes.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userRole = normalizeRole(req.user?.role);

    // Stop-gate: Only TPO, College Admin, or Super Admin can verify alumni
    if (
      userRole !== 'TPO_ADMIN' &&
      userRole !== 'COLLEGE_ADMIN' &&
      userRole !== 'SUPER_ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authorized TPO administrators can verify alumni profiles',
        code: 'TPO_AUTHORITY_REQUIRED'
      });
    }

    const profileId = getParam(req.params.id);
    const { notes } = req.body;

    const verified = await alumniService.verifyAlumni(
      tenantId,
      profileId,
      req.user!.id,
      notes
    );

    return res.json({
      success: true,
      data: verified,
      message: 'Alumni mentor profile verified successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to verify alumni profile'
    });
  }
});

/**
 * POST /api/v1/alumni/:id/suspend
 * TPO-only suspension workflow
 */
alumniRoutes.post('/:id/suspend', async (req: Request, res: Response) => {
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
        error: 'Forbidden: Only authorized TPO administrators can suspend alumni privileges',
        code: 'TPO_AUTHORITY_REQUIRED'
      });
    }

    const profileId = getParam(req.params.id);
    const { reason } = req.body;

    const suspended = await alumniService.suspendAlumni(
      tenantId,
      profileId,
      req.user!.id,
      reason
    );

    return res.json({
      success: true,
      data: suspended,
      message: 'Alumni mentorship privileges suspended'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to suspend alumni profile'
    });
  }
});

// ============================================================================
// MENTORSHIP ROUTES (/api/v1/mentorship)
// ============================================================================

/**
 * POST /api/v1/mentorship/requests
 * Student sends mentorship request (prevents duplicate active requests)
 */
mentorshipRoutes.post('/requests', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const studentUserId = req.user!.id;
    const { mentorUserId, alumniProfileId, topic, message, goals, preferredSlotId, preferredDate } = req.body;

    if (!mentorUserId || !topic || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: mentorUserId, topic, and message are mandatory'
      });
    }

    const request = await alumniService.createRequest(tenantId, studentUserId, undefined, {
      mentorUserId,
      alumniProfileId: alumniProfileId || 'profile-default',
      topic,
      message,
      goals,
      preferredSlotId,
      preferredDate
    });

    return res.status(201).json({
      success: true,
      data: request,
      message: 'Mentorship request sent successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to send mentorship request'
    });
  }
});

/**
 * GET /api/v1/mentorship/requests/student
 * Student views their mentorship requests
 */
mentorshipRoutes.get('/requests/student', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const studentUserId = req.user!.id;

    const requests = await alumniService.getStudentRequests(tenantId, studentUserId);
    return res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch student mentorship requests'
    });
  }
});

/**
 * PATCH /api/v1/mentorship/requests/:id
 * Accept, decline, reschedule, or cancel a mentorship request
 */
mentorshipRoutes.patch('/requests/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const requestId = getParam(req.params.id);
    const actorUserId = req.user!.id;
    const { action, rejectionReason, rescheduleNote } = req.body;

    if (!action || !['ACCEPT', 'DECLINE', 'RESCHEDULE', 'CANCEL'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be ACCEPT, DECLINE, RESCHEDULE, or CANCEL'
      });
    }

    const updated = await alumniService.updateRequestStatus(
      tenantId,
      requestId,
      actorUserId,
      action as any,
      { rejectionReason, rescheduleNote }
    );

    return res.json({
      success: true,
      data: updated,
      message: `Request status transitioned to ${updated.status}`
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to update request status'
    });
  }
});

/**
 * POST /api/v1/mentorship/sessions
 * Schedule session
 */
mentorshipRoutes.post('/sessions', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const actorUserId = req.user!.id;
    const { requestId, alumniProfileId, mentorUserId, studentUserId, scheduledAt, durationMinutes, meetingLink, agenda } = req.body;

    if (!requestId || !mentorUserId || !studentUserId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required session parameters'
      });
    }

    const session = await alumniService.createSession(tenantId, actorUserId, {
      requestId,
      alumniProfileId: alumniProfileId || 'profile-default',
      mentorUserId,
      studentUserId,
      scheduledAt: new Date(scheduledAt),
      durationMinutes,
      meetingLink,
      agenda
    });

    return res.status(201).json({
      success: true,
      data: session,
      message: 'Mentorship session scheduled successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to schedule mentorship session'
    });
  }
});

/**
 * POST /api/v1/mentorship/sessions/:id/complete
 * Complete session
 */
mentorshipRoutes.post('/sessions/:id/complete', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const sessionId = getParam(req.params.id);
    const actorUserId = req.user!.id;
    const { alumniNotes, studentNotes, actionItems } = req.body;

    const completed = await alumniService.completeSession(tenantId, sessionId, actorUserId, {
      alumniNotes,
      studentNotes,
      actionItems
    });

    return res.json({
      success: true,
      data: completed,
      message: 'Mentorship session marked as completed'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to complete session'
    });
  }
});

/**
 * POST /api/v1/mentorship/feedback
 * Submit structured feedback
 */
mentorshipRoutes.post('/feedback', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const submittedByUserId = req.user!.id;
    const { sessionId, feedbackTarget, rating, feedbackText, rubricScores, wouldRecommend, isPrivate } = req.body;

    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId and rating (1-5) are required'
      });
    }

    const feedback = await alumniService.submitFeedback(tenantId, submittedByUserId, {
      sessionId,
      feedbackTarget: feedbackTarget || 'ALUMNI',
      rating: parseInt(rating, 10),
      feedbackText,
      rubricScores,
      wouldRecommend,
      isPrivate
    });

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Mentorship feedback submitted successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to submit feedback'
    });
  }
});

// ============================================================================
// TPO ALUMNI ROUTES (/api/v1/tpo/alumni)
// ============================================================================

/**
 * GET /api/v1/tpo/alumni/analytics
 * TPO mentorship analytics
 */
tpoAlumniRoutes.get('/analytics', async (req: Request, res: Response) => {
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
        error: 'Forbidden: TPO institutional authority required',
        code: 'TPO_AUTHORITY_REQUIRED'
      });
    }

    const analytics = await alumniService.getTpoAnalytics(tenantId);
    return res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch TPO alumni analytics'
    });
  }
});

/**
 * GET /api/v1/tpo/alumni/pending
 * Pending verification queue
 */
tpoAlumniRoutes.get('/pending', async (req: Request, res: Response) => {
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
        error: 'Forbidden: TPO authority required',
        code: 'TPO_AUTHORITY_REQUIRED'
      });
    }

    const pending = await alumniService.listPendingVerifications(tenantId);
    return res.json({
      success: true,
      data: pending,
      count: pending.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch pending verifications'
    });
  }
});
