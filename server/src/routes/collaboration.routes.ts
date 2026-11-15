import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { collaborationService } from '../collaboration/collaboration.service';

export const collaborationRoutes = Router();

const getParam = (p: string | string[] | undefined): string =>
  Array.isArray(p) ? p[0] : p || '';

collaborationRoutes.use(requireAuth);
collaborationRoutes.use(tenantMiddleware);

/**
 * GET /api/v1/collaboration/rooms
 * List study rooms across the 9 disciplines
 */
collaborationRoutes.get('/rooms', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const { category, search, status } = req.query;

    const rooms = await collaborationService.listRooms(tenantId, {
      category: category as any,
      search: search as string,
      status: status as any
    });

    return res.json({
      success: true,
      data: rooms,
      count: rooms.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to list collaboration rooms'
    });
  }
});

/**
 * POST /api/v1/collaboration/rooms
 * Create a new collaboration study room
 */
collaborationRoutes.post('/rooms', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const hostUserId = req.user!.id;
    const { name, description, category, isPrivate, passcode, maxMembers, tags } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and category are mandatory'
      });
    }

    const room = await collaborationService.createRoom(tenantId, hostUserId, {
      name,
      description,
      category,
      isPrivate,
      passcode,
      maxMembers,
      tags
    });

    return res.status(201).json({
      success: true,
      data: room,
      message: 'Study room created successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to create collaboration room'
    });
  }
});

/**
 * GET /api/v1/collaboration/rooms/:id
 * Get room details, active participants, notes, and task list
 */
collaborationRoutes.get('/rooms/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;

    const details = await collaborationService.getRoomDetails(tenantId, roomId, userId);
    return res.json({
      success: true,
      data: details
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      error: error?.message || 'Collaboration room not found'
    });
  }
});

/**
 * POST /api/v1/collaboration/rooms/:id/join
 * Join collaboration study room
 */
collaborationRoutes.post('/rooms/:id/join', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;
    const { passcode } = req.body;

    const result = await collaborationService.joinRoom(tenantId, roomId, userId, passcode);
    return res.json({
      success: true,
      data: result,
      message: 'Joined collaboration room successfully'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to join collaboration room'
    });
  }
});

/**
 * POST /api/v1/collaboration/rooms/:id/leave
 * Leave collaboration study room
 */
collaborationRoutes.post('/rooms/:id/leave', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;

    await collaborationService.leaveRoom(tenantId, roomId, userId);
    return res.json({
      success: true,
      message: 'Left collaboration room'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to leave collaboration room'
    });
  }
});

/**
 * GET /api/v1/collaboration/rooms/:id/messages
 * In-room chat stream
 */
collaborationRoutes.get('/rooms/:id/messages', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const messages = await collaborationService.getMessages(tenantId, roomId, limit);
    return res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to retrieve messages'
    });
  }
});

/**
 * POST /api/v1/collaboration/rooms/:id/messages
 * Send message / code snippet / resource
 */
collaborationRoutes.post('/rooms/:id/messages', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const senderUserId = req.user!.id;
    const { content, messageType, codeSnippetJson, attachmentUrl } = req.body;

    if (!content && !codeSnippetJson && !attachmentUrl) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const message = await collaborationService.sendMessage(tenantId, roomId, senderUserId, {
      content: content || '',
      messageType,
      codeSnippetJson,
      attachmentUrl
    });

    return res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to send message'
    });
  }
});

/**
 * PATCH /api/v1/collaboration/rooms/:id/notes
 * Update shared notes with version conflict protection
 */
collaborationRoutes.patch('/rooms/:id/notes', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;
    const { content, expectedVersion } = req.body;

    if (content === undefined || expectedVersion === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: content and expectedVersion are mandatory'
      });
    }

    const updated = await collaborationService.updateNotes(tenantId, roomId, userId, {
      content,
      expectedVersion: parseInt(expectedVersion, 10)
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Notes updated successfully'
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      error: error?.message || 'Failed to update notes',
      code: error.code || 'NOTES_UPDATE_FAILED',
      currentVersion: error.currentVersion
    });
  }
});

/**
 * POST /api/v1/collaboration/rooms/:id/tasks
 * Add task to checklist
 */
collaborationRoutes.post('/rooms/:id/tasks', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const roomId = getParam(req.params.id);
    const userId = req.user!.id;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const task = await collaborationService.createTask(tenantId, roomId, userId, {
      title,
      description,
      priority,
      assignedTo,
      dueDate
    });

    return res.status(201).json({
      success: true,
      data: task,
      message: 'Task added to checklist'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to create task'
    });
  }
});

/**
 * PATCH /api/v1/collaboration/rooms/:id/tasks/:taskId
 * Update task (status, assign, priority)
 */
collaborationRoutes.patch('/rooms/:id/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId || req.user?.tenantId;
    const taskId = getParam(req.params.taskId);
    const userId = req.user!.id;
    const updates = req.body;

    const task = await collaborationService.updateTask(tenantId, taskId, userId, updates);
    return res.json({
      success: true,
      data: task,
      message: 'Task updated'
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to update task'
    });
  }
});
