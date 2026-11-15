/**
 * CarrerSync Phase 12 — Student Assessment REST API Routes
 *
 * Endpoints for:
 * 1. Aptitude practice & attempts (timed tests, progress saving, answer submission)
 * 2. Coding challenges (sanitized problem retrieval, test running, submission)
 * 3. AI interview practice (roles, question retrieval, 5-dimension answer grading, session reports)
 * 4. Mock drive participation (listings, registration, performance reports, weakness summaries)
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { mockDriveService } from '../assessment/mock-drive.service';
import { interviewEvaluator } from '../assessment/interview-evaluator';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';

export const studentAssessmentRoutes = Router();

studentAssessmentRoutes.use(requireAuth);
studentAssessmentRoutes.use(tenantMiddleware);

// Middleware: Student access check (Students + Admins for preview)
function requireStudentOrAdmin(req: Request, res: Response, next: Function) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role === 'RECRUITER') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Recruiter accounts cannot access student assessment engines',
      code: 'FORBIDDEN_ROLE'
    });
  }

  next();
}

studentAssessmentRoutes.use(requireStudentOrAdmin);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ---------------------------------------------------------------------------
// 1. Aptitude Assessment Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/student/assessments/aptitude/questions
 * Fetches sanitized questions (answers strictly omitted!).
 */
