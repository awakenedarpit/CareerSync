import crypto from 'crypto';
import type {
  ModerationReport,
  NewModerationReport,
  ModerationAction,
  NewModerationAction,
  ModerationReportStatus,
  ModerationActionType
} from '../db/schema';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface CreateReportInput {
  reportedUserId: string;
  entityType: 'MENTORSHIP' | 'PEER_INTERVIEW' | 'COLLABORATION_ROOM' | string;
  entityId: string;
  reason: string;
  description: string;
  evidenceJson?: Record<string, any>;
}

export interface ResolveReportInput {
  status: ModerationReportStatus;
  actionType: ModerationActionType;
  notes?: string;
  actionDurationHours?: number;
}

export interface ParticipantBlockRecord {
  id: string;
  tenantId: string;
  blockerUserId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: Date;
}

export class ModerationService {
  private static instance: ModerationService | null = null;

  // In-memory repositories for resilient operation and high-speed test execution
  private reports = new Map<string, ModerationReport>();
  private actions = new Map<string, ModerationAction>();
  private blocks = new Map<string, ParticipantBlockRecord>();

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  public static resetInstance(): void {
    if (ModerationService.instance) {
      ModerationService.instance.clear();
    }
    ModerationService.instance = null;
  }

  public clear(): void {
    this.reports.clear();
    this.actions.clear();
    this.blocks.clear();
  }

  /**
   * Submit an incident report against a participant (mentorship, peer interview, collaboration)
   */
  public async createReport(
    tenantId: string,
    reporterUserId: string,
    input: CreateReportInput
  ): Promise<ModerationReport> {
    if (!reporterUserId) {
      throw new Error('Reporter user ID is required.');
    }
    if (!input.reportedUserId) {
      throw new Error('Reported user ID is required.');
    }
    if (reporterUserId === input.reportedUserId) {
      throw new Error('Cannot submit an incident report against yourself.');
    }
    if (!input.reason) {
      throw new Error('Report reason is required.');
    }

    const reportId = crypto.randomUUID();
    const now = new Date();

    const reportRecord: ModerationReport = {
      id: reportId,
      tenantId,
      reporterUserId,
      reportedUserId: input.reportedUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      reason: input.reason,
      description: input.description || '',
      evidenceJson: input.evidenceJson || {},
      status: 'PENDING_REVIEW',
      investigatedBy: null,
      investigationNotes: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now
    };

    // Store in-memory
    this.reports.set(reportId, reportRecord);

    // Persist to Postgres if available
    try {
      const db = getDb();
      await db.insert(schema.moderationReports).values({
        id: reportId,
        tenantId,
        reporterUserId,
        reportedUserId: input.reportedUserId,
        entityType: input.entityType,
        entityId: input.entityId,
        reason: input.reason,
        description: input.description || '',
        evidenceJson: input.evidenceJson || {},
        status: 'PENDING_REVIEW',
        createdAt: now,
        updatedAt: now
      });
    } catch {
      // Offline / testing fallback
    }

    return reportRecord;
  }

  /**
   * Block a participant to prevent them from joining rooms or requesting mentorship
   */
  public async blockParticipant(
    tenantId: string,
    blockerUserId: string,
    blockedUserId: string,
    reason?: string
  ): Promise<ParticipantBlockRecord> {
    if (blockerUserId === blockedUserId) {
      throw new Error('Cannot block yourself.');
    }

    const blockKey = `${tenantId}:${blockerUserId}:${blockedUserId}`;
    const blockRecord: ParticipantBlockRecord = {
      id: crypto.randomUUID(),
      tenantId,
      blockerUserId,
      blockedUserId,
      reason,
      createdAt: new Date()
    };

    this.blocks.set(blockKey, blockRecord);

    // Also record a moderation action for audit
    await this.recordAction(tenantId, {
      reportId: null,
      actionType: 'PARTICIPANT_BLOCKED',
      targetUserId: blockedUserId,
      executedBy: blockerUserId,
      reason: reason || 'Direct participant block',
      notes: `User ${blockerUserId} blocked user ${blockedUserId}`
    });

    return blockRecord;
  }

  /**
   * Unblock a participant
   */
  public async unblockParticipant(
    tenantId: string,
    blockerUserId: string,
    blockedUserId: string
  ): Promise<boolean> {
    const blockKey = `${tenantId}:${blockerUserId}:${blockedUserId}`;
    return this.blocks.delete(blockKey);
  }

