/**
 * CarrerSync Phase 15 — Agent Orchestration Engine & Central Workflow Types
 *
 * Authoritative domain models for:
 * 1. Multi-Agent Workflows & State Machines
 * 2. Step-by-Step Execution Pipeline
 * 3. Cross-Agent Event Streaming & Correlation Tracking
 * 4. Human-in-the-Loop Governance & Approvals
 * 5. In-App Notification Center
 * 6. Delegated Reviewer Registry (Faculty Coordinator Verification)
 * 7. Structured Platform Observability & Sanitized Telemetry
 */

export type AgentName =
  | 'STUDENT_PROFILING_AGENT'
  | 'INDUSTRY_SKILL_GAP_AGENT'
  | 'PREDICTIVE_PLACEMENT_AGENT'
  | 'PLACEMENT_ORCHESTRATION_AGENT'
  | 'CENTRAL_ORCHESTRATOR';

export type WorkflowStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_FOR_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRY_PENDING';

export type WorkflowTriggerType =
  | 'MANUAL_USER'
  | 'AUTOMATED_EVENT'
  | 'SCHEDULED_CRON'
  | 'AGENT_HANDOFF'
  | 'SYSTEM_DISPATCH';

export type WorkflowApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISMISSED';

export type WorkflowPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type StepExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING_FOR_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type NotificationEventType =
  | 'PROFILE_REVIEW_COMPLETED'
  | 'EVIDENCE_REQUESTED'
  | 'SKILL_VERIFIED'
  | 'ROADMAP_UPDATED'
  | 'MOCK_ASSESSMENT_COMPLETED'
  | 'DRIVE_PUBLISHED'
  | 'ELIGIBILITY_UPDATED'
  | 'INTERVIEW_SCHEDULED'
  | 'OFFER_UPDATED'
  | 'TPO_APPROVAL_REQUIRED'
  | 'WORKFLOW_FAILED'
  | 'WORKFLOW_COMPLETED'
  | 'DELEGATION_GRANTED'
  | 'DELEGATION_REVOKED';

export interface WorkflowStepExecutionContext {
  workflowId: string;
  tenantId: string;
  correlationId: string;
  initiatedBy: string;
  input: Record<string, any>;
  previousStepOutputs: Record<string, any>;
}

export interface WorkflowStepDefinition {
  id: string;
  stepName: string;
  stepIndex: number;
  responsibleAgent: AgentName;
  requiresHumanApproval?: boolean;
  timeoutMs?: number;
  execute?: (context: WorkflowStepExecutionContext) => Promise<Record<string, any>>;
}

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description: string;
  triggerType: WorkflowTriggerType;
  initiatingRoles: string[];
  responsibleAgent: AgentName;
  requiredHumanApproval: boolean;
  timeoutMs: number;
  maxRetries: number;
  inputSchema?: any; // ZodType
  outputSchema?: any; // ZodType
  steps: WorkflowStepDefinition[];
}

export interface WorkflowInstance {
  id: string;
  tenantId: string;
  workflowDefinitionId: string;
  workflowName: string;
  triggerType: WorkflowTriggerType;
  initiatedBy: string;
  idempotencyKey?: string | null;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  inputPayloadJson: Record<string, any>;
  outputResultJson?: Record<string, any> | null;
  errorDetailsJson?: Record<string, any> | null;
  executionDurationMs?: number | null;
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  steps?: WorkflowStepExecution[];
  approvals?: WorkflowApproval[];
}

export interface WorkflowStepExecution {
  id: string;
  workflowId: string;
  tenantId: string;
  stepName: string;
  stepIndex: number;
  responsibleAgent: AgentName;
  status: StepExecutionStatus;
  inputJson?: Record<string, any> | null;
  outputJson?: Record<string, any> | null;
  errorJson?: Record<string, any> | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface AgentExecutionEvent {
  id: string;
  workflowId?: string | null;
  tenantId: string;
  eventType: string;
  agentName: AgentName;
  payloadJson: Record<string, any>;
  correlationId: string;
  executionTimeMs?: number | null;
  createdAt: Date | string;
}

export interface WorkflowApproval {
  id: string;
  workflowId: string;
  tenantId: string;
  stepId?: string | null;
  actionType: string;
  requiredRole: string;
  status: WorkflowApprovalStatus;
  reviewedBy?: string | null;
  reviewerNotes?: string | null;
  reviewedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface NotificationEvent {
  id: string;
  tenantId: string;
  recipientUserId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  readAt?: Date | string | null;
  metadataJson?: Record<string, any>;
  createdAt: Date | string;
}

export interface NotificationPreference {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  driveAnnouncements: boolean;
  workflowAlerts: boolean;
  approvalRequests: boolean;
}

export interface DelegatedReviewer {
  id: string;
  tenantId: string;
  userId: string;
  delegatedBy: string;
  permissionsJson: string[];
  isActive: boolean;
  validUntil?: Date | string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDelegationDto {
  userId: string;
  permissions: string[];
  validUntil?: Date | string | null;
  notes?: string;
}

export interface CorrelationContext {
  correlationId: string;
  workflowId?: string;
  tenantId: string;
  initiatedBy?: string;
  timestamp: string;
}

export interface ObservabilityStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  waitingApprovalCount: number;
  averageDurationMs: number;
  retryCount: number;
  fallbackCount: number;
  successRate: number;
  agentHealth: Record<
    AgentName,
    {
      status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
      totalCalls: number;
      errorRate: number;
      lastSeen: string;
    }
  >;
}

export interface ExecutionEventFilter {
  workflowId?: string;
  agentName?: AgentName;
  eventType?: string;
  correlationId?: string;
  limit?: number;
  offset?: number;
}
