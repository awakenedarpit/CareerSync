/**
 * CarrerSync Phase 12 — TPO Mock Drive & Question Bank Management REST API Routes
 *
 * Endpoints for:
 * 1. GET   /api/v1/tpo/mock-drives
 * 2. POST  /api/v1/tpo/mock-drives
 * 3. GET   /api/v1/tpo/mock-drives/question-banks
 * 4. POST  /api/v1/tpo/mock-drives/question-banks
 * 5. GET   /api/v1/tpo/mock-drives/:id
 * 6. PATCH /api/v1/tpo/mock-drives/:id
 * 7. GET   /api/v1/tpo/mock-drives/:id/analytics
 *
 * Strict institutional authority required (TPO_ADMIN, COLLEGE_ADMIN, SUPER_ADMIN).
 * RECRUITER and STUDENT receive 403 Forbidden.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { mockDriveService } from '../assessment/mock-drive.service';
import { normalizeRole } from '../utils/roles';
import type { AuthUserContext } from '../types';

export const tpoMockDriveRoutes = Router();

tpoMockDriveRoutes.use(requireAuth);
tpoMockDriveRoutes.use(tenantMiddleware);

// Middleware: Institutional Reviewer Authority check
function requireTpoAuthority(req: Request, res: Response, next: Function) {
  const user = req.user as AuthUserContext;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const role = normalizeRole(user.role);
  if (role !== 'TPO_ADMIN' && role !== 'COLLEGE_ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Institutional mock drive management requires TPO_ADMIN or COLLEGE_ADMIN authority',
      code: 'FORBIDDEN_INSUFFICIENT_ROLE'
    });
  }

  next();
}

tpoMockDriveRoutes.use(requireTpoAuthority);

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param ? String(param).trim() : '';
}

// ---------------------------------------------------------------------------
// 1. Question Banks Management (MUST precede /:id routes!)
// ---------------------------------------------------------------------------

/**
 * GET /question-banks or /mock-drives/question-banks
 * Lists question banks for current tenant or system.
 */
const getQuestionBanksHandler = (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const roundType = req.query.roundType as string | undefined;

    const banks = mockDriveService.listQuestionBanks(tenantId, roundType);
    return res.json({ success: true, count: banks.length, questionBanks: banks });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.get('/question-banks', getQuestionBanksHandler);
tpoMockDriveRoutes.get('/mock-drives/question-banks', getQuestionBanksHandler);

/**
 * POST /question-banks or /mock-drives/question-banks
 * Creates a new question bank.
 */
const createQuestionBankHandler = (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const { title, description, roundType, category } = req.body || {};

    if (!title || !roundType || !category) {
      return res.status(400).json({
        success: false,
        error: 'title, roundType (APTITUDE, CODING, INTERVIEW), and category are required'
      });
    }

    const bank = mockDriveService.createQuestionBank({
      tenantId,
      title,
      description,
      roundType,
      category,
      createdBy: user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Question bank created successfully',
      questionBank: bank
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.post('/question-banks', createQuestionBankHandler);
tpoMockDriveRoutes.post('/mock-drives/question-banks', createQuestionBankHandler);

// ---------------------------------------------------------------------------
// 2. Mock Drive CRUD & Analytics
// ---------------------------------------------------------------------------

/**
 * GET / or /mock-drives
 * Lists mock drives for current tenant.
 */
const listMockDrivesHandler = (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const status = req.query.status as string | undefined;

    const drives = mockDriveService.listMockDrives(tenantId, status);
    return res.json({ success: true, count: drives.length, mockDrives: drives });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.get('/', listMockDrivesHandler);
tpoMockDriveRoutes.get('/mock-drives', listMockDrivesHandler);

/**
 * POST / or /mock-drives
 * Creates a new institutional mock placement drive.
 */
const createMockDriveHandler = (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUserContext;
    const tenantId = req.tenantId || user.tenantId;
    const {
      title,
      description,
      companyName = 'Institutional Placement Simulation',
      targetRoles,
      startDate,
      endDate,
      rounds
    } = req.body || {};

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'title, description, startDate, and endDate are required'
      });
    }

    const defaultRounds = rounds && rounds.length > 0 ? rounds : [
      {
        id: 'r1',
        roundNumber: 1,
        roundType: 'APTITUDE',
        title: 'Round 1: General Aptitude & Logical Reasoning',
        durationMinutes: 30,
        passingScorePercentage: 60,
        totalMarks: 100
      },
      {
        id: 'r2',
        roundNumber: 2,
        roundType: 'CODING',
        title: 'Round 2: Algorithmic Coding Challenge',
        durationMinutes: 60,
        passingScorePercentage: 65,
        totalMarks: 100
      },
      {
        id: 'r3',
        roundNumber: 3,
        roundType: 'INTERVIEW',
        title: 'Round 3: Technical & Behavioral Practice Interview',
        durationMinutes: 45,
        passingScorePercentage: 70,
        totalMarks: 100
      }
    ];

    const drive = mockDriveService.createMockDrive({
      tenantId,
      title,
      description,
      companyName,
      targetRoles: Array.isArray(targetRoles) && targetRoles.length > 0 ? targetRoles : ['Software Engineer'],
      startDate,
      endDate,
      rounds: defaultRounds,
      createdBy: user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Mock placement drive configured and initialized successfully',
      mockDrive: drive
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.post('/', createMockDriveHandler);
tpoMockDriveRoutes.post('/mock-drives', createMockDriveHandler);

/**
 * GET /:id/analytics or /mock-drives/:id/analytics
 * Retrieves institutional mock drive analytics and pass rates.
 */
const getAnalyticsHandler = (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const analytics = mockDriveService.getMockDriveAnalytics(id);
    return res.json({ success: true, analytics });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.get('/:id/analytics', getAnalyticsHandler);
tpoMockDriveRoutes.get('/mock-drives/:id/analytics', getAnalyticsHandler);

/**
 * GET /:id or /mock-drives/:id
 * Retrieves mock drive details.
 */
const getDriveHandler = (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const drive = mockDriveService.getMockDrive(id);
    if (!drive) {
      return res.status(404).json({ success: false, error: 'Mock drive not found' });
    }
    return res.json({ success: true, mockDrive: drive });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.get('/:id', getDriveHandler);
tpoMockDriveRoutes.get('/mock-drives/:id', getDriveHandler);

/**
 * PATCH /:id or /mock-drives/:id
 * Updates mock drive configuration (status, dates, descriptions).
 */
const updateDriveHandler = (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const updates = req.body || {};

    const updated = mockDriveService.updateMockDrive(id, updates);
    return res.json({
      success: true,
      message: 'Mock drive configuration updated successfully',
      mockDrive: updated
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

tpoMockDriveRoutes.patch('/:id', updateDriveHandler);
tpoMockDriveRoutes.patch('/mock-drives/:id', updateDriveHandler);
