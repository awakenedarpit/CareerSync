CREATE TYPE "public"."fairness_review_status_enum" AS ENUM('FLAGGED', 'UNDER_REVIEW', 'EXPLANATION_REQUESTED', 'RESOLVED', 'ESCALATED');--> statement-breakpoint
CREATE TYPE "public"."intervention_status_enum" AS ENUM('PROPOSED', 'APPROVED', 'IN_PROGRESS', 'EVALUATING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."outreach_campaign_status_enum" AS ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'QUEUED', 'SENT', 'PARTIALLY_SENT', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."report_category_enum" AS ENUM('PLACEMENT_STATISTICS', 'BRANCH_WISE_OUTCOMES', 'COMPANY_PARTICIPATION', 'SALARY_DISTRIBUTION', 'VERIFIED_SKILL_COVERAGE', 'SKILL_GAP_CLOSURE', 'TRAINING_INTERVENTIONS', 'MOCK_ASSESSMENT_PERFORMANCE', 'ALUMNI_MENTORSHIP', 'ACADEMIC_YEAR_COMPARISON');--> statement-breakpoint
CREATE TYPE "public"."report_format_enum" AS ENUM('PDF', 'EXCEL', 'CSV', 'JSON');--> statement-breakpoint
CREATE TABLE "fairness_review_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid,
	"cohort_id" varchar(100),
	"metric_name" varchar(150),
	"stage" varchar(100) NOT NULL,
	"demographic_category" varchar(100) DEFAULT 'GENERAL' NOT NULL,
	"group_name" varchar(100) NOT NULL,
	"reference_group_name" varchar(100) NOT NULL,
	"group_size" integer DEFAULT 0 NOT NULL,
	"group_selected_count" integer DEFAULT 0 NOT NULL,
	"group_selection_rate" double precision NOT NULL,
	"reference_group_size" integer DEFAULT 0 NOT NULL,
	"reference_group_selected_count" integer DEFAULT 0 NOT NULL,
	"reference_group_selection_rate" double precision NOT NULL,
	"disparity_ratio" double precision NOT NULL,
	"is_small_group_suppressed" boolean DEFAULT false NOT NULL,
	"status" "fairness_review_status_enum" DEFAULT 'FLAGGED' NOT NULL,
	"flagged_reason" text DEFAULT 'Disparity ratio below four-fifths threshold' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"reviewer_notes" text,
	"resolution_notes" text,
	"resolution_reason" text,
	"explanation_requested_from" varchar(255),
	"explanation_requested_at" timestamp with time zone,
	"explanation_received" text,
	"explanation_provided" text,
	"escalation_notes" text,
	"audit_trail_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutional_data_quality_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" uuid,
	"observation_count" integer DEFAULT 0 NOT NULL,
	"completeness_ratio" double precision DEFAULT 1 NOT NULL,
	"missing_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"severity" varchar(50) DEFAULT 'INFO' NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutional_metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"snapshot_type" varchar(50) NOT NULL,
	"academic_year" varchar(20),
	"cohort_batch" varchar(50),
	"department" varchar(150),
	"total_students" integer DEFAULT 0 NOT NULL,
	"eligible_students" integer DEFAULT 0 NOT NULL,
	"placed_students" integer DEFAULT 0 NOT NULL,
	"placement_rate" double precision,
	"median_salary" double precision,
	"mean_salary" double precision,
	"highest_salary" double precision,
	"lowest_salary" double precision,
	"verified_skill_coverage" double precision,
	"skill_gap_closure_rate" double precision,
	"shortlist_to_offer_ratio" double precision,
	"avg_time_to_shortlist_days" double precision,
	"recruiter_engagement_score" double precision,
	"metrics_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_quality_status" varchar(50) DEFAULT 'COMPLETE' NOT NULL,
	"data_completeness_score" double precision DEFAULT 1 NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutional_report_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid,
	"report_title" varchar(255) NOT NULL,
	"category" "report_category_enum" NOT NULL,
	"format" "report_format_enum" NOT NULL,
	"status" varchar(50) DEFAULT 'GENERATED' NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completeness_score" double precision DEFAULT 1 NOT NULL,
	"missing_fields_count" integer DEFAULT 0 NOT NULL,
	"warning_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_traceability" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"file_url" text,
	"file_size_bytes" integer,
	"row_count" integer DEFAULT 0 NOT NULL,
	"sha256_hash" varchar(64),
	"generated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutional_report_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "report_category_enum" NOT NULL,
	"standard" varchar(50) DEFAULT 'INTERNAL' NOT NULL,
	"config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_system_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_campaign_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"company_id" uuid,
	"contact_id" varchar(100),
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"company_name" varchar(255),
	"status" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"is_unsubscribed" boolean DEFAULT false NOT NULL,
	"personalized_body" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"template_body" text NOT NULL,
	"target_criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "outreach_campaign_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"requires_human_approval" boolean DEFAULT true NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"approval_notes" text,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"audit_trail_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_intervention_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"intervention_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"support_classification" varchar(50) DEFAULT 'SUPPORT_RECOMMENDED' NOT NULL,
	"roll_number" varchar(50),
	"student_department" varchar(150),
	"attendance_rate" double precision DEFAULT 0 NOT NULL,
	"attendance_count" integer DEFAULT 0 NOT NULL,
	"attendance_verified" boolean DEFAULT false NOT NULL,
	"project_submitted" boolean DEFAULT false NOT NULL,
	"project_evidence_submitted" boolean DEFAULT false NOT NULL,
	"project_evidence_url" text,
	"project_evidence_description" text,
	"project_score" double precision,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"tpo_verified" boolean DEFAULT false NOT NULL,
	"skill_mastery_verified" boolean DEFAULT false NOT NULL,
	"verified_skill_gain_recorded" boolean DEFAULT false NOT NULL,
	"pre_score" double precision,
	"post_score" double precision,
	"status" varchar(50) DEFAULT 'ENROLLED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"target_skill" varchar(150) NOT NULL,
	"target_department" varchar(150),
	"target_batch" varchar(50),
	"proposed_by" uuid,
	"approved_by" uuid,
	"status" "intervention_status_enum" DEFAULT 'PROPOSED' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"budget" double precision DEFAULT 0,
	"action_plan" text,
	"target_student_count" integer DEFAULT 0 NOT NULL,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"baseline_skill_average" double precision,
	"post_intervention_skill_average" double precision,
	"skill_improvement_percentage" double precision,
	"attendance_only_rule_enforced" boolean DEFAULT true NOT NULL,
	"approved_at" timestamp with time zone,
	"audit_trail_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fairness_review_cases" ADD CONSTRAINT "fairness_review_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fairness_review_cases" ADD CONSTRAINT "fairness_review_cases_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fairness_review_cases" ADD CONSTRAINT "fairness_review_cases_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_data_quality_events" ADD CONSTRAINT "institutional_data_quality_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_data_quality_events" ADD CONSTRAINT "institutional_data_quality_events_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_metric_snapshots" ADD CONSTRAINT "institutional_metric_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_report_runs" ADD CONSTRAINT "institutional_report_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_report_runs" ADD CONSTRAINT "institutional_report_runs_template_id_institutional_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."institutional_report_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_report_runs" ADD CONSTRAINT "institutional_report_runs_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_report_templates" ADD CONSTRAINT "institutional_report_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_report_templates" ADD CONSTRAINT "institutional_report_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaign_recipients" ADD CONSTRAINT "outreach_campaign_recipients_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaign_recipients" ADD CONSTRAINT "outreach_campaign_recipients_campaign_id_outreach_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."outreach_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaign_recipients" ADD CONSTRAINT "outreach_campaign_recipients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ADD CONSTRAINT "outreach_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_intervention_participants" ADD CONSTRAINT "training_intervention_participants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_intervention_participants" ADD CONSTRAINT "training_intervention_participants_intervention_id_training_interventions_id_fk" FOREIGN KEY ("intervention_id") REFERENCES "public"."training_interventions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_intervention_participants" ADD CONSTRAINT "training_intervention_participants_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_intervention_participants" ADD CONSTRAINT "training_intervention_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_intervention_participants" ADD CONSTRAINT "training_intervention_participants_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_interventions" ADD CONSTRAINT "training_interventions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_interventions" ADD CONSTRAINT "training_interventions_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_interventions" ADD CONSTRAINT "training_interventions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fairness_case_tenant" ON "fairness_review_cases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_fairness_case_drive" ON "fairness_review_cases" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_fairness_case_status" ON "fairness_review_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fairness_case_stage" ON "fairness_review_cases" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_fairness_case_ratio" ON "fairness_review_cases" USING btree ("disparity_ratio");--> statement-breakpoint
CREATE INDEX "idx_fairness_case_created_at" ON "fairness_review_cases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_data_qual_tenant" ON "institutional_data_quality_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_data_qual_event_type" ON "institutional_data_quality_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_data_qual_entity_type" ON "institutional_data_quality_events" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_data_qual_severity" ON "institutional_data_quality_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_data_qual_resolved" ON "institutional_data_quality_events" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_data_qual_created_at" ON "institutional_data_quality_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_tenant" ON "institutional_metric_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_type" ON "institutional_metric_snapshots" USING btree ("snapshot_type");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_academic_year" ON "institutional_metric_snapshots" USING btree ("academic_year");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_cohort_batch" ON "institutional_metric_snapshots" USING btree ("cohort_batch");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_dept" ON "institutional_metric_snapshots" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_calc_at" ON "institutional_metric_snapshots" USING btree ("calculated_at");--> statement-breakpoint
CREATE INDEX "idx_inst_metric_created_at" ON "institutional_metric_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_report_run_tenant" ON "institutional_report_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_report_run_tmpl" ON "institutional_report_runs" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_report_run_category" ON "institutional_report_runs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_report_run_format" ON "institutional_report_runs" USING btree ("format");--> statement-breakpoint
CREATE INDEX "idx_report_run_status" ON "institutional_report_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_report_run_gen_by" ON "institutional_report_runs" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "idx_report_run_created_at" ON "institutional_report_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_report_tmpl_tenant" ON "institutional_report_templates" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_report_tmpl_category" ON "institutional_report_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_report_tmpl_standard" ON "institutional_report_templates" USING btree ("standard");--> statement-breakpoint
CREATE INDEX "idx_report_tmpl_active" ON "institutional_report_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_report_tmpl_created_by" ON "institutional_report_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_report_tmpl_created_at" ON "institutional_report_templates" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_outreach_recip_camp_email" ON "outreach_campaign_recipients" USING btree ("campaign_id","recipient_email");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_tenant" ON "outreach_campaign_recipients" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_camp" ON "outreach_campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_comp" ON "outreach_campaign_recipients" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_email" ON "outreach_campaign_recipients" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_status" ON "outreach_campaign_recipients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_unsub" ON "outreach_campaign_recipients" USING btree ("is_unsubscribed");--> statement-breakpoint
CREATE INDEX "idx_outreach_recip_created_at" ON "outreach_campaign_recipients" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_outreach_camp_tenant" ON "outreach_campaigns" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_outreach_camp_status" ON "outreach_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_outreach_camp_created_by" ON "outreach_campaigns" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_outreach_camp_approved_by" ON "outreach_campaigns" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_outreach_camp_sched_at" ON "outreach_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_outreach_camp_created_at" ON "outreach_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_train_intv_part_student" ON "training_intervention_participants" USING btree ("intervention_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_tenant" ON "training_intervention_participants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_intv" ON "training_intervention_participants" USING btree ("intervention_id");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_student" ON "training_intervention_participants" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_user" ON "training_intervention_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_status" ON "training_intervention_participants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_verified" ON "training_intervention_participants" USING btree ("skill_mastery_verified");--> statement-breakpoint
CREATE INDEX "idx_train_intv_part_created_at" ON "training_intervention_participants" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_train_intv_tenant" ON "training_interventions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_train_intv_status" ON "training_interventions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_train_intv_skill" ON "training_interventions" USING btree ("target_skill");--> statement-breakpoint
CREATE INDEX "idx_train_intv_dept" ON "training_interventions" USING btree ("target_department");--> statement-breakpoint
CREATE INDEX "idx_train_intv_batch" ON "training_interventions" USING btree ("target_batch");--> statement-breakpoint
CREATE INDEX "idx_train_intv_proposed_by" ON "training_interventions" USING btree ("proposed_by");--> statement-breakpoint
CREATE INDEX "idx_train_intv_approved_by" ON "training_interventions" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "idx_train_intv_created_at" ON "training_interventions" USING btree ("created_at");