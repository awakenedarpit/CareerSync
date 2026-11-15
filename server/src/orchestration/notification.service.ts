import crypto from 'crypto';
import type {
  NotificationEvent,
  NotificationEventType,
  NotificationPreference
} from './orchestration.types';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * In-App Notification Center Service
 *
 * Provides:
 * 1. Notification dispatch with intelligent duplicate prevention.
 * 2. Strict tenant and user isolation.
 * 3. Unread count tracking, single & bulk read markers.
 * 4. User preference configuration.
 * 5. Resilient offline fallback and DB persistence.
 */
export class NotificationService {
  private static instance: NotificationService | null = null;

  // In-memory cache: id -> NotificationEvent
  private notifications = new Map<string, NotificationEvent>();

  // Preferences cache: `${tenantId}:${userId}` -> NotificationPreference
  private preferences = new Map<string, NotificationPreference>();

  // Deduplication window in milliseconds (5 minutes)
  private readonly DEDUP_WINDOW_MS = 5 * 60 * 1000;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public static resetInstance(): void {
    if (NotificationService.instance) {
      NotificationService.instance.clear();
    }
    NotificationService.instance = null;
  }

  public clear(): void {
    this.notifications.clear();
    this.preferences.clear();
  }

  /**
   * Dispatch an in-app notification with deduplication
   */
  public async dispatchNotification(
    tenantId: string,
    input: {
      recipientUserId: string;
      eventType: NotificationEventType;
      title: string;
      message: string;
      referenceType?: string | null;
      referenceId?: string | null;
      metadataJson?: Record<string, any>;
    }
  ): Promise<{ dispatched: boolean; notification: NotificationEvent; isDuplicate?: boolean }> {
    const now = new Date();

    // Check duplicate prevention if referenceId and referenceType are provided
    if (input.referenceId && input.referenceType) {
      const existing = Array.from(this.notifications.values()).find((n) => {
        return (
          n.tenantId === tenantId &&
          n.recipientUserId === input.recipientUserId &&
          n.eventType === input.eventType &&
          n.referenceType === input.referenceType &&
          n.referenceId === input.referenceId &&
          now.getTime() - new Date(n.createdAt).getTime() < this.DEDUP_WINDOW_MS
        );
      });

      if (existing) {
        return {
          dispatched: false,
          notification: existing,
          isDuplicate: true
        };
      }
    }

    const id = crypto.randomUUID();
    const event: NotificationEvent = {
      id,
      tenantId,
      recipientUserId: input.recipientUserId,
      eventType: input.eventType,
      title: input.title,
      message: input.message,
      referenceType: input.referenceType || null,
      referenceId: input.referenceId || null,
      isRead: false,
      readAt: null,
      metadataJson: input.metadataJson || {},
      createdAt: now
    };

    this.notifications.set(id, event);

    // Attempt DB persistence
    try {
      const db = getDb();
      if ((schema as any).notificationEvents) {
        await db.insert((schema as any).notificationEvents).values({
          id: event.id,
          tenantId: event.tenantId,
          recipientUserId: event.recipientUserId,
          eventType: event.eventType,
          title: event.title,
          message: event.message,
          referenceType: event.referenceType,
          referenceId: event.referenceId,
          isRead: event.isRead,
          readAt: event.readAt,
          metadataJson: event.metadataJson,
          createdAt: event.createdAt
        });
      } else if ((schema as any).notifications) {
        // Compatibility with legacy notifications table
        await db.insert((schema as any).notifications).values({
          id: event.id,
          tenantId: event.tenantId,
          recipientUserId: event.recipientUserId,
          title: event.title,
          message: event.message,
          type: 'system',
          isRead: event.isRead,
          createdAt: event.createdAt,
          updatedAt: event.createdAt
        });
      }
    } catch {
      // Resilient fallback
    }

    return {
      dispatched: true,
      notification: event,
      isDuplicate: false
    };
  }

