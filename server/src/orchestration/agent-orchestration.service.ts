import crypto from 'crypto';
import type {
  WorkflowInstance,
  WorkflowStepExecution,
  WorkflowApproval,
  WorkflowStatus,
  WorkflowPriority,
  AgentName
} from './orchestration.types';
import {
  getWorkflowDefinition,
  hasWorkflowDefinition
} from './workflow-registry';
import { delegationService } from './delegation.service';
import { notificationService } from './notification.service';
import { observabilityService } from './observability.service';
import { normalizeRole } from '../utils/roles';
import { getDb } from '../db';
import * as schema from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface InitiateWorkflowOptions {
  tenantId: string;
  initiatedBy: string;
  initiatingRole: string;
  workflowDefinitionId: string;
  inputPayload: Record<string, any>;
  idempotencyKey?: string | null;
  priority?: WorkflowPriority;
}

/**
 * Central Agent Orchestration Service
 *
 * Implements deterministic routing, strict multi-tenant RBAC, step-by-step
 * execution pipeline, human-in-the-loop approvals, and structured error handling.
 */
export class AgentOrchestrationService {
  private static instance: AgentOrchestrationService | null = null;

  // In-memory repositories for resilient fallback and fast lookups
  private workflows = new Map<string, WorkflowInstance>();
  private steps = new Map<string, WorkflowStepExecution[]>();
  private approvals = new Map<string, WorkflowApproval[]>();

  public static getInstance(): AgentOrchestrationService {
    if (!AgentOrchestrationService.instance) {
      AgentOrchestrationService.instance = new AgentOrchestrationService();
    }
    return AgentOrchestrationService.instance;
  }

  public static resetInstance(): void {
    if (AgentOrchestrationService.instance) {
      AgentOrchestrationService.instance.clear();
    }
    AgentOrchestrationService.instance = null;
  }

  public clear(): void {
    this.workflows.clear();
    this.steps.clear();
    this.approvals.clear();
  }

  /**
   * Initiates a registered workflow with validation and idempotency check
   */
  public async initiateWorkflow(
    options: InitiateWorkflowOptions
  ): Promise<{ workflow: WorkflowInstance; isIdempotentReplay: boolean }> {
    const {
      tenantId,
      initiatedBy,
      initiatingRole,
      workflowDefinitionId,
      inputPayload,
      idempotencyKey,
      priority = 'NORMAL'
    } = options;

    // 1. Verify workflow definition exists
    const definition = getWorkflowDefinition(workflowDefinitionId);
    if (!definition) {
      throw new Error(`Workflow definition '${workflowDefinitionId}' is not registered`);
    }

    // 2. Deterministic RBAC Authorization Check (LLMs never decide authorization)
    const canonicalRole = normalizeRole(initiatingRole) || initiatingRole.toUpperCase();
    const authorized = definition.initiatingRoles.some(
      (role) => normalizeRole(role) === canonicalRole || role === canonicalRole
    );

    if (!authorized) {
      throw new Error(
        `Role '${initiatingRole}' is not authorized to initiate workflow '${workflowDefinitionId}'`
      );
    }

    // 3. Idempotency Check (Solves duplicate event/workflow execution)
    if (idempotencyKey && idempotencyKey.trim().length > 0) {
      const existing = Array.from(this.workflows.values()).find(
        (wf) => wf.tenantId === tenantId && wf.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return {
          workflow: this.hydrateWorkflowRelations(existing),
          isIdempotentReplay: true
        };
      }
    }

    // 4. Input Payload Validation against Schema
    let validatedInput = inputPayload;
    if (definition.inputSchema) {
      const parsed = definition.inputSchema.safeParse(inputPayload);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues
          .map((i: any) => `${i.path.join('.')}: ${i.message}`)
          .join(', ');
        throw new Error(`Workflow input validation failed: ${errorMsg}`);
      }
      validatedInput = parsed.data;
    }

    // 5. Create Workflow Instance
    const now = new Date();
    const workflowId = crypto.randomUUID();
    const correlationId = observabilityService.generateCorrelationId();

