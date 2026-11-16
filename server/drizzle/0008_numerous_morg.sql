CREATE TABLE "academic_correction_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"current_value" text,
	"requested_value" text NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" uuid,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_custom_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"platform" varchar(100) NOT NULL,
	"url" varchar(500) NOT NULL,
	"label" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "professional_summary" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "career_objective" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "alternate_phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "personal_email" varchar(255);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "preferred_contact_method" varchar(50) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "current_city" varchar(100);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "state" varchar(100);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "country" varchar(100) DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "github_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "linkedin_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "portfolio_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "leetcode_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "hackerrank_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "codeforces_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "codechef_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "kaggle_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "geeksforgeeks_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "personal_website_url" varchar(500);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "profile_visibility" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "preferred_locations" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "target_job_roles" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "preferred_industries" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "preferred_employment_types" jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "career_interests" text;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "gender" varchar(50);--> statement-breakpoint
ALTER TABLE "academic_correction_requests" ADD CONSTRAINT "academic_correction_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_correction_requests" ADD CONSTRAINT "academic_correction_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_correction_requests" ADD CONSTRAINT "academic_correction_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_custom_links" ADD CONSTRAINT "student_custom_links_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_custom_links" ADD CONSTRAINT "student_custom_links_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_custom_links_student_platform" ON "student_custom_links" USING btree ("student_id","platform");