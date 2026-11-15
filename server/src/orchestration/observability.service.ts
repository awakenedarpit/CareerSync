import crypto from 'crypto';
import type {
  AgentExecutionEvent,
  AgentName,
  ExecutionEventFilter,
  ObservabilityStats
} from './orchestration.types';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'jwt',
  'apikey',
  'api_key',
  'authorization',
  'email',
  'phone',
  'phonenumber',
  'ssn',
  'aadhaar',
  'creditcard',
  'cardnumber'
]);

/**
 * Deep sanitization function to ensure ZERO PII and ZERO secrets in telemetry
 */
export function sanitizeTelemetryPayload(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Check if looks like a JWT
    if (/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(data) && data.length > 50) {
      return '[REDACTED_JWT]';
    }
    // Check if looks like email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      return '[REDACTED_EMAIL]';
    }
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeTelemetryPayload(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeTelemetryPayload(value);
      }
    }
    return sanitized;
  }

  return String(data);
}

/**
 * Structured Platform Observability Service
 */
export class ObservabilityService {
  private static instance: ObservabilityService | null = null;

  private events: AgentExecutionEvent[] = [];

  // Metrics aggregations
  private executionCounts = {
    total: 0,
    successful: 0,
    failed: 0,
    waitingApproval: 0,
    retries: 0,
    fallbacks: 0,
    totalDurationMs: 0
  };

  private agentCalls: Record<
    AgentName,
    { totalCalls: number; errorCount: number; lastSeen: string }
  > = {
    STUDENT_PROFILING_AGENT: { totalCalls: 0, errorCount: 0, lastSeen: new Date().toISOString() },
    INDUSTRY_SKILL_GAP_AGENT: { totalCalls: 0, errorCount: 0, lastSeen: new Date().toISOString() },
    PREDICTIVE_PLACEMENT_AGENT: { totalCalls: 0, errorCount: 0, lastSeen: new Date().toISOString() },
    PLACEMENT_ORCHESTRATION_AGENT: { totalCalls: 0, errorCount: 0, lastSeen: new Date().toISOString() },
    CENTRAL_ORCHESTRATOR: { totalCalls: 0, errorCount: 0, lastSeen: new Date().toISOString() }
  };

  public static getInstance(): ObservabilityService {
    if (!ObservabilityService.instance) {
      ObservabilityService.instance = new ObservabilityService();
    }
    return ObservabilityService.instance;
  }

  public static resetInstance(): void {
    if (ObservabilityService.instance) {
      ObservabilityService.instance.clear();
    }
    ObservabilityService.instance = null;
  }

  public clear(): void {
    this.events = [];
    this.executionCounts = {
      total: 0,
      successful: 0,
      failed: 0,
      waitingApproval: 0,
      retries: 0,
      fallbacks: 0,
      totalDurationMs: 0
    };
    for (const key of Object.keys(this.agentCalls) as AgentName[]) {
      this.agentCalls[key] = {
        totalCalls: 0,
        errorCount: 0,
        lastSeen: new Date().toISOString()
      };
    }
  }

  /**
   * Generates a unique traceable correlation ID
   */
  public generateCorrelationId(): string {
    return `corr-${crypto.randomUUID()}`;
  }

  /**
   * Record structured execution event
   */
  public async recordEvent(
    tenantId: string,
    event: {
      workflowId?: string | null;
      eventType: string;
      agentName: AgentName;
      payloadJson: Record<string, any>;
      correlationId?: string;
      executionTimeMs?: number | null;
    }
  ): Promise<AgentExecutionEvent> {
    const correlationId = event.correlationId || this.generateCorrelationId();
    const sanitizedPayload = sanitizeTelemetryPayload(event.payloadJson);

    const record: AgentExecutionEvent = {
      id: crypto.randomUUID(),
      tenantId,
      workflowId: event.workflowId || null,
      eventType: event.eventType,
      agentName: event.agentName,
      payloadJson: sanitizedPayload,
      correlationId,
      executionTimeMs: event.executionTimeMs ?? null,
      createdAt: new Date()
    };

    this.events.unshift(record);

    // Update agent tracking
    if (this.agentCalls[event.agentName]) {
      this.agentCalls[event.agentName].totalCalls++;
      this.agentCalls[event.agentName].lastSeen = new Date().toISOString();
      if (
        event.eventType.includes('FAIL') ||
        event.eventType.includes('ERROR') ||
        event.payloadJson?.status === 'FAILED'
      ) {
        this.agentCalls[event.agentName].errorCount++;
      }
    }

    // Try DB insert if available
    try {
      const db = getDb();
      if ((schema as any).agentExecutionEvents) {
        await db.insert((schema as any).agentExecutionEvents).values({
          id: record.id,
          tenantId: record.tenantId,
          workflowId: record.workflowId,
          eventType: record.eventType,
          agentName: record.agentName,
          payloadJson: record.payloadJson,
          correlationId: record.correlationId,
          executionTimeMs: record.executionTimeMs,
          createdAt: record.createdAt
        });
      }
    } catch {
      // In-memory telemetry holds ground
    }

    return record;
  }

