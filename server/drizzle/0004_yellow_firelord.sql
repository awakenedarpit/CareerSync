CREATE TYPE "public"."forecast_method_enum" AS ENUM('MOVING_AVERAGE', 'HISTORICAL_AVERAGE', 'LINEAR_TREND', 'SEASONAL_TREND', 'FORECAST_UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."intervention_priority_enum" AS ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."prediction_model_type_enum" AS ENUM('LOGISTIC_REGRESSION', 'DECISION_TREE', 'HISTORICAL_CONVERSION', 'CALIBRATED_PROBABILITY', 'INSUFFICIENT_DATA_BASELINE');--> statement-breakpoint
CREATE TYPE "public"."prediction_target_enum" AS ENUM('SHORTLIST_PROGRESSION', 'INTERVIEW_COMPLETION', 'OFFER_CONVERSION', 'COHORT_OUTCOME');--> statement-breakpoint
CREATE TYPE "public"."readiness_classification_enum" AS ENUM('HIGH_READINESS', 'MODERATE_READINESS', 'DEVELOPING_READINESS', 'INSUFFICIENT_DATA');--> statement-breakpoint
CREATE TYPE "public"."student_support_category_enum" AS ENUM('SKILL_DEVELOPMENT', 'ASSESSMENT_PRACTICE', 'PROJECT_GUIDANCE', 'PROFILE_COMPLETION', 'INTERVIEW_PREPARATION', 'ADDITIONAL_REVIEW', 'INSUFFICIENT_DATA');--> statement-breakpoint
CREATE TYPE "public"."support_intervention_status_enum" AS ENUM('IDENTIFIED', 'UNDER_TPO_REVIEW', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "analytics_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"target_resource_type" varchar(100),
	"target_resource_id" uuid,
	"details_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"snapshot_type" varchar(100) NOT NULL,
	"batch_year" integer,
	"department" varchar(100),
	"cohort_size" integer DEFAULT 0 NOT NULL,
	"is_suppressed" boolean DEFAULT false NOT NULL,
	"metrics_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"snapshot_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"captured_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_forecast_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"forecast_period" varchar(100) NOT NULL,
	"batch_year" integer NOT NULL,
	"department" varchar(100),
	"forecast_method" "forecast_method_enum" NOT NULL,
	"projected_placement_rate" numeric(5, 2) NOT NULL,
	"lower_bound_rate" numeric(5, 2),
	"upper_bound_rate" numeric(5, 2),
	"projected_offer_count" integer DEFAULT 0,
	"historical_sample_size" integer DEFAULT 0 NOT NULL,
	"parameters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scenario_variables_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_forecast_unavailable" boolean DEFAULT false NOT NULL,
	"forecast_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_prediction_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"run_name" varchar(255) NOT NULL,
	"target" "prediction_target_enum" NOT NULL,
	"model_type" "prediction_model_type_enum" NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"training_split_ratio" numeric(4, 2) DEFAULT '0.80',
	"accuracy" numeric(6, 4),
	"precision" numeric(6, 4),
	"recall" numeric(6, 4),
	"f1_score" numeric(6, 4),
	"brier_score" numeric(6, 4),
	"confusion_matrix_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"feature_weights_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hyperparameters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"executed_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_readiness_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"readiness_classification" "readiness_classification_enum" NOT NULL,
	"overall_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"academic_score" numeric(5, 2) DEFAULT '0.00',
	"technical_skill_score" numeric(5, 2) DEFAULT '0.00',
	"assessment_score" numeric(5, 2) DEFAULT '0.00',
	"interview_score" numeric(5, 2) DEFAULT '0.00',
	"profile_completeness_score" numeric(5, 2) DEFAULT '0.00',
	"verified_evidence_count" integer DEFAULT 0 NOT NULL,
	"missing_data_flags_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"factors_breakdown_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evaluation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"evaluated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_support_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"category" "student_support_category_enum" NOT NULL,
	"priority" "intervention_priority_enum" DEFAULT 'MEDIUM' NOT NULL,
	"status" "support_intervention_status_enum" DEFAULT 'IDENTIFIED' NOT NULL,
	"title" varchar(255) NOT NULL,
	"support_rationale" text NOT NULL,
	"recommended_actions_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tpo_intervention_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recommendation_id" uuid,
	"student_id" uuid,
	"department" varchar(100),
	"batch_year" integer,
	"title" varchar(255) NOT NULL,
	"intervention_type" varchar(100) NOT NULL,
	"priority" "intervention_priority_enum" DEFAULT 'MEDIUM' NOT NULL,
	"status" "support_intervention_status_enum" DEFAULT 'APPROVED' NOT NULL,
	"scheduled_date" timestamp with time zone,
	"completed_date" timestamp with time zone,
	"action_notes" text,
	"target_student_count" integer DEFAULT 1 NOT NULL,
	"assigned_to" uuid,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "placement_predictions" ALTER COLUMN "probability_score" SET DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "run_id" uuid;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "prediction_target" "prediction_target_enum" DEFAULT 'OFFER_CONVERSION' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "predicted_probability" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "confidence_interval_lower" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "confidence_interval_upper" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "readiness_classification" "readiness_classification_enum" DEFAULT 'INSUFFICIENT_DATA' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "model_used" "prediction_model_type_enum" DEFAULT 'INSUFFICIENT_DATA_BASELINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "data_coverage_score" numeric(5, 2) DEFAULT '100.00';--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "limitations_notes" text;--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD COLUMN "is_insufficient_data" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_audit_events" ADD CONSTRAINT "analytics_audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_audit_events" ADD CONSTRAINT "analytics_audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_captured_by_users_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_forecast_snapshots" ADD CONSTRAINT "placement_forecast_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_forecast_snapshots" ADD CONSTRAINT "placement_forecast_snapshots_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_prediction_runs" ADD CONSTRAINT "placement_prediction_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_prediction_runs" ADD CONSTRAINT "placement_prediction_runs_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_readiness_history" ADD CONSTRAINT "student_readiness_history_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_readiness_history" ADD CONSTRAINT "student_readiness_history_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_readiness_history" ADD CONSTRAINT "student_readiness_history_evaluated_by_users_id_fk" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_support_recommendations" ADD CONSTRAINT "student_support_recommendations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_support_recommendations" ADD CONSTRAINT "student_support_recommendations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_support_recommendations" ADD CONSTRAINT "student_support_recommendations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tpo_intervention_records" ADD CONSTRAINT "tpo_intervention_records_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tpo_intervention_records" ADD CONSTRAINT "tpo_intervention_records_recommendation_id_student_support_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."student_support_recommendations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tpo_intervention_records" ADD CONSTRAINT "tpo_intervention_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tpo_intervention_records" ADD CONSTRAINT "tpo_intervention_records_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tpo_intervention_records" ADD CONSTRAINT "tpo_intervention_records_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_audit_tenant" ON "analytics_audit_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_audit_user" ON "analytics_audit_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_audit_event" ON "analytics_audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_audit_resource" ON "analytics_audit_events" USING btree ("target_resource_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_audit_time" ON "analytics_audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_snap_tenant" ON "analytics_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_snap_type" ON "analytics_snapshots" USING btree ("snapshot_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_snap_batch" ON "analytics_snapshots" USING btree ("batch_year");--> statement-breakpoint
CREATE INDEX "idx_analytics_snap_dept" ON "analytics_snapshots" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_analytics_snap_time" ON "analytics_snapshots" USING btree ("snapshot_timestamp");--> statement-breakpoint
CREATE INDEX "idx_forecast_snap_tenant" ON "placement_forecast_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_forecast_snap_period" ON "placement_forecast_snapshots" USING btree ("forecast_period");--> statement-breakpoint
CREATE INDEX "idx_forecast_snap_batch" ON "placement_forecast_snapshots" USING btree ("batch_year");--> statement-breakpoint
CREATE INDEX "idx_forecast_snap_dept" ON "placement_forecast_snapshots" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_forecast_snap_method" ON "placement_forecast_snapshots" USING btree ("forecast_method");--> statement-breakpoint
CREATE INDEX "idx_forecast_snap_time" ON "placement_forecast_snapshots" USING btree ("forecast_timestamp");--> statement-breakpoint
CREATE INDEX "idx_pred_run_tenant" ON "placement_prediction_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pred_run_target" ON "placement_prediction_runs" USING btree ("target");--> statement-breakpoint
CREATE INDEX "idx_pred_run_model" ON "placement_prediction_runs" USING btree ("model_type");--> statement-breakpoint
CREATE INDEX "idx_pred_run_executed_by" ON "placement_prediction_runs" USING btree ("executed_by");--> statement-breakpoint
CREATE INDEX "idx_pred_run_created" ON "placement_prediction_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_readiness_hist_tenant" ON "student_readiness_history" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_readiness_hist_student" ON "student_readiness_history" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_readiness_hist_class" ON "student_readiness_history" USING btree ("readiness_classification");--> statement-breakpoint
CREATE INDEX "idx_readiness_hist_date" ON "student_readiness_history" USING btree ("evaluation_date");--> statement-breakpoint
CREATE INDEX "idx_support_rec_tenant" ON "student_support_recommendations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_support_rec_student" ON "student_support_recommendations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_support_rec_category" ON "student_support_recommendations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_support_rec_priority" ON "student_support_recommendations" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_support_rec_status" ON "student_support_recommendations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_support_rec_reviewed_by" ON "student_support_recommendations" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_tenant" ON "tpo_intervention_records" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_student" ON "tpo_intervention_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_rec" ON "tpo_intervention_records" USING btree ("recommendation_id");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_status" ON "tpo_intervention_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_priority" ON "tpo_intervention_records" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_dept" ON "tpo_intervention_records" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_batch" ON "tpo_intervention_records" USING btree ("batch_year");--> statement-breakpoint
CREATE INDEX "idx_tpo_interv_assigned" ON "tpo_intervention_records" USING btree ("assigned_to");--> statement-breakpoint
ALTER TABLE "placement_predictions" ADD CONSTRAINT "placement_predictions_run_id_placement_prediction_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."placement_prediction_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_placement_pred_run" ON "placement_predictions" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "idx_placement_pred_target" ON "placement_predictions" USING btree ("prediction_target");--> statement-breakpoint
CREATE INDEX "idx_placement_pred_class" ON "placement_predictions" USING btree ("readiness_classification");--> statement-breakpoint
CREATE INDEX "idx_placement_pred_created" ON "placement_predictions" USING btree ("created_at");