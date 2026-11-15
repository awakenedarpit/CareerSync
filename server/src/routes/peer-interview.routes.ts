import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { peerInterviewService } from '../peer-interview/peer-interview.service';

export const peerInterviewRoutes = Router();

const getParam = (p: string | string[] | undefined): string =>
  Array.isArray(p) ? p[0] : p || '';

peerInterviewRoutes.use(requireAuth);
peerInterviewRoutes.use(tenantMiddleware);

/**
 * GET /api/v1/peer-interviews
 * Discover open peer mock interview rooms in the marketplace
 */
peerInterviewRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { interviewType, mode, difficulty } = req.query;

    const rooms = await peerInterviewService.discoverMarketplaceRooms(tenantId, {
      interviewType: interviewType as any,
      mode: mode as any,
      difficulty: difficulty as any
    });

    return res.json({
      success: true,
      data: rooms,
      count: rooms.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to discover peer interview rooms'
    });
  }
});

/**
 * GET /api/v1/peer-interviews/history
 * Get authenticated user's interview history
 */
peerInterviewRoutes.get('/history', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const userId = req.user!.id;

    const history = await peerInterviewService.getUserInterviewHistory(tenantId, userId);
    return res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch interview history'
    });
  }
});

/**
 * POST /api/v1/peer-interviews
 * Create new interview room
 */
peerInterviewRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const hostUserId = req.user!.id;
    const {
      title,
      interviewType,
      mode,
      scheduledStartTime,
      scheduledDurationMinutes,
      difficulty,
      maxParticipants,
      codeLanguage,
      initialQuestions
    } = req.body;

    if (!title || !interviewType || !mode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: title, interviewType, and mode are required'
      });
    }

    const room = await peerInterviewService.createRoom(tenantId, hostUserId, {
      title,
      interviewType,
      mode,
      scheduledStartTime,
      scheduledDurationMinutes,
      difficulty,
      maxParticipants,
      codeLanguage,
      initialQuestions
    });

    return res.status(201).json({
      success: true,
      data: room,
      message: 'Peer interview room created successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to create peer interview room'
    });
  }
});

/**
 * GET /api/v1/peer-interviews/:id
 * Get room details & questions (sanitizes standardAnswer for candidate)
 */
peerInterviewRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomIdOrCode = getParam(req.params.id);
    const userId = req.user!.id;

    const details = await peerInterviewService.getRoomDetails(tenantId, roomIdOrCode, userId);
    return res.json({
      success: true,
      data: details
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      error: error?.message || 'Failed to retrieve peer interview room'
    });
  }
});

/**
 * POST /api/v1/peer-interviews/:id/join
 * Join session
 */
peerInterviewRoutes.post('/:id/join', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomIdOrCode = getParam(req.params.id);
    const userId = req.user!.id;

    const result = await peerInterviewService.joinRoom(tenantId, roomIdOrCode, userId);
    return res.json({
      success: true,
      data: result,
      message: 'Joined interview room successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to join interview room'
    });
  }
});

/**
 * POST /api/v1/peer-interviews/:id/leave
 * Leave session
 */
peerInterviewRoutes.post('/:id/leave', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;

    await peerInterviewService.leaveRoom(tenantId, roomId, userId);
    return res.json({
      success: true,
      message: 'Left interview room'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to leave interview room'
    });
  }
});

/**
 * POST /api/v1/peer-interviews/:id/role-switch
 * Switch roles between interviewer and candidate (Mode A only)
 */
peerInterviewRoutes.post('/:id/role-switch', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;

    const updatedParticipants = await peerInterviewService.switchRoles(tenantId, roomId, userId);
    return res.json({
      success: true,
      data: updatedParticipants,
      message: 'Roles switched successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to switch roles'
    });
  }
});

/**
 * POST /api/v1/peer-interviews/:id/complete
 * Complete session
 */
peerInterviewRoutes.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;

    const room = await peerInterviewService.completeInterview(tenantId, roomId, userId);
    return res.json({
      success: true,
      data: room,
      message: 'Peer interview marked as completed'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to complete interview'
    });
  }
});

/**
 * POST /api/v1/peer-interviews/:id/feedback
 * Submit structured feedback rubric (explicitly flagged with isPeerProvidedLabel: true)
 */
peerInterviewRoutes.post('/:id/feedback', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const evaluatorUserId = req.user!.id;
    const {
      evaluateeUserId,
      overallRating,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      codeQualityScore,
      detailedRubricScores,
      strengthsText,
      improvementsText,
      generalFeedback
    } = req.body;

    if (!evaluateeUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing evaluateeUserId'
      });
    }

    const feedback = await peerInterviewService.submitFeedback(tenantId, evaluatorUserId, {
      roomId,
      evaluateeUserId,
      overallRating: parseInt(overallRating || '5', 10),
      technicalScore: parseInt(technicalScore || '5', 10),
      communicationScore: parseInt(communicationScore || '5', 10),
      problemSolvingScore: parseInt(problemSolvingScore || '5', 10),
      codeQualityScore: parseInt(codeQualityScore || '5', 10),
      detailedRubricScores,
      strengthsText,
      improvementsText,
      generalFeedback
    });

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Structured peer feedback submitted successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to submit peer feedback'
    });
  }
});
