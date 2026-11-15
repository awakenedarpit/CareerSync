/**
 * CarrerSync Recruiter Portal REST API Routes
 * Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Dashboard
 *
 * Implements endpoints for:
 * 1. Companies & Profile Management (/companies, /profile)
 * 2. Job Requirement Lifecycle (/jobs, /jobs/:id/submit)
 * 3. Placement Drive Orchestration & Conflict Checking (/drives, /drives/:id/schedules)
 * 4. Evidence-Based Candidate Discovery (/candidates, /candidates/:id)
 * 5. Candidate Shortlisting Workflow (/shortlists, /shortlists/:id/submit)
 * 6. Assessment Coordination (/assessments, /assessments/:id/scores)
 * 7. Multi-Stage Interview Management (/interviews, /interviews/:id/feedback)
 * 8. Offer Lifecycle Management (/offers, /offers/:id/submit, /offers/:id/history)
 * 9. Placement Intelligence Analytics (/analytics/overview, /analytics/drives)
 *
 * Enforces strict 5-role RBAC, anti-spoofing tenant boundaries, and audit logging.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { recruiterService } from '../recruiter/recruiter.service';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';

export const recruiterRoutes = Router();

recruiterRoutes.use(requireAuth);
recruiterRoutes.use(tenantMiddleware);

/**
 * RBAC Guard: Restricts recruiter portal to RECRUITER, TPO_ADMIN, COLLEGE_ADMIN, and SUPER_ADMIN.
 * Students receive 403 Forbidden.
 */
function requireRecruiterPortalAccess(req: Request, res: Response, next: Function) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role === 'STUDENT') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Students are not permitted to access recruiter endpoints',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }

  next();
}

recruiterRoutes.use(requireRecruiterPortalAccess);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ============================================================================
// 1. Company Management Endpoints
// ============================================================================

