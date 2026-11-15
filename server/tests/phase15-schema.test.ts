import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../src/db/schema';

describe('Phase 15 Schema Extensions (Autonomous Placement Orchestration Engine)', () => {
  describe('1. Authoritative Domain Enums', () => {
    it('should export workflowStatusEnum with 7 lifecycle stages', () => {
      expect(schema.workflowStatusEnum).toBeDefined();
      expect(schema.workflowStatusEnum.enumValues).toEqual([
        'QUEUED',
        'RUNNING',
        'WAITING_FOR_REVIEW',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'RETRY_PENDING'
      ]);
    });

    it('should export workflowTriggerTypeEnum with 5 dispatch triggers', () => {
      expect(schema.workflowTriggerTypeEnum).toBeDefined();
      expect(schema.workflowTriggerTypeEnum.enumValues).toEqual([
        'MANUAL_USER',
        'AUTOMATED_EVENT',
        'SCHEDULED_CRON',
        'AGENT_HANDOFF',
        'SYSTEM_DISPATCH'
      ]);
    });

    it('should export workflowApprovalStatusEnum with 4 governance statuses', () => {
      expect(schema.workflowApprovalStatusEnum).toBeDefined();
      expect(schema.workflowApprovalStatusEnum.enumValues).toEqual([
        'PENDING',
        'APPROVED',
        'REJECTED',
        'DISMISSED'
      ]);
    });

    it('should export notificationEventTypeEnum with 14 event types', () => {
      expect(schema.notificationEventTypeEnum).toBeDefined();
      expect(schema.notificationEventTypeEnum.enumValues).toEqual([
        'PROFILE_REVIEW_COMPLETED',
        'EVIDENCE_REQUESTED',
        'SKILL_VERIFIED',
        'ROADMAP_UPDATED',
        'MOCK_ASSESSMENT_COMPLETED',
        'DRIVE_PUBLISHED',
        'ELIGIBILITY_UPDATED',
        'INTERVIEW_SCHEDULED',
        'OFFER_UPDATED',
        'TPO_APPROVAL_REQUIRED',
        'WORKFLOW_FAILED',
        'WORKFLOW_COMPLETED',
        'DELEGATION_GRANTED',
        'DELEGATION_REVOKED'
      ]);
    });

    it('should export agentNameEnum with 5 specialized agent identities', () => {
      expect(schema.agentNameEnum).toBeDefined();
      expect(schema.agentNameEnum.enumValues).toEqual([
        'STUDENT_PROFILING_AGENT',
        'INDUSTRY_SKILL_GAP_AGENT',
        'PREDICTIVE_PLACEMENT_AGENT',
        'PLACEMENT_ORCHESTRATION_AGENT',
        'CENTRAL_ORCHESTRATOR'
      ]);
    });
  });

  describe('2. Table Structure & Multi-Tenant Isolation Guarantees', () => {
    it('agentWorkflows should define all required orchestration, execution, and isolation fields', () => {
      expect(schema.agentWorkflows).toBeDefined();
      const cols = getTableColumns(schema.agentWorkflows);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.workflowDefinitionId).toBeDefined();
      expect(cols.workflowName).toBeDefined();
      expect(cols.triggerType).toBeDefined();
      expect(cols.initiatedBy).toBeDefined();
      expect(cols.idempotencyKey).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.priority).toBeDefined();
      expect(cols.inputPayloadJson).toBeDefined();
      expect(cols.outputResultJson).toBeDefined();
      expect(cols.errorDetailsJson).toBeDefined();
      expect(cols.executionDurationMs).toBeDefined();
      expect(cols.timeoutMs).toBeDefined();
      expect(cols.retryCount).toBeDefined();
      expect(cols.maxRetries).toBeDefined();
      expect(cols.startedAt).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('agentWorkflowSteps should define step execution, status, and responsible agent fields', () => {
      expect(schema.agentWorkflowSteps).toBeDefined();
      const cols = getTableColumns(schema.agentWorkflowSteps);
      expect(cols.id).toBeDefined();
      expect(cols.workflowId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.stepName).toBeDefined();
      expect(cols.stepIndex).toBeDefined();
      expect(cols.responsibleAgent).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.inputJson).toBeDefined();
      expect(cols.outputJson).toBeDefined();
      expect(cols.errorJson).toBeDefined();
      expect(cols.startedAt).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('agentExecutionEvents should define event type, agent, correlation, and timing fields', () => {
      expect(schema.agentExecutionEvents).toBeDefined();
      const cols = getTableColumns(schema.agentExecutionEvents);
      expect(cols.id).toBeDefined();
      expect(cols.workflowId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.eventType).toBeDefined();
      expect(cols.agentName).toBeDefined();
      expect(cols.payloadJson).toBeDefined();
      expect(cols.correlationId).toBeDefined();
      expect(cols.executionTimeMs).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('agentWorkflowApprovals should define human-in-the-loop governance and review audit fields', () => {
      expect(schema.agentWorkflowApprovals).toBeDefined();
      const cols = getTableColumns(schema.agentWorkflowApprovals);
      expect(cols.id).toBeDefined();
      expect(cols.workflowId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.stepId).toBeDefined();
      expect(cols.actionType).toBeDefined();
      expect(cols.requiredRole).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.reviewedBy).toBeDefined();
      expect(cols.reviewerNotes).toBeDefined();
      expect(cols.reviewedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('notificationEvents should define notification event delivery, metadata, and read tracking', () => {
      expect(schema.notificationEvents).toBeDefined();
      const cols = getTableColumns(schema.notificationEvents);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.recipientUserId).toBeDefined();
      expect(cols.eventType).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.message).toBeDefined();
      expect(cols.referenceType).toBeDefined();
      expect(cols.referenceId).toBeDefined();
      expect(cols.isRead).toBeDefined();
      expect(cols.readAt).toBeDefined();
      expect(cols.metadataJson).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('delegatedReviewers should define persistent faculty review delegation with expirations', () => {
      expect(schema.delegatedReviewers).toBeDefined();
      const cols = getTableColumns(schema.delegatedReviewers);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.delegatedBy).toBeDefined();
      expect(cols.permissionsJson).toBeDefined();
      expect(cols.isActive).toBeDefined();
      expect(cols.validUntil).toBeDefined();
      expect(cols.notes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });
  });

  describe('3. Drizzle Relations Architecture', () => {
    it('should define all Phase 15 relations linking tenants, workflows, users, and steps', () => {
      expect(schema.agentWorkflowsRelations).toBeDefined();
      expect(schema.agentWorkflowStepsRelations).toBeDefined();
      expect(schema.agentExecutionEventsRelations).toBeDefined();
      expect(schema.agentWorkflowApprovalsRelations).toBeDefined();
      expect(schema.notificationEventsRelations).toBeDefined();
      expect(schema.delegatedReviewersRelations).toBeDefined();
    });

    it('should define multi-tenant relation bindings on tenantsRelations and usersRelations', () => {
      expect(schema.tenantsRelations).toBeDefined();
      expect(schema.usersRelations).toBeDefined();
    });
  });

  describe('4. Non-Destructive Migration File Verification (0005_*.sql)', () => {
    it('should locate 0005_*.sql migration and verify 100% additive structure', () => {
      const drizzleDir = path.resolve(__dirname, '../drizzle');
      const files = fs.readdirSync(drizzleDir);
      const phase15Migration = files.find((f) => f.startsWith('0005_') && f.endsWith('.sql'));

      expect(phase15Migration).toBeDefined();
      const sqlContent = fs.readFileSync(path.join(drizzleDir, phase15Migration!), 'utf-8');

      // Zero destructive commands
      expect(sqlContent).not.toMatch(/DROP\s+TABLE/i);
      expect(sqlContent).not.toMatch(/DROP\s+COLUMN/i);
      expect(sqlContent).not.toMatch(/TRUNCATE/i);

      // Verify all 5 enums created
      expect(sqlContent).toContain('CREATE TYPE "public"."workflow_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."workflow_trigger_type_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."workflow_approval_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."notification_event_type_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."agent_name_enum"');

      // Verify all Phase 15 new tables created
      expect(sqlContent).toContain('CREATE TABLE "agent_workflow_steps"');
      expect(sqlContent).toContain('CREATE TABLE "agent_execution_events"');
      expect(sqlContent).toContain('CREATE TABLE "agent_workflow_approvals"');
      expect(sqlContent).toContain('CREATE TABLE "notification_events"');
      expect(sqlContent).toContain('CREATE TABLE "delegated_reviewers"');

      // Verify agent_workflows table extended non-destructively
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "workflow_definition_id"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "trigger_type"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "initiated_by"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "idempotency_key"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "status"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "priority"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "input_payload_json"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "output_result_json"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "error_details_json"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "execution_duration_ms"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "timeout_ms"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "retry_count"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "max_retries"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "started_at"');
      expect(sqlContent).toContain('ALTER TABLE "agent_workflows" ADD COLUMN "completed_at"');

      // Verify multi-tenant isolation foreign keys
      expect(sqlContent).toContain('"agent_workflows_initiated_by_users_id_fk"');
      expect(sqlContent).toContain('"agent_workflow_steps_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"agent_execution_events_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"agent_workflow_approvals_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"notification_events_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"delegated_reviewers_tenant_id_tenants_id_fk"');

      // Verify relational foreign keys linking steps/approvals to workflows
      expect(sqlContent).toContain('"agent_workflow_steps_workflow_id_agent_workflows_id_fk"');
      expect(sqlContent).toContain('"agent_execution_events_workflow_id_agent_workflows_id_fk"');
      expect(sqlContent).toContain('"agent_workflow_approvals_workflow_id_agent_workflows_id_fk"');
    });
  });
});
