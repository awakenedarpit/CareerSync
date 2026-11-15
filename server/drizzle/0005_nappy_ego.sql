CREATE TYPE "public"."agent_name_enum" AS ENUM('STUDENT_PROFILING_AGENT', 'INDUSTRY_SKILL_GAP_AGENT', 'PREDICTIVE_PLACEMENT_AGENT', 'PLACEMENT_ORCHESTRATION_AGENT', 'CENTRAL_ORCHESTRATOR');--> statement-breakpoint
CREATE TYPE "public"."notification_event_type_enum" AS ENUM('PROFILE_REVIEW_COMPLETED', 'EVIDENCE_REQUESTED', 'SKILL_VERIFIED', 'ROADMAP_UPDATED', 'MOCK_ASSESSMENT_COMPLETED', 'DRIVE_PUBLISHED', 'ELIGIBILITY_UPDATED', 'INTERVIEW_SCHEDULED', 'OFFER_UPDATED', 'TPO_APPROVAL_REQUIRED', 'WORKFLOW_FAILED', 'WORKFLOW_COMPLETED', 'DELEGATION_GRANTED', 'DELEGATION_REVOKED');--> statement-breakpoint
CREATE TYPE "public"."workflow_approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."workflow_status_enum" AS ENUM('QUEUED', 'RUNNING', 'WAITING_FOR_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED', 'RETRY_PENDING');--> statement-breakpoint
CREATE TYPE "public"."workflow_trigger_type_enum" AS ENUM('MANUAL_USER', 'AUTOMATED_EVENT', 'SCHEDULED_CRON', 'AGENT_HANDOFF', 'SYSTEM_DISPATCH');--> statement-breakpoint
CREATE TABLE "agent_execution_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid,
	"tenant_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"agent_name" "agent_name_enum" NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"correlation_id" varchar(255),
	"execution_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_workflow_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"step_id" uuid,
	"action_type" varchar(100) NOT NULL,
	"required_role" varchar(50) DEFAULT 'TPO_ADMIN' NOT NULL,
	"status" "workflow_approval_status_enum" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" uuid,
	"reviewer_notes" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"step_name" varchar(150) NOT NULL,
	"step_index" integer NOT NULL,
	"responsible_agent" "agent_name_enum" NOT NULL,
	"status" "workflow_status_enum" DEFAULT 'QUEUED' NOT NULL,
	"input_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_json" jsonb DEFAULT '{}'::jsonb,
	"error_json" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delegated_reviewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"delegated_by" uuid NOT NULL,
	"permissions_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_until" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"event_type" "notification_event_type_enum" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"reference_type" varchar(100),
	"reference_id" varchar(255),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_workflows" ALTER COLUMN "target_entity_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ALTER COLUMN "target_entity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ALTER COLUMN "current_stage" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ALTER COLUMN "state_history" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "workflow_definition_id" varchar(150) DEFAULT 'CENTRAL_WORKFLOW' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "trigger_type" "workflow_trigger_type_enum" DEFAULT 'MANUAL_USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "initiated_by" uuid;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "idempotency_key" varchar(255);--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "status" "workflow_status_enum" DEFAULT 'QUEUED' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "priority" varchar(50) DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "input_payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "output_result_json" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "error_details_json" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "execution_duration_ms" integer;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "timeout_ms" integer DEFAULT 300000 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "max_retries" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "agent_execution_events" ADD CONSTRAINT "agent_execution_events_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution_events" ADD CONSTRAINT "agent_execution_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_approvals" ADD CONSTRAINT "agent_workflow_approvals_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_approvals" ADD CONSTRAINT "agent_workflow_approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_approvals" ADD CONSTRAINT "agent_workflow_approvals_step_id_agent_workflow_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."agent_workflow_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_approvals" ADD CONSTRAINT "agent_workflow_approvals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_steps" ADD CONSTRAINT "agent_workflow_steps_workflow_id_agent_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."agent_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflow_steps" ADD CONSTRAINT "agent_workflow_steps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_reviewers" ADD CONSTRAINT "delegated_reviewers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_reviewers" ADD CONSTRAINT "delegated_reviewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delegated_reviewers" ADD CONSTRAINT "delegated_reviewers_delegated_by_users_id_fk" FOREIGN KEY ("delegated_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exec_events_workflow" ON "agent_execution_events" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_exec_events_tenant" ON "agent_execution_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_exec_events_agent" ON "agent_execution_events" USING btree ("agent_name");--> statement-breakpoint
CREATE INDEX "idx_exec_events_type" ON "agent_execution_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_exec_events_correlation" ON "agent_execution_events" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "idx_exec_events_created_at" ON "agent_execution_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_workflow_approvals_workflow" ON "agent_workflow_approvals" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_approvals_tenant" ON "agent_workflow_approvals" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_approvals_step" ON "agent_workflow_approvals" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_approvals_status" ON "agent_workflow_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workflow_approvals_reviewer" ON "agent_workflow_approvals" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "idx_workflow_approvals_created_at" ON "agent_workflow_approvals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_workflow" ON "agent_workflow_steps" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_tenant" ON "agent_workflow_steps" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_agent" ON "agent_workflow_steps" USING btree ("responsible_agent");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_status" ON "agent_workflow_steps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_workflow_steps_created_at" ON "agent_workflow_steps" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_delegated_reviewers_tenant" ON "delegated_reviewers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_delegated_reviewers_user" ON "delegated_reviewers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_delegated_reviewers_delegated_by" ON "delegated_reviewers" USING btree ("delegated_by");--> statement-breakpoint
CREATE INDEX "idx_delegated_reviewers_active" ON "delegated_reviewers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_delegated_reviewers_created_at" ON "delegated_reviewers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_events_tenant" ON "notification_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_notification_events_recipient" ON "notification_events" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_events_type" ON "notification_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_notification_events_is_read" ON "notification_events" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notification_events_created_at" ON "notification_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_events_user_unread" ON "notification_events" USING btree ("recipient_user_id","is_read");--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD CONSTRAINT "agent_workflows_initiated_by_users_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_tenant" ON "agent_workflows" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_status" ON "agent_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_definition" ON "agent_workflows" USING btree ("workflow_definition_id");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_trigger" ON "agent_workflows" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_initiated_by" ON "agent_workflows" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_idempotency" ON "agent_workflows" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_agent_workflows_created_at" ON "agent_workflows" USING btree ("created_at");