    const workflowInstance: WorkflowInstance = {
      id: workflowId,
      tenantId,
      workflowDefinitionId: definition.workflowId,
      workflowName: definition.name,
      triggerType: definition.triggerType,
      initiatedBy,
      idempotencyKey: idempotencyKey || null,
      status: 'QUEUED',
      priority,
      inputPayloadJson: validatedInput,
      outputResultJson: null,
      errorDetailsJson: null,
      executionDurationMs: null,
      timeoutMs: definition.timeoutMs,
      retryCount: 0,
      maxRetries: definition.maxRetries,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    // Initialize Steps
    const stepInstances: WorkflowStepExecution[] = definition.steps.map((step) => ({
      id: crypto.randomUUID(),
      workflowId,
      tenantId,
      stepName: step.stepName,
      stepIndex: step.stepIndex,
      responsibleAgent: step.responsibleAgent,
      status: 'PENDING',
      inputJson: null,
      outputJson: null,
      errorJson: null,
      startedAt: null,
      completedAt: null,
      createdAt: now
    }));

    this.workflows.set(workflowId, workflowInstance);
    this.steps.set(workflowId, stepInstances);
    this.approvals.set(workflowId, []);

    // Record Telemetry
    await observabilityService.recordEvent(tenantId, {
      workflowId,
      eventType: 'WORKFLOW_INITIATED',
      agentName: definition.responsibleAgent,
      payloadJson: {
        workflowDefinitionId: definition.workflowId,
        priority,
        stepCount: definition.steps.length
      },
      correlationId
    });

    // 6. Execute Workflow Pipeline
    await this.executeWorkflowPipeline(workflowId, correlationId);

    const updated = this.workflows.get(workflowId)!;
    return {
      workflow: this.hydrateWorkflowRelations(updated),
      isIdempotentReplay: false
    };
  }

  /**
   * Executes the sequential step pipeline, handling human approval gates and retries
   */
  private async executeWorkflowPipeline(
    workflowId: string,
    correlationId: string
  ): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    const definition = getWorkflowDefinition(workflow.workflowDefinitionId);
    if (!definition) return;

    workflow.status = 'RUNNING';
    workflow.startedAt = new Date();
    workflow.updatedAt = new Date();
    const startTime = Date.now();

    const stepExecutions = this.steps.get(workflowId) || [];
    const stepOutputs: Record<string, any> = {};