studentAssessmentRoutes.get('/assessments/aptitude/questions', (req: Request, res: Response) => {
  try {
    const topic = req.query.topic as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const questions = mockDriveService.getSanitizedAptitudeQuestions(topic, limit);
    return res.json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/assessments/aptitude/start
 * Starts a timed aptitude attempt.
 */
studentAssessmentRoutes.post('/assessments/aptitude/start', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const { driveId, roundId, questionBankId, durationMinutes, questionCount } = req.body || {};

    const attempt = mockDriveService.startAptitudeAttempt({
      studentId: user.id,
      tenantId,
      driveId,
      roundId,
      questionBankId,
      durationMinutes,
      questionCount
    });

    return res.status(201).json({
      success: true,
      message: 'Aptitude assessment attempt initialized successfully',
      attempt
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/assessments/aptitude/:attemptId/save
 * Saves intermediate answers.
 */
studentAssessmentRoutes.post('/assessments/aptitude/:attemptId/save', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const attemptId = getParam(req.params.attemptId);
    const { answers } = req.body || {};

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ success: false, error: 'Answers object is required' });
    }

    const attempt = mockDriveService.saveAptitudeProgress({
      attemptId,
      studentId: user.id,
      tenantId,
      answers
    });

    return res.json({
      success: true,
      message: 'Progress saved successfully',
      status: attempt.status,
      expiresAt: attempt.expiresAt
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/assessments/aptitude/:attemptId/submit
 * Submits aptitude attempt, calculates verified server score, returns topic breakdown.
 */
studentAssessmentRoutes.post('/assessments/aptitude/:attemptId/submit', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const attemptId = getParam(req.params.attemptId);
    const { answers } = req.body || {};

    const result = mockDriveService.submitAptitudeAttempt({
      attemptId,
      studentId: user.id,
      tenantId,
      finalAnswers: answers
    });

    return res.json({
      success: true,
      message: 'Aptitude assessment evaluated successfully',
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.passed,
      topicBreakdown: result.topicBreakdown,
      reviewDetails: result.reviewDetails
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 2. Coding Assessment Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/student/assessments/coding/problems
 * Lists available coding challenges (hidden test cases are omitted).
 */
studentAssessmentRoutes.get('/assessments/coding/problems', (req: Request, res: Response) => {
  try {
    const problems = mockDriveService.listCodingProblems();
    return res.json({
      success: true,
      count: problems.length,
      problems
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/student/assessments/coding/problems/:problemId
 * Retrieves specific coding problem details.
 */
studentAssessmentRoutes.get('/assessments/coding/problems/:problemId', (req: Request, res: Response) => {
  try {
    const problemId = getParam(req.params.problemId);
    const problem = mockDriveService.getCodingProblem(problemId);
    if (!problem) {
      return res.status(404).json({ success: false, error: 'Coding problem not found' });
    }
    return res.json({ success: true, problem });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/assessments/coding/problems/:problemId/run
 * Dry-runs student code against visible test cases only.
 */
studentAssessmentRoutes.post('/assessments/coding/problems/:problemId/run', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const problemId = getParam(req.params.problemId);
    const { code, language } = req.body || {};

    if (!code || !language) {
      return res.status(400).json({ success: false, error: 'Code and language are required' });
    }

    const result = await mockDriveService.runCodingTest({
      studentId: user.id,
      problemId,
      code,
      language
    });

    return res.json({
      success: true,
      result
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/assessments/coding/problems/:problemId/submit
 * Submits student code against both visible and hidden test cases, records score.
 */
studentAssessmentRoutes.post('/assessments/coding/problems/:problemId/submit', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const problemId = getParam(req.params.problemId);
    const { code, language, driveId } = req.body || {};

    if (!code || !language) {
      return res.status(400).json({ success: false, error: 'Code and language are required' });
    }

    const result = await mockDriveService.submitCodingProblem({
      studentId: user.id,
      tenantId,
      problemId,
      code,
      language,
      driveId
    });

    return res.json({
      success: true,
      message: 'Code submission evaluated and recorded',
      result
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 3. Interview Practice Routes (5-Dimension AI Scoring, Zero Surveillance)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/student/interviews/practice/roles
 * Lists 12 standard supported target roles and categories.
 */
studentAssessmentRoutes.get('/interviews/practice/roles', (req: Request, res: Response) => {
  return res.json({
    success: true,
    roles: interviewEvaluator.getSupportedRoles(),
    categories: interviewEvaluator.getSupportedCategories()
  });
});

/**
 * POST /api/v1/student/interviews/practice/start
 * Starts a new interview practice session.
 */
studentAssessmentRoutes.post('/interviews/practice/start', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const { targetRole = 'Software Engineer', questionCount = 5 } = req.body || {};

    const session = mockDriveService.startInterviewPractice({
      studentId: user.id,
      tenantId,
      targetRole,
      questionCount
    });

    return res.status(201).json({
      success: true,
      message: 'Interview practice session initialized',
      session
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/interviews/practice/:sessionId/answer
 * Submits an answer for 5-dimension evaluation.
 */
studentAssessmentRoutes.post('/interviews/practice/:sessionId/answer', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const sessionId = getParam(req.params.sessionId);
    const { questionId, answerText } = req.body || {};

    if (!questionId || answerText === undefined) {
      return res.status(400).json({ success: false, error: 'questionId and answerText are required' });
    }

    const session = await mockDriveService.answerInterviewQuestion({
      sessionId,
      studentId: user.id,
      questionId,
      answerText
    });

    const evaluated = session.answers[questionId];
    return res.json({
      success: true,
      message: 'Answer evaluated successfully',
      evaluation: evaluated?.evaluation
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/interviews/practice/:sessionId/submit
 * Finalizes session and returns summary report.
 */
studentAssessmentRoutes.post('/interviews/practice/:sessionId/submit', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const sessionId = getParam(req.params.sessionId);

    const report = mockDriveService.submitInterviewSession(sessionId, user.id);
    return res.json({
      success: true,
      message: 'Interview session completed',
      report
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/student/interviews/practice/:sessionId/report
 * Retrieves completed interview session report.
 */
studentAssessmentRoutes.get('/interviews/practice/:sessionId/report', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const sessionId = getParam(req.params.sessionId);

    const report = mockDriveService.getInterviewSessionReport(sessionId, user.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Interview report not found' });
    }
    return res.json({ success: true, report });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 4. Mock Drives & Performance Reports Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/student/mock-drives
 * Lists available mock placement drives.
 */
studentAssessmentRoutes.get('/mock-drives', (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || (req.user as AuthUserContext).tenantId;
    const status = req.query.status as string | undefined;

    const drives = mockDriveService.listMockDrives(tenantId, status);
    return res.json({ success: true, count: drives.length, drives });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/student/mock-drives/reports
 * Lists all assessment performance reports for student.
 * (Placed before /:id to avoid route shadowing)
 */
studentAssessmentRoutes.get('/mock-drives/reports', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;

    const reports = mockDriveService.listStudentReports(user.id, tenantId);
    return res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/student/mock-drives/reports/:reportId
 * Retrieves detailed performance report by ID.
 */
studentAssessmentRoutes.get('/mock-drives/reports/:reportId', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const reportId = getParam(req.params.reportId);

    const report = mockDriveService.getPerformanceReport(reportId, user.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Performance report not found' });
    }
    return res.json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/student/mock-drives/weaknesses
 * Retrieves synthesized weakness and strength analysis mapped to roles.
 */
studentAssessmentRoutes.get('/mock-drives/weaknesses', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const targetRole = (req.query.targetRole as string) || 'Software Engineer';

    const weaknesses = mockDriveService.getStudentWeaknessSummary(user.id, tenantId, targetRole);
    return res.json({ success: true, weaknesses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/student/mock-drives/:id
 * Retrieves details for a specific mock drive.
 */
studentAssessmentRoutes.get('/mock-drives/:id', (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const drive = mockDriveService.getMockDrive(id);
    if (!drive) {
      return res.status(404).json({ success: false, error: 'Mock drive not found' });
    }
    return res.json({ success: true, drive });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/student/mock-drives/:id/register
 * Registers student for a mock placement drive.
 */
studentAssessmentRoutes.post('/mock-drives/:id/register', (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const id = getParam(req.params.id);

    const registration = mockDriveService.registerStudentForDrive(id, user.id, tenantId);
    return res.status(201).json({
      success: true,
      message: 'Successfully registered for mock drive',
      registration
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
