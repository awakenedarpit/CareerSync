CREATE TYPE "public"."alumni_verification_status_enum" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."collaboration_room_category_enum" AS ENUM('DSA', 'WEB_DEV', 'BACKEND', 'DATABASE', 'AI', 'APTITUDE', 'INTERVIEW', 'PROJECT', 'GENERAL_STUDY');--> statement-breakpoint
CREATE TYPE "public"."collaboration_room_status_enum" AS ENUM('ACTIVE', 'ARCHIVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."mentorship_request_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."moderation_action_enum" AS ENUM('NO_ACTION', 'WARNING_ISSUED', 'SESSION_TERMINATED', 'PARTICIPANT_BLOCKED', 'ACCOUNT_SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."moderation_report_status_enum" AS ENUM('PENDING_REVIEW', 'INVESTIGATING', 'RESOLVED_ACTION_TAKEN', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."peer_interview_mode_enum" AS ENUM('STRUCTURED_INTERVIEW', 'COLLABORATIVE_PRACTICE');--> statement-breakpoint
CREATE TYPE "public"."peer_interview_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."peer_interview_type_enum" AS ENUM('TECHNICAL', 'HR', 'BEHAVIORAL', 'APTITUDE_DISCUSSION', 'PROJECT_EXPLANATION', 'SYSTEM_DESIGN', 'GENERAL_PREP');--> statement-breakpoint
ALTER TYPE "public"."user_role_enum" ADD VALUE 'alumni';--> statement-breakpoint
CREATE TABLE "alumni_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"graduation_year" integer NOT NULL,
	"degree" varchar(150) NOT NULL,
	"department" varchar(150) NOT NULL,
	"current_company" varchar(255) NOT NULL,
	"current_role" varchar(255) NOT NULL,
	"industry_domain" varchar(150),
	"total_experience_years" integer DEFAULT 0 NOT NULL,
	"linkedin_url" varchar(500),
	"github_url" varchar(500),
	"portfolio_url" varchar(500),
	"bio" text,
	"skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expertise_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mentorship_enabled" boolean DEFAULT true NOT NULL,
	"max_active_mentees" integer DEFAULT 3 NOT NULL,
	"verification_status" "alumni_verification_status_enum" DEFAULT 'PENDING' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"verification_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"message_type" varchar(50) DEFAULT 'TEXT' NOT NULL,
	"content" text NOT NULL,
	"code_snippet_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attachment_url" varchar(500),
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'MEMBER' NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "collaboration_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"slug" varchar(150) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "collaboration_room_category_enum" DEFAULT 'GENERAL_STUDY' NOT NULL,
	"status" "collaboration_room_status_enum" DEFAULT 'ACTIVE' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"passcode_hash" varchar(255),
	"max_members" integer DEFAULT 10 NOT NULL,
	"active_member_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"pinned_message_id" uuid,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"canvas_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaboration_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'TODO' NOT NULL,
	"priority" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"alumni_profile_id" uuid NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Kolkata' NOT NULL,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"specific_date" date,
	"max_bookings_per_slot" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"feedback_target" varchar(50) NOT NULL,
	"rating" integer NOT NULL,
	"feedback_text" text,
	"rubric_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"would_recommend" boolean DEFAULT true NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"alumni_profile_id" uuid NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"topic" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"goals" text,
	"preferred_slot_id" uuid,
	"preferred_date" timestamp with time zone,
	"status" "mentorship_request_status_enum" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"reschedule_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"alumni_profile_id" uuid NOT NULL,
	"mentor_user_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 45 NOT NULL,
	"meeting_link" varchar(500),
	"room_code" varchar(100),
	"status" varchar(50) DEFAULT 'SCHEDULED' NOT NULL,
	"alumni_notes" text,
	"student_notes" text,
	"action_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recording_url" varchar(500),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"action_type" "moderation_action_enum" NOT NULL,
	"target_user_id" uuid NOT NULL,
	"executed_by" uuid NOT NULL,
	"reason" text NOT NULL,
	"action_duration_hours" integer DEFAULT 0 NOT NULL,
	"valid_until" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"reported_user_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "moderation_report_status_enum" DEFAULT 'PENDING_REVIEW' NOT NULL,
	"investigated_by" uuid,
	"investigation_notes" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_interview_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"evaluator_user_id" uuid NOT NULL,
	"evaluatee_user_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"technical_score" integer,
	"communication_score" integer,
	"problem_solving_score" integer,
	"code_quality_score" integer,
	"detailed_rubric_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"strengths_text" text,
	"improvements_text" text,
	"general_feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_interview_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"student_id" uuid,
	"role" varchar(50) DEFAULT 'INTERVIEWEE' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"connection_status" varchar(50) DEFAULT 'CONNECTED' NOT NULL,
	"camera_enabled" boolean DEFAULT true NOT NULL,
	"mic_enabled" boolean DEFAULT true NOT NULL,
	"screen_share_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"question_title" varchar(255) NOT NULL,
	"question_description" text NOT NULL,
	"difficulty" varchar(50) DEFAULT 'MEDIUM' NOT NULL,
	"category" varchar(100) DEFAULT 'CODING' NOT NULL,
	"standard_answer" text,
	"code_template" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_interview_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"room_code" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"interview_type" "peer_interview_type_enum" NOT NULL,
	"mode" "peer_interview_mode_enum" DEFAULT 'STRUCTURED_INTERVIEW' NOT NULL,
	"status" "peer_interview_status_enum" DEFAULT 'SCHEDULED' NOT NULL,
	"scheduled_start_time" timestamp with time zone NOT NULL,
	"scheduled_duration_minutes" integer DEFAULT 60 NOT NULL,
	"actual_start_time" timestamp with time zone,
	"actual_end_time" timestamp with time zone,
	"created_by" uuid,
	"max_participants" integer DEFAULT 2 NOT NULL,
	"shared_code_content" text DEFAULT '' NOT NULL,
	"code_language" varchar(50) DEFAULT 'javascript' NOT NULL,
	"shared_whiteboard_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rubric_template" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_room_id_collaboration_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."collaboration_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_messages" ADD CONSTRAINT "collaboration_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_participants" ADD CONSTRAINT "collaboration_participants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_participants" ADD CONSTRAINT "collaboration_participants_room_id_collaboration_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."collaboration_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_participants" ADD CONSTRAINT "collaboration_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_rooms" ADD CONSTRAINT "collaboration_rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_rooms" ADD CONSTRAINT "collaboration_rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_room_id_collaboration_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."collaboration_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_tasks" ADD CONSTRAINT "collaboration_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_availability" ADD CONSTRAINT "mentor_availability_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_availability" ADD CONSTRAINT "mentor_availability_alumni_profile_id_alumni_profiles_id_fk" FOREIGN KEY ("alumni_profile_id") REFERENCES "public"."alumni_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_availability" ADD CONSTRAINT "mentor_availability_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_feedback" ADD CONSTRAINT "mentorship_feedback_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_feedback" ADD CONSTRAINT "mentorship_feedback_session_id_mentorship_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mentorship_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_feedback" ADD CONSTRAINT "mentorship_feedback_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_alumni_profile_id_alumni_profiles_id_fk" FOREIGN KEY ("alumni_profile_id") REFERENCES "public"."alumni_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_preferred_slot_id_mentor_availability_id_fk" FOREIGN KEY ("preferred_slot_id") REFERENCES "public"."mentor_availability"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_request_id_mentorship_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_alumni_profile_id_alumni_profiles_id_fk" FOREIGN KEY ("alumni_profile_id") REFERENCES "public"."alumni_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentor_user_id_users_id_fk" FOREIGN KEY ("mentor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_moderation_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."moderation_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_executed_by_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_investigated_by_users_id_fk" FOREIGN KEY ("investigated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_feedback" ADD CONSTRAINT "peer_interview_feedback_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_feedback" ADD CONSTRAINT "peer_interview_feedback_room_id_peer_interview_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."peer_interview_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_feedback" ADD CONSTRAINT "peer_interview_feedback_evaluator_user_id_users_id_fk" FOREIGN KEY ("evaluator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_feedback" ADD CONSTRAINT "peer_interview_feedback_evaluatee_user_id_users_id_fk" FOREIGN KEY ("evaluatee_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_participants" ADD CONSTRAINT "peer_interview_participants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_participants" ADD CONSTRAINT "peer_interview_participants_room_id_peer_interview_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."peer_interview_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_participants" ADD CONSTRAINT "peer_interview_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_participants" ADD CONSTRAINT "peer_interview_participants_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_questions" ADD CONSTRAINT "peer_interview_questions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_questions" ADD CONSTRAINT "peer_interview_questions_room_id_peer_interview_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."peer_interview_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_rooms" ADD CONSTRAINT "peer_interview_rooms_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_interview_rooms" ADD CONSTRAINT "peer_interview_rooms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_alumni_profiles_user" ON "alumni_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_tenant" ON "alumni_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_status" ON "alumni_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_company" ON "alumni_profiles" USING btree ("current_company");--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_enabled" ON "alumni_profiles" USING btree ("mentorship_enabled");--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_dept_year" ON "alumni_profiles" USING btree ("tenant_id","department","graduation_year");--> statement-breakpoint
CREATE INDEX "idx_alumni_profiles_created_at" ON "alumni_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_collab_msg_tenant" ON "collaboration_messages" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_collab_msg_room" ON "collaboration_messages" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_collab_msg_sender" ON "collaboration_messages" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "idx_collab_msg_created_at" ON "collaboration_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_collab_part_room_user" ON "collaboration_participants" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_collab_part_tenant" ON "collaboration_participants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_collab_part_room" ON "collaboration_participants" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_collab_part_user" ON "collaboration_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_collab_part_last_active" ON "collaboration_participants" USING btree ("last_active_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_collab_room_tenant_slug" ON "collaboration_rooms" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_collab_room_tenant" ON "collaboration_rooms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_collab_room_category" ON "collaboration_rooms" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_collab_room_status" ON "collaboration_rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_collab_room_creator" ON "collaboration_rooms" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_collab_room_created_at" ON "collaboration_rooms" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_collab_task_tenant" ON "collaboration_tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_collab_task_room" ON "collaboration_tasks" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_collab_task_assigned" ON "collaboration_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_collab_task_status" ON "collaboration_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_collab_task_created_at" ON "collaboration_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mentor_avail_tenant" ON "mentor_availability" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mentor_avail_profile" ON "mentor_availability" USING btree ("alumni_profile_id");--> statement-breakpoint
CREATE INDEX "idx_mentor_avail_mentor" ON "mentor_availability" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "idx_mentor_avail_active" ON "mentor_availability" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_mentor_avail_day" ON "mentor_availability" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_mentorship_fb_tenant" ON "mentorship_feedback" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_fb_session" ON "mentorship_feedback" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_fb_author" ON "mentorship_feedback" USING btree ("submitted_by");--> statement-breakpoint
CREATE INDEX "idx_mentorship_fb_rating" ON "mentorship_feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_mentorship_fb_created_at" ON "mentorship_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_tenant" ON "mentorship_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_student" ON "mentorship_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_student_user" ON "mentorship_requests" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_mentor_user" ON "mentorship_requests" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_profile" ON "mentorship_requests" USING btree ("alumni_profile_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_status" ON "mentorship_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mentorship_req_created_at" ON "mentorship_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_tenant" ON "mentorship_sessions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_request" ON "mentorship_sessions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_mentor" ON "mentorship_sessions" USING btree ("mentor_user_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_student" ON "mentorship_sessions" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_scheduled" ON "mentorship_sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_status" ON "mentorship_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mentorship_sess_created_at" ON "mentorship_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mod_act_tenant" ON "moderation_actions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mod_act_report" ON "moderation_actions" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_mod_act_target" ON "moderation_actions" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "idx_mod_act_executed_by" ON "moderation_actions" USING btree ("executed_by");--> statement-breakpoint
CREATE INDEX "idx_mod_act_type" ON "moderation_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_mod_act_created_at" ON "moderation_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mod_rep_tenant" ON "moderation_reports" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_mod_rep_reporter" ON "moderation_reports" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "idx_mod_rep_reported" ON "moderation_reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "idx_mod_rep_status" ON "moderation_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mod_rep_entity" ON "moderation_reports" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_mod_rep_created_at" ON "moderation_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_peer_fb_tenant" ON "peer_interview_feedback" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_peer_fb_room" ON "peer_interview_feedback" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_peer_fb_evaluator" ON "peer_interview_feedback" USING btree ("evaluator_user_id");--> statement-breakpoint
CREATE INDEX "idx_peer_fb_evaluatee" ON "peer_interview_feedback" USING btree ("evaluatee_user_id");--> statement-breakpoint
CREATE INDEX "idx_peer_fb_created_at" ON "peer_interview_feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_peer_part_tenant" ON "peer_interview_participants" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_peer_part_room" ON "peer_interview_participants" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_peer_part_user" ON "peer_interview_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_peer_part_room_user" ON "peer_interview_participants" USING btree ("room_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_peer_q_tenant" ON "peer_interview_questions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_peer_q_room" ON "peer_interview_questions" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "idx_peer_q_category" ON "peer_interview_questions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_peer_q_created_at" ON "peer_interview_questions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_peer_interview_room_code" ON "peer_interview_rooms" USING btree ("tenant_id","room_code");--> statement-breakpoint
CREATE INDEX "idx_peer_room_tenant" ON "peer_interview_rooms" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_peer_room_status" ON "peer_interview_rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_peer_room_type" ON "peer_interview_rooms" USING btree ("interview_type");--> statement-breakpoint
CREATE INDEX "idx_peer_room_scheduled" ON "peer_interview_rooms" USING btree ("scheduled_start_time");--> statement-breakpoint
CREATE INDEX "idx_peer_room_created_by" ON "peer_interview_rooms" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_peer_room_created_at" ON "peer_interview_rooms" USING btree ("created_at");