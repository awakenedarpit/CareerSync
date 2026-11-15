CREATE TYPE "public"."career_recommendation_fit_enum" AS ENUM('STRONG_MATCH', 'GOOD_MATCH', 'POTENTIAL_MATCH', 'DEVELOPING', 'INSUFFICIENT_DATA');--> statement-breakpoint
CREATE TYPE "public"."jd_analysis_status_enum" AS ENUM('PENDING', 'ANALYZED', 'HUMAN_REVIEWED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."jd_source_type_enum" AS ENUM('RECRUITER_SUBMISSION', 'MANUAL_UPLOAD', 'INTERNAL_SYSTEM', 'PUBLIC_DATASET', 'PUBLIC_FEED');--> statement-breakpoint
CREATE TYPE "public"."skill_importance_enum" AS ENUM('MANDATORY', 'PREFERRED', 'OPTIONAL');--> statement-breakpoint
CREATE TYPE "public"."student_skill_gap_status_enum" AS ENUM('VERIFIED_MATCH', 'EVIDENCE_AVAILABLE', 'PENDING_VERIFICATION', 'IMPROVEMENT_NEEDED', 'MISSING_EVIDENCE', 'NOT_ASSESSED');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_category_enum" AS ENUM('PROGRAMMING_LANGUAGES', 'FRONTEND', 'BACKEND', 'DATABASE', 'CLOUD_DEVOPS', 'DATA_AI', 'CORE_CS', 'PROFESSIONAL_SKILLS');--> statement-breakpoint
CREATE TABLE "career_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"recommended_role" varchar(255) NOT NULL,
	"fit_level" "career_recommendation_fit_enum" NOT NULL,
	"match_score_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"strengths_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gaps_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_projects_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_learning_tasks_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rationale_text" text NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cohort_skill_gap_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"department" varchar(100) NOT NULL,
	"graduation_year" integer NOT NULL,
	"total_students_analyzed" integer DEFAULT 0 NOT NULL,
	"most_common_gaps_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verified_skill_coverage_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capability_vs_demand_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_interventions_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_job_descriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_id" uuid,
	"company_name" varchar(255) NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"target_role" varchar(255) NOT NULL,
	"industry_domain" varchar(100),
	"raw_description" text NOT NULL,
	"location" varchar(255),
	"employment_type" varchar(50) DEFAULT 'full_time',
	"experience_min_years" numeric(4, 1) DEFAULT '0.0',
	"experience_max_years" numeric(4, 1),
	"education_requirement" text,
	"published_date" timestamp with time zone,
	"collection_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"content_hash" varchar(64),
	"duplicate_of_id" uuid,
	"verification_status" varchar(50) DEFAULT 'unverified' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_skill_demand" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"skill_id" uuid,
	"skill_name" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"required_count" integer DEFAULT 0 NOT NULL,
	"preferred_count" integer DEFAULT 0 NOT NULL,
	"frequency_percentage" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"analysis_period" varchar(50) NOT NULL,
	"last_analyzed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "industry_skill_trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"skill_id" uuid,
	"skill_name" varchar(255) NOT NULL,
	"current_period_mentions" integer DEFAULT 0 NOT NULL,
	"previous_period_mentions" integer DEFAULT 0 NOT NULL,
	"percentage_growth" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"momentum_status" varchar(30) DEFAULT 'STABLE' NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"confidence_level" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_description_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jd_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"normalized_role" varchar(255) NOT NULL,
	"required_skills_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_skills_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"min_experience_years" numeric(4, 1) DEFAULT '0.0',
	"education_requirements_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confidence_score" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"analysis_method" varchar(50) DEFAULT 'AI' NOT NULL,
	"review_status" "jd_analysis_status_enum" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"reviewer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_description_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source_name" varchar(255) NOT NULL,
	"source_type" "jd_source_type_enum" NOT NULL,
	"source_url" varchar(1024),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_skill_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"role_name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"core_skills_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_foundations_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_skills_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"practical_project_expectations_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience_expectations" text,
	"is_system_template" boolean DEFAULT false NOT NULL,
	"is_reviewed" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"alias_name" varchar(255) NOT NULL,
	"normalized_alias" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_taxonomy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"skill_name" varchar(255) NOT NULL,
	"canonical_name" varchar(255) NOT NULL,
	"category" "taxonomy_category_enum" NOT NULL,
	"description" text,
	"parent_skill_id" uuid,
	"external_mapping_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_role_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target_role" varchar(255) NOT NULL,
	"preference_rank" integer DEFAULT 1 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"set_by_student" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_skill_gap_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target_role" varchar(255) NOT NULL,
	"skill_id" uuid,
	"skill_name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"status" "student_skill_gap_status_enum" NOT NULL,
	"confidence_score" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"verified_evidence_count" integer DEFAULT 0 NOT NULL,
	"unverified_evidence_count" integer DEFAULT 0 NOT NULL,
	"assessment_score" numeric(5, 2),
	"diagnosis_rationale" text,
	"recommended_action" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_skill_gap_snapshots" ADD CONSTRAINT "cohort_skill_gap_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_job_descriptions" ADD CONSTRAINT "industry_job_descriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_job_descriptions" ADD CONSTRAINT "industry_job_descriptions_source_id_job_description_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_description_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_job_descriptions" ADD CONSTRAINT "industry_job_descriptions_duplicate_of_id_industry_job_descriptions_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."industry_job_descriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_skill_demand" ADD CONSTRAINT "industry_skill_demand_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_skill_demand" ADD CONSTRAINT "industry_skill_demand_skill_id_skill_taxonomy_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill_taxonomy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_skill_trends" ADD CONSTRAINT "industry_skill_trends_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industry_skill_trends" ADD CONSTRAINT "industry_skill_trends_skill_id_skill_taxonomy_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill_taxonomy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_description_analyses" ADD CONSTRAINT "job_description_analyses_jd_id_industry_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."industry_job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_description_analyses" ADD CONSTRAINT "job_description_analyses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_description_analyses" ADD CONSTRAINT "job_description_analyses_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_description_sources" ADD CONSTRAINT "job_description_sources_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_skill_requirements" ADD CONSTRAINT "role_skill_requirements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_skill_requirements" ADD CONSTRAINT "role_skill_requirements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_skill_id_skill_taxonomy_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill_taxonomy"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_taxonomy" ADD CONSTRAINT "skill_taxonomy_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_taxonomy" ADD CONSTRAINT "skill_taxonomy_parent_skill_id_skill_taxonomy_id_fk" FOREIGN KEY ("parent_skill_id") REFERENCES "public"."skill_taxonomy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_role_preferences" ADD CONSTRAINT "student_role_preferences_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_role_preferences" ADD CONSTRAINT "student_role_preferences_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skill_gap_snapshots" ADD CONSTRAINT "student_skill_gap_snapshots_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skill_gap_snapshots" ADD CONSTRAINT "student_skill_gap_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_skill_gap_snapshots" ADD CONSTRAINT "student_skill_gap_snapshots_skill_id_skill_taxonomy_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill_taxonomy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_career_rec_student" ON "career_recommendations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_career_rec_tenant" ON "career_recommendations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_career_rec_role" ON "career_recommendations" USING btree ("recommended_role");--> statement-breakpoint
CREATE INDEX "idx_career_rec_fit" ON "career_recommendations" USING btree ("fit_level");--> statement-breakpoint
CREATE INDEX "idx_cohort_gap_tenant" ON "cohort_skill_gap_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_cohort_gap_dept_year" ON "cohort_skill_gap_snapshots" USING btree ("department","graduation_year");--> statement-breakpoint
CREATE INDEX "idx_ind_jd_tenant" ON "industry_job_descriptions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_ind_jd_source" ON "industry_job_descriptions" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_ind_jd_company" ON "industry_job_descriptions" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "idx_ind_jd_role" ON "industry_job_descriptions" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "idx_ind_jd_hash" ON "industry_job_descriptions" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "idx_ind_jd_dup" ON "industry_job_descriptions" USING btree ("duplicate_of_id");--> statement-breakpoint
CREATE INDEX "idx_skill_demand_tenant" ON "industry_skill_demand" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_skill_demand_skill" ON "industry_skill_demand" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_skill_demand_name" ON "industry_skill_demand" USING btree ("skill_name");--> statement-breakpoint
CREATE INDEX "idx_skill_demand_period" ON "industry_skill_demand" USING btree ("analysis_period");--> statement-breakpoint
CREATE INDEX "idx_skill_trend_tenant" ON "industry_skill_trends" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_skill_trend_skill" ON "industry_skill_trends" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_skill_trend_name" ON "industry_skill_trends" USING btree ("skill_name");--> statement-breakpoint
CREATE INDEX "idx_skill_trend_momentum" ON "industry_skill_trends" USING btree ("momentum_status");--> statement-breakpoint
CREATE INDEX "idx_jd_analysis_jd" ON "job_description_analyses" USING btree ("jd_id");--> statement-breakpoint
CREATE INDEX "idx_jd_analysis_tenant" ON "job_description_analyses" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_jd_analysis_role" ON "job_description_analyses" USING btree ("normalized_role");--> statement-breakpoint
CREATE INDEX "idx_jd_analysis_status" ON "job_description_analyses" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_jd_source_tenant" ON "job_description_sources" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_jd_source_type" ON "job_description_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_jd_source_active" ON "job_description_sources" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_role_skill_tenant" ON "role_skill_requirements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_role_skill_name" ON "role_skill_requirements" USING btree ("role_name");--> statement-breakpoint
CREATE INDEX "idx_role_skill_category" ON "role_skill_requirements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_skill_alias_skill" ON "skill_aliases" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_skill_alias_tenant" ON "skill_aliases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_skill_alias_normalized" ON "skill_aliases" USING btree ("normalized_alias");--> statement-breakpoint
CREATE INDEX "idx_skill_tax_tenant" ON "skill_taxonomy" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_skill_tax_name" ON "skill_taxonomy" USING btree ("skill_name");--> statement-breakpoint
CREATE INDEX "idx_skill_tax_canonical" ON "skill_taxonomy" USING btree ("canonical_name");--> statement-breakpoint
CREATE INDEX "idx_skill_tax_category" ON "skill_taxonomy" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_skill_tax_parent" ON "skill_taxonomy" USING btree ("parent_skill_id");--> statement-breakpoint
CREATE INDEX "idx_student_role_pref_student" ON "student_role_preferences" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_role_pref_tenant" ON "student_role_preferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_student_role_pref_role" ON "student_role_preferences" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "idx_std_gap_student" ON "student_skill_gap_snapshots" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_std_gap_tenant" ON "student_skill_gap_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_std_gap_role" ON "student_skill_gap_snapshots" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "idx_std_gap_skill" ON "student_skill_gap_snapshots" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_std_gap_status" ON "student_skill_gap_snapshots" USING btree ("status");