  /**
   * Checks whether communication/interaction is blocked between two users (bidirectional check)
   */
  public async isBlocked(tenantId: string, userA: string, userB: string): Promise<boolean> {
    const key1 = `${tenantId}:${userA}:${userB}`;
    const key2 = `${tenantId}:${userB}:${userA}`;

    if (this.blocks.has(key1) || this.blocks.has(key2)) {
      return true;
    }

    // Check actions for account suspension
    for (const action of this.actions.values()) {
      if (
        action.tenantId === tenantId &&
        (action.targetUserId === userA || action.targetUserId === userB) &&
        action.actionType === 'ACCOUNT_SUSPENDED'
      ) {
        if (!action.validUntil || new Date(action.validUntil) > new Date()) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Retrieve list of blocked user IDs for a given blocker
   */
  public getBlockedUserIds(tenantId: string, blockerUserId: string): string[] {
    const blocked: string[] = [];
    for (const record of this.blocks.values()) {
      if (record.tenantId === tenantId && record.blockerUserId === blockerUserId) {
        blocked.push(record.blockedUserId);
      }
    }
    return blocked;
  }

  /**
   * TPO-Only: Retrieve moderation report queue with tenant isolation
   */
  public async getTpoReportQueue(
    tenantId: string,
    filters?: { status?: ModerationReportStatus; entityType?: string }
  ): Promise<ModerationReport[]> {
    const reports: ModerationReport[] = [];

    for (const report of this.reports.values()) {
      if (report.tenantId !== tenantId) continue;
      if (filters?.status && report.status !== filters.status) continue;
      if (filters?.entityType && report.entityType !== filters.entityType) continue;
      reports.push(report);
    }

    // Sort newest first
    return reports.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get single report by ID (tenant-scoped)
   */
  public async getReportById(tenantId: string, reportId: string): Promise<ModerationReport | null> {
    const report = this.reports.get(reportId);
    if (!report || report.tenantId !== tenantId) {
      return null;
    }
    return report;
  }

  /**
   * TPO-Only: Resolve or dismiss an incident report with administrative enforcement
   */
  public async resolveReport(
    tenantId: string,
    reportId: string,
    reviewerUserId: string,
    input: ResolveReportInput
  ): Promise<{ report: ModerationReport; actionRecord?: ModerationAction }> {
    const report = await this.getReportById(tenantId, reportId);
    if (!report) {
      throw new Error(`Moderation report ${reportId} not found in tenant ${tenantId}.`);
    }

    const now = new Date();
    report.status = input.status;
    report.investigatedBy = reviewerUserId;
    report.investigationNotes = input.notes || null;
    report.resolvedAt = now;
    report.updatedAt = now;

    this.reports.set(reportId, report);

    let actionRecord: ModerationAction | undefined;

    if (input.actionType && input.actionType !== 'NO_ACTION') {
      actionRecord = await this.recordAction(tenantId, {
        reportId,
        actionType: input.actionType,
        targetUserId: report.reportedUserId,
        executedBy: reviewerUserId,
        reason: report.reason,
        notes: input.notes,
        actionDurationHours: input.actionDurationHours
      });

      // If action is participant block, record it in blocks
      if (input.actionType === 'PARTICIPANT_BLOCKED') {
        const blockKey = `${tenantId}:${report.reporterUserId}:${report.reportedUserId}`;
        this.blocks.set(blockKey, {
          id: crypto.randomUUID(),
          tenantId,
          blockerUserId: report.reporterUserId,
          blockedUserId: report.reportedUserId,
          reason: input.notes || report.reason,
          createdAt: now
        });
      }
    }

    // Update in DB if available
    try {
      const db = getDb();
      await db
        .update(schema.moderationReports)
        .set({
          status: input.status,
          investigatedBy: reviewerUserId,
          investigationNotes: input.notes || null,
          resolvedAt: now,
          updatedAt: now
        })
        .where(
          and(
            eq(schema.moderationReports.id, reportId),
            eq(schema.moderationReports.tenantId, tenantId)
          )
        );
    } catch {
      // Offline fallback
    }

    return { report, actionRecord };
  }

  /**
   * Record an administrative moderation action
   */
  private async recordAction(
    tenantId: string,
    data: {
      reportId: string | null;
      actionType: ModerationActionType;
      targetUserId: string;
      executedBy: string;
      reason: string;
      notes?: string;
      actionDurationHours?: number;
    }
  ): Promise<ModerationAction> {
    const actionId = crypto.randomUUID();
    const now = new Date();
    let validUntil: Date | null = null;

    if (data.actionDurationHours && data.actionDurationHours > 0) {
      validUntil = new Date(now.getTime() + data.actionDurationHours * 3600 * 1000);
    }

    const actionRecord: ModerationAction = {
      id: actionId,
      tenantId,
      reportId: data.reportId || crypto.randomUUID(),
      actionType: data.actionType,
      targetUserId: data.targetUserId,
      executedBy: data.executedBy,
      reason: data.reason,
      actionDurationHours: data.actionDurationHours || 0,
      validUntil,
      notes: data.notes || null,
      createdAt: now
    };

    this.actions.set(actionId, actionRecord);

    try {
      const db = getDb();
      await db.insert(schema.moderationActions).values(actionRecord as any);
    } catch {
      // Offline fallback
    }

    return actionRecord;
  }

  /**
   * Retrieve all actions for audit purposes
   */
  public async getActionsForUser(tenantId: string, targetUserId: string): Promise<ModerationAction[]> {
    const list: ModerationAction[] = [];
    for (const action of this.actions.values()) {
      if (action.tenantId === tenantId && action.targetUserId === targetUserId) {
        list.push(action);
      }
    }
    return list;
  }
}

export const moderationService = ModerationService.getInstance();