recruiterRoutes.get('/companies', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const search = req.query.search as string;
    const companies = await recruiterService.listCompanies(user.tenantId, search);
    return res.json({ success: true, count: companies.length, data: companies });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/companies', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { name, industryDomain, website, description, headquarters, contactEmail, contactPhone } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Company name is mandatory' });
    }

    const company = await recruiterService.createCompany(user.tenantId, user.id, {
      name,
      industryDomain,
      website,
      description,
      headquarters,
      contactEmail,
      contactPhone
    });

    return res.status(201).json({ success: true, data: company });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const company = await recruiterService.getCompany(getParam(req.params.id));
    if (!company) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }
    return res.json({ success: true, data: company });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.patch('/companies/:id', async (req: Request, res: Response) => {
  try {
    const updated = await recruiterService.updateCompany(getParam(req.params.id), req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const company = await recruiterService.getRecruiterCompany(user.id);
    return res.json({ success: true, data: company });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 2. Job Requirement Lifecycle Endpoints
// ============================================================================

recruiterRoutes.get('/jobs', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const status = req.query.status as string;
    const jobs = await recruiterService.listRecruiterJobs(user.tenantId, user.id, status);
    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/jobs', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { companyName, jobTitle, jobDescription, eligibleDepartments, requiredSkills } = req.body;

    if (!companyName || !jobTitle || !jobDescription) {
      return res.status(400).json({ success: false, error: 'companyName, jobTitle, and jobDescription are required' });
    }

    const job = await recruiterService.createJobDraft(user.tenantId, user.id, req.body);
    return res.status(201).json({ success: true, data: job });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const job = await recruiterService.getJobById(user.tenantId, getParam(req.params.id));
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job requirement not found' });
    }
    return res.json({ success: true, data: job });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.patch('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const updated = await recruiterService.updateJob(user.tenantId, user.id, user.role, getParam(req.params.id), req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, error: err.message, code: err.code });
  }
});

recruiterRoutes.post('/jobs/:id/submit', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const submitted = await recruiterService.submitJobForReview(user.tenantId, user.id, getParam(req.params.id));
    return res.json({
      success: true,
      message: 'Job submitted for institutional TPO review and approval',
      data: submitted
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. Placement Drive Management Endpoints
// ============================================================================

recruiterRoutes.get('/drives', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const status = req.query.status as string;
    const drives = await recruiterService.listDrives(user.tenantId, status);
    return res.json({ success: true, count: drives.length, data: drives });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/drives', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { title, batchYear, registrationStart, registrationEnd } = req.body;

    if (!title || !batchYear || !registrationStart || !registrationEnd) {
      return res.status(400).json({ success: false, error: 'title, batchYear, and registration dates are mandatory' });
    }

    const drive = await recruiterService.createPlacementDrive(user.tenantId, user.id, req.body);
    return res.status(201).json({ success: true, data: drive });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/drives/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const drive = await recruiterService.getDriveById(user.tenantId, getParam(req.params.id));
    if (!drive) {
      return res.status(404).json({ success: false, error: 'Placement drive not found' });
    }
    return res.json({ success: true, data: drive });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/drives/:id/submit', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const submitted = await recruiterService.submitDriveForApproval(user.tenantId, user.id, getParam(req.params.id));
    return res.json({
      success: true,
      message: 'Placement drive schedule submitted for TPO institutional approval',
      data: submitted
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/drives/:id/schedules', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const schedules = await recruiterService.listDriveSchedules(user.tenantId, getParam(req.params.id));
    return res.json({ success: true, count: schedules.length, data: schedules });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/drives/:id/schedules', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { eventTitle, eventType, startTime, endTime, venueOrLink } = req.body;

    if (!eventTitle || !eventType || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: 'eventTitle, eventType, startTime, and endTime are required' });
    }

    const slot = await recruiterService.addDriveScheduleSlot(user.tenantId, getParam(req.params.id), {
      eventTitle,
      eventType,
      startTime,
      endTime,
      venueOrLink
    });

    return res.status(201).json({ success: true, data: slot });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 4. Evidence-Based Candidate Discovery Endpoints
// ============================================================================

recruiterRoutes.get('/candidates', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, jobId, department, graduationYear, minCgpa, skill } = req.query;

    const candidates = await recruiterService.discoverCandidates(user.tenantId, driveId as string, jobId as string, {
      department: department as string,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      minCgpa: minCgpa ? Number(minCgpa) : undefined,
      skill: skill as string
    });

    return res.json({ success: true, count: candidates.length, data: candidates });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5. Candidate Shortlisting Endpoints
// ============================================================================

recruiterRoutes.get('/shortlists', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, status } = req.query;
    const shortlists = await recruiterService.listShortlists(user.tenantId, driveId as string, status as string);
    return res.json({ success: true, count: shortlists.length, data: shortlists });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/shortlists', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, jobId, studentId, recruiterNotes } = req.body;

    if (!driveId || !jobId || !studentId) {
      return res.status(400).json({ success: false, error: 'driveId, jobId, and studentId are mandatory' });
    }

    const shortlist = await recruiterService.recommendCandidateForShortlist(user.tenantId, user.id, {
      driveId,
      jobId,
      studentId,
      recruiterNotes
    });

    return res.status(201).json({ success: true, data: shortlist });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/shortlists/:id/submit', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const submitted = await recruiterService.submitShortlistForTpoReview(user.tenantId, getParam(req.params.id));
    return res.json({
      success: true,
      message: 'Candidate shortlist recommendation submitted for TPO institutional approval',
      data: submitted
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 6. Assessment Coordination Endpoints
// ============================================================================

recruiterRoutes.get('/assessments', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId } = req.query;
    const assessments = await recruiterService.listAssessments(user.tenantId, driveId as string);
    return res.json({ success: true, count: assessments.length, data: assessments });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/assessments', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, assessmentType, title, scheduledAt, durationMinutes, meetingDetails } = req.body;

    if (!driveId || !assessmentType || !title) {
      return res.status(400).json({ success: false, error: 'driveId, assessmentType, and title are required' });
    }

    const assessment = await recruiterService.scheduleAssessment(user.tenantId, user.id, {
      driveId,
      assessmentType,
      title,
      scheduledAt,
      durationMinutes,
      meetingDetails
    });

    return res.status(201).json({ success: true, data: assessment });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/assessments/:id/scores', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { studentId, score, maxScore, feedback } = req.body;

    if (!studentId || score === undefined) {
      return res.status(400).json({ success: false, error: 'studentId and score are required' });
    }

    const result = await recruiterService.recordAssessmentScore(user.tenantId, user.id, getParam(req.params.id), {
      studentId,
      score,
      maxScore,
      feedback
    });

    return res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 7. Interview Coordination Endpoints
// ============================================================================

recruiterRoutes.get('/interviews', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, status } = req.query;
    const interviews = await recruiterService.listInterviews(user.tenantId, driveId as string, status as string);
    return res.json({ success: true, count: interviews.length, data: interviews });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/interviews', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, studentId, roundStage, scheduledAt, interviewerName, meetingDetails } = req.body;

    if (!driveId || !studentId || !roundStage || !scheduledAt) {
      return res.status(400).json({ success: false, error: 'driveId, studentId, roundStage, and scheduledAt are required' });
    }

    const interview = await recruiterService.scheduleInterviewRound(user.tenantId, user.id, {
      driveId,
      studentId,
      roundStage,
      scheduledAt,
      interviewerName,
      meetingDetails
    });

    return res.status(201).json({ success: true, data: interview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.patch('/interviews/:id/feedback', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { status, feedback, rating } = req.body;

    if (!status || !feedback) {
      return res.status(400).json({ success: false, error: 'status and feedback are required' });
    }

    const interview = await recruiterService.recordInterviewFeedback(user.tenantId, user.id, getParam(req.params.id), {
      status,
      feedback,
      rating
    });

    return res.json({ success: true, data: interview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 8. Offer Lifecycle Management Endpoints
// ============================================================================

recruiterRoutes.get('/offers', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { studentId, status } = req.query;
    const offers = await recruiterService.listOffers(user.tenantId, studentId as string, status as string);
    return res.json({ success: true, count: offers.length, data: offers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/offers', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const { driveId, jobId, studentId, roleTitle, ctcLpa, joiningDate, expiryDate } = req.body;

    if (!driveId || !jobId || !studentId || !roleTitle) {
      return res.status(400).json({ success: false, error: 'driveId, jobId, studentId, and roleTitle are required' });
    }

    const offer = await recruiterService.draftOffer(user.tenantId, user.id, {
      driveId,
      jobId,
      studentId,
      roleTitle,
      ctcLpa,
      joiningDate,
      expiryDate
    });

    return res.status(201).json({ success: true, data: offer });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.post('/offers/:id/submit', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const submitted = await recruiterService.submitOfferForReview(user.tenantId, user.id, getParam(req.params.id));
    return res.json({
      success: true,
      message: 'Placement offer submitted for institutional TPO review',
      data: submitted
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/offers/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await recruiterService.getOfferHistory(getParam(req.params.id));
    return res.json({ success: true, count: history.length, data: history });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 9. Placement Intelligence Analytics Endpoints
// ============================================================================

recruiterRoutes.get('/analytics/overview', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const analytics = await recruiterService.getRecruiterAnalytics(user.tenantId, user.id);
    return res.json({ success: true, data: analytics });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

recruiterRoutes.get('/analytics/drives', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const analytics = await recruiterService.getRecruiterAnalytics(user.tenantId, user.id);
    return res.json({ success: true, data: { funnel: analytics.candidateFunnel, skills: analytics.skillDemand } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
