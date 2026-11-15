import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { notificationService } from '../orchestration';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);
notificationRoutes.use(tenantMiddleware);

/**
 * 1. GET /api/v1/notifications
 * Get paginated notifications for current user with unread count
 */
notificationRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId || !req.user?.id) {
      return res.status(403).json({ success: false, error: 'Authentication or tenant context missing' });
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await notificationService.getNotifications(tenantId, req.user.id, {
      unreadOnly,
      limit,
      offset
    });

    return res.json({
      success: true,
      data: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      limit,
      offset
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch notifications'
    });
  }
});

/**
 * 2. PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
notificationRoutes.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId || !req.user?.id) {
      return res.status(403).json({ success: false, error: 'Authentication or tenant context missing' });
    }

    const notifId = String(req.params.id);
    const updated = await notificationService.markAsRead(tenantId, req.user.id, notifId);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Notification '${notifId}' not found`
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to mark notification as read'
    });
  }
});

/**
 * 3. POST /api/v1/notifications/read-all
 * Mark all notifications as read for current user
 */
notificationRoutes.post('/read-all', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId || !req.user?.id) {
      return res.status(403).json({ success: false, error: 'Authentication or tenant context missing' });
    }

    const result = await notificationService.markAllAsRead(tenantId, req.user.id);

    return res.json({
      success: true,
      data: result,
      message: `Marked ${result.count} notifications as read`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to mark all notifications as read'
    });
  }
});

/**
 * 4. GET /api/v1/notifications/preferences
 * Get current user notification preferences
 */
notificationRoutes.get('/preferences', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId || !req.user?.id) {
      return res.status(403).json({ success: false, error: 'Authentication or tenant context missing' });
    }

    const preferences = await notificationService.getPreferences(tenantId, req.user.id);

    return res.json({
      success: true,
      data: preferences
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get notification preferences'
    });
  }
});

/**
 * 5. PUT /api/v1/notifications/preferences
 * Update user notification preferences
 */
notificationRoutes.put('/preferences', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId || !req.user?.id) {
      return res.status(403).json({ success: false, error: 'Authentication or tenant context missing' });
    }

    const updated = await notificationService.updatePreferences(
      tenantId,
      req.user.id,
      req.body || {}
    );

    return res.json({
      success: true,
      data: updated,
      message: 'Notification preferences updated successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to update notification preferences'
    });
  }
});