  /**
   * Record execution lifecycle metrics
   */
  public recordExecutionMetric(metric: {
    status: 'COMPLETED' | 'FAILED' | 'WAITING_FOR_REVIEW';
    durationMs?: number;
    retried?: boolean;
    fallbackUsed?: boolean;
  }): void {
    this.executionCounts.total++;
    if (metric.status === 'COMPLETED') {
      this.executionCounts.successful++;
    } else if (metric.status === 'FAILED') {
      this.executionCounts.failed++;
    } else if (metric.status === 'WAITING_FOR_REVIEW') {
      this.executionCounts.waitingApproval++;
    }

    if (metric.durationMs && metric.durationMs > 0) {
      this.executionCounts.totalDurationMs += metric.durationMs;
    }
    if (metric.retried) {
      this.executionCounts.retries++;
    }
    if (metric.fallbackUsed) {
      this.executionCounts.fallbacks++;
    }
  }

  /**
   * Get platform observability stats
   */
  public async getStats(_tenantId?: string): Promise<ObservabilityStats> {
    const total = this.executionCounts.total;
    const successful = this.executionCounts.successful;
    const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 100;
    const averageDurationMs =
      total > 0 ? Math.round(this.executionCounts.totalDurationMs / total) : 0;

    const agentHealth: ObservabilityStats['agentHealth'] = {} as any;

    for (const [agent, stat] of Object.entries(this.agentCalls)) {
      const agentKey = agent as AgentName;
      const errorRate =
        stat.totalCalls > 0 ? Math.round((stat.errorCount / stat.totalCalls) * 100) : 0;
      const status = errorRate > 25 ? 'DEGRADED' : 'HEALTHY';
      agentHealth[agentKey] = {
        status,
        totalCalls: stat.totalCalls,
        errorRate,
        lastSeen: stat.lastSeen
      };
    }

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: this.executionCounts.failed,
      waitingApprovalCount: this.executionCounts.waitingApproval,
      averageDurationMs,
      retryCount: this.executionCounts.retries,
      fallbackCount: this.executionCounts.fallbacks,
      successRate,
      agentHealth
    };
  }

  /**
   * Query filterable execution event log
   */
  public async getEvents(
    tenantId: string,
    filter: ExecutionEventFilter = {}
  ): Promise<{ events: AgentExecutionEvent[]; total: number }> {
    const { workflowId, agentName, eventType, correlationId, limit = 50, offset = 0 } = filter;

    // Check DB first if available
    try {
      const db = getDb();
      if ((schema as any).agentExecutionEvents) {
        const conditions = [eq((schema as any).agentExecutionEvents.tenantId, tenantId)];
        if (workflowId) {
          conditions.push(eq((schema as any).agentExecutionEvents.workflowId, workflowId));
        }
        if (agentName) {
          conditions.push(eq((schema as any).agentExecutionEvents.agentName, agentName));
        }
        if (correlationId) {
          conditions.push(eq((schema as any).agentExecutionEvents.correlationId, correlationId));
        }

        const rows = await db
          .select()
          .from((schema as any).agentExecutionEvents)
          .where(and(...conditions))
          .orderBy(desc((schema as any).agentExecutionEvents.createdAt))
          .limit(limit)
          .offset(offset);

        if (rows && rows.length > 0) {
          return {
            events: rows.map((r: any) => ({
              id: r.id,
              tenantId: r.tenantId,
              workflowId: r.workflowId,
              eventType: r.eventType,
              agentName: r.agentName,
              payloadJson: r.payloadJson,
              correlationId: r.correlationId,
              executionTimeMs: r.executionTimeMs,
              createdAt: r.createdAt
            })),
            total: rows.length
          };
        }
      }
    } catch {
      // In-memory fallback
    }

    let filtered = this.events.filter((e) => e.tenantId === tenantId);

    if (workflowId) {
      filtered = filtered.filter((e) => e.workflowId === workflowId);
    }
    if (agentName) {
      filtered = filtered.filter((e) => e.agentName === agentName);
    }
    if (eventType) {
      filtered = filtered.filter((e) => e.eventType === eventType);
    }
    if (correlationId) {
      filtered = filtered.filter((e) => e.correlationId === correlationId);
    }

    const paged = filtered.slice(offset, offset + limit);

    return {
      events: paged,
      total: filtered.length
    };
  }
}

export const observabilityService = ObservabilityService.getInstance();