    for (let i = 0; i < definition.steps.length; i++) {
      const stepDef = definition.steps[i];
      const stepExec = stepExecutions.find((s) => s.stepIndex === stepDef.stepIndex);
      if (!stepExec) continue;

      // Skip already completed steps (e.g. after approval resume)
      if (stepExec.status === 'COMPLETED') {
        if (stepExec.outputJson) {
          stepOutputs[stepDef.id] = stepExec.outputJson;
        }
        continue;
      }

      // Check if step requires human-in-the-loop approval gate
      if (stepDef.requiresHumanApproval) {
        stepExec.status = 'WAITING_FOR_APPROVAL';
        stepExec.startedAt = new Date();
        workflow.status = 'WAITING_FOR_REVIEW';
        workflow.updatedAt = new Date();

        // Create approval record
        const approvalRecord: WorkflowApproval = {
          id: crypto.randomUUID(),
          workflowId,
          tenantId: workflow.tenantId,
          stepId: stepExec.id,
          actionType: 'TPO_STEP_APPROVAL',
          requiredRole: 'TPO_ADMIN',
          status: 'PENDING',
          reviewedBy: null,
          reviewerNotes: null,
          reviewedAt: null,
          createdAt: new Date()
        };

        const existingApprovals = this.approvals.get(workflowId) || [];
        existingApprovals.push(approvalRecord);
        this.approvals.set(workflowId, existingApprovals);

        // Record telemetry and notify TPO
        await observabilityService.recordEvent(workflow.tenantId, {
          workflowId,
          eventType: 'WORKFLOW_WAITING_FOR_REVIEW',
          agentName: stepDef.responsibleAgent,
          payloadJson: {
            stepIndex: stepDef.stepIndex,
            stepName: stepDef.stepName,
            requiredRole: 'TPO_ADMIN'
          },
          correlationId
        });

        observabilityService.recordExecutionMetric({
          status: 'WAITING_FOR_REVIEW'
        });

        await notificationService.dispatchNotification(workflow.tenantId, {
          recipientUserId: workflow.initiatedBy,
          eventType: 'TPO_APPROVAL_REQUIRED',
          title: `Action Required: ${definition.name}`,
          message: `Step '${stepDef.stepName}' halted and requires institutional TPO authorization.`,
          referenceType: 'WORKFLOW',
          referenceId: workflowId
        });

        // Halt execution pipeline until human review is submitted
        return;
      }

      // Step Execution with retry and exponential backoff
      stepExec.status = 'RUNNING';
      stepExec.startedAt = new Date();
      stepExec.inputJson = {
        input: workflow.inputPayloadJson,
        previousStepOutputs: { ...stepOutputs }
      };

      let attempt = 0;
      let success = false;
      let lastError: any = null;

      while (attempt <= definition.maxRetries && !success) {
        attempt++;
        try {
          if (stepDef.execute) {
            const result = await stepDef.execute({
              workflowId,
              tenantId: workflow.tenantId,
              correlationId,
              initiatedBy: workflow.initiatedBy,
              input: workflow.inputPayloadJson,
              previousStepOutputs: { ...stepOutputs }
            });
            stepExec.outputJson = result;
            stepOutputs[stepDef.id] = result;
          } else {
            stepExec.outputJson = { status: 'SUCCESS' };
            stepOutputs[stepDef.id] = { status: 'SUCCESS' };
          }
          success = true;
          stepExec.status = 'COMPLETED';
          stepExec.completedAt = new Date();
        } catch (err: any) {
          lastError = err;
          if (attempt <= definition.maxRetries) {
            // Exponential backoff
            await new Promise((res) => setTimeout(res, Math.min(100 * Math.pow(2, attempt), 1000)));
          }
        }
      }

      if (!success) {
        stepExec.status = 'FAILED';
        stepExec.errorJson = { error: lastError?.message || 'Step execution failed' };
        stepExec.completedAt = new Date();

        workflow.status = 'FAILED';
        workflow.errorDetailsJson = {
          failedStep: stepDef.stepName,
          error: lastError?.message || 'Step execution failed',
          attempts: attempt
        };
        workflow.completedAt = new Date();
        workflow.executionDurationMs = Date.now() - startTime;
        workflow.updatedAt = new Date();

        await observabilityService.recordEvent(workflow.tenantId, {
          workflowId,
          eventType: 'WORKFLOW_STEP_FAILED',
          agentName: stepDef.responsibleAgent,
          payloadJson: {
            stepName: stepDef.stepName,
            error: lastError?.message
          },
          correlationId,
          executionTimeMs: Date.now() - startTime
        });

        observabilityService.recordExecutionMetric({
          status: 'FAILED',
          durationMs: Date.now() - startTime
        });

        await notificationService.dispatchNotification(workflow.tenantId, {
          recipientUserId: workflow.initiatedBy,
          eventType: 'WORKFLOW_FAILED',
          title: `Workflow Failed: ${definition.name}`,
          message: `Execution halted at step '${stepDef.stepName}': ${lastError?.message || 'Unknown error'}`,
          referenceType: 'WORKFLOW',
          referenceId: workflowId
        });

        return;
      }
    }

    // Workflow Successfully Completed
    const durationMs = Date.now() - startTime;
    workflow.status = 'COMPLETED';
    workflow.completedAt = new Date();
    workflow.executionDurationMs = durationMs;
    workflow.outputResultJson = {
      workflowId,
      definitionId: definition.workflowId,
      completedSteps: stepExecutions.length,
      stepOutputs
    };
    workflow.updatedAt = new Date();

    await observabilityService.recordEvent(workflow.tenantId, {
      workflowId,
      eventType: 'WORKFLOW_COMPLETED',
      agentName: definition.responsibleAgent,
      payloadJson: {
        completedSteps: stepExecutions.length,
        durationMs
      },
      correlationId,
      executionTimeMs: durationMs
    });

    observabilityService.recordExecutionMetric({
      status: 'COMPLETED',
      durationMs
    });

