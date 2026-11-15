CREATE TYPE "public"."action_type_enum" AS ENUM('project_milestone', 'hands_on_lab', 'course_module', 'practice_problem');--> statement-breakpoint
CREATE TYPE "public"."agent_exec_status_enum" AS ENUM('success', 'fallback_used', 'failed');--> statement-breakpoint
CREATE TYPE "public"."agent_type_enum" AS ENUM('student_profiling', 'industry_skill_gap', 'predictive_analytics', 'placement_orchestration');--> statement-breakpoint
CREATE TYPE "public"."application_status_enum" AS ENUM('applied', 'eligible', 'shortlisted', 'interview_scheduled', 'offered', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."document_type_enum" AS ENUM('resume', 'academic_certificate', 'technical_certificate', 'project_evidence', 'portfolio_attachment', 'placement_document');--> statement-breakpoint
CREATE TYPE "public"."drive_status_enum" AS ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."eligibility_result_enum" AS ENUM('ELIGIBLE', 'INELIGIBLE', 'NEEDS_REVIEW', 'INSUFFICIENT_DATA');--> statement-breakpoint
CREATE TYPE "public"."evidence_type_enum" AS ENUM('github_commit', 'github_pr', 'project_repository', 'deployed_application', 'coding_assessment', 'certification');--> statement-breakpoint
CREATE TYPE "public"."extraction_status_enum" AS ENUM('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PARTIALLY_APPROVED');--> statement-breakpoint
CREATE TYPE "public"."round_type_enum" AS ENUM('online_test', 'technical_1', 'technical_2', 'hr', 'management');--> statement-breakpoint
CREATE TYPE "public"."interview_status_enum" AS ENUM('scheduled', 'cleared', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invitation_status_enum" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."job_status_enum" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_type_enum" AS ENUM('drive_announcement', 'skill_verified', 'gap_alert', 'interview_call', 'system');--> statement-breakpoint
CREATE TYPE "public"."proficiency_level_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."profile_evidence_type_enum" AS ENUM('RESUME', 'PROJECT', 'CERTIFICATE', 'ASSESSMENT', 'SELF_DECLARED');--> statement-breakpoint
CREATE TYPE "public"."profile_verification_status_enum" AS ENUM('SELF_DECLARED', 'EVIDENCE_FOUND', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_MORE_EVIDENCE');--> statement-breakpoint
CREATE TYPE "public"."readiness_category_enum" AS ENUM('READY', 'DEVELOPING', 'NEEDS_SUPPORT', 'INSUFFICIENT_DATA');--> statement-breakpoint
CREATE TYPE "public"."recruitment_job_status_enum" AS ENUM('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."review_action_enum" AS ENUM('APPROVE', 'REJECT', 'MODIFY');--> statement-breakpoint
CREATE TYPE "public"."risk_tier_enum" AS ENUM('low_risk', 'moderate_risk', 'high_risk');--> statement-breakpoint
CREATE TYPE "public"."skill_category_enum" AS ENUM('programming_languages', 'frameworks', 'databases', 'cloud_devops', 'core_cs', 'data_ai', 'soft_skills');--> statement-breakpoint
CREATE TYPE "public"."skill_state_enum" AS ENUM('Claimed', 'Observed', 'Evidence-linked', 'Verified', 'Expired');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('superadmin', 'college_admin', 'tpo_admin', 'faculty_coordinator', 'recruiter', 'student');--> statement-breakpoint
CREATE TYPE "public"."verification_status_enum" AS ENUM('pending_review', 'validated', 'rejected');--> statement-breakpoint
CREATE TABLE "academic_semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"semester_number" integer NOT NULL,
	"sgpa" numeric(4, 2) NOT NULL,
	"credits_earned" numeric(4, 1) NOT NULL,
	"backlogs_in_semester" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agent_type" "agent_type_enum" NOT NULL,
	"triggered_by" uuid,
	"execution_mode" varchar(50) NOT NULL,
	"input_payload_digest" varchar(64),
	"tokens_consumed" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"status" "agent_exec_status_enum" DEFAULT 'success' NOT NULL,
	"error_message" text,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"workflow_name" varchar(150) NOT NULL,
	"target_entity_type" varchar(50) NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"current_stage" varchar(100) NOT NULL,
	"state_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "application_status_enum" DEFAULT 'applied' NOT NULL,
	"final_decision_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(100),
	"changes_diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" varchar(45),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"domain" varchar(255),
	"location" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_name_unique" UNIQUE("name"),
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry_domain" varchar(150),
	"website" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "document_processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "job_status_enum" DEFAULT 'QUEUED' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"mime_type" varchar(127) NOT NULL,
	"file_size" integer NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"upload_status" varchar(20) DEFAULT 'completed' NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "evidence_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"evidence_type" "evidence_type_enum" NOT NULL,
	"source_url" varchar(1024) NOT NULL,
	"r2_storage_key" varchar(512),
	"file_storage_key" varchar(512),
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"verification_status" "verification_status_enum" DEFAULT 'pending_review' NOT NULL,
	"validated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"round_type" "round_type_enum" NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "interview_status_enum" DEFAULT 'scheduled' NOT NULL,
	"interviewer_feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255) NOT NULL,
	"role" "user_role_enum" NOT NULL,
	"full_name" varchar(255),
	"token" varchar(255) NOT NULL,
	"status" "invitation_status_enum" DEFAULT 'pending' NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"invited_by_user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "job_eligibility_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"result" "eligibility_result_enum" NOT NULL,
	"matched_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unmet_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"missing_information" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"explanation" text NOT NULL,
	"overridden_by" uuid,
	"override_reason" text,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruitment_job_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"job_title" varchar(200) NOT NULL,
	"job_description" text NOT NULL,
	"eligible_departments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"graduation_year" integer,
	"minimum_cgpa" numeric(4, 2),
	"required_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assessment_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deadline" timestamp with time zone,
	"status" "recruitment_job_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"experience_level" varchar(50) DEFAULT 'Fresher / Entry Level' NOT NULL,
	"ctc_lpa" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"target_role_id" uuid,
	"title" varchar(255) NOT NULL,
	"action_type" "action_type_enum" DEFAULT 'project_milestone' NOT NULL,
	"description" text,
	"estimated_hours" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_role_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"min_proficiency" "proficiency_level_enum" DEFAULT 'intermediate' NOT NULL,
	"weight" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type_enum" DEFAULT 'system' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_drives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"job_role_id" uuid NOT NULL,
	"batch_year" integer NOT NULL,
	"min_cgpa" numeric(4, 2) DEFAULT '6.00' NOT NULL,
	"max_backlogs_allowed" integer DEFAULT 0 NOT NULL,
	"eligible_departments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"registration_start" timestamp with time zone NOT NULL,
	"registration_end" timestamp with time zone NOT NULL,
	"drive_date" timestamp with time zone,
	"status" "drive_status_enum" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"drive_id" uuid,
	"probability_score" numeric(5, 4) NOT NULL,
	"risk_tier" "risk_tier_enum" DEFAULT 'moderate_risk' NOT NULL,
	"contributing_factors_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_advisory_only" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_extractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"raw_text_preview" text,
	"sanitized_text" text,
	"extracted_skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extracted_projects" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extracted_certifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"overall_confidence" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"provider_used" varchar(50) DEFAULT 'rule-based' NOT NULL,
	"status" "extraction_status_enum" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"extraction_id" uuid,
	"skill_id" uuid,
	"action" "review_action_enum" NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewer_role" varchar(50) NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_skill_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_name" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"proficiency_claim" varchar(50),
	"evidence_type" "profile_evidence_type_enum" NOT NULL,
	"document_id" uuid,
	"extraction_id" uuid,
	"confidence" numeric(4, 2) DEFAULT '0.50' NOT NULL,
	"verification_status" "profile_verification_status_enum" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"trigger_event" varchar(100) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"assessment_name" varchar(255) NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"max_score" numeric(5, 2) NOT NULL,
	"evaluation_metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_gap_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"job_role_id" uuid NOT NULL,
	"match_percentage" numeric(5, 2) NOT NULL,
	"missing_skills_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"matching_skills_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"analysis_mode" varchar(50) DEFAULT 'deterministic' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_verification_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"previous_status" "profile_verification_status_enum" NOT NULL,
	"new_status" "profile_verification_status_enum" NOT NULL,
	"reason" text NOT NULL,
	"reviewer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"canonical_slug" varchar(150) NOT NULL,
	"category" "skill_category_enum" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name"),
	CONSTRAINT "skills_canonical_slug_unique" UNIQUE("canonical_slug")
);
--> statement-breakpoint
CREATE TABLE "student_readiness_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"category" "readiness_category_enum" NOT NULL,
	"dimensions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"explanation" text NOT NULL,
	"data_completeness" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"state" "skill_state_enum" DEFAULT 'Claimed' NOT NULL,
	"proficiency_level" "proficiency_level_enum" DEFAULT 'beginner' NOT NULL,
	"confidence_score" numeric(4, 3) DEFAULT '0.000' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_user_id" uuid,
	"expiry_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"roll_number" varchar(50) NOT NULL,
	"department" varchar(100) NOT NULL,
	"batch_year" integer NOT NULL,
	"degree" varchar(50) DEFAULT 'B.Tech' NOT NULL,
	"cgpa" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"backlog_count" integer DEFAULT 0 NOT NULL,
	"date_of_birth" date,
	"resume_r2_url" varchar(512),
	"resume_url" varchar(512),
	"readiness_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" "user_role_enum" DEFAULT 'student' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_semesters" ADD CONSTRAINT "academic_semesters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_semesters" ADD CONSTRAINT "academic_semesters_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution_logs" ADD CONSTRAINT "agent_execution_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_execution_logs" ADD CONSTRAINT "agent_execution_logs_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_workflows" ADD CONSTRAINT "agent_workflows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_final_decision_by_users_id_fk" FOREIGN KEY ("final_decision_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_processing_jobs" ADD CONSTRAINT "document_processing_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_eligibility_evaluations" ADD CONSTRAINT "job_eligibility_evaluations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_eligibility_evaluations" ADD CONSTRAINT "job_eligibility_evaluations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_eligibility_evaluations" ADD CONSTRAINT "job_eligibility_evaluations_job_id_recruitment_job_requirements_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."recruitment_job_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_eligibility_evaluations" ADD CONSTRAINT "job_eligibility_evaluations_overridden_by_users_id_fk" FOREIGN KEY ("overridden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD CONSTRAINT "recruitment_job_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD CONSTRAINT "recruitment_job_requirements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_roles" ADD CONSTRAINT "job_roles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_recommendations" ADD CONSTRAINT "learning_recommendations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_recommendations" ADD CONSTRAINT "learning_recommendations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_recommendations" ADD CONSTRAINT "learning_recommendations_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_recommendations" ADD CONSTRAINT "learning_recommendations_target_role_id_job_roles_id_fk" FOREIGN KEY ("target_role_id") REFERENCES "public"."job_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_job_role_id_job_roles_id_fk" FOREIGN KEY ("job_role_id") REFERENCES "public"."job_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_requirements" ADD CONSTRAINT "job_requirements_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_job_role_id_job_roles_id_fk" FOREIGN KEY ("job_role_id") REFERENCES "public"."job_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD CONSTRAINT "placement_predictions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD CONSTRAINT "placement_predictions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD CONSTRAINT "placement_predictions_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_extractions" ADD CONSTRAINT "profile_extractions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_extractions" ADD CONSTRAINT "profile_extractions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_extractions" ADD CONSTRAINT "profile_extractions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_review_events" ADD CONSTRAINT "profile_review_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_review_events" ADD CONSTRAINT "profile_review_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_review_events" ADD CONSTRAINT "profile_review_events_extraction_id_profile_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."profile_extractions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_review_events" ADD CONSTRAINT "profile_review_events_skill_id_profile_skill_evidence_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."profile_skill_evidence"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_review_events" ADD CONSTRAINT "profile_review_events_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skill_evidence" ADD CONSTRAINT "profile_skill_evidence_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skill_evidence" ADD CONSTRAINT "profile_skill_evidence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skill_evidence" ADD CONSTRAINT "profile_skill_evidence_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skill_evidence" ADD CONSTRAINT "profile_skill_evidence_extraction_id_profile_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."profile_extractions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_skill_evidence" ADD CONSTRAINT "profile_skill_evidence_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_job_role_id_job_roles_id_fk" FOREIGN KEY ("job_role_id") REFERENCES "public"."job_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_verification_reviews" ADD CONSTRAINT "skill_verification_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_verification_reviews" ADD CONSTRAINT "skill_verification_reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_verification_reviews" ADD CONSTRAINT "skill_verification_reviews_evidence_id_profile_skill_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."profile_skill_evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_verification_reviews" ADD CONSTRAINT "skill_verification_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_readiness_snapshots" ADD CONSTRAINT "student_readiness_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_readiness_snapshots" ADD CONSTRAINT "student_readiness_snapshots_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_semester_student_num" ON "academic_semesters" USING btree ("student_id","semester_number");--> statement-breakpoint
CREATE INDEX "ix_agent_logs_tenant_type_status" ON "agent_execution_logs" USING btree ("tenant_id","agent_type","status");--> statement-breakpoint
CREATE INDEX "ix_workflows_tenant_entity" ON "agent_workflows" USING btree ("tenant_id","target_entity_type","target_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_applications_drive_student" ON "applications" USING btree ("drive_id","student_id");--> statement-breakpoint
CREATE INDEX "ix_applications_tenant_status" ON "applications" USING btree ("tenant_id","status","drive_id");--> statement-breakpoint
CREATE INDEX "ix_audit_tenant_timestamp" ON "audit_events" USING btree ("tenant_id","timestamp");--> statement-breakpoint
CREATE INDEX "ix_audit_tenant_action" ON "audit_events" USING btree ("tenant_id","action");--> statement-breakpoint
CREATE INDEX "idx_doc_jobs_tenant" ON "document_processing_jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_doc_jobs_document" ON "document_processing_jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_doc_jobs_user" ON "document_processing_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_doc_jobs_status" ON "document_processing_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_doc_jobs_tenant_status" ON "document_processing_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_documents_tenant" ON "documents" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_documents_owner" ON "documents" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_documents_storage_key" ON "documents" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_documents_checksum" ON "documents" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "ix_evidence_tenant_student_skill" ON "evidence_records" USING btree ("tenant_id","student_id","skill_id");--> statement-breakpoint
CREATE INDEX "ix_interviews_tenant_app" ON "interviews" USING btree ("tenant_id","application_id");--> statement-breakpoint
CREATE INDEX "ix_invitations_tenant" ON "invitations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ix_invitations_email" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ix_invitations_token" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "ix_invitations_status" ON "invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_eligibility_eval_tenant" ON "job_eligibility_evaluations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_eligibility_eval_student" ON "job_eligibility_evaluations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_eligibility_eval_job" ON "job_eligibility_evaluations" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_eligibility_eval_result" ON "job_eligibility_evaluations" USING btree ("result");--> statement-breakpoint
CREATE INDEX "idx_eligibility_eval_tenant_job" ON "job_eligibility_evaluations" USING btree ("tenant_id","job_id");--> statement-breakpoint
CREATE INDEX "idx_eligibility_eval_student_job" ON "job_eligibility_evaluations" USING btree ("student_id","job_id");--> statement-breakpoint
CREATE INDEX "idx_job_req_tenant" ON "recruitment_job_requirements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_job_req_status" ON "recruitment_job_requirements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_req_created_by" ON "recruitment_job_requirements" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_job_req_company" ON "recruitment_job_requirements" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_job_req_tenant_status" ON "recruitment_job_requirements" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "ix_learning_recommendations_student_id" ON "learning_recommendations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "ix_learning_recommendations_skill_id" ON "learning_recommendations" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_job_req_role_skill" ON "job_requirements" USING btree ("job_role_id","skill_id");--> statement-breakpoint
CREATE INDEX "ix_notifications_tenant_recipient" ON "notifications" USING btree ("tenant_id","recipient_user_id","is_read");--> statement-breakpoint
CREATE INDEX "ix_drives_tenant_status_batch" ON "placement_drives" USING btree ("tenant_id","status","batch_year");--> statement-breakpoint
CREATE INDEX "ix_predictions_tenant_student" ON "placement_predictions" USING btree ("tenant_id","student_id");--> statement-breakpoint
CREATE INDEX "ix_placement_predictions_drive_id" ON "placement_predictions" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_profile_extractions_tenant" ON "profile_extractions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_profile_extractions_document" ON "profile_extractions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_profile_extractions_user" ON "profile_extractions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_extractions_status" ON "profile_extractions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_profile_extractions_tenant_user" ON "profile_extractions" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_review_events_tenant" ON "profile_review_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_profile_review_events_user" ON "profile_review_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_review_events_reviewer" ON "profile_review_events" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_profile_review_events_extraction" ON "profile_review_events" USING btree ("extraction_id");--> statement-breakpoint
CREATE INDEX "idx_profile_review_events_skill" ON "profile_review_events" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_profile_review_events_tenant_user" ON "profile_review_events" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_tenant" ON "profile_skill_evidence" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_user" ON "profile_skill_evidence" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_skill" ON "profile_skill_evidence" USING btree ("skill_name");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_status" ON "profile_skill_evidence" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_document" ON "profile_skill_evidence" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_extraction" ON "profile_skill_evidence" USING btree ("extraction_id");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_tenant_user" ON "profile_skill_evidence" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_skill_evidence_tenant_user_skill" ON "profile_skill_evidence" USING btree ("tenant_id","user_id","skill_name");--> statement-breakpoint
CREATE INDEX "idx_profile_versions_tenant" ON "profile_versions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_profile_versions_user" ON "profile_versions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profile_versions_creator" ON "profile_versions" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_profile_versions_tenant_user_ver" ON "profile_versions" USING btree ("tenant_id","user_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_profile_versions_tenant_user" ON "profile_versions" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "ix_gap_analysis_tenant_student_role" ON "skill_gap_analyses" USING btree ("tenant_id","student_id","job_role_id");--> statement-breakpoint
CREATE INDEX "ix_skill_gap_analyses_student_id" ON "skill_gap_analyses" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "ix_skill_gap_analyses_job_role_id" ON "skill_gap_analyses" USING btree ("job_role_id");--> statement-breakpoint
CREATE INDEX "idx_skill_reviews_tenant" ON "skill_verification_reviews" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_skill_reviews_student" ON "skill_verification_reviews" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_skill_reviews_evidence" ON "skill_verification_reviews" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "idx_skill_reviews_reviewer" ON "skill_verification_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_skill_reviews_created_at" ON "skill_verification_reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_readiness_snap_tenant" ON "student_readiness_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_readiness_snap_student" ON "student_readiness_snapshots" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_readiness_snap_category" ON "student_readiness_snapshots" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_readiness_snap_calculated" ON "student_readiness_snapshots" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "idx_readiness_snap_tenant_student" ON "student_readiness_snapshots" USING btree ("tenant_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_skills_student_skill" ON "student_skills" USING btree ("student_id","skill_id");--> statement-breakpoint
CREATE INDEX "ix_student_skills_tenant_state" ON "student_skills" USING btree ("tenant_id","state","skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_students_tenant_roll" ON "students" USING btree ("tenant_id","roll_number");--> statement-breakpoint
CREATE INDEX "ix_students_tenant_batch_dept" ON "students" USING btree ("tenant_id","batch_year","department");--> statement-breakpoint
CREATE INDEX "ix_students_tenant_cgpa" ON "students" USING btree ("tenant_id","cgpa");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_tenant_email" ON "users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "ix_users_tenant_role" ON "users" USING btree ("tenant_id","role");--> statement-breakpoint
CREATE INDEX "ix_users_email" ON "users" USING btree ("email");