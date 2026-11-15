CREATE TYPE "public"."assessment_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."assessment_type_enum" AS ENUM('APTITUDE', 'TECHNICAL', 'CODING', 'INTERVIEW');--> statement-breakpoint
CREATE TYPE "public"."candidate_shortlist_status_enum" AS ENUM('RECOMMENDED', 'SUBMITTED_FOR_TPO_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."company_verification_status_enum" AS ENUM('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."drive_stage_status_enum" AS ENUM('DRAFT', 'PENDING_TPO_APPROVAL', 'APPROVED', 'SCHEDULED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');--> statement-breakpoint
CREATE TYPE "public"."interview_stage_enum" AS ENUM('TECHNICAL_1', 'TECHNICAL_2', 'CODING', 'MANAGERIAL', 'HR', 'FINAL');--> statement-breakpoint
CREATE TYPE "public"."offer_lifecycle_status_enum" AS ENUM('DRAFT', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'RELEASED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "candidate_assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"assessment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"score" numeric(5, 2),
	"max_score" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"status" varchar(50) DEFAULT 'COMPLETED' NOT NULL,
	"feedback" text,
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_shortlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"recruiter_id" uuid NOT NULL,
	"status" "candidate_shortlist_status_enum" DEFAULT 'RECOMMENDED' NOT NULL,
	"recruiter_notes" text,
	"tpo_reviewer_id" uuid,
	"tpo_decision_reason" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_verification_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"decision" "company_verification_status_enum" NOT NULL,
	"review_notes" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid NOT NULL,
	"assessment_type" "assessment_type_enum" DEFAULT 'APTITUDE' NOT NULL,
	"title" varchar(255) NOT NULL,
	"scheduled_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"meeting_details" text,
	"status" "assessment_status_enum" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_interview_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"round_number" integer DEFAULT 1 NOT NULL,
	"round_stage" "interview_stage_enum" DEFAULT 'TECHNICAL_1' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"interviewer_name" varchar(255),
	"interviewer_id" uuid,
	"meeting_details" text,
	"status" varchar(50) DEFAULT 'SCHEDULED' NOT NULL,
	"feedback" text,
	"rating" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid NOT NULL,
	"event_title" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"venue_or_link" varchar(512),
	"conflict_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"previous_status" varchar(50) NOT NULL,
	"new_status" varchar(50) NOT NULL,
	"changed_by" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"drive_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"recruiter_id" uuid NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"ctc_lpa" numeric(6, 2),
	"joining_date" timestamp with time zone,
	"offer_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"status" "offer_lifecycle_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"tpo_reviewer_id" uuid,
	"tpo_approval_reason" text,
	"student_responded_at" timestamp with time zone,
	"student_response_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiter_company_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'recruiter' NOT NULL,
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "logo_url" varchar(512);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "headquarters" varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "contact_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "verification_status" "company_verification_status_enum" DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "job_role" varchar(150);--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "job_category" varchar(100);--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "employment_type" varchar(50) DEFAULT 'Full-Time';--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "work_location" varchar(150);--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "salary_min_lpa" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "salary_max_lpa" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "max_backlogs_allowed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "experience_level" varchar(100);--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "vacancies" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "tpo_approval_status" varchar(50) DEFAULT 'PENDING_TPO_APPROVAL';--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "tpo_approved_by" uuid;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "tpo_approval_reason" text;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "venue" varchar(255);--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "available_positions" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "recruiter_id" uuid;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "stage_status" "drive_stage_status_enum" DEFAULT 'DRAFT' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "tpo_approved_by" uuid;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD COLUMN "tpo_approval_reason" text;--> statement-breakpoint
ALTER TABLE "candidate_assessment_results" ADD CONSTRAINT "candidate_assessment_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessment_results" ADD CONSTRAINT "candidate_assessment_results_assessment_id_drive_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."drive_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessment_results" ADD CONSTRAINT "candidate_assessment_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessment_results" ADD CONSTRAINT "candidate_assessment_results_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_job_id_recruitment_job_requirements_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."recruitment_job_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_tpo_reviewer_id_users_id_fk" FOREIGN KEY ("tpo_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_verification_reviews" ADD CONSTRAINT "company_verification_reviews_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_verification_reviews" ADD CONSTRAINT "company_verification_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_verification_reviews" ADD CONSTRAINT "company_verification_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_assessments" ADD CONSTRAINT "drive_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_assessments" ADD CONSTRAINT "drive_assessments_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_interview_rounds" ADD CONSTRAINT "drive_interview_rounds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_interview_rounds" ADD CONSTRAINT "drive_interview_rounds_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_interview_rounds" ADD CONSTRAINT "drive_interview_rounds_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_interview_rounds" ADD CONSTRAINT "drive_interview_rounds_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_schedules" ADD CONSTRAINT "drive_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_schedules" ADD CONSTRAINT "drive_schedules_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_drive_id_placement_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."placement_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_job_id_recruitment_job_requirements_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."recruitment_job_requirements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_tpo_reviewer_id_users_id_fk" FOREIGN KEY ("tpo_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_company_memberships" ADD CONSTRAINT "recruiter_company_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruiter_company_memberships" ADD CONSTRAINT "recruiter_company_memberships_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assess_result_tenant" ON "candidate_assessment_results" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_assess_result_assess" ON "candidate_assessment_results" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "idx_assess_result_student" ON "candidate_assessment_results" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_assess_result_student" ON "candidate_assessment_results" USING btree ("assessment_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_shortlist_tenant" ON "candidate_shortlists" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_shortlist_drive" ON "candidate_shortlists" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_shortlist_student" ON "candidate_shortlists" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_shortlist_status" ON "candidate_shortlists" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_shortlist_drive_student" ON "candidate_shortlists" USING btree ("drive_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_company_review_company" ON "company_verification_reviews" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_company_review_tenant" ON "company_verification_reviews" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_company_review_reviewer" ON "company_verification_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_drive_assess_tenant" ON "drive_assessments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_drive_assess_drive" ON "drive_assessments" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_interview_rnd_tenant" ON "drive_interview_rounds" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_interview_rnd_drive" ON "drive_interview_rounds" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_interview_rnd_student" ON "drive_interview_rounds" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_drive_sched_tenant" ON "drive_schedules" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_drive_sched_drive" ON "drive_schedules" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_drive_sched_time" ON "drive_schedules" USING btree ("tenant_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_offer_history_offer" ON "offer_status_history" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "idx_offer_history_changed_by" ON "offer_status_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "idx_offer_tenant" ON "placement_offers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_offer_drive" ON "placement_offers" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "idx_offer_student" ON "placement_offers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_offer_company" ON "placement_offers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_offer_status" ON "placement_offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_recruiter_membership_user" ON "recruiter_company_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recruiter_membership_company" ON "recruiter_company_memberships" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_recruiter_user_company" ON "recruiter_company_memberships" USING btree ("user_id","company_id");--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD CONSTRAINT "recruitment_job_requirements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_job_requirements" ADD CONSTRAINT "recruitment_job_requirements_tpo_approved_by_users_id_fk" FOREIGN KEY ("tpo_approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_recruiter_id_users_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_tpo_approved_by_users_id_fk" FOREIGN KEY ("tpo_approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_drives_stage_status" ON "placement_drives" USING btree ("tenant_id","stage_status");