    await notificationService.dispatchNotification(workflow.tenantId, {
      recipientUserId: workflow.initiatedBy,
      eventType: 'WORKFLOW_COMPLETED',
      title: `Workflow Completed: ${definition.name}`,
      message: `Workflow '${definition.name}' completed successfully in ${durationMs}ms.`,
      referenceType: 'WORKFLOW',
      referenceId: workflowId
    });
  }

  /**
   * TPO Human Approval Action ('APPROVED' or 'REJECTED')
   */
  public async approveWorkflow(
    tenantId: string,
    workflowId: string,
    reviewedBy: string,
    reviewerRole: string,
    action: 'APPROVED' | 'REJECTED',
    reviewerNotes: string = ''
  ): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.tenantId !== tenantId) {
      throw new Error(`Workflow '${workflowId}' not found in tenant`);
    }

    if (workflow.status !== 'WAITING_FOR_REVIEW') {
      throw new Error(
        `Workflow '${workflowId}' is in status '${workflow.status}', not 'WAITING_FOR_REVIEW'`
      );
    }

    // Authorization verification for reviewer (TPO_ADMIN and SUPER_ADMIN have native authority; COLLEGE_ADMIN and others require active delegation)
    const canonical = normalizeRole(reviewerRole) || '';
    const isDirectAdmin = ['TPO_ADMIN', 'SUPER_ADMIN'].includes(canonical);
    const isDelegated = delegationService.isReviewerDelegatedSync(tenantId, reviewedBy);

    if (!isDirectAdmin && !isDelegated) {
      throw new Error(
        `User does not possess TPO authority or active faculty delegation to review workflows`
      );
    }

    const workflowApprovals = this.approvals.get(workflowId) || [];
    const pendingApproval = workflowApprovals.find((a) => a.status === 'PENDING');
    const now = new Date();

    if (pendingApproval) {
      pendingApproval.status = action;
      pendingApproval.reviewedBy = reviewedBy;
      pendingApproval.reviewerNotes = reviewerNotes;
      pendingApproval.reviewedAt = now;
    }

    const correlationId = observabilityService.generateCorrelationId();

    if (action === 'REJECTED') {
      workflow.status = 'FAILED';
      workflow.errorDetailsJson = {
        rejectionReason: reviewerNotes || 'Rejected by TPO Reviewer',
        rejectedBy: reviewedBy,
        rejectedAt: now.toISOString()
      };
      workflow.completedAt = now;
      workflow.updatedAt = now;

      // Mark waiting step as failed
      const stepExecutions = this.steps.get(workflowId) || [];
      const waitingStep = stepExecutions.find((s) => s.status === 'WAITING_FOR_APPROVAL');
      if (waitingStep) {
        waitingStep.status = 'FAILED';
        waitingStep.errorJson = { rejectionReason: reviewerNotes };
        waitingStep.completedAt = now;
      }

      await observabilityService.recordEvent(tenantId, {
        workflowId,
        eventType: 'WORKFLOW_APPROVAL_REJECTED',
        agentName: 'CENTRAL_ORCHESTRATOR',
        payloadJson: {
          reviewedBy,
          reviewerNotes
        },
        correlationId
      });

      observabilityService.recordExecutionMetric({
        status: 'FAILED'
      });

      await notificationService.dispatchNotification(tenantId, {
        recipientUserId: workflow.initiatedBy,
        eventType: 'WORKFLOW_FAILED',
        title: `Workflow Rejected: ${workflow.workflowName}`,
        message: `Institutional approval was rejected by TPO: ${reviewerNotes || 'No notes provided'}`,
        referenceType: 'WORKFLOW',
        referenceId: workflowId
      });

      return this.hydrateWorkflowRelations(workflow);
    }

    // Action === 'APPROVED': Mark step completed and resume execution
    const stepExecutions = this.steps.get(workflowId) || [];
    const waitingStep = stepExecutions.find((s) => s.status === 'WAITING_FOR_APPROVAL');
    if (waitingStep) {
      waitingStep.status = 'COMPLETED';
      waitingStep.completedAt = now;
      waitingStep.outputJson = {
        approvalInfo: {
          approved: true,
          reviewedBy,
          reviewedAt: now.toISOString(),
          reviewerNotes
        }
      };
    }

    await observabilityService.recordEvent(tenantId, {
      workflowId,
      eventType: 'WORKFLOW_APPROVAL_GRANTED',
      agentName: 'CENTRAL_ORCHESTRATOR',
      payloadJson: {
        reviewedBy,
        reviewerNotes
      },
      correlationId
    });

    // Resume pipeline execution
    await this.executeWorkflowPipeline(workflowId, correlationId);

    const updated = this.workflows.get(workflowId)!;
    return this.hydrateWorkflowRelations(updated);
  }

  /**
   * Cancel running or queued workflow
   */
  public async cancelWorkflow(
    tenantId: string,
    workflowId: string,
    cancelledBy: string
  ): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.tenantId !== tenantId) {
      throw new Error(`Workflow '${workflowId}' not found in tenant`);
    }

    if (['COMPLETED', 'CANCELLED'].includes(workflow.status)) {
      throw new Error(`Cannot cancel workflow in status '${workflow.status}'`);
    }

    workflow.status = 'CANCELLED';
    workflow.errorDetailsJson = { cancelledBy, cancelledAt: new Date().toISOString() };
    workflow.completedAt = new Date();
    workflow.updatedAt = new Date();

    await observabilityService.recordEvent(tenantId, {
      workflowId,
      eventType: 'WORKFLOW_CANCELLED',
      agentName: 'CENTRAL_ORCHESTRATOR',
      payloadJson: { cancelledBy }
    });

    return this.hydrateWorkflowRelations(workflow);
  }

  /**
   * Retry failed workflow
   */
  public async retryWorkflow(
    tenantId: string,
    workflowId: string,
    _retriedBy: string
  ): Promise<WorkflowInstance> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.tenantId !== tenantId) {
      throw new Error(`Workflow '${workflowId}' not found in tenant`);
    }

    if (workflow.status !== 'FAILED') {
      throw new Error(`Only failed workflows can be retried. Current status: '${workflow.status}'`);
    }

    workflow.retryCount++;
    workflow.errorDetailsJson = null;
    workflow.status = 'QUEUED';
    workflow.updatedAt = new Date();

    const correlationId = observabilityService.generateCorrelationId();

    await observabilityService.recordEvent(tenantId, {
      workflowId,
      eventType: 'WORKFLOW_RETRY_INITIATED',
      agentName: 'CENTRAL_ORCHESTRATOR',
      payloadJson: { retryCount: workflow.retryCount },
      correlationId
    });

    observabilityService.recordExecutionMetric({
      status: 'WAITING_FOR_REVIEW', // temporary placeholder metric
      retried: true
    });

    // Reset failed steps to pending
    const stepExecutions = this.steps.get(workflowId) || [];
    for (const step of stepExecutions) {
      if (step.status === 'FAILED') {
        step.status = 'PENDING';
        step.errorJson = null;
      }
    }

    // Resume execution
    await this.executeWorkflowPipeline(workflowId, correlationId);

    const updated = this.workflows.get(workflowId)!;
    return this.hydrateWorkflowRelations(updated);
  }

  /**
   * Get single workflow with relation hydration
   */
  public async getWorkflow(
    tenantId: string,
    workflowId: string
  ): Promise<WorkflowInstance | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.tenantId !== tenantId) {
      return null;
    }
    return this.hydrateWorkflowRelations(workflow);
  }

  /**
   * List workflows with tenant filter and pagination
   */
  public async listWorkflows(
    tenantId: string,
    options: { status?: WorkflowStatus; limit?: number; offset?: number } = {}
  ): Promise<{ workflows: WorkflowInstance[]; total: number }> {
    const { status, limit = 50, offset = 0 } = options;

    const filtered = Array.from(this.workflows.values())
      .filter((w) => w.tenantId === tenantId && (!status || w.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paged = filtered
      .slice(offset, offset + limit)
      .map((w) => this.hydrateWorkflowRelations(w));

    return {
      workflows: paged,
      total: filtered.length
    };
  }

  /**
   * Helper to attach steps and approvals to a workflow instance
   */
  private hydrateWorkflowRelations(workflow: WorkflowInstance): WorkflowInstance {
    const steps = this.steps.get(workflow.id) || [];
    const approvals = this.approvals.get(workflow.id) || [];
    return {
      ...workflow,
      steps: [...steps],
      approvals: [...approvals]
    };
  }
}

export const agentOrchestrationService = AgentOrchestrationService.getInstance();
