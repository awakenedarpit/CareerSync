CREATE TYPE "public"."assessment_attempt_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED', 'TIMED_OUT', 'ABANDONED');--> statement-breakpoint
CREATE TYPE "public"."coding_language_enum" AS ENUM('python', 'java', 'cpp', 'javascript');--> statement-breakpoint
CREATE TYPE "public"."coding_verdict_enum" AS ENUM('ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'DEMO_EVALUATION');--> statement-breakpoint
CREATE TYPE "public"."learning_task_category_enum" AS ENUM('CONCEPT_LEARNING', 'CODING_EXERCISE', 'PRACTICAL_PROJECT', 'DATABASE_PRACTICE', 'PROBLEM_SOLVING', 'INTERVIEW_PREP', 'PORTFOLIO_IMPROVEMENT');--> statement-breakpoint
CREATE TYPE "public"."learning_task_status_enum" AS ENUM('RECOMMENDED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'COMPLETED', 'REJECTED', 'PAUSED');--> statement-breakpoint
CREATE TYPE "public"."mock_drive_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."mock_round_type_enum" AS ENUM('APTITUDE', 'TECHNICAL_CODING', 'INTERVIEW');--> statement-breakpoint
CREATE TYPE "public"."skill_proficiency_category_enum" AS ENUM('ASSESSED_STRENGTH', 'IMPROVEMENT_NEEDED', 'NOT_ASSESSED', 'INSUFFICIENT_DATA');--> statement-breakpoint
ALTER TYPE "public"."offer_lifecycle_status_enum" ADD VALUE 'REJECTED' BEFORE 'RELEASED';--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid,
	"round_id" uuid,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"round_type" "mock_round_type_enum" NOT NULL,
	"status" "assessment_attempt_status_enum" DEFAULT 'IN_PROGRESS' NOT NULL,
	"score" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"max_score" numeric(6, 2) DEFAULT '100.00' NOT NULL,
	"percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"topic_analysis_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_question_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"topic" varchar(100) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'medium' NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar(30) DEFAULT 'MCQ' NOT NULL,
	"options_json" jsonb,
	"correct_answer" text,
	"explanation" text,
	"test_cases_json" jsonb,
	"starter_code_json" jsonb,
	"marks" integer DEFAULT 1 NOT NULL,
	"negative_marks" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target_role" varchar(150) NOT NULL,
	"aptitude_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"technical_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"interview_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"composite_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"strengths_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weaknesses_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"questions_attempted" integer DEFAULT 0 NOT NULL,
	"questions_unanswered" integer DEFAULT 0 NOT NULL,
	"time_utilization_seconds" integer DEFAULT 0 NOT NULL,
	"recommendations_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"selected_option" text,
	"answer_text" text,
	"is_correct" boolean,
	"marks_awarded" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"is_marked_for_review" boolean DEFAULT false NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"problem_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"language" "coding_language_enum" NOT NULL,
	"source_code" text NOT NULL,
	"verdict" "coding_verdict_enum" NOT NULL,
	"test_cases_passed" integer DEFAULT 0 NOT NULL,
	"total_test_cases" integer DEFAULT 0 NOT NULL,
	"execution_time_ms" integer DEFAULT 0 NOT NULL,
	"memory_kb" integer DEFAULT 0 NOT NULL,
	"output_details_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_practice_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_answer" text,
	"audio_recording_url" varchar(1024),
	"correctness_score" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"understanding_score" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"completeness_score" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"relevance_score" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"clarity_score" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"overall_score" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"strengths_text" text,
	"weaknesses_text" text,
	"suggested_answer_text" text,
	"evaluator_type" varchar(50) DEFAULT 'AI' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target_role" varchar(150) NOT NULL,
	"category" varchar(50) DEFAULT 'TECHNICAL' NOT NULL,
	"total_questions" integer DEFAULT 5 NOT NULL,
	"status" varchar(50) DEFAULT 'IN_PROGRESS' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_evidence_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"submission_id" uuid,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"skill_id" uuid,
	"evidence_type" varchar(50) NOT NULL,
	"evidence_url" varchar(1024) NOT NULL,
	"verification_status" varchar(50) DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target_role" varchar(150) NOT NULL,
	"readiness_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"active_goal" text NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"repository_url" varchar(1024),
	"project_url" varchar(1024),
	"documentation_text" text,
	"review_status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"feedback_text" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "learning_task_category_enum" NOT NULL,
	"target_skill" varchar(100) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'intermediate' NOT NULL,
	"estimated_hours" numeric(4, 1) DEFAULT '2.0' NOT NULL,
	"completion_criteria" text NOT NULL,
	"expected_evidence_type" varchar(50) DEFAULT 'project_repository' NOT NULL,
	"status" "learning_task_status_enum" DEFAULT 'RECOMMENDED' NOT NULL,
	"task_order" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_drive_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"target_role" varchar(150) NOT NULL,
	"description" text,
	"status" "mock_drive_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"eligible_departments_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"min_cgpa" numeric(4, 2) DEFAULT '0.00' NOT NULL,
	"created_by" uuid NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_drive_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"registration_status" varchar(50) DEFAULT 'REGISTERED' NOT NULL,
	"current_round_order" integer DEFAULT 1 NOT NULL,
	"completed_at" timestamp with time zone,
	"final_report_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_drive_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drive_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"round_type" "mock_round_type_enum" NOT NULL,
	"round_order" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"cutoff_score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"question_bank_id" uuid,
	"config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_drive_id_mock_drive_configurations_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."mock_drive_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_round_id_mock_drive_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."mock_drive_rounds"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_question_banks" ADD CONSTRAINT "assessment_question_banks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_question_banks" ADD CONSTRAINT "assessment_question_banks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_bank_id_assessment_question_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."assessment_question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_reports" ADD CONSTRAINT "assessment_reports_drive_id_mock_drive_configurations_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."mock_drive_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_reports" ADD CONSTRAINT "assessment_reports_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_reports" ADD CONSTRAINT "assessment_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_problem_id_assessment_questions_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."assessment_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submissions" ADD CONSTRAINT "coding_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_feedback" ADD CONSTRAINT "interview_practice_feedback_session_id_interview_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_feedback" ADD CONSTRAINT "interview_practice_feedback_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_feedback" ADD CONSTRAINT "interview_practice_feedback_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_feedback" ADD CONSTRAINT "interview_practice_feedback_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_sessions" ADD CONSTRAINT "interview_practice_sessions_drive_id_mock_drive_configurations_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."mock_drive_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_sessions" ADD CONSTRAINT "interview_practice_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_practice_sessions" ADD CONSTRAINT "interview_practice_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence_links" ADD CONSTRAINT "learning_evidence_links_task_id_learning_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."learning_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence_links" ADD CONSTRAINT "learning_evidence_links_submission_id_learning_task_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."learning_task_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence_links" ADD CONSTRAINT "learning_evidence_links_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence_links" ADD CONSTRAINT "learning_evidence_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_evidence_links" ADD CONSTRAINT "learning_evidence_links_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_task_submissions" ADD CONSTRAINT "learning_task_submissions_task_id_learning_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."learning_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_task_submissions" ADD CONSTRAINT "learning_task_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_task_submissions" ADD CONSTRAINT "learning_task_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_task_submissions" ADD CONSTRAINT "learning_task_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_configurations" ADD CONSTRAINT "mock_drive_configurations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_configurations" ADD CONSTRAINT "mock_drive_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_participants" ADD CONSTRAINT "mock_drive_participants_drive_id_mock_drive_configurations_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."mock_drive_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_participants" ADD CONSTRAINT "mock_drive_participants_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_participants" ADD CONSTRAINT "mock_drive_participants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_participants" ADD CONSTRAINT "mock_drive_participants_final_report_id_assessment_reports_id_fk" FOREIGN KEY ("final_report_id") REFERENCES "public"."assessment_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_rounds" ADD CONSTRAINT "mock_drive_rounds_drive_id_mock_drive_configurations_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."mock_drive_configurations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_rounds" ADD CONSTRAINT "mock_drive_rounds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_drive_rounds" ADD CONSTRAINT "mock_drive_rounds_question_bank_id_assessment_question_banks_id_fk" FOREIGN KEY ("question_bank_id") REFERENCES "public"."assessment_question_banks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attempt_student" ON "assessment_attempts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_attempt_drive" ON "assessment_attempts" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_attempt_round" ON "assessment_attempts" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "idx_attempt_tenant" ON "assessment_attempts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_attempt_status" ON "assessment_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_qbank_tenant" ON "assessment_question_banks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_qbank_category" ON "assessment_question_banks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_qbank_created_by" ON "assessment_question_banks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_questions_bank" ON "assessment_questions" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "idx_questions_tenant" ON "assessment_questions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_questions_category" ON "assessment_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_questions_topic" ON "assessment_questions" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "idx_questions_difficulty" ON "assessment_questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "idx_assessment_report_drive" ON "assessment_reports" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_assessment_report_student" ON "assessment_reports" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_assessment_report_tenant" ON "assessment_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_assessment_report_composite" ON "assessment_reports" USING btree ("composite_score");--> statement-breakpoint
CREATE INDEX "idx_response_attempt" ON "assessment_responses" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_response_question" ON "assessment_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_response_student" ON "assessment_responses" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_response_tenant" ON "assessment_responses" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_response_attempt_question" ON "assessment_responses" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_coding_sub_attempt" ON "coding_submissions" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_coding_sub_problem" ON "coding_submissions" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "idx_coding_sub_student" ON "coding_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_coding_sub_tenant" ON "coding_submissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_coding_sub_verdict" ON "coding_submissions" USING btree ("verdict");--> statement-breakpoint
CREATE INDEX "idx_interview_fb_session" ON "interview_practice_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_interview_fb_question" ON "interview_practice_feedback" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_interview_fb_student" ON "interview_practice_feedback" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_interview_fb_tenant" ON "interview_practice_feedback" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_interview_session_student" ON "interview_practice_sessions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_interview_session_drive" ON "interview_practice_sessions" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_interview_session_tenant" ON "interview_practice_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_interview_session_status" ON "interview_practice_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_evidence_link_task" ON "learning_evidence_links" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_link_sub" ON "learning_evidence_links" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_link_student" ON "learning_evidence_links" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_link_tenant" ON "learning_evidence_links" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_link_skill" ON "learning_evidence_links" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_learning_paths_student" ON "learning_paths" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_learning_paths_tenant" ON "learning_paths" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_learning_paths_status" ON "learning_paths" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_learning_sub_task" ON "learning_task_submissions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_learning_sub_student" ON "learning_task_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_learning_sub_tenant" ON "learning_task_submissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_learning_sub_status" ON "learning_task_submissions" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_learning_tasks_path" ON "learning_tasks" USING btree ("path_id");--> statement-breakpoint
CREATE INDEX "idx_learning_tasks_student" ON "learning_tasks" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_learning_tasks_tenant" ON "learning_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_learning_tasks_status" ON "learning_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_learning_tasks_category" ON "learning_tasks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_learning_tasks_skill" ON "learning_tasks" USING btree ("target_skill");--> statement-breakpoint
CREATE INDEX "idx_mock_drive_tenant" ON "mock_drive_configurations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mock_drive_status" ON "mock_drive_configurations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mock_drive_target_role" ON "mock_drive_configurations" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "idx_mock_drive_created_by" ON "mock_drive_configurations" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mock_participant_drive_student" ON "mock_drive_participants" USING btree ("drive_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_mock_participant_tenant" ON "mock_drive_participants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mock_participant_student" ON "mock_drive_participants" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_mock_participant_status" ON "mock_drive_participants" USING btree ("registration_status");--> statement-breakpoint
CREATE INDEX "idx_mock_round_drive" ON "mock_drive_rounds" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_mock_round_tenant" ON "mock_drive_rounds" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mock_round_order" ON "mock_drive_rounds" USING btree ("drive_id","round_order");--> statement-breakpoint
CREATE INDEX "idx_mock_round_qbank" ON "mock_drive_rounds" USING btree ("question_bank_id");