  /**
   * Get paginated notifications and unread count for user in tenant
   */
  public async getNotifications(
    tenantId: string,
    recipientUserId: string,
    options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
  ): Promise<{ notifications: NotificationEvent[]; total: number; unreadCount: number }> {
    const { unreadOnly = false, limit = 50, offset = 0 } = options;

    // Check DB first if available
    try {
      const db = getDb();
      if ((schema as any).notificationEvents) {
        const query = db
          .select()
          .from((schema as any).notificationEvents)
          .where(
            unreadOnly
              ? and(
                  eq((schema as any).notificationEvents.tenantId, tenantId),
                  eq((schema as any).notificationEvents.recipientUserId, recipientUserId),
                  eq((schema as any).notificationEvents.isRead, false)
                )
              : and(
                  eq((schema as any).notificationEvents.tenantId, tenantId),
                  eq((schema as any).notificationEvents.recipientUserId, recipientUserId)
                )
          )
          .orderBy(desc((schema as any).notificationEvents.createdAt));

        const rows = await query;
        if (rows && rows.length > 0) {
          const mapped: NotificationEvent[] = rows.map((r: any) => ({
            id: r.id,
            tenantId: r.tenantId,
            recipientUserId: r.recipientUserId,
            eventType: r.eventType,
            title: r.title,
            message: r.message,
            referenceType: r.referenceType,
            referenceId: r.referenceId,
            isRead: Boolean(r.isRead),
            readAt: r.readAt,
            metadataJson: r.metadataJson || {},
            createdAt: r.createdAt
          }));

          const unreadCount = mapped.filter((n) => !n.isRead).length;
          const paged = mapped.slice(offset, offset + limit);
          return { notifications: paged, total: mapped.length, unreadCount };
        }
      }
    } catch {
      // In-memory fallback
    }

    const userNotifs = Array.from(this.notifications.values())
      .filter((n) => n.tenantId === tenantId && n.recipientUserId === recipientUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = userNotifs.filter((n) => !n.isRead).length;
    const filtered = unreadOnly ? userNotifs.filter((n) => !n.isRead) : userNotifs;
    const paged = filtered.slice(offset, offset + limit);

    return {
      notifications: paged,
      total: filtered.length,
      unreadCount
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(
    tenantId: string,
    recipientUserId: string,
    notificationId: string
  ): Promise<NotificationEvent | null> {
    const notif = this.notifications.get(notificationId);
    if (!notif || notif.tenantId !== tenantId || notif.recipientUserId !== recipientUserId) {
      return null;
    }

    notif.isRead = true;
    notif.readAt = new Date();
    this.notifications.set(notificationId, notif);

    // Update DB
    try {
      const db = getDb();
      if ((schema as any).notificationEvents) {
        await db
          .update((schema as any).notificationEvents)
          .set({ isRead: true, readAt: notif.readAt })
          .where(
            and(
              eq((schema as any).notificationEvents.id, notificationId),
              eq((schema as any).notificationEvents.tenantId, tenantId)
            )
          );
      }
    } catch {
      // Fallback
    }

    return notif;
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(
    tenantId: string,
    recipientUserId: string
  ): Promise<{ count: number }> {
    let count = 0;
    const now = new Date();

    for (const [id, notif] of this.notifications.entries()) {
      if (notif.tenantId === tenantId && notif.recipientUserId === recipientUserId && !notif.isRead) {
        notif.isRead = true;
        notif.readAt = now;
        this.notifications.set(id, notif);
        count++;
      }
    }

    // Update DB
    try {
      const db = getDb();
      if ((schema as any).notificationEvents) {
        await db
          .update((schema as any).notificationEvents)
          .set({ isRead: true, readAt: now })
          .where(
            and(
              eq((schema as any).notificationEvents.tenantId, tenantId),
              eq((schema as any).notificationEvents.recipientUserId, recipientUserId),
              eq((schema as any).notificationEvents.isRead, false)
            )
          );
      }
    } catch {
      // Fallback
    }

    return { count };
  }

  /**
   * Get user notification preferences
   */
  public async getPreferences(
    tenantId: string,
    userId: string
  ): Promise<NotificationPreference> {
    const key = `${tenantId}:${userId}`;
    const pref = this.preferences.get(key);
    if (pref) {
      return pref;
    }

    const defaultPref: NotificationPreference = {
      emailNotifications: true,
      inAppNotifications: true,
      driveAnnouncements: true,
      workflowAlerts: true,
      approvalRequests: true
    };

    this.preferences.set(key, defaultPref);
    return defaultPref;
  }

  /**
   * Update user notification preferences
   */
  public async updatePreferences(
    tenantId: string,
    userId: string,
    updated: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const current = await this.getPreferences(tenantId, userId);
    const merged: NotificationPreference = {
      ...current,
      ...updated
    };

    const key = `${tenantId}:${userId}`;
    this.preferences.set(key, merged);
    return merged;
  }
}

export const notificationService = NotificationService.getInstance();
