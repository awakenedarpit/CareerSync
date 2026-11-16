import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  doublePrecision,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// Authoritative Domain Enums
// ============================================================================

export const userRoleEnum = pgEnum('user_role_enum', [
  'superadmin',
  'college_admin',
  'tpo_admin',
  'faculty_coordinator',
  'recruiter',
  'student',
  'alumni'
]);

export const invitationStatusEnum = pgEnum('invitation_status_enum', [
  'pending',
  'accepted',
  'expired',
  'revoked'
]);

export const documentTypeEnum = pgEnum('document_type_enum', [
  'resume',
  'academic_certificate',
  'technical_certificate',
  'project_evidence',
  'portfolio_attachment',
  'placement_document'
]);

export const skillCategoryEnum = pgEnum('skill_category_enum', [
  'programming_languages',
  'frameworks',
  'databases',
  'cloud_devops',
  'core_cs',
  'data_ai',
  'soft_skills'
]);

/**
 * Mandatory 5-Stage Skill Verification Lifecycle:
 * 1. Claimed: Self-reported by student, no inspectable evidence attached.
 * 2. Observed: Automatically detected from repository commits/artifacts by Profiling Agent.
 * 3. Evidence-linked: Directly bound to verifiable GitHub commit, PR, or artifact in R2.
 * 4. Verified: Validated by human faculty/placement admin or verified assessment.
 *    (AI cannot independently verify or issue final verified status).
 * 5. Expired: Lapsed without ongoing activity/recertification over defined threshold.
 */
export const skillStateEnum = pgEnum('skill_state_enum', [
  'Claimed',
  'Observed',
  'Evidence-linked',
  'Verified',
  'Expired'
]);

export const proficiencyLevelEnum = pgEnum('proficiency_level_enum', [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
]);

export const evidenceTypeEnum = pgEnum('evidence_type_enum', [
  'github_commit',
  'github_pr',
  'project_repository',
  'deployed_application',
  'coding_assessment',
  'certification'
]);

export const verificationStatusEnum = pgEnum('verification_status_enum', [
  'pending_review',
  'validated',
  'rejected'
]);

export const driveStatusEnum = pgEnum('drive_status_enum', [
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled'
]);

export const applicationStatusEnum = pgEnum('application_status_enum', [
  'applied',
  'eligible',
  'shortlisted',
  'interview_scheduled',
  'offered',
  'rejected',
  'withdrawn'
]);

export const interviewRoundTypeEnum = pgEnum('round_type_enum', [
  'online_test',
  'technical_1',
  'technical_2',
  'hr',
  'management'
]);

export const interviewStatusEnum = pgEnum('interview_status_enum', [
  'scheduled',
  'cleared',
  'failed',
  'cancelled'
]);

export const notificationTypeEnum = pgEnum('notification_type_enum', [
  'drive_announcement',
  'skill_verified',
  'gap_alert',
  'interview_call',
  'system'
]);

export const riskTierEnum = pgEnum('risk_tier_enum', [
  'low_risk',
  'moderate_risk',
  'high_risk'
]);

export const actionTypeEnum = pgEnum('action_type_enum', [
  'project_milestone',
  'hands_on_lab',
  'course_module',
  'practice_problem'
]);

export const agentTypeEnum = pgEnum('agent_type_enum', [
  'student_profiling',
  'industry_skill_gap',
  'predictive_analytics',
  'placement_orchestration'
]);

export const agentExecutionStatusEnum = pgEnum('agent_exec_status_enum', [
  'success',
  'fallback_used',
  'failed'
]);

// ============================================================================
// Phase 09 — AI Student Profiling & Document Ingestion Enums
// ============================================================================

export const jobStatusEnum = pgEnum('job_status_enum', [
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
]);

export const extractionStatusEnum = pgEnum('extraction_status_enum', [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'PARTIALLY_APPROVED'
]);

export const reviewActionEnum = pgEnum('review_action_enum', [
  'APPROVE',
  'REJECT',
  'MODIFY'
]);

export const profileEvidenceTypeEnum = pgEnum('profile_evidence_type_enum', [
  'RESUME',
  'PROJECT',
  'CERTIFICATE',
  'ASSESSMENT',
  'SELF_DECLARED'
]);

export const profileVerificationStatusEnum = pgEnum('profile_verification_status_enum', [
  'SELF_DECLARED',
  'EVIDENCE_FOUND',
  'PENDING_REVIEW',
  'VERIFIED',
  'REJECTED',
  'NEEDS_MORE_EVIDENCE'
]);

// Cross-phase aliases for Phase 09 profiling
export const profilingEvidenceTypeEnum = profileEvidenceTypeEnum;
export const profilingVerificationStatusEnum = profileVerificationStatusEnum;

// ============================================================================
// Phase 10: Placement Readiness, Skill Verification & Job Eligibility Enums
// ============================================================================

export const readinessCategoryEnum = pgEnum('readiness_category_enum', [
  'READY',
  'DEVELOPING',
  'NEEDS_SUPPORT',
  'INSUFFICIENT_DATA'
]);

export const eligibilityResultEnum = pgEnum('eligibility_result_enum', [
  'ELIGIBLE',
  'INELIGIBLE',
  'NEEDS_REVIEW',
  'INSUFFICIENT_DATA'
]);

export const recruitmentJobStatusEnum = pgEnum('recruitment_job_status_enum', [
  'DRAFT',
  'ACTIVE',
  'CLOSED',
  'ARCHIVED'
]);

// ============================================================================
// Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Enums
// ============================================================================

export const companyVerificationStatusEnum = pgEnum('company_verification_status_enum', [
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED'
]);

export const driveStageStatusEnum = pgEnum('drive_stage_status_enum', [
  'DRAFT',
  'PENDING_TPO_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'REGISTRATION_OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED'
]);

export const candidateShortlistStatusEnum = pgEnum('candidate_shortlist_status_enum', [
  'RECOMMENDED',
  'SUBMITTED_FOR_TPO_REVIEW',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN'
]);

export const assessmentTypeEnum = pgEnum('assessment_type_enum', [
  'APTITUDE',
  'TECHNICAL',
  'CODING',
  'INTERVIEW'
]);

export const assessmentStatusEnum = pgEnum('assessment_status_enum', [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

export const interviewStageEnum = pgEnum('interview_stage_enum', [
  'TECHNICAL_1',
  'TECHNICAL_2',
  'CODING',
  'MANAGERIAL',
  'HR',
  'FINAL'
]);

export const offerLifecycleStatusEnum = pgEnum('offer_lifecycle_status_enum', [
  'DRAFT',
  'SUBMITTED_FOR_REVIEW',
  'APPROVED',
  'REJECTED',
  'RELEASED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
  'WITHDRAWN'
]);

// ============================================================================
// Phase 12 — Student Mock Drive, Assessment Engine & Personalized Learning Intelligence Enums
// ============================================================================

export const mockDriveStatusEnum = pgEnum('mock_drive_status_enum', [
  'DRAFT',
  'PUBLISHED',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED'
]);

export const mockRoundTypeEnum = pgEnum('mock_round_type_enum', [
  'APTITUDE',
  'TECHNICAL_CODING',
  'INTERVIEW'
]);

export const assessmentAttemptStatusEnum = pgEnum('assessment_attempt_status_enum', [
  'IN_PROGRESS',
  'COMPLETED',
  'TIMED_OUT',
  'ABANDONED'
]);

export const codingLanguageEnum = pgEnum('coding_language_enum', [
  'python',
  'java',
  'cpp',
  'javascript'
]);

export const codingVerdictEnum = pgEnum('coding_verdict_enum', [
  'ACCEPTED',
  'WRONG_ANSWER',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'COMPILATION_ERROR',
  'RUNTIME_ERROR',
  'DEMO_EVALUATION'
]);

export const skillProficiencyCategoryEnum = pgEnum('skill_proficiency_category_enum', [
  'ASSESSED_STRENGTH',
  'IMPROVEMENT_NEEDED',
  'NOT_ASSESSED',
  'INSUFFICIENT_DATA'
]);

export const learningTaskStatusEnum = pgEnum('learning_task_status_enum', [
  'RECOMMENDED',
  'IN_PROGRESS',
  'SUBMITTED_FOR_REVIEW',
  'COMPLETED',
  'REJECTED',
  'PAUSED'
]);

export const learningTaskCategoryEnum = pgEnum('learning_task_category_enum', [
  'CONCEPT_LEARNING',
  'CODING_EXERCISE',
  'PRACTICAL_PROJECT',
  'DATABASE_PRACTICE',
  'PROBLEM_SOLVING',
  'INTERVIEW_PREP',
  'PORTFOLIO_IMPROVEMENT'
]);

// ============================================================================
// Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine Enums
// ============================================================================

export const taxonomyCategoryEnum = pgEnum('taxonomy_category_enum', [
  'PROGRAMMING_LANGUAGES',
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'CLOUD_DEVOPS',
  'DATA_AI',
  'CORE_CS',
  'PROFESSIONAL_SKILLS'
]);

export const jdSourceTypeEnum = pgEnum('jd_source_type_enum', [
  'RECRUITER_SUBMISSION',
  'MANUAL_UPLOAD',
  'INTERNAL_SYSTEM',
  'PUBLIC_DATASET',
  'PUBLIC_FEED'
]);

export const jdAnalysisStatusEnum = pgEnum('jd_analysis_status_enum', [
  'PENDING',
  'ANALYZED',
  'HUMAN_REVIEWED',
  'REJECTED'
]);

export const skillImportanceEnum = pgEnum('skill_importance_enum', [
  'MANDATORY',
  'PREFERRED',
  'OPTIONAL'
]);

export const studentSkillGapStatusEnum = pgEnum('student_skill_gap_status_enum', [
  'VERIFIED_MATCH',
  'EVIDENCE_AVAILABLE',
  'PENDING_VERIFICATION',
  'IMPROVEMENT_NEEDED',
  'MISSING_EVIDENCE',
  'NOT_ASSESSED'
]);

export const careerRecommendationFitEnum = pgEnum('career_recommendation_fit_enum', [
  'STRONG_MATCH',
  'GOOD_MATCH',
  'POTENTIAL_MATCH',
  'DEVELOPING',
  'INSUFFICIENT_DATA'
]);

// ============================================================================
// Phase 14 — Predictive Placement Analytics Engine Enums
// ============================================================================

export const readinessClassificationEnum = pgEnum('readiness_classification_enum', [
  'HIGH_READINESS',
  'MODERATE_READINESS',
  'DEVELOPING_READINESS',
  'INSUFFICIENT_DATA'
]);

export const predictionTargetEnum = pgEnum('prediction_target_enum', [
  'SHORTLIST_PROGRESSION',
  'INTERVIEW_COMPLETION',
  'OFFER_CONVERSION',
  'COHORT_OUTCOME'
]);

export const predictionModelTypeEnum = pgEnum('prediction_model_type_enum', [
  'LOGISTIC_REGRESSION',
  'DECISION_TREE',
  'HISTORICAL_CONVERSION',
  'CALIBRATED_PROBABILITY',
  'INSUFFICIENT_DATA_BASELINE'
]);

export const studentSupportCategoryEnum = pgEnum('student_support_category_enum', [
  'SKILL_DEVELOPMENT',
  'ASSESSMENT_PRACTICE',
  'PROJECT_GUIDANCE',
  'PROFILE_COMPLETION',
  'INTERVIEW_PREPARATION',
  'ADDITIONAL_REVIEW',
  'INSUFFICIENT_DATA'
]);

export const supportInterventionStatusEnum = pgEnum('support_intervention_status_enum', [
  'IDENTIFIED',
  'UNDER_TPO_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'RESOLVED',
  'DISMISSED'
]);

export const interventionPriorityEnum = pgEnum('intervention_priority_enum', [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW'
]);

export const forecastMethodEnum = pgEnum('forecast_method_enum', [
  'MOVING_AVERAGE',
  'HISTORICAL_AVERAGE',
  'LINEAR_TREND',
  'SEASONAL_TREND',
  'FORECAST_UNAVAILABLE'
]);

// ============================================================================
// Phase 15 — Autonomous Placement Orchestration & Workflow Enums
// ============================================================================

export const workflowStatusEnum = pgEnum('workflow_status_enum', [
  'QUEUED',
  'RUNNING',
  'WAITING_FOR_REVIEW',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'RETRY_PENDING'
]);

export const workflowTriggerTypeEnum = pgEnum('workflow_trigger_type_enum', [
  'MANUAL_USER',
  'AUTOMATED_EVENT',
  'SCHEDULED_CRON',
  'AGENT_HANDOFF',
  'SYSTEM_DISPATCH'
]);

export const workflowApprovalStatusEnum = pgEnum('workflow_approval_status_enum', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'DISMISSED'
]);

export const notificationEventTypeEnum = pgEnum('notification_event_type_enum', [
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

export const agentNameEnum = pgEnum('agent_name_enum', [
  'STUDENT_PROFILING_AGENT',
  'INDUSTRY_SKILL_GAP_AGENT',
  'PREDICTIVE_PLACEMENT_AGENT',
  'PLACEMENT_ORCHESTRATION_AGENT',
  'CENTRAL_ORCHESTRATOR'
]);

// ============================================================================
// Phase 16 — Peer Collaboration & Alumni Mentorship Ecosystem Enums
// ============================================================================

export const alumniVerificationStatusEnum = pgEnum('alumni_verification_status_enum', [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED'
]);

export const mentorshipRequestStatusEnum = pgEnum('mentorship_request_status_enum', [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'RESCHEDULE_REQUESTED',
  'CANCELLED',
  'COMPLETED'
]);

export const peerInterviewTypeEnum = pgEnum('peer_interview_type_enum', [
  'TECHNICAL',
  'HR',
  'BEHAVIORAL',
  'APTITUDE_DISCUSSION',
  'PROJECT_EXPLANATION',
  'SYSTEM_DESIGN',
  'GENERAL_PREP'
]);

export const peerInterviewModeEnum = pgEnum('peer_interview_mode_enum', [
  'STRUCTURED_INTERVIEW',
  'COLLABORATIVE_PRACTICE'
]);

export const peerInterviewStatusEnum = pgEnum('peer_interview_status_enum', [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]);

export const collaborationRoomCategoryEnum = pgEnum('collaboration_room_category_enum', [
  'DSA',
  'WEB_DEV',
  'BACKEND',
  'DATABASE',
  'AI',
  'APTITUDE',
  'INTERVIEW',
  'PROJECT',
  'GENERAL_STUDY'
]);

export const collaborationRoomStatusEnum = pgEnum('collaboration_room_status_enum', [
  'ACTIVE',
  'ARCHIVED',
  'CLOSED'
]);

export const moderationReportStatusEnum = pgEnum('moderation_report_status_enum', [
  'PENDING_REVIEW',
  'INVESTIGATING',
  'RESOLVED_ACTION_TAKEN',
  'DISMISSED'
]);

export const moderationActionEnum = pgEnum('moderation_action_enum', [
  'NO_ACTION',
  'WARNING_ISSUED',
  'SESSION_TERMINATED',
  'PARTICIPANT_BLOCKED',
  'ACCOUNT_SUSPENDED'
]);

// ============================================================================
// Phase 17 — Institutional Governance, Accreditation & Outreach Enums
// ============================================================================

export const interventionStatusEnum = pgEnum('intervention_status_enum', [
  'PROPOSED',
  'APPROVED',
  'IN_PROGRESS',
  'EVALUATING',
  'COMPLETED',
  'CANCELLED'
]);

export const fairnessReviewStatusEnum = pgEnum('fairness_review_status_enum', [
  'FLAGGED',
  'UNDER_REVIEW',
  'EXPLANATION_REQUESTED',
  'RESOLVED',
  'ESCALATED'
]);

export const reportFormatEnum = pgEnum('report_format_enum', [
  'PDF',
  'EXCEL',
  'CSV',
  'JSON'
]);

export const reportCategoryEnum = pgEnum('report_category_enum', [
  'PLACEMENT_STATISTICS',
  'BRANCH_WISE_OUTCOMES',
  'COMPANY_PARTICIPATION',
  'SALARY_DISTRIBUTION',
  'VERIFIED_SKILL_COVERAGE',
  'SKILL_GAP_CLOSURE',
  'TRAINING_INTERVENTIONS',
  'MOCK_ASSESSMENT_PERFORMANCE',
  'ALUMNI_MENTORSHIP',
  'ACADEMIC_YEAR_COMPARISON'
]);

export const outreachCampaignStatusEnum = pgEnum('outreach_campaign_status_enum', [
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'QUEUED',
  'SENT',
  'PARTIALLY_SENT',
  'FAILED',
  'CANCELLED'
]);



// ============================================================================
// Core Tables Definition (16 Canonical Domain Tables + Invitations + AI Tables)
// ============================================================================

/**
 * 1. Tenants & Institutions Table
 * Represents colleges, universities, or autonomous hiring entities.
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  domain: varchar('domain', { length: 255 }),
  location: varchar('location', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  isSuspended: boolean('is_suspended').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * 2. Users, Authentication & RBAC Table
 * Scoped strictly to tenant_id. Enforces unique email per tenant.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('student').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_users_tenant_email').on(table.tenantId, table.email),
    index('ix_users_tenant_role').on(table.tenantId, table.role),
    index('ix_users_email').on(table.email)
  ]
);

/**
 * 3. Students Table
 * Extended profile for students enrolled within a tenant.
 * Includes non-destructive column compatibility for resumeUrl and resumeR2Url.
 */
export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    rollNumber: varchar('roll_number', { length: 50 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    batchYear: integer('batch_year').notNull(),
    degree: varchar('degree', { length: 50 }).default('B.Tech').notNull(),
    cgpa: numeric('cgpa', { precision: 4, scale: 2 }).default('0.00').notNull(),
    backlogCount: integer('backlog_count').default(0).notNull(),
    dateOfBirth: date('date_of_birth'),
    // Non-destructive column compatibility:
    // Support both canonical resumeUrl and legacy resumeR2Url without dropping or breaking columns
    resumeR2Url: varchar('resume_r2_url', { length: 512 }),
    resumeUrl: varchar('resume_url', { length: 512 }),
    readinessScore: numeric('readiness_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    // Added profile fields (additive only)
    bio: text('bio'),
    professionalSummary: text('professional_summary'),
    careerObjective: text('career_objective'),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    phoneNumber: varchar('phone_number', { length: 20 }),
    alternatePhoneNumber: varchar('alternate_phone_number', { length: 20 }),
    personalEmail: varchar('personal_email', { length: 255 }),
    preferredContactMethod: varchar('preferred_contact_method', { length: 50 }).default('email'),
    currentCity: varchar('current_city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }).default('India'),
    githubUrl: varchar('github_url', { length: 500 }),
    linkedinUrl: varchar('linkedin_url', { length: 500 }),
    portfolioUrl: varchar('portfolio_url', { length: 500 }),
    leetcodeUrl: varchar('leetcode_url', { length: 500 }),
    hackerrankUrl: varchar('hackerrank_url', { length: 500 }),
    codeforcesUrl: varchar('codeforces_url', { length: 500 }),
    codechefUrl: varchar('codechef_url', { length: 500 }),
    kaggleUrl: varchar('kaggle_url', { length: 500 }),
    geeksforgeeksUrl: varchar('geeksforgeeks_url', { length: 500 }),
    personalWebsiteUrl: varchar('personal_website_url', { length: 500 }),
    profileVisibility: jsonb('profile_visibility'),
    preferredLocations: jsonb('preferred_locations'),
    targetJobRoles: jsonb('target_job_roles'),
    preferredIndustries: jsonb('preferred_industries'),
    preferredEmploymentTypes: jsonb('preferred_employment_types'),
    careerInterests: text('career_interests'),
    gender: varchar('gender', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_students_tenant_roll').on(table.tenantId, table.rollNumber),
    index('ix_students_tenant_batch_dept').on(table.tenantId, table.batchYear, table.department),
    index('ix_students_tenant_cgpa').on(table.tenantId, table.cgpa)
  ]
);

/**
 * 4. Standardized Skills Master Taxonomy
 */
export const skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  canonicalSlug: varchar('canonical_slug', { length: 150 }).notNull().unique(),
  category: skillCategoryEnum('category').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * 5. StudentSkills Table
 * Explicit binding between a Student and a Skill with strict 5-State lifecycle tracking.
 */
export const studentSkills = pgTable(
  'student_skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    state: skillStateEnum('state').default('Claimed').notNull(),
    proficiencyLevel: proficiencyLevelEnum('proficiency_level').default('beginner').notNull(),
    confidenceScore: numeric('confidence_score', { precision: 4, scale: 3 }).default('0.000').notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedByUserId: uuid('verified_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_student_skills_student_skill').on(table.studentId, table.skillId),
    index('ix_student_skills_tenant_state').on(table.tenantId, table.state, table.skillId)
  ]
);

/**
 * 6. Inspectable Evidence Records (Proof-of-work)
 * Includes non-destructive column compatibility for fileStorageKey and r2StorageKey.
 */
export const evidenceRecords = pgTable(
  'evidence_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    evidenceType: evidenceTypeEnum('evidence_type').notNull(),
    sourceUrl: varchar('source_url', { length: 1024 }).notNull(),
    // Non-destructive column compatibility:
    // Support both canonical fileStorageKey and legacy r2StorageKey without dropping or breaking columns
    r2StorageKey: varchar('r2_storage_key', { length: 512 }),
    fileStorageKey: varchar('file_storage_key', { length: 512 }),
    metadataJson: jsonb('metadata_json').default({}).notNull(),
    verificationStatus: verificationStatusEnum('verification_status').default('pending_review').notNull(),
    validatedBy: uuid('validated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_evidence_tenant_student_skill').on(table.tenantId, table.studentId, table.skillId)
  ]
);

/**
 * 7. Standardized Skill Assessments
 */
export const skillAssessments = pgTable('skill_assessments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  assessmentName: varchar('assessment_name', { length: 255 }).notNull(),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  maxScore: numeric('max_score', { precision: 5, scale: 2 }).notNull(),
  evaluationMetrics: jsonb('evaluation_metrics').default({}).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * 8. Academic Semesters Table
 */
export const academicSemesters = pgTable(
  'academic_semesters',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    semesterNumber: integer('semester_number').notNull(),
    sgpa: numeric('sgpa', { precision: 4, scale: 2 }).notNull(),
    creditsEarned: numeric('credits_earned', { precision: 4, scale: 1 }).notNull(),
    backlogsInSemester: integer('backlogs_in_semester').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_semester_student_num').on(table.studentId, table.semesterNumber)
  ]
);

/**
 * 9. Companies Table
 */
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  industryDomain: varchar('industry_domain', { length: 150 }),
  website: varchar('website', { length: 512 }),
  description: text('description'),
  logoUrl: varchar('logo_url', { length: 512 }),
  headquarters: varchar('headquarters', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  verificationStatus: companyVerificationStatusEnum('verification_status').default('PENDING').notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * 10. Job Roles Table
 */
export const jobRoles = pgTable('job_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  experienceLevel: varchar('experience_level', { length: 50 }).default('Fresher / Entry Level').notNull(),
  ctcLpa: numeric('ctc_lpa', { precision: 6, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * 11. Role Skill Requirements Table (Canonical Domain Table)
 */
export const roleJobRequirements = pgTable(
  'job_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jobRoleId: uuid('job_role_id')
      .notNull()
      .references(() => jobRoles.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    isMandatory: boolean('is_mandatory').default(true).notNull(),
    minProficiency: proficiencyLevelEnum('min_proficiency').default('intermediate').notNull(),
    weight: numeric('weight', { precision: 3, scale: 2 }).default('1.00').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_job_req_role_skill').on(table.jobRoleId, table.skillId)
  ]
);

export const legacyJobRequirements = roleJobRequirements;

/**
 * 12. Placement Drives Table
 */
export const placementDrives = pgTable(
  'placement_drives',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    jobRoleId: uuid('job_role_id')
      .notNull()
      .references(() => jobRoles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }),
    description: text('description'),
    venue: varchar('venue', { length: 255 }),
    availablePositions: integer('available_positions').default(1),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    recruiterId: uuid('recruiter_id').references(() => users.id, { onDelete: 'set null' }),
    batchYear: integer('batch_year').notNull(),
    minCgpa: numeric('min_cgpa', { precision: 4, scale: 2 }).default('6.00').notNull(),
    maxBacklogsAllowed: integer('max_backlogs_allowed').default(0).notNull(),
    eligibleDepartments: jsonb('eligible_departments').default([]).notNull(),
    registrationStart: timestamp('registration_start', { withTimezone: true }).notNull(),
    registrationEnd: timestamp('registration_end', { withTimezone: true }).notNull(),
    driveDate: timestamp('drive_date', { withTimezone: true }),
    status: driveStatusEnum('status').default('draft').notNull(),
    stageStatus: driveStageStatusEnum('stage_status').default('DRAFT').notNull(),
    tpoApprovedBy: uuid('tpo_approved_by').references(() => users.id, { onDelete: 'set null' }),
    tpoApprovalReason: text('tpo_approval_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_drives_tenant_status_batch').on(table.tenantId, table.status, table.batchYear),
    index('ix_drives_stage_status').on(table.tenantId, table.stageStatus)
  ]
);

/**
 * 13. Applications Table
 */
export const applications = pgTable(
  'applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => placementDrives.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    status: applicationStatusEnum('status').default('applied').notNull(),
    finalDecisionBy: uuid('final_decision_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_applications_drive_student').on(table.driveId, table.studentId),
    index('ix_applications_tenant_status').on(table.tenantId, table.status, table.driveId)
  ]
);

/**
 * 14. Interviews Table
 */
export const interviews = pgTable(
  'interviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    roundType: interviewRoundTypeEnum('round_type').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: interviewStatusEnum('status').default('scheduled').notNull(),
    interviewerFeedback: text('interviewer_feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_interviews_tenant_app').on(table.tenantId, table.applicationId)
  ]
);

/**
 * 15. Audit Events Table (Tamper-proof compliance logging)
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: varchar('actor_email', { length: 255 }),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 100 }),
    changesDiff: jsonb('changes_diff').default({}).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_audit_tenant_timestamp').on(table.tenantId, table.timestamp),
    index('ix_audit_tenant_action').on(table.tenantId, table.action)
  ]
);

/**
 * 16. Notifications Table
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    recipientUserId: uuid('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: notificationTypeEnum('type').default('system').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_notifications_tenant_recipient').on(table.tenantId, table.recipientUserId, table.isRead)
  ]
);

/**
 * 17. Invitations Table
 * Tracks secure, single-use, expiring invitations for platform users.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull(),
    fullName: varchar('full_name', { length: 255 }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    status: invitationStatusEnum('status').default('pending').notNull(),
    metadataJson: jsonb('metadata_json').default({}).notNull(),
    invitedByUserId: uuid('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_invitations_tenant').on(table.tenantId),
    index('ix_invitations_email').on(table.email),
    index('ix_invitations_token').on(table.token),
    index('ix_invitations_status').on(table.status)
  ]
);

/**
 * 18. Skill Gap Analyses Table (AI Agent & Analytics)
 */
export const skillGapAnalyses = pgTable(
  'skill_gap_analyses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    jobRoleId: uuid('job_role_id')
      .notNull()
      .references(() => jobRoles.id, { onDelete: 'cascade' }),
    matchPercentage: numeric('match_percentage', { precision: 5, scale: 2 }).notNull(),
    missingSkillsJson: jsonb('missing_skills_json').default([]).notNull(),
    matchingSkillsJson: jsonb('matching_skills_json').default([]).notNull(),
    analysisMode: varchar('analysis_mode', { length: 50 }).default('deterministic').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_gap_analysis_tenant_student_role').on(table.tenantId, table.studentId, table.jobRoleId),
    index('ix_skill_gap_analyses_student_id').on(table.studentId),
    index('ix_skill_gap_analyses_job_role_id').on(table.jobRoleId)
  ]
);

/**
 * 19. Placement Predictions Table (AI Agent & Analytics)
 * Consolidated and extended under Phase 14 (Table 69: placementPredictions)
 */

/**
 * 20. Learning Recommendations Table (AI Agent & Analytics)
 */
export const learningRecommendations = pgTable(
  'learning_recommendations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    targetRoleId: uuid('target_role_id').references(() => jobRoles.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    actionType: actionTypeEnum('action_type').default('project_milestone').notNull(),
    description: text('description'),
    estimatedHours: integer('estimated_hours').default(0).notNull(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_learning_recommendations_student_id').on(table.studentId),
    index('ix_learning_recommendations_skill_id').on(table.skillId)
  ]
);

/**
 * 21. Agent Execution Logs Table (Observability & Compliance)
 */
export const agentExecutionLogs = pgTable(
  'agent_execution_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    agentType: agentTypeEnum('agent_type').notNull(),
    triggeredBy: uuid('triggered_by').references(() => users.id, { onDelete: 'set null' }),
    executionMode: varchar('execution_mode', { length: 50 }).notNull(),
    inputPayloadDigest: varchar('input_payload_digest', { length: 64 }),
    tokensConsumed: integer('tokens_consumed').default(0).notNull(),
    latencyMs: integer('latency_ms').default(0).notNull(),
    status: agentExecutionStatusEnum('status').default('success').notNull(),
    errorMessage: text('error_message'),
    executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_agent_logs_tenant_type_status').on(table.tenantId, table.agentType, table.status)
  ]
);

/**
 * 22. Agent Workflows Table (State Machine Tracking)
 * Consolidated and extended under Phase 15 (Table 75: agentWorkflows)
 */

// ============================================================================
// Non-Destructive Column Compatibility Helpers (Dual-Read & Normalization)
// ============================================================================

/**
 * Non-destructive dual-read helper for student resume URL.
 * Supports both modern `resumeUrl` and legacy `resumeR2Url` (or snake_case db columns).
 */
export function resolveStudentResumeUrl(
  student: {
    resumeUrl?: string | null;
    resumeR2Url?: string | null;
    resume_url?: string | null;
    resume_r2_url?: string | null;
  } | null | undefined
): string | null {
  if (!student) return null;
  return student.resumeUrl ?? student.resumeR2Url ?? student.resume_url ?? student.resume_r2_url ?? null;
}

/**
 * Non-destructive dual-read helper for evidence artifact storage key.
 * Supports both modern `fileStorageKey` and legacy `r2StorageKey` (or snake_case db columns).
 */
export function resolveEvidenceStorageKey(
  record: {
    fileStorageKey?: string | null;
    r2StorageKey?: string | null;
    file_storage_key?: string | null;
    r2_storage_key?: string | null;
  } | null | undefined
): string | null {
  if (!record) return null;
  return record.fileStorageKey ?? record.r2StorageKey ?? record.file_storage_key ?? record.r2_storage_key ?? null;
}

/**
 * Normalizes student resume fields for backward and forward compatibility.
 * When either `resumeUrl` or `resumeR2Url` is provided, ensures both are populated.
 */
export function normalizeStudentResumeInput<T extends Record<string, any>>(
  input: T
): T & { resumeUrl: string | null; resumeR2Url: string | null } {
  const url = input.resumeUrl ?? input.resumeR2Url ?? input.resume_url ?? input.resume_r2_url ?? null;
  return {
    ...input,
    resumeUrl: url,
    resumeR2Url: url
  };
}

/**
 * Normalizes evidence storage key fields for backward and forward compatibility.
 * When either `fileStorageKey` or `r2StorageKey` is provided, ensures both are populated.
 */
export function normalizeEvidenceStorageInput<T extends Record<string, any>>(
  input: T
): T & { fileStorageKey: string | null; r2StorageKey: string | null } {
  const key = input.fileStorageKey ?? input.r2StorageKey ?? input.file_storage_key ?? input.r2_storage_key ?? null;
  return {
    ...input,
    fileStorageKey: key,
    r2StorageKey: key
  };
}

// ============================================================================
// Phase 08 — File Metadata & Document Registry Table
// ============================================================================

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    originalFilename: varchar('original_filename', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull().unique(),
    mimeType: varchar('mime_type', { length: 127 }).notNull(),
    fileSize: integer('file_size').notNull(),
    checksum: varchar('checksum', { length: 64 }).notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(),
    uploadStatus: varchar('upload_status', { length: 20 }).notNull().default('completed'),
    isPrivate: boolean('is_private').notNull().default(true),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_documents_tenant').on(table.tenantId),
    index('idx_documents_owner').on(table.ownerUserId),
    index('idx_documents_storage_key').on(table.storageKey),
    index('idx_documents_type').on(table.documentType),
    index('idx_documents_checksum').on(table.checksum)
  ]
);

// ============================================================================
// Phase 09 — AI Student Profiling & Document Ingestion Tables
// ============================================================================

/**
 * 22. Document Processing Jobs Table
 * Asynchronous job queue tracking background document text extraction and AI profiling.
 */
export const documentProcessingJobs = pgTable(
  'document_processing_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: jobStatusEnum('status').default('QUEUED').notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    errorMessage: text('error_message'),
    payload: jsonb('payload').default({}).notNull(),
    result: jsonb('result').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true })
  },
  (table) => [
    index('idx_doc_jobs_tenant').on(table.tenantId),
    index('idx_doc_jobs_document').on(table.documentId),
    index('idx_doc_jobs_user').on(table.userId),
    index('idx_doc_jobs_status').on(table.status),
    index('idx_doc_jobs_tenant_status').on(table.tenantId, table.status)
  ]
);

/**
 * 23. Profile Extractions Table
 * Output of AI profiling analysis on documents, containing proposed skills, projects, and warnings.
 */
export const profileExtractions = pgTable(
  'profile_extractions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rawTextPreview: text('raw_text_preview'),
    sanitizedText: text('sanitized_text'),
    extractedSkills: jsonb('extracted_skills').default([]).notNull(),
    extractedProjects: jsonb('extracted_projects').default([]).notNull(),
    extractedCertifications: jsonb('extracted_certifications').default([]).notNull(),
    warnings: jsonb('warnings').default([]).notNull(),
    overallConfidence: numeric('overall_confidence', { precision: 4, scale: 2 }).default('0.00').notNull(),
    providerUsed: varchar('provider_used', { length: 50 }).default('rule-based').notNull(),
    status: extractionStatusEnum('status').default('PENDING_REVIEW').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_profile_extractions_tenant').on(table.tenantId),
    index('idx_profile_extractions_document').on(table.documentId),
    index('idx_profile_extractions_user').on(table.userId),
    index('idx_profile_extractions_status').on(table.status),
    index('idx_profile_extractions_tenant_user').on(table.tenantId, table.userId)
  ]
);

/**
 * 24. Profile Skill Evidence Table
 * Granular skill claims supported by verifiable document/project evidence and verification states.
 */
export const profileSkillEvidence = pgTable(
  'profile_skill_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    proficiencyClaim: varchar('proficiency_claim', { length: 50 }),
    evidenceType: profileEvidenceTypeEnum('evidence_type').notNull(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),
    extractionId: uuid('extraction_id').references(() => profileExtractions.id, { onDelete: 'set null' }),
    confidence: numeric('confidence', { precision: 4, scale: 2 }).default('0.50').notNull(),
    verificationStatus: profileVerificationStatusEnum('verification_status').default('PENDING_REVIEW').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_profile_skill_evidence_tenant').on(table.tenantId),
    index('idx_profile_skill_evidence_user').on(table.userId),
    index('idx_profile_skill_evidence_skill').on(table.skillName),
    index('idx_profile_skill_evidence_status').on(table.verificationStatus),
    index('idx_profile_skill_evidence_document').on(table.documentId),
    index('idx_profile_skill_evidence_extraction').on(table.extractionId),
    index('idx_profile_skill_evidence_tenant_user').on(table.tenantId, table.userId),
    index('idx_profile_skill_evidence_tenant_user_skill').on(table.tenantId, table.userId, table.skillName)
  ]
);

/**
 * 25. Profile Review Events Table
 * Audit log of student or administrator approval, rejection, or modification of profile extractions.
 */
export const profileReviewEvents = pgTable(
  'profile_review_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    extractionId: uuid('extraction_id').references(() => profileExtractions.id, { onDelete: 'set null' }),
    skillId: uuid('skill_id').references(() => profileSkillEvidence.id, { onDelete: 'set null' }),
    action: reviewActionEnum('action').notNull(),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reviewerRole: varchar('reviewer_role', { length: 50 }).notNull(),
    previousState: jsonb('previous_state'),
    newState: jsonb('new_state'),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_profile_review_events_tenant').on(table.tenantId),
    index('idx_profile_review_events_user').on(table.userId),
    index('idx_profile_review_events_reviewer').on(table.reviewerId),
    index('idx_profile_review_events_extraction').on(table.extractionId),
    index('idx_profile_review_events_skill').on(table.skillId),
    index('idx_profile_review_events_tenant_user').on(table.tenantId, table.userId)
  ]
);

/**
 * 26. Profile Versions Table
 * Immutable historical snapshots of a student's profile state over time.
 */
export const profileVersions = pgTable(
  'profile_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    triggerEvent: varchar('trigger_event', { length: 100 }).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_profile_versions_tenant').on(table.tenantId),
    index('idx_profile_versions_user').on(table.userId),
    index('idx_profile_versions_creator').on(table.createdBy),
    uniqueIndex('uq_profile_versions_tenant_user_ver').on(table.tenantId, table.userId, table.versionNumber),
    index('idx_profile_versions_tenant_user').on(table.tenantId, table.userId)
  ]
);

// College tenant entity alias for Phase 09 compliance
export const colleges = tenants;

// ============================================================================
// Phase 10: Placement Readiness, Skill Verification & Job Eligibility Tables
// ============================================================================

/**
 * 27. Skill Verification Reviews Table
 * Audit and lifecycle review records for student evidence verification by authorized faculty/TPO.
 */
export const skillVerificationReviews = pgTable(
  'skill_verification_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    evidenceId: uuid('evidence_id')
      .notNull()
      .references(() => profileSkillEvidence.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    previousStatus: profileVerificationStatusEnum('previous_status').notNull(),
    newStatus: profileVerificationStatusEnum('new_status').notNull(),
    reason: text('reason').notNull(),
    reviewerNotes: text('reviewer_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_skill_reviews_tenant').on(table.tenantId),
    index('idx_skill_reviews_student').on(table.studentId),
    index('idx_skill_reviews_evidence').on(table.evidenceId),
    index('idx_skill_reviews_reviewer').on(table.reviewerId),
    index('idx_skill_reviews_created_at').on(table.createdAt)
  ]
);

/**
 * 28. Student Readiness Snapshots Table
 * Periodic deterministic evaluation snapshots of student placement readiness.
 */
export const studentReadinessSnapshots = pgTable(
  'student_readiness_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: numeric('score', { precision: 5, scale: 2 }).notNull(),
    category: readinessCategoryEnum('category').notNull(),
    dimensions: jsonb('dimensions').default({}).notNull(),
    explanation: text('explanation').notNull(),
    dataCompleteness: numeric('data_completeness', { precision: 4, scale: 2 }).default('1.00').notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_readiness_snap_tenant').on(table.tenantId),
    index('idx_readiness_snap_student').on(table.studentId),
    index('idx_readiness_snap_category').on(table.category),
    index('idx_readiness_snap_calculated').on(table.calculatedAt),
    index('idx_readiness_snap_tenant_student').on(table.tenantId, table.studentId)
  ]
);

/**
 * 29. Job Requirements (Recruitment Job Postings) Table
 * Tenant-isolated recruitment postings with criteria, required & preferred skills, and assessment requirements.
 */
export const jobRequirements = pgTable(
  'recruitment_job_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    companyName: varchar('company_name', { length: 200 }).notNull(),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    jobTitle: varchar('job_title', { length: 200 }).notNull(),
    jobRole: varchar('job_role', { length: 150 }),
    jobCategory: varchar('job_category', { length: 100 }),
    employmentType: varchar('employment_type', { length: 50 }).default('Full-Time'),
    workLocation: varchar('work_location', { length: 150 }),
    salaryMinLpa: numeric('salary_min_lpa', { precision: 6, scale: 2 }),
    salaryMaxLpa: numeric('salary_max_lpa', { precision: 6, scale: 2 }),
    maxBacklogsAllowed: integer('max_backlogs_allowed').default(0),
    experienceLevel: varchar('experience_level', { length: 100 }),
    vacancies: integer('vacancies').default(1),
    jobDescription: text('job_description').notNull(),
    eligibleDepartments: jsonb('eligible_departments').default([]).notNull(),
    graduationYear: integer('graduation_year'),
    minimumCgpa: numeric('minimum_cgpa', { precision: 4, scale: 2 }),
    requiredSkills: jsonb('required_skills').default([]).notNull(),
    preferredSkills: jsonb('preferred_skills').default([]).notNull(),
    assessmentRequirements: jsonb('assessment_requirements').default([]).notNull(),
    deadline: timestamp('deadline', { withTimezone: true }),
    status: recruitmentJobStatusEnum('status').default('ACTIVE').notNull(),
    tpoApprovalStatus: varchar('tpo_approval_status', { length: 50 }).default('PENDING_TPO_APPROVAL'),
    tpoApprovedBy: uuid('tpo_approved_by').references(() => users.id, { onDelete: 'set null' }),
    tpoApprovalReason: text('tpo_approval_reason'),
    rejectionReason: text('rejection_reason'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_job_req_tenant').on(table.tenantId),
    index('idx_job_req_status').on(table.status),
    index('idx_job_req_created_by').on(table.createdBy),
    index('idx_job_req_company').on(table.companyName),
    index('idx_job_req_tenant_status').on(table.tenantId, table.status)
  ]
);

export const recruitmentJobRequirements = jobRequirements;
export const recruitmentJobs = jobRequirements;

/**
 * 30. Job Eligibility Evaluations Table
 * Evaluation outcomes determining student eligibility against job requirements with human override audit.
 */
export const jobEligibilityEvaluations = pgTable(
  'job_eligibility_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobRequirements.id, { onDelete: 'cascade' }),
    result: eligibilityResultEnum('result').notNull(),
    matchedRequirements: jsonb('matched_requirements').default([]).notNull(),
    unmetRequirements: jsonb('unmet_requirements').default([]).notNull(),
    missingInformation: jsonb('missing_information').default([]).notNull(),
    explanation: text('explanation').notNull(),
    overriddenBy: uuid('overridden_by').references(() => users.id, { onDelete: 'set null' }),
    overrideReason: text('override_reason'),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_eligibility_eval_tenant').on(table.tenantId),
    index('idx_eligibility_eval_student').on(table.studentId),
    index('idx_eligibility_eval_job').on(table.jobId),
    index('idx_eligibility_eval_result').on(table.result),
    index('idx_eligibility_eval_tenant_job').on(table.tenantId, table.jobId),
    index('idx_eligibility_eval_student_job').on(table.studentId, table.jobId)
  ]
);

// ============================================================================
// Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Tables
// ============================================================================

/**
 * 31. Recruiter Company Memberships Table
 * Binds recruiter user accounts to their verified corporate entity.
 */
export const recruiterCompanyMemberships = pgTable(
  'recruiter_company_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).default('recruiter').notNull(),
    isPrimaryContact: boolean('is_primary_contact').default(false).notNull(),
    status: varchar('status', { length: 50 }).default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_recruiter_membership_user').on(table.userId),
    index('idx_recruiter_membership_company').on(table.companyId),
    uniqueIndex('uq_recruiter_user_company').on(table.userId, table.companyId)
  ]
);

/**
 * 32. Company Verification Reviews Table
 * Immutable audit log of TPO / platform administration company verification reviews.
 */
export const companyVerificationReviews = pgTable(
  'company_verification_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    decision: companyVerificationStatusEnum('decision').notNull(),
    reviewNotes: text('review_notes').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_company_review_company').on(table.companyId),
    index('idx_company_review_tenant').on(table.tenantId),
    index('idx_company_review_reviewer').on(table.reviewerId)
  ]
);

/**
 * 33. Placement Drive Schedules Table
 * Calendar slots, interview schedules, and timeline conflict detection.
 */
export const driveSchedules = pgTable(
  'drive_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => placementDrives.id, { onDelete: 'cascade' }),
    eventTitle: varchar('event_title', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    venueOrLink: varchar('venue_or_link', { length: 512 }),
    conflictFlag: boolean('conflict_flag').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_drive_sched_tenant').on(table.tenantId),
    index('idx_drive_sched_drive').on(table.driveId),
    index('idx_drive_sched_time').on(table.tenantId, table.startTime, table.endTime)
  ]
);

/**
 * 34. Candidate Shortlists Table
 * Human-in-the-loop candidate shortlisting workflow with mandatory TPO governance.
 */
export const candidateShortlists = pgTable(
  'candidate_shortlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => placementDrives.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobRequirements.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recruiterId: uuid('recruiter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: candidateShortlistStatusEnum('status').default('RECOMMENDED').notNull(),
    recruiterNotes: text('recruiter_notes'),
    tpoReviewerId: uuid('tpo_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    tpoDecisionReason: text('tpo_decision_reason'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_shortlist_tenant').on(table.tenantId),
    index('idx_shortlist_drive').on(table.driveId),
    index('idx_shortlist_student').on(table.studentId),
    index('idx_shortlist_status').on(table.status),
    uniqueIndex('uq_shortlist_drive_student').on(table.driveId, table.studentId)
  ]
);

/**
 * 35. Drive Assessments Table
 * Aptitude, technical, coding, and interview assessments scheduled for a drive.
 */
export const driveAssessments = pgTable(
  'drive_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => placementDrives.id, { onDelete: 'cascade' }),
    assessmentType: assessmentTypeEnum('assessment_type').default('APTITUDE').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    meetingDetails: text('meeting_details'),
    status: assessmentStatusEnum('status').default('SCHEDULED').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_drive_assess_tenant').on(table.tenantId),
    index('idx_drive_assess_drive').on(table.driveId)
  ]
);

/**
 * 36. Candidate Assessment Results Table
 * Recorded candidate evaluation scores and feedback with authorization checks.
 */
export const candidateAssessmentResults = pgTable(
  'candidate_assessment_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => driveAssessments.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: numeric('score', { precision: 5, scale: 2 }),
    maxScore: numeric('max_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
    status: varchar('status', { length: 50 }).default('COMPLETED').notNull(),
    feedback: text('feedback'),
    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_assess_result_tenant').on(table.tenantId),
    index('idx_assess_result_assess').on(table.assessmentId),
    index('idx_assess_result_student').on(table.studentId),
    uniqueIndex('uq_assess_result_student').on(table.assessmentId, table.studentId)
  ]
);

/**
 * 37. Drive Interview Rounds Table
 * Multi-stage interview coordination (technical, coding, managerial, HR, final).
 */
export const driveInterviewRounds = pgTable(
  'drive_interview_rounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => placementDrives.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').default(1).notNull(),
    roundStage: interviewStageEnum('round_stage').default('TECHNICAL_1').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    interviewerName: varchar('interviewer_name', { length: 255 }),
    interviewerId: uuid('interviewer_id').references(() => users.id, { onDelete: 'set null' }),
    meetingDetails: text('meeting_details'),
    status: varchar('status', { length: 50 }).default('SCHEDULED').notNull(),
    feedback: text('feedback'),
    rating: integer('rating'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_interview_rnd_tenant').on(table.tenantId),
    index('idx_interview_rnd_drive').on(table.driveId),
    index('idx_interview_rnd_student').on(table.studentId)
  ]
);

/**
 * 38. Placement Offers Table
 * Complete offer lifecycle management with TPO review gate and student acceptance tracking.
 */
export const placementOffers = pgTable(
  'placement_offers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => placementDrives.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobRequirements.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    recruiterId: uuid('recruiter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleTitle: varchar('role_title', { length: 255 }).notNull(),
    ctcLpa: numeric('ctc_lpa', { precision: 6, scale: 2 }),
    joiningDate: timestamp('joining_date', { withTimezone: true }),
    offerDate: timestamp('offer_date', { withTimezone: true }).defaultNow().notNull(),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    status: offerLifecycleStatusEnum('status').default('DRAFT').notNull(),
    tpoReviewerId: uuid('tpo_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    tpoApprovalReason: text('tpo_approval_reason'),
    studentRespondedAt: timestamp('student_responded_at', { withTimezone: true }),
    studentResponseNotes: text('student_response_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_offer_tenant').on(table.tenantId),
    index('idx_offer_drive').on(table.driveId),
    index('idx_offer_student').on(table.studentId),
    index('idx_offer_company').on(table.companyId),
    index('idx_offer_status').on(table.status)
  ]
);

/**
 * 39. Offer Status History Table
 * Immutable audit trail tracking historical state transitions for all placement offers.
 */
export const offerStatusHistory = pgTable(
  'offer_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    offerId: uuid('offer_id')
      .notNull()
      .references(() => placementOffers.id, { onDelete: 'cascade' }),
    previousStatus: varchar('previous_status', { length: 50 }).notNull(),
    newStatus: varchar('new_status', { length: 50 }).notNull(),
    changedBy: uuid('changed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_offer_history_offer').on(table.offerId),
    index('idx_offer_history_changed_by').on(table.changedBy)
  ]
);

// ============================================================================
// Phase 12 — Student Mock Drive, Assessment Engine & Personalized Learning Intelligence Tables
// ============================================================================

/**
 * 40. Assessment Question Banks Table
 * Categorized repositories of questions for mock drives and skill evaluations.
 */
export const assessmentQuestionBanks = pgTable(
  'assessment_question_banks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(), // aptitude / technical / interview
    description: text('description'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_qbank_tenant').on(table.tenantId),
    index('idx_qbank_category').on(table.category),
    index('idx_qbank_created_by').on(table.createdBy)
  ]
);

/**
 * 41. Assessment Questions Table
 * Individual evaluation questions spanning MCQ, coding challenges, and descriptive/behavioral prompts.
 */
export const assessmentQuestions = pgTable(
  'assessment_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bankId: uuid('bank_id')
      .notNull()
      .references(() => assessmentQuestionBanks.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 50 }).notNull(),
    topic: varchar('topic', { length: 100 }).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).default('medium').notNull(),
    questionText: text('question_text').notNull(),
    questionType: varchar('question_type', { length: 30 }).default('MCQ').notNull(),
    optionsJson: jsonb('options_json'),
    correctAnswer: text('correct_answer'),
    explanation: text('explanation'),
    testCasesJson: jsonb('test_cases_json'),
    starterCodeJson: jsonb('starter_code_json'),
    marks: integer('marks').default(1).notNull(),
    negativeMarks: numeric('negative_marks', { precision: 4, scale: 2 }).default('0.00').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_questions_bank').on(table.bankId),
    index('idx_questions_tenant').on(table.tenantId),
    index('idx_questions_category').on(table.category),
    index('idx_questions_topic').on(table.topic),
    index('idx_questions_difficulty').on(table.difficulty)
  ]
);

/**
 * 42. Mock Drive Configurations Table
 * Institutional mock recruitment drive configurations with departmental rules and cutoffs.
 */
export const mockDriveConfigurations = pgTable(
  'mock_drive_configurations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    targetRole: varchar('target_role', { length: 150 }).notNull(),
    description: text('description'),
    status: mockDriveStatusEnum('status').default('DRAFT').notNull(),
    eligibleDepartmentsJson: jsonb('eligible_departments_json').default([]).notNull(),
    minCgpa: numeric('min_cgpa', { precision: 4, scale: 2 }).default('0.00').notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scheduledStart: timestamp('scheduled_start', { withTimezone: true }),
    scheduledEnd: timestamp('scheduled_end', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mock_drive_tenant').on(table.tenantId),
    index('idx_mock_drive_status').on(table.status),
    index('idx_mock_drive_target_role').on(table.targetRole),
    index('idx_mock_drive_created_by').on(table.createdBy)
  ]
);

/**
 * 43. Mock Drive Rounds Table
 * Sequenced stages for mock placement drives (Aptitude -> Coding -> Interview).
 */
export const mockDriveRounds = pgTable(
  'mock_drive_rounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => mockDriveConfigurations.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roundType: mockRoundTypeEnum('round_type').notNull(),
    roundOrder: integer('round_order').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    cutoffScore: numeric('cutoff_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    questionBankId: uuid('question_bank_id').references(() => assessmentQuestionBanks.id, { onDelete: 'set null' }),
    configJson: jsonb('config_json').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mock_round_drive').on(table.driveId),
    index('idx_mock_round_tenant').on(table.tenantId),
    index('idx_mock_round_order').on(table.driveId, table.roundOrder),
    index('idx_mock_round_qbank').on(table.questionBankId)
  ]
);

/**
 * 44. Assessment Reports Table
 * Comprehensive analytical report synthesized after mock drive or practice evaluations.
 */
export const assessmentReports = pgTable(
  'assessment_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driveId: uuid('drive_id').references(() => mockDriveConfigurations.id, { onDelete: 'set null' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    targetRole: varchar('target_role', { length: 150 }).notNull(),
    aptitudeScore: numeric('aptitude_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    technicalScore: numeric('technical_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    interviewScore: numeric('interview_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    compositeScore: numeric('composite_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    strengthsJson: jsonb('strengths_json').default([]).notNull(),
    weaknessesJson: jsonb('weaknesses_json').default([]).notNull(),
    questionsAttempted: integer('questions_attempted').default(0).notNull(),
    questionsUnanswered: integer('questions_unanswered').default(0).notNull(),
    timeUtilizationSeconds: integer('time_utilization_seconds').default(0).notNull(),
    recommendationsJson: jsonb('recommendations_json').default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_assessment_report_drive').on(table.driveId),
    index('idx_assessment_report_student').on(table.studentId),
    index('idx_assessment_report_tenant').on(table.tenantId),
    index('idx_assessment_report_composite').on(table.compositeScore)
  ]
);

/**
 * 45. Mock Drive Participants Table
 * Student registrations and progression tracking across mock drive rounds.
 */
export const mockDriveParticipants = pgTable(
  'mock_drive_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driveId: uuid('drive_id')
      .notNull()
      .references(() => mockDriveConfigurations.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    registrationStatus: varchar('registration_status', { length: 50 }).default('REGISTERED').notNull(),
    currentRoundOrder: integer('current_round_order').default(1).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    finalReportId: uuid('final_report_id').references(() => assessmentReports.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_mock_participant_drive_student').on(table.driveId, table.studentId),
    index('idx_mock_participant_tenant').on(table.tenantId),
    index('idx_mock_participant_student').on(table.studentId),
    index('idx_mock_participant_status').on(table.registrationStatus)
  ]
);

/**
 * 46. Assessment Attempts Table
 * Student attempt sessions for specific mock rounds or standalone assessments.
 */
export const assessmentAttempts = pgTable(
  'assessment_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driveId: uuid('drive_id').references(() => mockDriveConfigurations.id, { onDelete: 'set null' }),
    roundId: uuid('round_id').references(() => mockDriveRounds.id, { onDelete: 'set null' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roundType: mockRoundTypeEnum('round_type').notNull(),
    status: assessmentAttemptStatusEnum('status').default('IN_PROGRESS').notNull(),
    score: numeric('score', { precision: 6, scale: 2 }).default('0.00').notNull(),
    maxScore: numeric('max_score', { precision: 6, scale: 2 }).default('100.00').notNull(),
    percentage: numeric('percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    topicAnalysisJson: jsonb('topic_analysis_json').default({}).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_attempt_student').on(table.studentId),
    index('idx_attempt_drive').on(table.driveId),
    index('idx_attempt_round').on(table.roundId),
    index('idx_attempt_tenant').on(table.tenantId),
    index('idx_attempt_status').on(table.status)
  ]
);

/**
 * 47. Assessment Responses Table
 * Granular per-question responses submitted during an assessment attempt.
 */
export const assessmentResponses = pgTable(
  'assessment_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => assessmentQuestions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    selectedOption: text('selected_option'),
    answerText: text('answer_text'),
    isCorrect: boolean('is_correct'),
    marksAwarded: numeric('marks_awarded', { precision: 5, scale: 2 }).default('0.00').notNull(),
    isMarkedForReview: boolean('is_marked_for_review').default(false).notNull(),
    timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_response_attempt').on(table.attemptId),
    index('idx_response_question').on(table.questionId),
    index('idx_response_student').on(table.studentId),
    index('idx_response_tenant').on(table.tenantId),
    uniqueIndex('uq_response_attempt_question').on(table.attemptId, table.questionId)
  ]
);

/**
 * 48. Coding Submissions Table
 * Executed code submissions for coding assessment problems with sandbox execution metrics.
 */
export const codingSubmissions = pgTable(
  'coding_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => assessmentQuestions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    language: codingLanguageEnum('language').notNull(),
    sourceCode: text('source_code').notNull(),
    verdict: codingVerdictEnum('verdict').notNull(),
    testCasesPassed: integer('test_cases_passed').default(0).notNull(),
    totalTestCases: integer('total_test_cases').default(0).notNull(),
    executionTimeMs: integer('execution_time_ms').default(0).notNull(),
    memoryKb: integer('memory_kb').default(0).notNull(),
    outputDetailsJson: jsonb('output_details_json').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_coding_sub_attempt').on(table.attemptId),
    index('idx_coding_sub_problem').on(table.problemId),
    index('idx_coding_sub_student').on(table.studentId),
    index('idx_coding_sub_tenant').on(table.tenantId),
    index('idx_coding_sub_verdict').on(table.verdict)
  ]
);

/**
 * 49. Interview Practice Sessions Table
 * AI or peer-conducted technical/behavioral interview practice sessions.
 */
export const interviewPracticeSessions = pgTable(
  'interview_practice_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    driveId: uuid('drive_id').references(() => mockDriveConfigurations.id, { onDelete: 'set null' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    targetRole: varchar('target_role', { length: 150 }).notNull(),
    category: varchar('category', { length: 50 }).default('TECHNICAL').notNull(),
    totalQuestions: integer('total_questions').default(5).notNull(),
    status: varchar('status', { length: 50 }).default('IN_PROGRESS').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_interview_session_student').on(table.studentId),
    index('idx_interview_session_drive').on(table.driveId),
    index('idx_interview_session_tenant').on(table.tenantId),
    index('idx_interview_session_status').on(table.status)
  ]
);

/**
 * 50. Interview Practice Feedback Table
 * Multi-dimensional evaluation rubrics for interview questions (correctness, clarity, relevance, etc.).
 */
export const interviewPracticeFeedback = pgTable(
  'interview_practice_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => interviewPracticeSessions.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').references(() => assessmentQuestions.id, { onDelete: 'set null' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentAnswer: text('student_answer'),
    audioRecordingUrl: varchar('audio_recording_url', { length: 1024 }),
    correctnessScore: numeric('correctness_score', { precision: 4, scale: 2 }).default('0.00').notNull(),
    understandingScore: numeric('understanding_score', { precision: 4, scale: 2 }).default('0.00').notNull(),
    completenessScore: numeric('completeness_score', { precision: 4, scale: 2 }).default('0.00').notNull(),
    relevanceScore: numeric('relevance_score', { precision: 4, scale: 2 }).default('0.00').notNull(),
    clarityScore: numeric('clarity_score', { precision: 4, scale: 2 }).default('0.00').notNull(),
    overallScore: numeric('overall_score', { precision: 4, scale: 2 }).default('0.00').notNull(),
    strengthsText: text('strengths_text'),
    weaknessesText: text('weaknesses_text'),
    suggestedAnswerText: text('suggested_answer_text'),
    evaluatorType: varchar('evaluator_type', { length: 50 }).default('AI').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_interview_fb_session').on(table.sessionId),
    index('idx_interview_fb_question').on(table.questionId),
    index('idx_interview_fb_student').on(table.studentId),
    index('idx_interview_fb_tenant').on(table.tenantId)
  ]
);

/**
 * 51. Learning Paths Table
 * Student personalized roadmap synthesized from assessment gap analysis and target roles.
 */
export const learningPaths = pgTable(
  'learning_paths',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    targetRole: varchar('target_role', { length: 150 }).notNull(),
    readinessScore: numeric('readiness_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    activeGoal: text('active_goal').notNull(),
    status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_learning_paths_student').on(table.studentId),
    index('idx_learning_paths_tenant').on(table.tenantId),
    index('idx_learning_paths_status').on(table.status)
  ]
);

/**
 * 52. Learning Tasks Table
 * Modular, actionable learning tasks (concepts, exercises, projects) tied to target skills.
 */
export const learningTasks = pgTable(
  'learning_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    pathId: uuid('path_id')
      .notNull()
      .references(() => learningPaths.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: learningTaskCategoryEnum('category').notNull(),
    targetSkill: varchar('target_skill', { length: 100 }).notNull(),
    difficulty: varchar('difficulty', { length: 20 }).default('intermediate').notNull(),
    estimatedHours: numeric('estimated_hours', { precision: 4, scale: 1 }).default('2.0').notNull(),
    completionCriteria: text('completion_criteria').notNull(),
    expectedEvidenceType: varchar('expected_evidence_type', { length: 50 }).default('project_repository').notNull(),
    status: learningTaskStatusEnum('status').default('RECOMMENDED').notNull(),
    taskOrder: integer('task_order').default(1).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_learning_tasks_path').on(table.pathId),
    index('idx_learning_tasks_student').on(table.studentId),
    index('idx_learning_tasks_tenant').on(table.tenantId),
    index('idx_learning_tasks_status').on(table.status),
    index('idx_learning_tasks_category').on(table.category),
    index('idx_learning_tasks_skill').on(table.targetSkill)
  ]
);

/**
 * 53. Learning Task Submissions Table
 * Student submitted deliverables (repositories, deployed applications, documentation) for verification.
 */
export const learningTaskSubmissions = pgTable(
  'learning_task_submissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => learningTasks.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    repositoryUrl: varchar('repository_url', { length: 1024 }),
    projectUrl: varchar('project_url', { length: 1024 }),
    documentationText: text('documentation_text'),
    reviewStatus: varchar('review_status', { length: 50 }).default('PENDING').notNull(),
    feedbackText: text('feedback_text'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_learning_sub_task').on(table.taskId),
    index('idx_learning_sub_student').on(table.studentId),
    index('idx_learning_sub_tenant').on(table.tenantId),
    index('idx_learning_sub_status').on(table.reviewStatus)
  ]
);

/**
 * 54. Learning Evidence Links Table
 * Verified binding between learning task submissions and verified student skills.
 */
export const learningEvidenceLinks = pgTable(
  'learning_evidence_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => learningTasks.id, { onDelete: 'cascade' }),
    submissionId: uuid('submission_id').references(() => learningTaskSubmissions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'set null' }),
    evidenceType: varchar('evidence_type', { length: 50 }).notNull(),
    evidenceUrl: varchar('evidence_url', { length: 1024 }).notNull(),
    verificationStatus: varchar('verification_status', { length: 50 }).default('pending_review').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_evidence_link_task').on(table.taskId),
    index('idx_evidence_link_sub').on(table.submissionId),
    index('idx_evidence_link_student').on(table.studentId),
    index('idx_evidence_link_tenant').on(table.tenantId),
    index('idx_evidence_link_skill').on(table.skillId)
  ]
);

// ============================================================================
// Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine Tables
// ============================================================================

/**
 * 55. Skill Taxonomy Master Table
 * Canonical repository of industry-standardized skills with hierarchy and external taxonomy mappings.
 */
export const skillTaxonomy = pgTable(
  'skill_taxonomy',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    skillName: varchar('skill_name', { length: 255 }).notNull(),
    canonicalName: varchar('canonical_name', { length: 255 }).notNull(),
    category: taxonomyCategoryEnum('category').notNull(),
    description: text('description'),
    parentSkillId: uuid('parent_skill_id').references((): any => skillTaxonomy.id, { onDelete: 'set null' }),
    externalMappingJson: jsonb('external_mapping_json').default({}).notNull(), // ESCO, O*NET, NSQF metadata
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_skill_tax_tenant').on(table.tenantId),
    index('idx_skill_tax_name').on(table.skillName),
    index('idx_skill_tax_canonical').on(table.canonicalName),
    index('idx_skill_tax_category').on(table.category),
    index('idx_skill_tax_parent').on(table.parentSkillId)
  ]
);

/**
 * 56. Skill Aliases Table
 * Alternative names, variations, and acronyms mapped to canonical taxonomy skills.
 */
export const skillAliases = pgTable(
  'skill_aliases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skillTaxonomy.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    aliasName: varchar('alias_name', { length: 255 }).notNull(),
    normalizedAlias: varchar('normalized_alias', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_skill_alias_skill').on(table.skillId),
    index('idx_skill_alias_tenant').on(table.tenantId),
    index('idx_skill_alias_normalized').on(table.normalizedAlias)
  ]
);

/**
 * 57. Job Description Sources Table
 * Registry of data acquisition channels for industry job postings.
 */
export const jobDescriptionSources = pgTable(
  'job_description_sources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sourceName: varchar('source_name', { length: 255 }).notNull(),
    sourceType: jdSourceTypeEnum('source_type').notNull(),
    sourceUrl: varchar('source_url', { length: 1024 }),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_jd_source_tenant').on(table.tenantId),
    index('idx_jd_source_type').on(table.sourceType),
    index('idx_jd_source_active').on(table.isActive)
  ]
);

/**
 * 58. Industry Job Descriptions Table
 * Ingested real-world employer job postings with metadata, provenance, and deduplication hashes.
 */
export const industryJobDescriptions = pgTable(
  'industry_job_descriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id').references(() => jobDescriptionSources.id, { onDelete: 'set null' }),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    jobTitle: varchar('job_title', { length: 255 }).notNull(),
    targetRole: varchar('target_role', { length: 255 }).notNull(),
    industryDomain: varchar('industry_domain', { length: 100 }),
    rawDescription: text('raw_description').notNull(),
    location: varchar('location', { length: 255 }),
    employmentType: varchar('employment_type', { length: 50 }).default('full_time'),
    experienceMinYears: numeric('experience_min_years', { precision: 4, scale: 1 }).default('0.0'),
    experienceMaxYears: numeric('experience_max_years', { precision: 4, scale: 1 }),
    educationRequirement: text('education_requirement'),
    publishedDate: timestamp('published_date', { withTimezone: true }),
    collectionTimestamp: timestamp('collection_timestamp', { withTimezone: true }).defaultNow().notNull(),
    contentHash: varchar('content_hash', { length: 64 }),
    duplicateOfId: uuid('duplicate_of_id').references((): any => industryJobDescriptions.id, { onDelete: 'set null' }),
    verificationStatus: varchar('verification_status', { length: 50 }).default('unverified').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_ind_jd_tenant').on(table.tenantId),
    index('idx_ind_jd_source').on(table.sourceId),
    index('idx_ind_jd_company').on(table.companyName),
    index('idx_ind_jd_role').on(table.targetRole),
    index('idx_ind_jd_hash').on(table.contentHash),
    index('idx_ind_jd_dup').on(table.duplicateOfId)
  ]
);

/**
 * 59. Job Description Analyses Table
 * Extracted and structured skill demand from job descriptions with human review auditing.
 */
export const jobDescriptionAnalyses = pgTable(
  'job_description_analyses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    jdId: uuid('jd_id')
      .notNull()
      .references(() => industryJobDescriptions.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    normalizedRole: varchar('normalized_role', { length: 255 }).notNull(),
    requiredSkillsJson: jsonb('required_skills_json').default([]).notNull(),
    preferredSkillsJson: jsonb('preferred_skills_json').default([]).notNull(),
    minExperienceYears: numeric('min_experience_years', { precision: 4, scale: 1 }).default('0.0'),
    educationRequirementsJson: jsonb('education_requirements_json').default([]).notNull(),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
    analysisMethod: varchar('analysis_method', { length: 50 }).default('AI').notNull(), // AI / DETERMINISTIC
    reviewStatus: jdAnalysisStatusEnum('review_status').default('PENDING').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewerNotes: text('reviewer_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_jd_analysis_jd').on(table.jdId),
    index('idx_jd_analysis_tenant').on(table.tenantId),
    index('idx_jd_analysis_role').on(table.normalizedRole),
    index('idx_jd_analysis_status').on(table.reviewStatus)
  ]
);

/**
 * 60. Industry Skill Demand Table
 * Aggregated demand frequency metrics per skill and time period across job descriptions.
 */
export const industrySkillDemand = pgTable(
  'industry_skill_demand',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').references(() => skillTaxonomy.id, { onDelete: 'set null' }),
    skillName: varchar('skill_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    mentionCount: integer('mention_count').default(0).notNull(),
    requiredCount: integer('required_count').default(0).notNull(),
    preferredCount: integer('preferred_count').default(0).notNull(),
    frequencyPercentage: numeric('frequency_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    analysisPeriod: varchar('analysis_period', { length: 50 }).notNull(), // e.g. "2026-Q4"
    lastAnalyzedAt: timestamp('last_analyzed_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_skill_demand_tenant').on(table.tenantId),
    index('idx_skill_demand_skill').on(table.skillId),
    index('idx_skill_demand_name').on(table.skillName),
    index('idx_skill_demand_period').on(table.analysisPeriod)
  ]
);

/**
 * 61. Industry Skill Trends Table
 * Time-series momentum and growth trajectories for skills across market windows.
 */
export const industrySkillTrends = pgTable(
  'industry_skill_trends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').references(() => skillTaxonomy.id, { onDelete: 'set null' }),
    skillName: varchar('skill_name', { length: 255 }).notNull(),
    currentPeriodMentions: integer('current_period_mentions').default(0).notNull(),
    previousPeriodMentions: integer('previous_period_mentions').default(0).notNull(),
    percentageGrowth: numeric('percentage_growth', { precision: 6, scale: 2 }).default('0.00').notNull(),
    momentumStatus: varchar('momentum_status', { length: 30 }).default('STABLE').notNull(), // SURGING, GROWING, STABLE, DECLINING
    sampleSize: integer('sample_size').default(0).notNull(),
    confidenceLevel: numeric('confidence_level', { precision: 5, scale: 2 }).default('100.00').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_skill_trend_tenant').on(table.tenantId),
    index('idx_skill_trend_skill').on(table.skillId),
    index('idx_skill_trend_name').on(table.skillName),
    index('idx_skill_trend_momentum').on(table.momentumStatus)
  ]
);

/**
 * 62. Role Skill Requirements Table
 * Benchmark competencies, foundational prerequisites, and project expectations per target role.
 */
export const roleSkillRequirements = pgTable(
  'role_skill_requirements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roleName: varchar('role_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    coreSkillsJson: jsonb('core_skills_json').default([]).notNull(),
    requiredFoundationsJson: jsonb('required_foundations_json').default([]).notNull(),
    preferredSkillsJson: jsonb('preferred_skills_json').default([]).notNull(),
    practicalProjectExpectationsJson: jsonb('practical_project_expectations_json').default([]).notNull(),
    experienceExpectations: text('experience_expectations'),
    isSystemTemplate: boolean('is_system_template').default(false).notNull(),
    isReviewed: boolean('is_reviewed').default(false).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_role_skill_tenant').on(table.tenantId),
    index('idx_role_skill_name').on(table.roleName),
    index('idx_role_skill_category').on(table.category)
  ]
);

/**
 * 63. Student Role Preferences Table
 * Student-configured or advisor-set career aspirations and role prioritization.
 */
export const studentRolePreferences = pgTable(
  'student_role_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    targetRole: varchar('target_role', { length: 255 }).notNull(),
    preferenceRank: integer('preference_rank').default(1).notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    setByStudent: boolean('set_by_student').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_student_role_pref_student').on(table.studentId),
    index('idx_student_role_pref_tenant').on(table.tenantId),
    index('idx_student_role_pref_role').on(table.targetRole)
  ]
);

/**
 * 64. Student Skill Gap Snapshots Table
 * Granular skill-by-skill gap diagnostic per student and target career role.
 */
export const studentSkillGapSnapshots = pgTable(
  'student_skill_gap_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    targetRole: varchar('target_role', { length: 255 }).notNull(),
    skillId: uuid('skill_id').references(() => skillTaxonomy.id, { onDelete: 'set null' }),
    skillName: varchar('skill_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    status: studentSkillGapStatusEnum('status').notNull(),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
    verifiedEvidenceCount: integer('verified_evidence_count').default(0).notNull(),
    unverifiedEvidenceCount: integer('unverified_evidence_count').default(0).notNull(),
    assessmentScore: numeric('assessment_score', { precision: 5, scale: 2 }),
    diagnosisRationale: text('diagnosis_rationale'),
    recommendedAction: text('recommended_action'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_std_gap_student').on(table.studentId),
    index('idx_std_gap_tenant').on(table.tenantId),
    index('idx_std_gap_role').on(table.targetRole),
    index('idx_std_gap_skill').on(table.skillId),
    index('idx_std_gap_status').on(table.status)
  ]
);

/**
 * 65. Career Recommendations Table
 * Explainable role recommendations synthesized from student verified profile, market demand, and gap analysis.
 */
export const careerRecommendations = pgTable(
  'career_recommendations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    recommendedRole: varchar('recommended_role', { length: 255 }).notNull(),
    fitLevel: careerRecommendationFitEnum('fit_level').notNull(),
    matchScorePercentage: numeric('match_score_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
    strengthsJson: jsonb('strengths_json').default([]).notNull(),
    gapsJson: jsonb('gaps_json').default([]).notNull(),
    suggestedProjectsJson: jsonb('suggested_projects_json').default([]).notNull(),
    suggestedLearningTasksJson: jsonb('suggested_learning_tasks_json').default([]).notNull(),
    rationaleText: text('rationale_text').notNull(),
    isDismissed: boolean('is_dismissed').default(false).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_career_rec_student').on(table.studentId),
    index('idx_career_rec_tenant').on(table.tenantId),
    index('idx_career_rec_role').on(table.recommendedRole),
    index('idx_career_rec_fit').on(table.fitLevel)
  ]
);

/**
 * 66. Cohort Skill Gap Snapshots Table
 * Macro department- and batch-level capability vs market demand analytics for institutional curriculum interventions.
 */
export const cohortSkillGapSnapshots = pgTable(
  'cohort_skill_gap_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    department: varchar('department', { length: 100 }).notNull(),
    graduationYear: integer('graduation_year').notNull(),
    totalStudentsAnalyzed: integer('total_students_analyzed').default(0).notNull(),
    mostCommonGapsJson: jsonb('most_common_gaps_json').default([]).notNull(),
    verifiedSkillCoverageJson: jsonb('verified_skill_coverage_json').default([]).notNull(),
    capabilityVsDemandJson: jsonb('capability_vs_demand_json').default([]).notNull(),
    recommendedInterventionsJson: jsonb('recommended_interventions_json').default([]).notNull(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_cohort_gap_tenant').on(table.tenantId),
    index('idx_cohort_gap_dept_year').on(table.department, table.graduationYear)
  ]
);

// ============================================================================
// Phase 14 — Predictive Placement Analytics Engine Tables
// ============================================================================

/**
 * 67. Placement Prediction Runs Table
 * Manages model training, evaluation runs, statistical validation metrics, and hyperparameters.
 */
export const placementPredictionRuns = pgTable(
  'placement_prediction_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    runName: varchar('run_name', { length: 255 }).notNull(),
    target: predictionTargetEnum('target').notNull(),
    modelType: predictionModelTypeEnum('model_type').notNull(),
    status: varchar('status', { length: 50 }).default('COMPLETED').notNull(),
    sampleSize: integer('sample_size').default(0).notNull(),
    trainingSplitRatio: numeric('training_split_ratio', { precision: 4, scale: 2 }).default('0.80'),
    accuracy: numeric('accuracy', { precision: 6, scale: 4 }),
    precision: numeric('precision', { precision: 6, scale: 4 }),
    recall: numeric('recall', { precision: 6, scale: 4 }),
    f1Score: numeric('f1_score', { precision: 6, scale: 4 }),
    brierScore: numeric('brier_score', { precision: 6, scale: 4 }),
    confusionMatrixJson: jsonb('confusion_matrix_json').default({}).notNull(),
    featureWeightsJson: jsonb('feature_weights_json').default({}).notNull(),
    hyperparametersJson: jsonb('hyperparameters_json').default({}).notNull(),
    executedBy: uuid('executed_by').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_pred_run_tenant').on(table.tenantId),
    index('idx_pred_run_target').on(table.target),
    index('idx_pred_run_model').on(table.modelType),
    index('idx_pred_run_executed_by').on(table.executedBy),
    index('idx_pred_run_created').on(table.createdAt)
  ]
);

/**
 * 68. Student Readiness History Table
 * Multi-dimensional longitudinal readiness classification and explainable contribution factors.
 */
export const studentReadinessHistory = pgTable(
  'student_readiness_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    readinessClassification: readinessClassificationEnum('readiness_classification').notNull(),
    overallScore: numeric('overall_score', { precision: 5, scale: 2 }).default('0.00').notNull(),
    academicScore: numeric('academic_score', { precision: 5, scale: 2 }).default('0.00'),
    technicalSkillScore: numeric('technical_skill_score', { precision: 5, scale: 2 }).default('0.00'),
    assessmentScore: numeric('assessment_score', { precision: 5, scale: 2 }).default('0.00'),
    interviewScore: numeric('interview_score', { precision: 5, scale: 2 }).default('0.00'),
    profileCompletenessScore: numeric('profile_completeness_score', { precision: 5, scale: 2 }).default('0.00'),
    verifiedEvidenceCount: integer('verified_evidence_count').default(0).notNull(),
    missingDataFlagsJson: jsonb('missing_data_flags_json').default([]).notNull(),
    factorsBreakdownJson: jsonb('factors_breakdown_json').default({}).notNull(),
    evaluationDate: timestamp('evaluation_date', { withTimezone: true }).defaultNow().notNull(),
    evaluatedBy: uuid('evaluated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_readiness_hist_tenant').on(table.tenantId),
    index('idx_readiness_hist_student').on(table.studentId),
    index('idx_readiness_hist_class').on(table.readinessClassification),
    index('idx_readiness_hist_date').on(table.evaluationDate)
  ]
);

/**
 * 69. Placement Outcome Predictions Table
 * Probability estimations, confidence intervals, model attribution, and ethical non-exclusion safeguards.
 */
export const placementPredictions = pgTable(
  'placement_predictions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id').references(() => placementDrives.id, { onDelete: 'cascade' }),
    probabilityScore: numeric('probability_score', { precision: 5, scale: 4 }).default('0.0000').notNull(),
    riskTier: riskTierEnum('risk_tier').default('moderate_risk').notNull(),
    contributingFactorsJson: jsonb('contributing_factors_json').default([]).notNull(),
    isAdvisoryOnly: boolean('is_advisory_only').default(true).notNull(),
    // Phase 14 Predictive Extensions
    runId: uuid('run_id').references(() => placementPredictionRuns.id, { onDelete: 'cascade' }),
    predictionTarget: predictionTargetEnum('prediction_target').default('OFFER_CONVERSION').notNull(),
    predictedProbability: numeric('predicted_probability', { precision: 6, scale: 4 }),
    confidenceIntervalLower: numeric('confidence_interval_lower', { precision: 6, scale: 4 }),
    confidenceIntervalUpper: numeric('confidence_interval_upper', { precision: 6, scale: 4 }),
    readinessClassification: readinessClassificationEnum('readiness_classification').default('INSUFFICIENT_DATA').notNull(),
    modelUsed: predictionModelTypeEnum('model_used').default('INSUFFICIENT_DATA_BASELINE').notNull(),
    dataCoverageScore: numeric('data_coverage_score', { precision: 5, scale: 2 }).default('100.00'),
    limitationsNotes: text('limitations_notes'),
    isInsufficientData: boolean('is_insufficient_data').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_predictions_tenant_student').on(table.tenantId, table.studentId),
    index('ix_placement_predictions_drive_id').on(table.driveId),
    index('idx_placement_pred_run').on(table.runId),
    index('idx_placement_pred_target').on(table.predictionTarget),
    index('idx_placement_pred_class').on(table.readinessClassification),
    index('idx_placement_pred_created').on(table.createdAt)
  ]
);

/**
 * 70. Student Support Recommendations Table
 * Diagnostic support identification across 7 categories using non-stigmatizing language and review workflow.
 */
export const studentSupportRecommendations = pgTable(
  'student_support_recommendations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    category: studentSupportCategoryEnum('category').notNull(),
    priority: interventionPriorityEnum('priority').default('MEDIUM').notNull(),
    status: supportInterventionStatusEnum('status').default('IDENTIFIED').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    supportRationale: text('support_rationale').notNull(),
    recommendedActionsJson: jsonb('recommended_actions_json').default([]).notNull(),
    evidenceJson: jsonb('evidence_json').default({}).notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_support_rec_tenant').on(table.tenantId),
    index('idx_support_rec_student').on(table.studentId),
    index('idx_support_rec_category').on(table.category),
    index('idx_support_rec_priority').on(table.priority),
    index('idx_support_rec_status').on(table.status),
    index('idx_support_rec_reviewed_by').on(table.reviewedBy)
  ]
);

/**
 * 71. TPO Intervention Records Table
 * Human-in-the-loop intervention plans, institutional clinics, bootcamps, and progress tracking.
 */
export const tpoInterventionRecords = pgTable(
  'tpo_intervention_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    recommendationId: uuid('recommendation_id').references(() => studentSupportRecommendations.id, { onDelete: 'set null' }),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }),
    department: varchar('department', { length: 100 }),
    batchYear: integer('batch_year'),
    title: varchar('title', { length: 255 }).notNull(),
    interventionType: varchar('intervention_type', { length: 100 }).notNull(),
    priority: interventionPriorityEnum('priority').default('MEDIUM').notNull(),
    status: supportInterventionStatusEnum('status').default('APPROVED').notNull(),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
    completedDate: timestamp('completed_date', { withTimezone: true }),
    actionNotes: text('action_notes'),
    targetStudentCount: integer('target_student_count').default(1).notNull(),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_tpo_interv_tenant').on(table.tenantId),
    index('idx_tpo_interv_student').on(table.studentId),
    index('idx_tpo_interv_rec').on(table.recommendationId),
    index('idx_tpo_interv_status').on(table.status),
    index('idx_tpo_interv_priority').on(table.priority),
    index('idx_tpo_interv_dept').on(table.department),
    index('idx_tpo_interv_batch').on(table.batchYear),
    index('idx_tpo_interv_assigned').on(table.assignedTo)
  ]
);

/**
 * 72. Placement Forecast Snapshots Table
 * Time-series forecast projections, historical averages, moving averages, and uncertainty bounds.
 */
export const placementForecastSnapshots = pgTable(
  'placement_forecast_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    forecastPeriod: varchar('forecast_period', { length: 100 }).notNull(),
    batchYear: integer('batch_year').notNull(),
    department: varchar('department', { length: 100 }),
    forecastMethod: forecastMethodEnum('forecast_method').notNull(),
    projectedPlacementRate: numeric('projected_placement_rate', { precision: 5, scale: 2 }).notNull(),
    lowerBoundRate: numeric('lower_bound_rate', { precision: 5, scale: 2 }),
    upperBoundRate: numeric('upper_bound_rate', { precision: 5, scale: 2 }),
    projectedOfferCount: integer('projected_offer_count').default(0),
    historicalSampleSize: integer('historical_sample_size').default(0).notNull(),
    parametersJson: jsonb('parameters_json').default({}).notNull(),
    scenarioVariablesJson: jsonb('scenario_variables_json').default({}).notNull(),
    isForecastUnavailable: boolean('is_forecast_unavailable').default(false).notNull(),
    forecastTimestamp: timestamp('forecast_timestamp', { withTimezone: true }).defaultNow().notNull(),
    generatedBy: uuid('generated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_forecast_snap_tenant').on(table.tenantId),
    index('idx_forecast_snap_period').on(table.forecastPeriod),
    index('idx_forecast_snap_batch').on(table.batchYear),
    index('idx_forecast_snap_dept').on(table.department),
    index('idx_forecast_snap_method').on(table.forecastMethod),
    index('idx_forecast_snap_time').on(table.forecastTimestamp)
  ]
);

/**
 * 73. Analytics Snapshots Table
 * Pre-aggregated cohort and department level placement metrics, mock drive insights, and trend records.
 */
export const analyticsSnapshots = pgTable(
  'analytics_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    snapshotType: varchar('snapshot_type', { length: 100 }).notNull(),
    batchYear: integer('batch_year'),
    department: varchar('department', { length: 100 }),
    cohortSize: integer('cohort_size').default(0).notNull(),
    isSuppressed: boolean('is_suppressed').default(false).notNull(),
    metricsJson: jsonb('metrics_json').default({}).notNull(),
    snapshotTimestamp: timestamp('snapshot_timestamp', { withTimezone: true }).defaultNow().notNull(),
    capturedBy: uuid('captured_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_analytics_snap_tenant').on(table.tenantId),
    index('idx_analytics_snap_type').on(table.snapshotType),
    index('idx_analytics_snap_batch').on(table.batchYear),
    index('idx_analytics_snap_dept').on(table.department),
    index('idx_analytics_snap_time').on(table.snapshotTimestamp)
  ]
);

/**
 * 74. Analytics Audit Events Table
 * Comprehensive immutable audit log of predictions, fairness monitoring, reports, and intervention decisions.
 */
export const analyticsAuditEvents = pgTable(
  'analytics_audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    targetResourceType: varchar('target_resource_type', { length: 100 }),
    targetResourceId: uuid('target_resource_id'),
    detailsJson: jsonb('details_json').default({}).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_analytics_audit_tenant').on(table.tenantId),
    index('idx_analytics_audit_user').on(table.userId),
    index('idx_analytics_audit_event').on(table.eventType),
    index('idx_analytics_audit_resource').on(table.targetResourceId),
    index('idx_analytics_audit_time').on(table.createdAt)
  ]
);

// ============================================================================
// Phase 15 — Autonomous Placement Orchestration Engine Tables
// ============================================================================

/**
 * 75. Agent Workflows Table
 * Multi-agent orchestration workflows with state machine tracking, idempotency, retry policies, and multi-tenant isolation.
 */
export const agentWorkflows = pgTable(
  'agent_workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    workflowDefinitionId: varchar('workflow_definition_id', { length: 150 }).default('CENTRAL_WORKFLOW').notNull(),
    workflowName: varchar('workflow_name', { length: 150 }).notNull(),
    triggerType: workflowTriggerTypeEnum('trigger_type').default('MANUAL_USER').notNull(),
    initiatedBy: uuid('initiated_by').references(() => users.id, { onDelete: 'set null' }),
    idempotencyKey: varchar('idempotency_key', { length: 255 }),
    status: workflowStatusEnum('status').default('QUEUED').notNull(),
    priority: varchar('priority', { length: 50 }).default('NORMAL').notNull(),
    inputPayloadJson: jsonb('input_payload_json').default({}).notNull(),
    outputResultJson: jsonb('output_result_json').default({}),
    errorDetailsJson: jsonb('error_details_json').default({}),
    executionDurationMs: integer('execution_duration_ms'),
    timeoutMs: integer('timeout_ms').default(300000).notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    maxRetries: integer('max_retries').default(3).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    // Compatibility columns with legacy state machine
    targetEntityType: varchar('target_entity_type', { length: 50 }),
    targetEntityId: uuid('target_entity_id'),
    currentStage: varchar('current_stage', { length: 100 }),
    stateHistory: jsonb('state_history').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_workflows_tenant_entity').on(table.tenantId, table.targetEntityType, table.targetEntityId),
    index('idx_agent_workflows_tenant').on(table.tenantId),
    index('idx_agent_workflows_status').on(table.status),
    index('idx_agent_workflows_definition').on(table.workflowDefinitionId),
    index('idx_agent_workflows_trigger').on(table.triggerType),
    index('idx_agent_workflows_initiated_by').on(table.initiatedBy),
    index('idx_agent_workflows_idempotency').on(table.idempotencyKey),
    index('idx_agent_workflows_created_at').on(table.createdAt)
  ]
);

/**
 * 76. Agent Workflow Steps Table
 * Granular step-level execution tracking, inputs/outputs, error diagnosis, and responsible agent mapping.
 */
export const agentWorkflowSteps = pgTable(
  'agent_workflow_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => agentWorkflows.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    stepName: varchar('step_name', { length: 150 }).notNull(),
    stepIndex: integer('step_index').notNull(),
    responsibleAgent: agentNameEnum('responsible_agent').notNull(),
    status: workflowStatusEnum('status').default('QUEUED').notNull(),
    inputJson: jsonb('input_json').default({}).notNull(),
    outputJson: jsonb('output_json').default({}),
    errorJson: jsonb('error_json').default({}),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_workflow_steps_workflow').on(table.workflowId),
    index('idx_workflow_steps_tenant').on(table.tenantId),
    index('idx_workflow_steps_agent').on(table.responsibleAgent),
    index('idx_workflow_steps_status').on(table.status),
    index('idx_workflow_steps_created_at').on(table.createdAt)
  ]
);

/**
 * 77. Agent Execution Events Table
 * Real-time event log for orchestrator pub/sub, inter-agent coordination, and latency tracking.
 */
export const agentExecutionEvents = pgTable(
  'agent_execution_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id').references(() => agentWorkflows.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    agentName: agentNameEnum('agent_name').notNull(),
    payloadJson: jsonb('payload_json').default({}).notNull(),
    correlationId: varchar('correlation_id', { length: 255 }),
    executionTimeMs: integer('execution_time_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_exec_events_workflow').on(table.workflowId),
    index('idx_exec_events_tenant').on(table.tenantId),
    index('idx_exec_events_agent').on(table.agentName),
    index('idx_exec_events_type').on(table.eventType),
    index('idx_exec_events_correlation').on(table.correlationId),
    index('idx_exec_events_created_at').on(table.createdAt)
  ]
);

/**
 * 78. Agent Workflow Approvals Table
 * Human-in-the-loop review, approval gates, role-based signing, and reviewer notes.
 */
export const agentWorkflowApprovals = pgTable(
  'agent_workflow_approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => agentWorkflows.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    stepId: uuid('step_id').references(() => agentWorkflowSteps.id, { onDelete: 'set null' }),
    actionType: varchar('action_type', { length: 100 }).notNull(),
    requiredRole: varchar('required_role', { length: 50 }).default('TPO_ADMIN').notNull(),
    status: workflowApprovalStatusEnum('status').default('PENDING').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewerNotes: text('reviewer_notes'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_workflow_approvals_workflow').on(table.workflowId),
    index('idx_workflow_approvals_tenant').on(table.tenantId),
    index('idx_workflow_approvals_step').on(table.stepId),
    index('idx_workflow_approvals_status').on(table.status),
    index('idx_workflow_approvals_reviewer').on(table.reviewedBy),
    index('idx_workflow_approvals_created_at').on(table.createdAt)
  ]
);

/**
 * 79. Notification Events Table
 * Realtime and inbox notifications dispatched during automated agent workflows, approvals, and system triggers.
 */
export const notificationEvents = pgTable(
  'notification_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    recipientUserId: uuid('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventType: notificationEventTypeEnum('event_type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    referenceType: varchar('reference_type', { length: 100 }),
    referenceId: varchar('reference_id', { length: 255 }),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    metadataJson: jsonb('metadata_json').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_notification_events_tenant').on(table.tenantId),
    index('idx_notification_events_recipient').on(table.recipientUserId),
    index('idx_notification_events_type').on(table.eventType),
    index('idx_notification_events_is_read').on(table.isRead),
    index('idx_notification_events_created_at').on(table.createdAt),
    index('idx_notification_events_user_unread').on(table.recipientUserId, table.isRead)
  ]
);

/**
 * 80. Delegated Reviewers Table
 * Persistent delegation of review and verification authority with expirations, scopes, and revocability.
 */
export const delegatedReviewers = pgTable(
  'delegated_reviewers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    delegatedBy: uuid('delegated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    permissionsJson: jsonb('permissions_json').default([]).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_delegated_reviewers_tenant').on(table.tenantId),
    index('idx_delegated_reviewers_user').on(table.userId),
    index('idx_delegated_reviewers_delegated_by').on(table.delegatedBy),
    index('idx_delegated_reviewers_active').on(table.isActive),
    index('idx_delegated_reviewers_created_at').on(table.createdAt)
  ]
);

// ============================================================================
// Phase 16 — Peer Collaboration & Alumni Mentorship Ecosystem Tables
// ============================================================================

/**
 * 81. Alumni Profiles Table
 * Detailed alumni professional background, graduation cohort, domain expertise, and mentorship capacity.
 */
export const alumniProfiles = pgTable(
  'alumni_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    graduationYear: integer('graduation_year').notNull(),
    degree: varchar('degree', { length: 150 }).notNull(),
    department: varchar('department', { length: 150 }).notNull(),
    currentCompany: varchar('current_company', { length: 255 }).notNull(),
    currentRole: varchar('current_role', { length: 255 }).notNull(),
    industryDomain: varchar('industry_domain', { length: 150 }),
    totalExperienceYears: integer('total_experience_years').default(0).notNull(),
    linkedInUrl: varchar('linkedin_url', { length: 500 }),
    githubUrl: varchar('github_url', { length: 500 }),
    portfolioUrl: varchar('portfolio_url', { length: 500 }),
    bio: text('bio'),
    skills: jsonb('skills').default([]).notNull(),
    expertiseAreas: jsonb('expertise_areas').default([]).notNull(),
    mentorshipEnabled: boolean('mentorship_enabled').default(true).notNull(),
    maxActiveMentees: integer('max_active_mentees').default(3).notNull(),
    verificationStatus: alumniVerificationStatusEnum('verification_status').default('PENDING').notNull(),
    verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verificationNotes: text('verification_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_alumni_profiles_user').on(table.userId),
    index('idx_alumni_profiles_tenant').on(table.tenantId),
    index('idx_alumni_profiles_status').on(table.verificationStatus),
    index('idx_alumni_profiles_company').on(table.currentCompany),
    index('idx_alumni_profiles_enabled').on(table.mentorshipEnabled),
    index('idx_alumni_profiles_dept_year').on(table.tenantId, table.department, table.graduationYear),
    index('idx_alumni_profiles_created_at').on(table.createdAt)
  ]
);

/**
 * 82. Mentor Availability Table
 * Weekly recurring or date-specific availability slots configured by alumni mentors.
 */
export const mentorAvailability = pgTable(
  'mentor_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    alumniProfileId: uuid('alumni_profile_id')
      .notNull()
      .references(() => alumniProfiles.id, { onDelete: 'cascade' }),
    mentorUserId: uuid('mentor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: varchar('start_time', { length: 10 }).notNull(),
    endTime: varchar('end_time', { length: 10 }).notNull(),
    timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata').notNull(),
    isRecurring: boolean('is_recurring').default(true).notNull(),
    specificDate: date('specific_date'),
    maxBookingsPerSlot: integer('max_bookings_per_slot').default(1).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mentor_avail_tenant').on(table.tenantId),
    index('idx_mentor_avail_profile').on(table.alumniProfileId),
    index('idx_mentor_avail_mentor').on(table.mentorUserId),
    index('idx_mentor_avail_active').on(table.isActive),
    index('idx_mentor_avail_day').on(table.dayOfWeek)
  ]
);

/**
 * 83. Mentorship Requests Table
 * Student guidance and mock interview requests dispatched to alumni mentors.
 */
export const mentorshipRequests = pgTable(
  'mentorship_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    studentUserId: uuid('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    alumniProfileId: uuid('alumni_profile_id')
      .notNull()
      .references(() => alumniProfiles.id, { onDelete: 'cascade' }),
    mentorUserId: uuid('mentor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topic: varchar('topic', { length: 255 }).notNull(),
    message: text('message').notNull(),
    goals: text('goals'),
    preferredSlotId: uuid('preferred_slot_id').references(() => mentorAvailability.id, { onDelete: 'set null' }),
    preferredDate: timestamp('preferred_date', { withTimezone: true }),
    status: mentorshipRequestStatusEnum('status').default('PENDING').notNull(),
    rejectionReason: text('rejection_reason'),
    rescheduleNote: text('reschedule_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mentorship_req_tenant').on(table.tenantId),
    index('idx_mentorship_req_student').on(table.studentId),
    index('idx_mentorship_req_student_user').on(table.studentUserId),
    index('idx_mentorship_req_mentor_user').on(table.mentorUserId),
    index('idx_mentorship_req_profile').on(table.alumniProfileId),
    index('idx_mentorship_req_status').on(table.status),
    index('idx_mentorship_req_created_at').on(table.createdAt)
  ]
);

/**
 * 84. Mentorship Sessions Table
 * Scheduled, in-progress, and completed 1-on-1 mentorship appointments with audit trail and notes.
 */
export const mentorshipSessions = pgTable(
  'mentorship_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    requestId: uuid('request_id')
      .notNull()
      .references(() => mentorshipRequests.id, { onDelete: 'cascade' }),
    alumniProfileId: uuid('alumni_profile_id')
      .notNull()
      .references(() => alumniProfiles.id, { onDelete: 'cascade' }),
    mentorUserId: uuid('mentor_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    studentUserId: uuid('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').default(45).notNull(),
    meetingLink: varchar('meeting_link', { length: 500 }),
    roomCode: varchar('room_code', { length: 100 }),
    status: varchar('status', { length: 50 }).default('SCHEDULED').notNull(),
    alumniNotes: text('alumni_notes'),
    studentNotes: text('student_notes'),
    actionItems: jsonb('action_items').default([]).notNull(),
    recordingUrl: varchar('recording_url', { length: 500 }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mentorship_sess_tenant').on(table.tenantId),
    index('idx_mentorship_sess_request').on(table.requestId),
    index('idx_mentorship_sess_mentor').on(table.mentorUserId),
    index('idx_mentorship_sess_student').on(table.studentUserId),
    index('idx_mentorship_sess_scheduled').on(table.scheduledAt),
    index('idx_mentorship_sess_status').on(table.status),
    index('idx_mentorship_sess_created_at').on(table.createdAt)
  ]
);

/**
 * 85. Mentorship Feedback Table
 * Dual-perspective post-session ratings and qualitative reviews submitted by mentors and students.
 */
export const mentorshipFeedback = pgTable(
  'mentorship_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => mentorshipSessions.id, { onDelete: 'cascade' }),
    submittedBy: uuid('submitted_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    feedbackTarget: varchar('feedback_target', { length: 50 }).notNull(),
    rating: integer('rating').notNull(),
    feedbackText: text('feedback_text'),
    rubricScores: jsonb('rubric_scores').default({}).notNull(),
    wouldRecommend: boolean('would_recommend').default(true).notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mentorship_fb_tenant').on(table.tenantId),
    index('idx_mentorship_fb_session').on(table.sessionId),
    index('idx_mentorship_fb_author').on(table.submittedBy),
    index('idx_mentorship_fb_rating').on(table.rating),
    index('idx_mentorship_fb_created_at').on(table.createdAt)
  ]
);

/**
 * 86. Peer Interview Rooms Table
 * Live peer mock interview rooms with shared code editor state, WebRTC coordination, and rubric settings.
 */
export const peerInterviewRooms = pgTable(
  'peer_interview_rooms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomCode: varchar('room_code', { length: 100 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    interviewType: peerInterviewTypeEnum('interview_type').notNull(),
    mode: peerInterviewModeEnum('mode').default('STRUCTURED_INTERVIEW').notNull(),
    status: peerInterviewStatusEnum('status').default('SCHEDULED').notNull(),
    scheduledStartTime: timestamp('scheduled_start_time', { withTimezone: true }).notNull(),
    scheduledDurationMinutes: integer('scheduled_duration_minutes').default(60).notNull(),
    actualStartTime: timestamp('actual_start_time', { withTimezone: true }),
    actualEndTime: timestamp('actual_end_time', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    maxParticipants: integer('max_participants').default(2).notNull(),
    sharedCodeContent: text('shared_code_content').default('').notNull(),
    codeLanguage: varchar('code_language', { length: 50 }).default('javascript').notNull(),
    sharedWhiteboardState: jsonb('shared_whiteboard_state').default({}).notNull(),
    rubricTemplate: jsonb('rubric_template').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_peer_interview_room_code').on(table.tenantId, table.roomCode),
    index('idx_peer_room_tenant').on(table.tenantId),
    index('idx_peer_room_status').on(table.status),
    index('idx_peer_room_type').on(table.interviewType),
    index('idx_peer_room_scheduled').on(table.scheduledStartTime),
    index('idx_peer_room_created_by').on(table.createdBy),
    index('idx_peer_room_created_at').on(table.createdAt)
  ]
);

/**
 * 87. Peer Interview Participants Table
 * Room participant assignments (interviewer vs interviewee), connection states, and media flags.
 */
export const peerInterviewParticipants = pgTable(
  'peer_interview_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => peerInterviewRooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'set null' }),
    role: varchar('role', { length: 50 }).default('INTERVIEWEE').notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    connectionStatus: varchar('connection_status', { length: 50 }).default('CONNECTED').notNull(),
    cameraEnabled: boolean('camera_enabled').default(true).notNull(),
    micEnabled: boolean('mic_enabled').default(true).notNull(),
    screenShareEnabled: boolean('screen_share_enabled').default(false).notNull()
  },
  (table) => [
    index('idx_peer_part_tenant').on(table.tenantId),
    index('idx_peer_part_room').on(table.roomId),
    index('idx_peer_part_user').on(table.userId),
    index('idx_peer_part_room_user').on(table.roomId, table.userId)
  ]
);

/**
 * 88. Peer Interview Questions Table
 * Problems, behavioral prompts, and system design challenges assigned during a peer mock session.
 */
export const peerInterviewQuestions = pgTable(
  'peer_interview_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => peerInterviewRooms.id, { onDelete: 'cascade' }),
    questionTitle: varchar('question_title', { length: 255 }).notNull(),
    questionDescription: text('question_description').notNull(),
    difficulty: varchar('difficulty', { length: 50 }).default('MEDIUM').notNull(),
    category: varchar('category', { length: 100 }).default('CODING').notNull(),
    standardAnswer: text('standard_answer'),
    codeTemplate: text('code_template'),
    orderIndex: integer('order_index').default(0).notNull(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_peer_q_tenant').on(table.tenantId),
    index('idx_peer_q_room').on(table.roomId),
    index('idx_peer_q_category').on(table.category),
    index('idx_peer_q_created_at').on(table.createdAt)
  ]
);

/**
 * 89. Peer Interview Feedback Table
 * Standardized 4-dimension rubric scoring (Technical, Communication, Problem Solving, Code Quality) with qualitative notes.
 */
export const peerInterviewFeedback = pgTable(
  'peer_interview_feedback',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => peerInterviewRooms.id, { onDelete: 'cascade' }),
    evaluatorUserId: uuid('evaluator_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    evaluateeUserId: uuid('evaluatee_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    overallRating: integer('overall_rating').notNull(),
    technicalScore: integer('technical_score'),
    communicationScore: integer('communication_score'),
    problemSolvingScore: integer('problem_solving_score'),
    codeQualityScore: integer('code_quality_score'),
    detailedRubricScores: jsonb('detailed_rubric_scores').default({}).notNull(),
    strengthsText: text('strengths_text'),
    improvementsText: text('improvements_text'),
    generalFeedback: text('general_feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_peer_fb_tenant').on(table.tenantId),
    index('idx_peer_fb_room').on(table.roomId),
    index('idx_peer_fb_evaluator').on(table.evaluatorUserId),
    index('idx_peer_fb_evaluatee').on(table.evaluateeUserId),
    index('idx_peer_fb_created_at').on(table.createdAt)
  ]
);

/**
 * 90. Collaboration Rooms Table
 * Cohort study pods, project teams, and category-based group learning spaces.
 */
export const collaborationRooms = pgTable(
  'collaboration_rooms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    slug: varchar('slug', { length: 150 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: collaborationRoomCategoryEnum('category').default('GENERAL_STUDY').notNull(),
    status: collaborationRoomStatusEnum('status').default('ACTIVE').notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    passcodeHash: varchar('passcode_hash', { length: 255 }),
    maxMembers: integer('max_members').default(10).notNull(),
    activeMemberCount: integer('active_member_count').default(0).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pinnedMessageId: uuid('pinned_message_id'),
    tags: jsonb('tags').default([]).notNull(),
    canvasState: jsonb('canvas_state').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_collab_room_tenant_slug').on(table.tenantId, table.slug),
    index('idx_collab_room_tenant').on(table.tenantId),
    index('idx_collab_room_category').on(table.category),
    index('idx_collab_room_status').on(table.status),
    index('idx_collab_room_creator').on(table.createdBy),
    index('idx_collab_room_created_at').on(table.createdAt)
  ]
);

/**
 * 91. Collaboration Participants Table
 * Room membership, moderation roles (Host, Moderator, Member), and activity tracking.
 */
export const collaborationParticipants = pgTable(
  'collaboration_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => collaborationRooms.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 50 }).default('MEMBER').notNull(),
    isMuted: boolean('is_muted').default(false).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
    leftAt: timestamp('left_at', { withTimezone: true })
  },
  (table) => [
    uniqueIndex('uq_collab_part_room_user').on(table.roomId, table.userId),
    index('idx_collab_part_tenant').on(table.tenantId),
    index('idx_collab_part_room').on(table.roomId),
    index('idx_collab_part_user').on(table.userId),
    index('idx_collab_part_last_active').on(table.lastActiveAt)
  ]
);

/**
 * 92. Collaboration Messages Table
 * Persistent chat stream, code snippets, reactions, and attachments in group study rooms.
 */
export const collaborationMessages = pgTable(
  'collaboration_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => collaborationRooms.id, { onDelete: 'cascade' }),
    senderUserId: uuid('sender_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    messageType: varchar('message_type', { length: 50 }).default('TEXT').notNull(),
    content: text('content').notNull(),
    codeSnippetJson: jsonb('code_snippet_json').default({}).notNull(),
    attachmentUrl: varchar('attachment_url', { length: 500 }),
    isPinned: boolean('is_pinned').default(false).notNull(),
    isEdited: boolean('is_edited').default(false).notNull(),
    reactions: jsonb('reactions').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_collab_msg_tenant').on(table.tenantId),
    index('idx_collab_msg_room').on(table.roomId),
    index('idx_collab_msg_sender').on(table.senderUserId),
    index('idx_collab_msg_created_at').on(table.createdAt)
  ]
);

/**
 * 93. Collaboration Tasks Table
 * Peer sprint milestones, study tasks, and action item tracking within study pods.
 */
export const collaborationTasks = pgTable(
  'collaboration_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id')
      .notNull()
      .references(() => collaborationRooms.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).default('TODO').notNull(),
    priority: varchar('priority', { length: 50 }).default('MEDIUM').notNull(),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_collab_task_tenant').on(table.tenantId),
    index('idx_collab_task_room').on(table.roomId),
    index('idx_collab_task_assigned').on(table.assignedTo),
    index('idx_collab_task_status').on(table.status),
    index('idx_collab_task_created_at').on(table.createdAt)
  ]
);

/**
 * 94. Moderation Reports Table
 * Student/mentor anti-harassment reports, policy violations, and incident triage for TPO governance.
 */
export const moderationReports = pgTable(
  'moderation_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    reporterUserId: uuid('reporter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reportedUserId: uuid('reported_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    reason: varchar('reason', { length: 255 }).notNull(),
    description: text('description').notNull(),
    evidenceJson: jsonb('evidence_json').default({}).notNull(),
    status: moderationReportStatusEnum('status').default('PENDING_REVIEW').notNull(),
    investigatedBy: uuid('investigated_by').references(() => users.id, { onDelete: 'set null' }),
    investigationNotes: text('investigation_notes'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mod_rep_tenant').on(table.tenantId),
    index('idx_mod_rep_reporter').on(table.reporterUserId),
    index('idx_mod_rep_reported').on(table.reportedUserId),
    index('idx_mod_rep_status').on(table.status),
    index('idx_mod_rep_entity').on(table.entityType, table.entityId),
    index('idx_mod_rep_created_at').on(table.createdAt)
  ]
);

/**
 * 95. Moderation Actions Table
 * TPO and College Admin enforcement actions (warning, session termination, participant block, account suspension).
 */
export const moderationActions = pgTable(
  'moderation_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    reportId: uuid('report_id')
      .notNull()
      .references(() => moderationReports.id, { onDelete: 'cascade' }),
    actionType: moderationActionEnum('action_type').notNull(),
    targetUserId: uuid('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    executedBy: uuid('executed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    actionDurationHours: integer('action_duration_hours').default(0).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_mod_act_tenant').on(table.tenantId),
    index('idx_mod_act_report').on(table.reportId),
    index('idx_mod_act_target').on(table.targetUserId),
    index('idx_mod_act_executed_by').on(table.executedBy),
    index('idx_mod_act_type').on(table.actionType),
    index('idx_mod_act_created_at').on(table.createdAt)
  ]
);

// ============================================================================
// Phase 17 — Institutional Governance, Accreditation & Outreach Tables
// ============================================================================

/**
 * 96. Institutional Metric Snapshots Table
 * High-fidelity empirical snapshots of institutional KPIs, cohort analytics, placement rates, and skill coverage.
 */
export const institutionalMetricSnapshots = pgTable(
  'institutional_metric_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    snapshotType: varchar('snapshot_type', { length: 50 }).notNull(),
    academicYear: varchar('academic_year', { length: 20 }),
    cohortBatch: varchar('cohort_batch', { length: 50 }),
    department: varchar('department', { length: 150 }),
    totalStudents: integer('total_students').default(0).notNull(),
    eligibleStudents: integer('eligible_students').default(0).notNull(),
    placedStudents: integer('placed_students').default(0).notNull(),
    placementRate: doublePrecision('placement_rate'),
    medianSalary: doublePrecision('median_salary'),
    meanSalary: doublePrecision('mean_salary'),
    highestSalary: doublePrecision('highest_salary'),
    lowestSalary: doublePrecision('lowest_salary'),
    verifiedSkillCoverage: doublePrecision('verified_skill_coverage'),
    skillGapClosureRate: doublePrecision('skill_gap_closure_rate'),
    shortlistToOfferRatio: doublePrecision('shortlist_to_offer_ratio'),
    avgTimeToShortlistDays: doublePrecision('avg_time_to_shortlist_days'),
    recruiterEngagementScore: doublePrecision('recruiter_engagement_score'),
    metricsJson: jsonb('metrics_json').default({}).notNull(),
    dataQualityStatus: varchar('data_quality_status', { length: 50 }).default('COMPLETE').notNull(),
    dataCompletenessScore: doublePrecision('data_completeness_score').default(1.0).notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_inst_metric_tenant').on(table.tenantId),
    index('idx_inst_metric_type').on(table.snapshotType),
    index('idx_inst_metric_academic_year').on(table.academicYear),
    index('idx_inst_metric_cohort_batch').on(table.cohortBatch),
    index('idx_inst_metric_dept').on(table.department),
    index('idx_inst_metric_calc_at').on(table.calculatedAt),
    index('idx_inst_metric_created_at').on(table.createdAt)
  ]
);

/**
 * 97. Training Interventions Table
 * Targeted institutional upskilling programs to resolve cohort skill gaps with human TPO governance.
 */
export const trainingInterventions = pgTable(
  'training_interventions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    targetSkill: varchar('target_skill', { length: 150 }).notNull(),
    targetDepartment: varchar('target_department', { length: 150 }),
    targetBatch: varchar('target_batch', { length: 50 }),
    proposedBy: uuid('proposed_by').references(() => users.id, { onDelete: 'set null' }),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    status: interventionStatusEnum('status').default('PROPOSED').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    budget: doublePrecision('budget').default(0),
    actionPlan: text('action_plan'),
    targetStudentCount: integer('target_student_count').default(0).notNull(),
    enrolledCount: integer('enrolled_count').default(0).notNull(),
    completedCount: integer('completed_count').default(0).notNull(),
    baselineSkillAverage: doublePrecision('baseline_skill_average'),
    postInterventionSkillAverage: doublePrecision('post_intervention_skill_average'),
    skillImprovementPercentage: doublePrecision('skill_improvement_percentage'),
    attendanceOnlyRuleEnforced: boolean('attendance_only_rule_enforced').default(true).notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    auditTrailJson: jsonb('audit_trail_json').default([]).notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_train_intv_tenant').on(table.tenantId),
    index('idx_train_intv_status').on(table.status),
    index('idx_train_intv_skill').on(table.targetSkill),
    index('idx_train_intv_dept').on(table.targetDepartment),
    index('idx_train_intv_batch').on(table.targetBatch),
    index('idx_train_intv_proposed_by').on(table.proposedBy),
    index('idx_train_intv_approved_by').on(table.approvedBy),
    index('idx_train_intv_created_at').on(table.createdAt)
  ]
);

/**
 * 98. Training Intervention Participants Table
 * Student participation in skill interventions, attendance, project submission, and verified mastery.
 */
export const trainingInterventionParticipants = pgTable(
  'training_intervention_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    interventionId: uuid('intervention_id')
      .notNull()
      .references(() => trainingInterventions.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    supportClassification: varchar('support_classification', { length: 50 }).default('SUPPORT_RECOMMENDED').notNull(),
    rollNumber: varchar('roll_number', { length: 50 }),
    studentDepartment: varchar('student_department', { length: 150 }),
    attendanceRate: doublePrecision('attendance_rate').default(0).notNull(),
    attendanceCount: integer('attendance_count').default(0).notNull(),
    attendanceVerified: boolean('attendance_verified').default(false).notNull(),
    projectSubmitted: boolean('project_submitted').default(false).notNull(),
    projectEvidenceSubmitted: boolean('project_evidence_submitted').default(false).notNull(),
    projectEvidenceUrl: text('project_evidence_url'),
    projectEvidenceDescription: text('project_evidence_description'),
    projectScore: doublePrecision('project_score'),
    verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    tpoVerified: boolean('tpo_verified').default(false).notNull(),
    skillMasteryVerified: boolean('skill_mastery_verified').default(false).notNull(),
    verifiedSkillGainRecorded: boolean('verified_skill_gain_recorded').default(false).notNull(),
    preScore: doublePrecision('pre_score'),
    postScore: doublePrecision('post_score'),
    status: varchar('status', { length: 50 }).default('ENROLLED').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_train_intv_part_student').on(table.interventionId, table.studentId),
    index('idx_train_intv_part_tenant').on(table.tenantId),
    index('idx_train_intv_part_intv').on(table.interventionId),
    index('idx_train_intv_part_student').on(table.studentId),
    index('idx_train_intv_part_user').on(table.userId),
    index('idx_train_intv_part_status').on(table.status),
    index('idx_train_intv_part_verified').on(table.skillMasteryVerified),
    index('idx_train_intv_part_created_at').on(table.createdAt)
  ]
);

/**
 * 99. Fairness Review Cases Table
 * Auditable governance tracking for selection funnel stage disparities and EEOC Four-Fifths benchmark flags.
 */
export const fairnessReviewCases = pgTable(
  'fairness_review_cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    driveId: uuid('drive_id').references(() => placementDrives.id, { onDelete: 'set null' }),
    cohortId: varchar('cohort_id', { length: 100 }),
    metricName: varchar('metric_name', { length: 150 }),
    stage: varchar('stage', { length: 100 }).notNull(),
    demographicCategory: varchar('demographic_category', { length: 100 }).default('GENERAL').notNull(),
    groupName: varchar('group_name', { length: 100 }).notNull(),
    referenceGroupName: varchar('reference_group_name', { length: 100 }).notNull(),
    groupSize: integer('group_size').default(0).notNull(),
    groupSelectedCount: integer('group_selected_count').default(0).notNull(),
    groupSelectionRate: doublePrecision('group_selection_rate').notNull(),
    referenceGroupSize: integer('reference_group_size').default(0).notNull(),
    referenceGroupSelectedCount: integer('reference_group_selected_count').default(0).notNull(),
    referenceGroupSelectionRate: doublePrecision('reference_group_selection_rate').notNull(),
    disparityRatio: doublePrecision('disparity_ratio').notNull(),
    isSmallGroupSuppressed: boolean('is_small_group_suppressed').default(false).notNull(),
    status: fairnessReviewStatusEnum('status').default('FLAGGED').notNull(),
    flaggedReason: text('flagged_reason').default('Disparity ratio below four-fifths threshold').notNull(),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewerNotes: text('reviewer_notes'),
    resolutionNotes: text('resolution_notes'),
    resolutionReason: text('resolution_reason'),
    explanationRequestedFrom: varchar('explanation_requested_from', { length: 255 }),
    explanationRequestedAt: timestamp('explanation_requested_at', { withTimezone: true }),
    explanationReceived: text('explanation_received'),
    explanationProvided: text('explanation_provided'),
    escalationNotes: text('escalation_notes'),
    auditTrailJson: jsonb('audit_trail_json').default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_fairness_case_tenant').on(table.tenantId),
    index('idx_fairness_case_drive').on(table.driveId),
    index('idx_fairness_case_status').on(table.status),
    index('idx_fairness_case_stage').on(table.stage),
    index('idx_fairness_case_ratio').on(table.disparityRatio),
    index('idx_fairness_case_created_at').on(table.createdAt)
  ]
);

/**
 * 100. Institutional Report Templates Table
 * Configurable templates for accreditation (NAAC/NIRF/NBA) and internal institutional reporting.
 */
export const institutionalReportTemplates = pgTable(
  'institutional_report_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: reportCategoryEnum('category').notNull(),
    standard: varchar('standard', { length: 50 }).default('INTERNAL').notNull(),
    configJson: jsonb('config_json').default({}).notNull(),
    isSystemDefault: boolean('is_system_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_report_tmpl_tenant').on(table.tenantId),
    index('idx_report_tmpl_category').on(table.category),
    index('idx_report_tmpl_standard').on(table.standard),
    index('idx_report_tmpl_active').on(table.isActive),
    index('idx_report_tmpl_created_by').on(table.createdBy),
    index('idx_report_tmpl_created_at').on(table.createdAt)
  ]
);

/**
 * 101. Institutional Report Runs Table
 * Audit-ready generation runs, preview snapshots, and exported artifacts with empirical evidence traceability.
 */
export const institutionalReportRuns = pgTable(
  'institutional_report_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id').references(() => institutionalReportTemplates.id, { onDelete: 'set null' }),
    reportTitle: varchar('report_title', { length: 255 }).notNull(),
    category: reportCategoryEnum('category').notNull(),
    format: reportFormatEnum('format').notNull(),
    status: varchar('status', { length: 50 }).default('GENERATED').notNull(),
    parameters: jsonb('parameters').default({}).notNull(),
    summaryData: jsonb('summary_data').default({}).notNull(),
    completenessScore: doublePrecision('completeness_score').default(1.0).notNull(),
    missingFieldsCount: integer('missing_fields_count').default(0).notNull(),
    warningFlags: jsonb('warning_flags').default([]).notNull(),
    evidenceTraceability: jsonb('evidence_traceability').default([]).notNull(),
    fileUrl: text('file_url'),
    fileSizeBytes: integer('file_size_bytes'),
    rowCount: integer('row_count').default(0).notNull(),
    sha256Hash: varchar('sha256_hash', { length: 64 }),
    generatedBy: uuid('generated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_report_run_tenant').on(table.tenantId),
    index('idx_report_run_tmpl').on(table.templateId),
    index('idx_report_run_category').on(table.category),
    index('idx_report_run_format').on(table.format),
    index('idx_report_run_status').on(table.status),
    index('idx_report_run_gen_by').on(table.generatedBy),
    index('idx_report_run_created_at').on(table.createdAt)
  ]
);

/**
 * 102. Outreach Campaigns Table
 * Recruiter outreach campaigns governed by mandatory human approval confirmation before bulk dispatch.
 */
export const outreachCampaigns = pgTable(
  'outreach_campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    templateBody: text('template_body').notNull(),
    targetCriteria: jsonb('target_criteria').default({}).notNull(),
    status: outreachCampaignStatusEnum('status').default('DRAFT').notNull(),
    requiresHumanApproval: boolean('requires_human_approval').default(true).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvalNotes: text('approval_notes'),
    totalRecipients: integer('total_recipients').default(0).notNull(),
    sentCount: integer('sent_count').default(0).notNull(),
    deliveredCount: integer('delivered_count').default(0).notNull(),
    failedCount: integer('failed_count').default(0).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    auditTrailJson: jsonb('audit_trail_json').default([]).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_outreach_camp_tenant').on(table.tenantId),
    index('idx_outreach_camp_status').on(table.status),
    index('idx_outreach_camp_created_by').on(table.createdBy),
    index('idx_outreach_camp_approved_by').on(table.approvedBy),
    index('idx_outreach_camp_sched_at').on(table.scheduledAt),
    index('idx_outreach_camp_created_at').on(table.createdAt)
  ]
);

/**
 * 103. Outreach Campaign Recipients Table
 * Recruiter contact targets with duplicate suppression and opt-out / unsubscribe tracking.
 */
export const outreachCampaignRecipients = pgTable(
  'outreach_campaign_recipients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => outreachCampaigns.id, { onDelete: 'cascade' }),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
    contactId: varchar('contact_id', { length: 100 }),
    recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
    recipientName: varchar('recipient_name', { length: 255 }),
    companyName: varchar('company_name', { length: 255 }),
    status: varchar('status', { length: 50 }).default('QUEUED').notNull(),
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    isUnsubscribed: boolean('is_unsubscribed').default(false).notNull(),
    personalizedBody: text('personalized_body'),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_outreach_recip_camp_email').on(table.campaignId, table.recipientEmail),
    index('idx_outreach_recip_tenant').on(table.tenantId),
    index('idx_outreach_recip_camp').on(table.campaignId),
    index('idx_outreach_recip_comp').on(table.companyId),
    index('idx_outreach_recip_email').on(table.recipientEmail),
    index('idx_outreach_recip_status').on(table.status),
    index('idx_outreach_recip_unsub').on(table.isUnsubscribed),
    index('idx_outreach_recip_created_at').on(table.createdAt)
  ]
);

/**
 * 104. Institutional Data Quality Events Table
 * Audit logs tracking data completeness, sparse observation alerts, and reconciliation discrepancies.
 */
export const institutionalDataQualityEvents = pgTable(
  'institutional_data_quality_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id'),
    observationCount: integer('observation_count').default(0).notNull(),
    completenessRatio: doublePrecision('completeness_ratio').default(1.0).notNull(),
    missingFields: jsonb('missing_fields').default([]).notNull(),
    details: jsonb('details').default({}).notNull(),
    severity: varchar('severity', { length: 50 }).default('INFO').notNull(),
    resolved: boolean('resolved').default(false).notNull(),
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_data_qual_tenant').on(table.tenantId),
    index('idx_data_qual_event_type').on(table.eventType),
    index('idx_data_qual_entity_type').on(table.entityType),
    index('idx_data_qual_severity').on(table.severity),
    index('idx_data_qual_resolved').on(table.resolved),
    index('idx_data_qual_created_at').on(table.createdAt)
  ]
);



// ============================================================================
// Drizzle Relations
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  students: many(students),
  documents: many(documents),
  placementDrives: many(placementDrives),
  auditEvents: many(auditEvents),
  notifications: many(notifications),
  invitations: many(invitations),
  skillGapAnalyses: many(skillGapAnalyses),
  placementPredictions: many(placementPredictions),
  learningRecommendations: many(learningRecommendations),
  agentExecutionLogs: many(agentExecutionLogs),
  agentWorkflows: many(agentWorkflows),
  agentWorkflowSteps: many(agentWorkflowSteps),
  agentExecutionEvents: many(agentExecutionEvents),
  agentWorkflowApprovals: many(agentWorkflowApprovals),
  notificationEvents: many(notificationEvents),
  delegatedReviewers: many(delegatedReviewers),
  documentProcessingJobs: many(documentProcessingJobs),
  profileExtractions: many(profileExtractions),
  profileSkillEvidence: many(profileSkillEvidence),
  profileReviewEvents: many(profileReviewEvents),
  profileVersions: many(profileVersions),
  skillVerificationReviews: many(skillVerificationReviews),
  studentReadinessSnapshots: many(studentReadinessSnapshots),
  recruitmentJobs: many(jobRequirements),
  jobEligibilityEvaluations: many(jobEligibilityEvaluations),
  alumniProfiles: many(alumniProfiles),
  mentorAvailability: many(mentorAvailability),
  mentorshipRequests: many(mentorshipRequests),
  mentorshipSessions: many(mentorshipSessions),
  mentorshipFeedback: many(mentorshipFeedback),
  peerInterviewRooms: many(peerInterviewRooms),
  peerInterviewParticipants: many(peerInterviewParticipants),
  peerInterviewQuestions: many(peerInterviewQuestions),
  peerInterviewFeedback: many(peerInterviewFeedback),
  collaborationRooms: many(collaborationRooms),
  collaborationParticipants: many(collaborationParticipants),
  collaborationMessages: many(collaborationMessages),
  collaborationTasks: many(collaborationTasks),
  moderationReports: many(moderationReports),
  moderationActions: many(moderationActions),
  institutionalMetricSnapshots: many(institutionalMetricSnapshots),
  trainingInterventions: many(trainingInterventions),
  trainingInterventionParticipants: many(trainingInterventionParticipants),
  fairnessReviewCases: many(fairnessReviewCases),
  institutionalReportTemplates: many(institutionalReportTemplates),
  institutionalReportRuns: many(institutionalReportRuns),
  outreachCampaigns: many(outreachCampaigns),
  outreachCampaignRecipients: many(outreachCampaignRecipients),
  institutionalDataQualityEvents: many(institutionalDataQualityEvents)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [users.id],
    references: [students.userId]
  }),
  documents: many(documents),
  notifications: many(notifications),
  auditEvents: many(auditEvents),
  sentInvitations: many(invitations),
  agentLogs: many(agentExecutionLogs),
  initiatedWorkflows: many(agentWorkflows),
  workflowApprovals: many(agentWorkflowApprovals),
  notificationEvents: many(notificationEvents),
  delegatedReviewers: many(delegatedReviewers),
  readinessSnapshots: many(studentReadinessSnapshots),
  recruitmentJobs: many(jobRequirements),
  eligibilityEvaluations: many(jobEligibilityEvaluations),
  alumniProfile: one(alumniProfiles, {
    fields: [users.id],
    references: [alumniProfiles.userId],
    relationName: 'userAlumniProfile'
  }),
  mentorAvailabilitySlots: many(mentorAvailability),
  mentorshipRequestsAsStudent: many(mentorshipRequests, { relationName: 'studentRequests' }),
  mentorshipRequestsAsMentor: many(mentorshipRequests, { relationName: 'mentorRequests' }),
  mentorshipSessionsAsStudent: many(mentorshipSessions, { relationName: 'studentSessions' }),
  mentorshipSessionsAsMentor: many(mentorshipSessions, { relationName: 'mentorSessions' }),
  submittedMentorshipFeedback: many(mentorshipFeedback),
  peerInterviewRoomsCreated: many(peerInterviewRooms),
  peerInterviewParticipations: many(peerInterviewParticipants),
  peerInterviewFeedbackGiven: many(peerInterviewFeedback, { relationName: 'evaluatorFeedback' }),
  peerInterviewFeedbackReceived: many(peerInterviewFeedback, { relationName: 'evaluateeFeedback' }),
  collaborationRoomsCreated: many(collaborationRooms),
  collaborationParticipations: many(collaborationParticipants),
  collaborationMessagesSent: many(collaborationMessages),
  collaborationTasksCreated: many(collaborationTasks, { relationName: 'taskCreator' }),
  collaborationTasksAssigned: many(collaborationTasks, { relationName: 'taskAssignee' }),
  moderationReportsFiled: many(moderationReports, { relationName: 'reporterUser' }),
  moderationReportsAgainst: many(moderationReports, { relationName: 'reportedUser' }),
  moderationActionsReceived: many(moderationActions, { relationName: 'targetUser' }),
  moderationActionsExecuted: many(moderationActions, { relationName: 'executingUser' }),
  proposedInterventions: many(trainingInterventions, { relationName: 'interventionProposer' }),
  approvedInterventions: many(trainingInterventions, { relationName: 'interventionApprover' }),
  trainingInterventionParticipations: many(trainingInterventionParticipants),
  verifiedTrainingInterventions: many(trainingInterventionParticipants, { relationName: 'interventionVerifier' }),
  reviewedFairnessCases: many(fairnessReviewCases),
  createdReportTemplates: many(institutionalReportTemplates),
  generatedReportRuns: many(institutionalReportRuns),
  createdOutreachCampaigns: many(outreachCampaigns, { relationName: 'campaignCreator' }),
  approvedOutreachCampaigns: many(outreachCampaigns, { relationName: 'campaignApprover' })
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id]
  }),
  owner: one(users, {
    fields: [documents.ownerUserId],
    references: [users.id]
  }),
  processingJobs: many(documentProcessingJobs),
  extractions: many(profileExtractions)
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [students.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [students.userId],
    references: [users.id]
  }),
  skills: many(studentSkills),
  evidence: many(evidenceRecords),
  assessments: many(skillAssessments),
  semesters: many(academicSemesters),
  applications: many(applications),
  gapAnalyses: many(skillGapAnalyses),
  predictions: many(placementPredictions),
  recommendations: many(learningRecommendations),
  trainingInterventions: many(trainingInterventionParticipants),
  correctionRequests: many(academicCorrectionRequests),
  customLinks: many(studentCustomLinks)
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  studentSkills: many(studentSkills),
  jobRequirements: many(roleJobRequirements),
  evidence: many(evidenceRecords),
  assessments: many(skillAssessments),
  recommendations: many(learningRecommendations)
}));

export const studentSkillsRelations = relations(studentSkills, ({ one }) => ({
  tenant: one(tenants, {
    fields: [studentSkills.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [studentSkills.studentId],
    references: [students.id]
  }),
  skill: one(skills, {
    fields: [studentSkills.skillId],
    references: [skills.id]
  }),
  verifiedBy: one(users, {
    fields: [studentSkills.verifiedByUserId],
    references: [users.id]
  })
}));

export const evidenceRecordsRelations = relations(evidenceRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [evidenceRecords.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [evidenceRecords.studentId],
    references: [students.id]
  }),
  skill: one(skills, {
    fields: [evidenceRecords.skillId],
    references: [skills.id]
  }),
  validator: one(users, {
    fields: [evidenceRecords.validatedBy],
    references: [users.id]
  })
}));

export const skillAssessmentsRelations = relations(skillAssessments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [skillAssessments.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [skillAssessments.studentId],
    references: [students.id]
  }),
  skill: one(skills, {
    fields: [skillAssessments.skillId],
    references: [skills.id]
  })
}));

export const academicSemestersRelations = relations(academicSemesters, ({ one }) => ({
  tenant: one(tenants, {
    fields: [academicSemesters.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [academicSemesters.studentId],
    references: [students.id]
  })
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  jobRoles: many(jobRoles),
  outreachCampaignRecipients: many(outreachCampaignRecipients)
}));

export const jobRolesRelations = relations(jobRoles, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobRoles.companyId],
    references: [companies.id]
  }),
  requirements: many(roleJobRequirements),
  placementDrives: many(placementDrives),
  gapAnalyses: many(skillGapAnalyses)
}));

export const roleJobRequirementsRelations = relations(roleJobRequirements, ({ one }) => ({
  jobRole: one(jobRoles, {
    fields: [roleJobRequirements.jobRoleId],
    references: [jobRoles.id]
  }),
  skill: one(skills, {
    fields: [roleJobRequirements.skillId],
    references: [skills.id]
  })
}));

export const legacyJobRequirementsRelations = roleJobRequirementsRelations;

export const placementDrivesRelations = relations(placementDrives, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [placementDrives.tenantId],
    references: [tenants.id]
  }),
  jobRole: one(jobRoles, {
    fields: [placementDrives.jobRoleId],
    references: [jobRoles.id]
  }),
  applications: many(applications),
  predictions: many(placementPredictions),
  fairnessReviewCases: many(fairnessReviewCases)
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [applications.tenantId],
    references: [tenants.id]
  }),
  drive: one(placementDrives, {
    fields: [applications.driveId],
    references: [placementDrives.id]
  }),
  student: one(students, {
    fields: [applications.studentId],
    references: [students.id]
  }),
  decisionMaker: one(users, {
    fields: [applications.finalDecisionBy],
    references: [users.id]
  }),
  interviews: many(interviews)
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  tenant: one(tenants, {
    fields: [interviews.tenantId],
    references: [tenants.id]
  }),
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id]
  })
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditEvents.tenantId],
    references: [tenants.id]
  }),
  actor: one(users, {
    fields: [auditEvents.actorId],
    references: [users.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id]
  }),
  recipient: one(users, {
    fields: [notifications.recipientUserId],
    references: [users.id]
  })
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenantId],
    references: [tenants.id]
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedByUserId],
    references: [users.id]
  })
}));

export const skillGapAnalysesRelations = relations(skillGapAnalyses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [skillGapAnalyses.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [skillGapAnalyses.studentId],
    references: [students.id]
  }),
  jobRole: one(jobRoles, {
    fields: [skillGapAnalyses.jobRoleId],
    references: [jobRoles.id]
  })
}));

export const placementPredictionsRelations = relations(placementPredictions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [placementPredictions.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [placementPredictions.studentId],
    references: [students.id]
  }),
  drive: one(placementDrives, {
    fields: [placementPredictions.driveId],
    references: [placementDrives.id]
  }),
  run: one(placementPredictionRuns, {
    fields: [placementPredictions.runId],
    references: [placementPredictionRuns.id]
  })
}));

export const learningRecommendationsRelations = relations(learningRecommendations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [learningRecommendations.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [learningRecommendations.studentId],
    references: [students.id]
  }),
  skill: one(skills, {
    fields: [learningRecommendations.skillId],
    references: [skills.id]
  }),
  targetRole: one(jobRoles, {
    fields: [learningRecommendations.targetRoleId],
    references: [jobRoles.id]
  })
}));

export const agentExecutionLogsRelations = relations(agentExecutionLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [agentExecutionLogs.tenantId],
    references: [tenants.id]
  }),
  triggerUser: one(users, {
    fields: [agentExecutionLogs.triggeredBy],
    references: [users.id]
  })
}));

export const agentWorkflowsRelations = relations(agentWorkflows, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [agentWorkflows.tenantId],
    references: [tenants.id]
  }),
  initiator: one(users, {
    fields: [agentWorkflows.initiatedBy],
    references: [users.id]
  }),
  steps: many(agentWorkflowSteps),
  events: many(agentExecutionEvents),
  approvals: many(agentWorkflowApprovals)
}));

export const documentProcessingJobsRelations = relations(documentProcessingJobs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [documentProcessingJobs.tenantId],
    references: [tenants.id]
  }),
  document: one(documents, {
    fields: [documentProcessingJobs.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentProcessingJobs.userId],
    references: [users.id]
  })
}));

export const profileExtractionsRelations = relations(profileExtractions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [profileExtractions.tenantId],
    references: [tenants.id]
  }),
  document: one(documents, {
    fields: [profileExtractions.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [profileExtractions.userId],
    references: [users.id]
  }),
  skillEvidence: many(profileSkillEvidence),
  reviewEvents: many(profileReviewEvents)
}));

export const profileSkillEvidenceRelations = relations(profileSkillEvidence, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [profileSkillEvidence.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [profileSkillEvidence.userId],
    references: [users.id]
  }),
  document: one(documents, {
    fields: [profileSkillEvidence.documentId],
    references: [documents.id]
  }),
  extraction: one(profileExtractions, {
    fields: [profileSkillEvidence.extractionId],
    references: [profileExtractions.id]
  }),
  reviewer: one(users, {
    fields: [profileSkillEvidence.reviewedBy],
    references: [users.id]
  }),
  reviewEvents: many(profileReviewEvents),
  verificationReviews: many(skillVerificationReviews)
}));

export const profileReviewEventsRelations = relations(profileReviewEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [profileReviewEvents.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [profileReviewEvents.userId],
    references: [users.id]
  }),
  extraction: one(profileExtractions, {
    fields: [profileReviewEvents.extractionId],
    references: [profileExtractions.id]
  }),
  skill: one(profileSkillEvidence, {
    fields: [profileReviewEvents.skillId],
    references: [profileSkillEvidence.id]
  }),
  reviewer: one(users, {
    fields: [profileReviewEvents.reviewerId],
    references: [users.id]
  })
}));

export const profileVersionsRelations = relations(profileVersions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [profileVersions.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [profileVersions.userId],
    references: [users.id]
  }),
  creator: one(users, {
    fields: [profileVersions.createdBy],
    references: [users.id]
  })
}));

// ============================================================================
// Phase 10 Relations
// ============================================================================

export const skillVerificationReviewsRelations = relations(skillVerificationReviews, ({ one }) => ({
  tenant: one(tenants, {
    fields: [skillVerificationReviews.tenantId],
    references: [tenants.id]
  }),
  student: one(users, {
    fields: [skillVerificationReviews.studentId],
    references: [users.id]
  }),
  evidence: one(profileSkillEvidence, {
    fields: [skillVerificationReviews.evidenceId],
    references: [profileSkillEvidence.id]
  }),
  reviewer: one(users, {
    fields: [skillVerificationReviews.reviewerId],
    references: [users.id]
  })
}));

export const studentReadinessSnapshotsRelations = relations(studentReadinessSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [studentReadinessSnapshots.tenantId],
    references: [tenants.id]
  }),
  student: one(users, {
    fields: [studentReadinessSnapshots.studentId],
    references: [users.id]
  })
}));

export const jobRequirementsRelations = relations(jobRequirements, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [jobRequirements.tenantId],
    references: [tenants.id]
  }),
  creator: one(users, {
    fields: [jobRequirements.createdBy],
    references: [users.id]
  }),
  evaluations: many(jobEligibilityEvaluations)
}));

export const recruitmentJobRequirementsRelations = jobRequirementsRelations;
export const recruitmentJobsRelations = jobRequirementsRelations;

export const jobEligibilityEvaluationsRelations = relations(jobEligibilityEvaluations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [jobEligibilityEvaluations.tenantId],
    references: [tenants.id]
  }),
  student: one(users, {
    fields: [jobEligibilityEvaluations.studentId],
    references: [users.id]
  }),
  job: one(jobRequirements, {
    fields: [jobEligibilityEvaluations.jobId],
    references: [jobRequirements.id]
  }),
  overridingUser: one(users, {
    fields: [jobEligibilityEvaluations.overriddenBy],
    references: [users.id]
  })
}));

// ============================================================================
// Phase 13 Relations
// ============================================================================

export const skillTaxonomyRelations = relations(skillTaxonomy, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [skillTaxonomy.tenantId],
    references: [tenants.id]
  }),
  parentSkill: one(skillTaxonomy, {
    fields: [skillTaxonomy.parentSkillId],
    references: [skillTaxonomy.id],
    relationName: 'parentChildTaxonomy'
  }),
  childSkills: many(skillTaxonomy, {
    relationName: 'parentChildTaxonomy'
  }),
  aliases: many(skillAliases),
  demand: many(industrySkillDemand),
  trends: many(industrySkillTrends),
  studentSkillGaps: many(studentSkillGapSnapshots)
}));

export const skillAliasesRelations = relations(skillAliases, ({ one }) => ({
  skill: one(skillTaxonomy, {
    fields: [skillAliases.skillId],
    references: [skillTaxonomy.id]
  }),
  tenant: one(tenants, {
    fields: [skillAliases.tenantId],
    references: [tenants.id]
  })
}));

export const jobDescriptionSourcesRelations = relations(jobDescriptionSources, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [jobDescriptionSources.tenantId],
    references: [tenants.id]
  }),
  jobDescriptions: many(industryJobDescriptions)
}));

export const industryJobDescriptionsRelations = relations(industryJobDescriptions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [industryJobDescriptions.tenantId],
    references: [tenants.id]
  }),
  source: one(jobDescriptionSources, {
    fields: [industryJobDescriptions.sourceId],
    references: [jobDescriptionSources.id]
  }),
  analyses: many(jobDescriptionAnalyses)
}));

export const jobDescriptionAnalysesRelations = relations(jobDescriptionAnalyses, ({ one }) => ({
  jd: one(industryJobDescriptions, {
    fields: [jobDescriptionAnalyses.jdId],
    references: [industryJobDescriptions.id]
  }),
  tenant: one(tenants, {
    fields: [jobDescriptionAnalyses.tenantId],
    references: [tenants.id]
  }),
  reviewer: one(users, {
    fields: [jobDescriptionAnalyses.reviewedBy],
    references: [users.id]
  })
}));

export const industrySkillDemandRelations = relations(industrySkillDemand, ({ one }) => ({
  tenant: one(tenants, {
    fields: [industrySkillDemand.tenantId],
    references: [tenants.id]
  }),
  skill: one(skillTaxonomy, {
    fields: [industrySkillDemand.skillId],
    references: [skillTaxonomy.id]
  })
}));

export const industrySkillTrendsRelations = relations(industrySkillTrends, ({ one }) => ({
  tenant: one(tenants, {
    fields: [industrySkillTrends.tenantId],
    references: [tenants.id]
  }),
  skill: one(skillTaxonomy, {
    fields: [industrySkillTrends.skillId],
    references: [skillTaxonomy.id]
  })
}));

export const roleSkillRequirementsRelations = relations(roleSkillRequirements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [roleSkillRequirements.tenantId],
    references: [tenants.id]
  }),
  creator: one(users, {
    fields: [roleSkillRequirements.createdBy],
    references: [users.id]
  })
}));

export const studentRolePreferencesRelations = relations(studentRolePreferences, ({ one }) => ({
  student: one(users, {
    fields: [studentRolePreferences.studentId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [studentRolePreferences.tenantId],
    references: [tenants.id]
  })
}));

export const studentSkillGapSnapshotsRelations = relations(studentSkillGapSnapshots, ({ one }) => ({
  student: one(users, {
    fields: [studentSkillGapSnapshots.studentId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [studentSkillGapSnapshots.tenantId],
    references: [tenants.id]
  }),
  skill: one(skillTaxonomy, {
    fields: [studentSkillGapSnapshots.skillId],
    references: [skillTaxonomy.id]
  })
}));

export const careerRecommendationsRelations = relations(careerRecommendations, ({ one }) => ({
  student: one(users, {
    fields: [careerRecommendations.studentId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [careerRecommendations.tenantId],
    references: [tenants.id]
  })
}));

export const cohortSkillGapSnapshotsRelations = relations(cohortSkillGapSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [cohortSkillGapSnapshots.tenantId],
    references: [tenants.id]
  })
}));

// ============================================================================
// Phase 14 Relations
// ============================================================================

export const placementPredictionRunsRelations = relations(placementPredictionRuns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [placementPredictionRuns.tenantId],
    references: [tenants.id]
  }),
  executor: one(users, {
    fields: [placementPredictionRuns.executedBy],
    references: [users.id]
  }),
  predictions: many(placementPredictions)
}));

export const studentReadinessHistoryRelations = relations(studentReadinessHistory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [studentReadinessHistory.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [studentReadinessHistory.studentId],
    references: [students.id]
  }),
  evaluator: one(users, {
    fields: [studentReadinessHistory.evaluatedBy],
    references: [users.id]
  })
}));

export const studentSupportRecommendationsRelations = relations(studentSupportRecommendations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [studentSupportRecommendations.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [studentSupportRecommendations.studentId],
    references: [students.id]
  }),
  reviewer: one(users, {
    fields: [studentSupportRecommendations.reviewedBy],
    references: [users.id]
  }),
  interventions: many(tpoInterventionRecords)
}));

export const tpoInterventionRecordsRelations = relations(tpoInterventionRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tpoInterventionRecords.tenantId],
    references: [tenants.id]
  }),
  recommendation: one(studentSupportRecommendations, {
    fields: [tpoInterventionRecords.recommendationId],
    references: [studentSupportRecommendations.id]
  }),
  student: one(students, {
    fields: [tpoInterventionRecords.studentId],
    references: [students.id]
  }),
  assignee: one(users, {
    fields: [tpoInterventionRecords.assignedTo],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [tpoInterventionRecords.approvedBy],
    references: [users.id]
  })
}));

export const placementForecastSnapshotsRelations = relations(placementForecastSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [placementForecastSnapshots.tenantId],
    references: [tenants.id]
  }),
  generator: one(users, {
    fields: [placementForecastSnapshots.generatedBy],
    references: [users.id]
  })
}));

export const analyticsSnapshotsRelations = relations(analyticsSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [analyticsSnapshots.tenantId],
    references: [tenants.id]
  }),
  capturer: one(users, {
    fields: [analyticsSnapshots.capturedBy],
    references: [users.id]
  })
}));

export const analyticsAuditEventsRelations = relations(analyticsAuditEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [analyticsAuditEvents.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [analyticsAuditEvents.userId],
    references: [users.id]
  })
}));

// ============================================================================
// Phase 15 Relations
// ============================================================================

export const agentWorkflowStepsRelations = relations(agentWorkflowSteps, ({ one, many }) => ({
  workflow: one(agentWorkflows, {
    fields: [agentWorkflowSteps.workflowId],
    references: [agentWorkflows.id]
  }),
  tenant: one(tenants, {
    fields: [agentWorkflowSteps.tenantId],
    references: [tenants.id]
  }),
  approvals: many(agentWorkflowApprovals)
}));

export const agentExecutionEventsRelations = relations(agentExecutionEvents, ({ one }) => ({
  workflow: one(agentWorkflows, {
    fields: [agentExecutionEvents.workflowId],
    references: [agentWorkflows.id]
  }),
  tenant: one(tenants, {
    fields: [agentExecutionEvents.tenantId],
    references: [tenants.id]
  })
}));

export const agentWorkflowApprovalsRelations = relations(agentWorkflowApprovals, ({ one }) => ({
  workflow: one(agentWorkflows, {
    fields: [agentWorkflowApprovals.workflowId],
    references: [agentWorkflows.id]
  }),
  step: one(agentWorkflowSteps, {
    fields: [agentWorkflowApprovals.stepId],
    references: [agentWorkflowSteps.id]
  }),
  tenant: one(tenants, {
    fields: [agentWorkflowApprovals.tenantId],
    references: [tenants.id]
  }),
  reviewer: one(users, {
    fields: [agentWorkflowApprovals.reviewedBy],
    references: [users.id]
  })
}));

export const notificationEventsRelations = relations(notificationEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notificationEvents.tenantId],
    references: [tenants.id]
  }),
  recipient: one(users, {
    fields: [notificationEvents.recipientUserId],
    references: [users.id]
  })
}));

export const delegatedReviewersRelations = relations(delegatedReviewers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [delegatedReviewers.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [delegatedReviewers.userId],
    references: [users.id]
  }),
  delegator: one(users, {
    fields: [delegatedReviewers.delegatedBy],
    references: [users.id]
  })
}));

// ============================================================================
// Phase 16 Relations
// ============================================================================

export const alumniProfilesRelations = relations(alumniProfiles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [alumniProfiles.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [alumniProfiles.userId],
    references: [users.id],
    relationName: 'userAlumniProfile'
  }),
  verifier: one(users, {
    fields: [alumniProfiles.verifiedBy],
    references: [users.id]
  }),
  availabilitySlots: many(mentorAvailability),
  mentorshipRequests: many(mentorshipRequests),
  mentorshipSessions: many(mentorshipSessions)
}));

export const mentorAvailabilityRelations = relations(mentorAvailability, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [mentorAvailability.tenantId],
    references: [tenants.id]
  }),
  alumniProfile: one(alumniProfiles, {
    fields: [mentorAvailability.alumniProfileId],
    references: [alumniProfiles.id]
  }),
  mentorUser: one(users, {
    fields: [mentorAvailability.mentorUserId],
    references: [users.id]
  }),
  mentorshipRequests: many(mentorshipRequests)
}));

export const mentorshipRequestsRelations = relations(mentorshipRequests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mentorshipRequests.tenantId],
    references: [tenants.id]
  }),
  student: one(students, {
    fields: [mentorshipRequests.studentId],
    references: [students.id]
  }),
  studentUser: one(users, {
    fields: [mentorshipRequests.studentUserId],
    references: [users.id],
    relationName: 'studentRequests'
  }),
  mentorUser: one(users, {
    fields: [mentorshipRequests.mentorUserId],
    references: [users.id],
    relationName: 'mentorRequests'
  }),
  alumniProfile: one(alumniProfiles, {
    fields: [mentorshipRequests.alumniProfileId],
    references: [alumniProfiles.id]
  }),
  preferredSlot: one(mentorAvailability, {
    fields: [mentorshipRequests.preferredSlotId],
    references: [mentorAvailability.id]
  })
}));

export const mentorshipSessionsRelations = relations(mentorshipSessions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [mentorshipSessions.tenantId],
    references: [tenants.id]
  }),
  request: one(mentorshipRequests, {
    fields: [mentorshipSessions.requestId],
    references: [mentorshipRequests.id]
  }),
  alumniProfile: one(alumniProfiles, {
    fields: [mentorshipSessions.alumniProfileId],
    references: [alumniProfiles.id]
  }),
  mentorUser: one(users, {
    fields: [mentorshipSessions.mentorUserId],
    references: [users.id],
    relationName: 'mentorSessions'
  }),
  student: one(students, {
    fields: [mentorshipSessions.studentId],
    references: [students.id]
  }),
  studentUser: one(users, {
    fields: [mentorshipSessions.studentUserId],
    references: [users.id],
    relationName: 'studentSessions'
  }),
  feedback: many(mentorshipFeedback)
}));

export const mentorshipFeedbackRelations = relations(mentorshipFeedback, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mentorshipFeedback.tenantId],
    references: [tenants.id]
  }),
  session: one(mentorshipSessions, {
    fields: [mentorshipFeedback.sessionId],
    references: [mentorshipSessions.id]
  }),
  submitter: one(users, {
    fields: [mentorshipFeedback.submittedBy],
    references: [users.id]
  })
}));

export const peerInterviewRoomsRelations = relations(peerInterviewRooms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [peerInterviewRooms.tenantId],
    references: [tenants.id]
  }),
  creator: one(users, {
    fields: [peerInterviewRooms.createdBy],
    references: [users.id]
  }),
  participants: many(peerInterviewParticipants),
  questions: many(peerInterviewQuestions),
  feedback: many(peerInterviewFeedback)
}));

export const peerInterviewParticipantsRelations = relations(peerInterviewParticipants, ({ one }) => ({
  tenant: one(tenants, {
    fields: [peerInterviewParticipants.tenantId],
    references: [tenants.id]
  }),
  room: one(peerInterviewRooms, {
    fields: [peerInterviewParticipants.roomId],
    references: [peerInterviewRooms.id]
  }),
  user: one(users, {
    fields: [peerInterviewParticipants.userId],
    references: [users.id]
  }),
  student: one(students, {
    fields: [peerInterviewParticipants.studentId],
    references: [students.id]
  })
}));

export const peerInterviewQuestionsRelations = relations(peerInterviewQuestions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [peerInterviewQuestions.tenantId],
    references: [tenants.id]
  }),
  room: one(peerInterviewRooms, {
    fields: [peerInterviewQuestions.roomId],
    references: [peerInterviewRooms.id]
  })
}));

export const peerInterviewFeedbackRelations = relations(peerInterviewFeedback, ({ one }) => ({
  tenant: one(tenants, {
    fields: [peerInterviewFeedback.tenantId],
    references: [tenants.id]
  }),
  room: one(peerInterviewRooms, {
    fields: [peerInterviewFeedback.roomId],
    references: [peerInterviewRooms.id]
  }),
  evaluator: one(users, {
    fields: [peerInterviewFeedback.evaluatorUserId],
    references: [users.id],
    relationName: 'evaluatorFeedback'
  }),
  evaluatee: one(users, {
    fields: [peerInterviewFeedback.evaluateeUserId],
    references: [users.id],
    relationName: 'evaluateeFeedback'
  })
}));

export const collaborationRoomsRelations = relations(collaborationRooms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [collaborationRooms.tenantId],
    references: [tenants.id]
  }),
  creator: one(users, {
    fields: [collaborationRooms.createdBy],
    references: [users.id]
  }),
  participants: many(collaborationParticipants),
  messages: many(collaborationMessages),
  tasks: many(collaborationTasks)
}));

export const collaborationParticipantsRelations = relations(collaborationParticipants, ({ one }) => ({
  tenant: one(tenants, {
    fields: [collaborationParticipants.tenantId],
    references: [tenants.id]
  }),
  room: one(collaborationRooms, {
    fields: [collaborationParticipants.roomId],
    references: [collaborationRooms.id]
  }),
  user: one(users, {
    fields: [collaborationParticipants.userId],
    references: [users.id]
  })
}));

export const collaborationMessagesRelations = relations(collaborationMessages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [collaborationMessages.tenantId],
    references: [tenants.id]
  }),
  room: one(collaborationRooms, {
    fields: [collaborationMessages.roomId],
    references: [collaborationRooms.id]
  }),
  sender: one(users, {
    fields: [collaborationMessages.senderUserId],
    references: [users.id]
  })
}));

export const collaborationTasksRelations = relations(collaborationTasks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [collaborationTasks.tenantId],
    references: [tenants.id]
  }),
  room: one(collaborationRooms, {
    fields: [collaborationTasks.roomId],
    references: [collaborationRooms.id]
  }),
  creator: one(users, {
    fields: [collaborationTasks.createdBy],
    references: [users.id],
    relationName: 'taskCreator'
  }),
  assignee: one(users, {
    fields: [collaborationTasks.assignedTo],
    references: [users.id],
    relationName: 'taskAssignee'
  })
}));

export const moderationReportsRelations = relations(moderationReports, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [moderationReports.tenantId],
    references: [tenants.id]
  }),
  reporter: one(users, {
    fields: [moderationReports.reporterUserId],
    references: [users.id],
    relationName: 'reporterUser'
  }),
  reportedUser: one(users, {
    fields: [moderationReports.reportedUserId],
    references: [users.id],
    relationName: 'reportedUser'
  }),
  investigator: one(users, {
    fields: [moderationReports.investigatedBy],
    references: [users.id]
  }),
  actions: many(moderationActions)
}));

export const moderationActionsRelations = relations(moderationActions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [moderationActions.tenantId],
    references: [tenants.id]
  }),
  report: one(moderationReports, {
    fields: [moderationActions.reportId],
    references: [moderationReports.id]
  }),
  targetUser: one(users, {
    fields: [moderationActions.targetUserId],
    references: [users.id],
    relationName: 'targetUser'
  }),
  executor: one(users, {
    fields: [moderationActions.executedBy],
    references: [users.id],
    relationName: 'executingUser'
  })
}));

// ============================================================================
// Phase 17 Relations
// ============================================================================

export const institutionalMetricSnapshotsRelations = relations(institutionalMetricSnapshots, ({ one }) => ({
  tenant: one(tenants, {
    fields: [institutionalMetricSnapshots.tenantId],
    references: [tenants.id]
  })
}));

export const trainingInterventionsRelations = relations(trainingInterventions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [trainingInterventions.tenantId],
    references: [tenants.id]
  }),
  proposer: one(users, {
    fields: [trainingInterventions.proposedBy],
    references: [users.id],
    relationName: 'interventionProposer'
  }),
  approver: one(users, {
    fields: [trainingInterventions.approvedBy],
    references: [users.id],
    relationName: 'interventionApprover'
  }),
  participants: many(trainingInterventionParticipants)
}));

export const trainingInterventionParticipantsRelations = relations(trainingInterventionParticipants, ({ one }) => ({
  tenant: one(tenants, {
    fields: [trainingInterventionParticipants.tenantId],
    references: [tenants.id]
  }),
  intervention: one(trainingInterventions, {
    fields: [trainingInterventionParticipants.interventionId],
    references: [trainingInterventions.id]
  }),
  student: one(students, {
    fields: [trainingInterventionParticipants.studentId],
    references: [students.id]
  }),
  user: one(users, {
    fields: [trainingInterventionParticipants.userId],
    references: [users.id]
  }),
  verifier: one(users, {
    fields: [trainingInterventionParticipants.verifiedBy],
    references: [users.id],
    relationName: 'interventionVerifier'
  })
}));

export const fairnessReviewCasesRelations = relations(fairnessReviewCases, ({ one }) => ({
  tenant: one(tenants, {
    fields: [fairnessReviewCases.tenantId],
    references: [tenants.id]
  }),
  drive: one(placementDrives, {
    fields: [fairnessReviewCases.driveId],
    references: [placementDrives.id]
  }),
  reviewer: one(users, {
    fields: [fairnessReviewCases.reviewedBy],
    references: [users.id]
  })
}));

export const institutionalReportTemplatesRelations = relations(institutionalReportTemplates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [institutionalReportTemplates.tenantId],
    references: [tenants.id]
  }),
  creator: one(users, {
    fields: [institutionalReportTemplates.createdBy],
    references: [users.id]
  }),
  runs: many(institutionalReportRuns)
}));

export const institutionalReportRunsRelations = relations(institutionalReportRuns, ({ one }) => ({
  tenant: one(tenants, {
    fields: [institutionalReportRuns.tenantId],
    references: [tenants.id]
  }),
  template: one(institutionalReportTemplates, {
    fields: [institutionalReportRuns.templateId],
    references: [institutionalReportTemplates.id]
  }),
  generator: one(users, {
    fields: [institutionalReportRuns.generatedBy],
    references: [users.id]
  })
}));

export const outreachCampaignsRelations = relations(outreachCampaigns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [outreachCampaigns.tenantId],
    references: [tenants.id]
  }),
  creator: one(users, {
    fields: [outreachCampaigns.createdBy],
    references: [users.id],
    relationName: 'campaignCreator'
  }),
  approver: one(users, {
    fields: [outreachCampaigns.approvedBy],
    references: [users.id],
    relationName: 'campaignApprover'
  }),
  recipients: many(outreachCampaignRecipients)
}));

export const outreachCampaignRecipientsRelations = relations(outreachCampaignRecipients, ({ one }) => ({
  tenant: one(tenants, {
    fields: [outreachCampaignRecipients.tenantId],
    references: [tenants.id]
  }),
  campaign: one(outreachCampaigns, {
    fields: [outreachCampaignRecipients.campaignId],
    references: [outreachCampaigns.id]
  }),
  company: one(companies, {
    fields: [outreachCampaignRecipients.companyId],
    references: [companies.id]
  })
}));

export const institutionalDataQualityEventsRelations = relations(institutionalDataQualityEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [institutionalDataQualityEvents.tenantId],
    references: [tenants.id]
  }),
  resolver: one(users, {
    fields: [institutionalDataQualityEvents.resolvedBy],
    references: [users.id]
  })
}));


// ============================================================================
// Exported Inferred Types for Safety
// ============================================================================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

export type StudentSkill = typeof studentSkills.$inferSelect;
export type NewStudentSkill = typeof studentSkills.$inferInsert;

export type EvidenceRecord = typeof evidenceRecords.$inferSelect;
export type NewEvidenceRecord = typeof evidenceRecords.$inferInsert;

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type NewSkillAssessment = typeof skillAssessments.$inferInsert;

export type AcademicSemester = typeof academicSemesters.$inferSelect;
export type NewAcademicSemester = typeof academicSemesters.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type JobRole = typeof jobRoles.$inferSelect;
export type NewJobRole = typeof jobRoles.$inferInsert;

export type JobRequirement = typeof jobRequirements.$inferSelect;
export type NewJobRequirement = typeof jobRequirements.$inferInsert;

export type RoleJobRequirement = typeof roleJobRequirements.$inferSelect;
export type NewRoleJobRequirement = typeof roleJobRequirements.$inferInsert;
export type LegacyJobRequirement = RoleJobRequirement;
export type NewLegacyJobRequirement = NewRoleJobRequirement;

export type PlacementDrive = typeof placementDrives.$inferSelect;
export type NewPlacementDrive = typeof placementDrives.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type SkillGapAnalysis = typeof skillGapAnalyses.$inferSelect;
export type NewSkillGapAnalysis = typeof skillGapAnalyses.$inferInsert;

export type PlacementPrediction = typeof placementPredictions.$inferSelect;
export type NewPlacementPrediction = typeof placementPredictions.$inferInsert;

export type LearningRecommendation = typeof learningRecommendations.$inferSelect;
export type NewLearningRecommendation = typeof learningRecommendations.$inferInsert;

export type AgentExecutionLog = typeof agentExecutionLogs.$inferSelect;
export type NewAgentExecutionLog = typeof agentExecutionLogs.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// ============================================================================
// Phase 09 — AI Student Profiling & Document Ingestion Inferred Types
// ============================================================================

export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;
export type NewDocumentProcessingJob = typeof documentProcessingJobs.$inferInsert;

export type ProfileExtraction = typeof profileExtractions.$inferSelect;
export type NewProfileExtraction = typeof profileExtractions.$inferInsert;

export type ProfileSkillEvidence = typeof profileSkillEvidence.$inferSelect;
export type NewProfileSkillEvidence = typeof profileSkillEvidence.$inferInsert;

export type ProfileReviewEvent = typeof profileReviewEvents.$inferSelect;
export type NewProfileReviewEvent = typeof profileReviewEvents.$inferInsert;

export type ProfileVersion = typeof profileVersions.$inferSelect;
export type NewProfileVersion = typeof profileVersions.$inferInsert;

// Phase 09 Enum Value Types
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type ExtractionStatus = (typeof extractionStatusEnum.enumValues)[number];
export type ReviewAction = (typeof reviewActionEnum.enumValues)[number];
export type ProfileEvidenceType = (typeof profileEvidenceTypeEnum.enumValues)[number];
export type ProfileVerificationStatus = (typeof profileVerificationStatusEnum.enumValues)[number];

// Phase 09 College Alias Types
export const collegesRelations = tenantsRelations;
export type College = Tenant;
export type NewCollege = NewTenant;

// ============================================================================
// Phase 10 — Placement Readiness, Skill Verification & Job Eligibility Types
// ============================================================================

export type SkillVerificationReview = typeof skillVerificationReviews.$inferSelect;
export type NewSkillVerificationReview = typeof skillVerificationReviews.$inferInsert;

export type StudentReadinessSnapshot = typeof studentReadinessSnapshots.$inferSelect;
export type NewStudentReadinessSnapshot = typeof studentReadinessSnapshots.$inferInsert;

export type RecruitmentJob = typeof jobRequirements.$inferSelect;
export type NewRecruitmentJob = typeof jobRequirements.$inferInsert;

export type RecruitmentJobRequirement = typeof jobRequirements.$inferSelect;
export type NewRecruitmentJobRequirement = typeof jobRequirements.$inferInsert;

export type JobEligibilityEvaluation = typeof jobEligibilityEvaluations.$inferSelect;
export type NewJobEligibilityEvaluation = typeof jobEligibilityEvaluations.$inferInsert;

// Phase 10 Enum Value Types
export type ReadinessCategory = (typeof readinessCategoryEnum.enumValues)[number];
export type EligibilityResult = (typeof eligibilityResultEnum.enumValues)[number];
export type RecruitmentJobStatus = (typeof recruitmentJobStatusEnum.enumValues)[number];

// ============================================================================
// Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Types
// ============================================================================

export type RecruiterCompanyMembership = typeof recruiterCompanyMemberships.$inferSelect;
export type NewRecruiterCompanyMembership = typeof recruiterCompanyMemberships.$inferInsert;

export type CompanyVerificationReview = typeof companyVerificationReviews.$inferSelect;
export type NewCompanyVerificationReview = typeof companyVerificationReviews.$inferInsert;

export type DriveSchedule = typeof driveSchedules.$inferSelect;
export type NewDriveSchedule = typeof driveSchedules.$inferInsert;

export type CandidateShortlist = typeof candidateShortlists.$inferSelect;
export type NewCandidateShortlist = typeof candidateShortlists.$inferInsert;

export type DriveAssessment = typeof driveAssessments.$inferSelect;
export type NewDriveAssessment = typeof driveAssessments.$inferInsert;

export type CandidateAssessmentResult = typeof candidateAssessmentResults.$inferSelect;
export type NewCandidateAssessmentResult = typeof candidateAssessmentResults.$inferInsert;

export type DriveInterviewRound = typeof driveInterviewRounds.$inferSelect;
export type NewDriveInterviewRound = typeof driveInterviewRounds.$inferInsert;

export type PlacementOffer = typeof placementOffers.$inferSelect;
export type NewPlacementOffer = typeof placementOffers.$inferInsert;

export type OfferStatusHistory = typeof offerStatusHistory.$inferSelect;
export type NewOfferStatusHistory = typeof offerStatusHistory.$inferInsert;

// Phase 11 Enum Value Types
export type CompanyVerificationStatus = (typeof companyVerificationStatusEnum.enumValues)[number];
export type DriveStageStatus = (typeof driveStageStatusEnum.enumValues)[number];
export type CandidateShortlistStatus = (typeof candidateShortlistStatusEnum.enumValues)[number];
export type AssessmentType = (typeof assessmentTypeEnum.enumValues)[number];
export type AssessmentStatus = (typeof assessmentStatusEnum.enumValues)[number];
export type InterviewStage = (typeof interviewStageEnum.enumValues)[number];
export type OfferLifecycleStatus = (typeof offerLifecycleStatusEnum.enumValues)[number];

// ============================================================================
// Phase 12 — Student Mock Drive, Assessment Engine & Learning Intelligence Types
// ============================================================================

export type AssessmentQuestionBank = typeof assessmentQuestionBanks.$inferSelect;
export type NewAssessmentQuestionBank = typeof assessmentQuestionBanks.$inferInsert;

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type NewAssessmentQuestion = typeof assessmentQuestions.$inferInsert;

export type MockDriveConfiguration = typeof mockDriveConfigurations.$inferSelect;
export type NewMockDriveConfiguration = typeof mockDriveConfigurations.$inferInsert;

export type MockDriveRound = typeof mockDriveRounds.$inferSelect;
export type NewMockDriveRound = typeof mockDriveRounds.$inferInsert;

export type MockDriveParticipant = typeof mockDriveParticipants.$inferSelect;
export type NewMockDriveParticipant = typeof mockDriveParticipants.$inferInsert;

export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type NewAssessmentAttempt = typeof assessmentAttempts.$inferInsert;

export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type NewAssessmentResponse = typeof assessmentResponses.$inferInsert;

export type CodingSubmission = typeof codingSubmissions.$inferSelect;
export type NewCodingSubmission = typeof codingSubmissions.$inferInsert;

export type InterviewPracticeSession = typeof interviewPracticeSessions.$inferSelect;
export type NewInterviewPracticeSession = typeof interviewPracticeSessions.$inferInsert;

export type InterviewPracticeFeedback = typeof interviewPracticeFeedback.$inferSelect;
export type NewInterviewPracticeFeedback = typeof interviewPracticeFeedback.$inferInsert;

export type AssessmentReport = typeof assessmentReports.$inferSelect;
export type NewAssessmentReport = typeof assessmentReports.$inferInsert;

export type LearningPath = typeof learningPaths.$inferSelect;
export type NewLearningPath = typeof learningPaths.$inferInsert;

export type LearningTask = typeof learningTasks.$inferSelect;
export type NewLearningTask = typeof learningTasks.$inferInsert;

export type LearningTaskSubmission = typeof learningTaskSubmissions.$inferSelect;
export type NewLearningTaskSubmission = typeof learningTaskSubmissions.$inferInsert;

export type LearningEvidenceLink = typeof learningEvidenceLinks.$inferSelect;
export type NewLearningEvidenceLink = typeof learningEvidenceLinks.$inferInsert;

// Phase 12 Enum Value Types
export type MockDriveStatus = (typeof mockDriveStatusEnum.enumValues)[number];
export type MockRoundType = (typeof mockRoundTypeEnum.enumValues)[number];
export type AssessmentAttemptStatus = (typeof assessmentAttemptStatusEnum.enumValues)[number];
export type CodingLanguage = (typeof codingLanguageEnum.enumValues)[number];
export type CodingVerdict = (typeof codingVerdictEnum.enumValues)[number];
export type SkillProficiencyCategory = (typeof skillProficiencyCategoryEnum.enumValues)[number];
export type LearningTaskStatus = (typeof learningTaskStatusEnum.enumValues)[number];
export type LearningTaskCategory = (typeof learningTaskCategoryEnum.enumValues)[number];

// ============================================================================
// Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Types
// ============================================================================

export type SkillTaxonomy = typeof skillTaxonomy.$inferSelect;
export type NewSkillTaxonomy = typeof skillTaxonomy.$inferInsert;

export type SkillAlias = typeof skillAliases.$inferSelect;
export type NewSkillAlias = typeof skillAliases.$inferInsert;
export type SkillAliases = SkillAlias;
export type NewSkillAliases = NewSkillAlias;

export type JobDescriptionSource = typeof jobDescriptionSources.$inferSelect;
export type NewJobDescriptionSource = typeof jobDescriptionSources.$inferInsert;

export type IndustryJobDescription = typeof industryJobDescriptions.$inferSelect;
export type NewIndustryJobDescription = typeof industryJobDescriptions.$inferInsert;

export type JobDescriptionAnalysis = typeof jobDescriptionAnalyses.$inferSelect;
export type NewJobDescriptionAnalysis = typeof jobDescriptionAnalyses.$inferInsert;

export type IndustrySkillDemand = typeof industrySkillDemand.$inferSelect;
export type NewIndustrySkillDemand = typeof industrySkillDemand.$inferInsert;

export type IndustrySkillTrend = typeof industrySkillTrends.$inferSelect;
export type NewIndustrySkillTrend = typeof industrySkillTrends.$inferInsert;
export type IndustrySkillTrends = IndustrySkillTrend;
export type NewIndustrySkillTrends = NewIndustrySkillTrend;

export type RoleSkillRequirement = typeof roleSkillRequirements.$inferSelect;
export type NewRoleSkillRequirement = typeof roleSkillRequirements.$inferInsert;

export type StudentRolePreference = typeof studentRolePreferences.$inferSelect;
export type NewStudentRolePreference = typeof studentRolePreferences.$inferInsert;

export type StudentSkillGapSnapshot = typeof studentSkillGapSnapshots.$inferSelect;
export type NewStudentSkillGapSnapshot = typeof studentSkillGapSnapshots.$inferInsert;

export type CareerRecommendation = typeof careerRecommendations.$inferSelect;
export type NewCareerRecommendation = typeof careerRecommendations.$inferInsert;

export type CohortSkillGapSnapshot = typeof cohortSkillGapSnapshots.$inferSelect;
export type NewCohortSkillGapSnapshot = typeof cohortSkillGapSnapshots.$inferInsert;

// Phase 13 Enum Value Types
export type TaxonomyCategory = (typeof taxonomyCategoryEnum.enumValues)[number];
export type JdSourceType = (typeof jdSourceTypeEnum.enumValues)[number];
export type JdAnalysisStatus = (typeof jdAnalysisStatusEnum.enumValues)[number];
export type SkillImportance = (typeof skillImportanceEnum.enumValues)[number];
export type StudentSkillGapStatus = (typeof studentSkillGapStatusEnum.enumValues)[number];
export type CareerRecommendationFit = (typeof careerRecommendationFitEnum.enumValues)[number];

// ============================================================================
// Phase 14 — Predictive Placement Analytics Types
// ============================================================================

export type PlacementPredictionRun = typeof placementPredictionRuns.$inferSelect;
export type NewPlacementPredictionRun = typeof placementPredictionRuns.$inferInsert;

export type StudentReadinessHistory = typeof studentReadinessHistory.$inferSelect;
export type NewStudentReadinessHistory = typeof studentReadinessHistory.$inferInsert;

export type StudentSupportRecommendation = typeof studentSupportRecommendations.$inferSelect;
export type NewStudentSupportRecommendation = typeof studentSupportRecommendations.$inferInsert;

export type TpoInterventionRecord = typeof tpoInterventionRecords.$inferSelect;
export type NewTpoInterventionRecord = typeof tpoInterventionRecords.$inferInsert;

export type PlacementForecastSnapshot = typeof placementForecastSnapshots.$inferSelect;
export type NewPlacementForecastSnapshot = typeof placementForecastSnapshots.$inferInsert;

export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type NewAnalyticsSnapshot = typeof analyticsSnapshots.$inferInsert;

export type AnalyticsAuditEvent = typeof analyticsAuditEvents.$inferSelect;
export type NewAnalyticsAuditEvent = typeof analyticsAuditEvents.$inferInsert;

// Phase 14 Enum Value Types
export type ReadinessClassification = (typeof readinessClassificationEnum.enumValues)[number];
export type PredictionTarget = (typeof predictionTargetEnum.enumValues)[number];
export type PredictionModelType = (typeof predictionModelTypeEnum.enumValues)[number];
export type StudentSupportCategory = (typeof studentSupportCategoryEnum.enumValues)[number];
export type SupportInterventionStatus = (typeof supportInterventionStatusEnum.enumValues)[number];
export type InterventionPriority = (typeof interventionPriorityEnum.enumValues)[number];
export type ForecastMethod = (typeof forecastMethodEnum.enumValues)[number];

// ============================================================================
// Phase 15 — Autonomous Placement Orchestration & Workflow Types
// ============================================================================

export type AgentWorkflow = typeof agentWorkflows.$inferSelect;
export type NewAgentWorkflow = typeof agentWorkflows.$inferInsert;
export type AgentWorkflows = AgentWorkflow;
export type NewAgentWorkflows = NewAgentWorkflow;

export type AgentWorkflowStep = typeof agentWorkflowSteps.$inferSelect;
export type NewAgentWorkflowStep = typeof agentWorkflowSteps.$inferInsert;
export type AgentWorkflowSteps = AgentWorkflowStep;
export type NewAgentWorkflowSteps = NewAgentWorkflowStep;

export type AgentExecutionEvent = typeof agentExecutionEvents.$inferSelect;
export type NewAgentExecutionEvent = typeof agentExecutionEvents.$inferInsert;
export type AgentExecutionEvents = AgentExecutionEvent;
export type NewAgentExecutionEvents = NewAgentExecutionEvent;

export type AgentWorkflowApproval = typeof agentWorkflowApprovals.$inferSelect;
export type NewAgentWorkflowApproval = typeof agentWorkflowApprovals.$inferInsert;
export type AgentWorkflowApprovals = AgentWorkflowApproval;
export type NewAgentWorkflowApprovals = NewAgentWorkflowApproval;

export type NotificationEvent = typeof notificationEvents.$inferSelect;
export type NewNotificationEvent = typeof notificationEvents.$inferInsert;
export type NotificationEvents = NotificationEvent;
export type NewNotificationEvents = NewNotificationEvent;

export type DelegatedReviewer = typeof delegatedReviewers.$inferSelect;
export type NewDelegatedReviewer = typeof delegatedReviewers.$inferInsert;
export type DelegatedReviewers = DelegatedReviewer;
export type NewDelegatedReviewers = NewDelegatedReviewer;

// Phase 15 Enum Value Types
export type WorkflowStatus = (typeof workflowStatusEnum.enumValues)[number];
export type WorkflowTriggerType = (typeof workflowTriggerTypeEnum.enumValues)[number];
export type WorkflowApprovalStatus = (typeof workflowApprovalStatusEnum.enumValues)[number];
export type NotificationEventType = (typeof notificationEventTypeEnum.enumValues)[number];
export type AgentName = (typeof agentNameEnum.enumValues)[number];

// ============================================================================
// Phase 16 — Peer Collaboration & Alumni Mentorship Ecosystem Types
// ============================================================================

export type AlumniProfile = typeof alumniProfiles.$inferSelect;
export type NewAlumniProfile = typeof alumniProfiles.$inferInsert;
export type AlumniProfiles = AlumniProfile;
export type NewAlumniProfiles = NewAlumniProfile;

export type MentorAvailability = typeof mentorAvailability.$inferSelect;
export type NewMentorAvailability = typeof mentorAvailability.$inferInsert;

export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type NewMentorshipRequest = typeof mentorshipRequests.$inferInsert;
export type MentorshipRequests = MentorshipRequest;
export type NewMentorshipRequests = NewMentorshipRequest;

export type MentorshipSession = typeof mentorshipSessions.$inferSelect;
export type NewMentorshipSession = typeof mentorshipSessions.$inferInsert;
export type MentorshipSessions = MentorshipSession;
export type NewMentorshipSessions = NewMentorshipSession;

export type MentorshipFeedback = typeof mentorshipFeedback.$inferSelect;
export type NewMentorshipFeedback = typeof mentorshipFeedback.$inferInsert;

export type PeerInterviewRoom = typeof peerInterviewRooms.$inferSelect;
export type NewPeerInterviewRoom = typeof peerInterviewRooms.$inferInsert;
export type PeerInterviewRooms = PeerInterviewRoom;
export type NewPeerInterviewRooms = NewPeerInterviewRoom;

export type PeerInterviewParticipant = typeof peerInterviewParticipants.$inferSelect;
export type NewPeerInterviewParticipant = typeof peerInterviewParticipants.$inferInsert;
export type PeerInterviewParticipants = PeerInterviewParticipant;
export type NewPeerInterviewParticipants = NewPeerInterviewParticipant;

export type PeerInterviewQuestion = typeof peerInterviewQuestions.$inferSelect;
export type NewPeerInterviewQuestion = typeof peerInterviewQuestions.$inferInsert;
export type PeerInterviewQuestions = PeerInterviewQuestion;
export type NewPeerInterviewQuestions = NewPeerInterviewQuestion;

export type PeerInterviewFeedback = typeof peerInterviewFeedback.$inferSelect;
export type NewPeerInterviewFeedback = typeof peerInterviewFeedback.$inferInsert;

export type CollaborationRoom = typeof collaborationRooms.$inferSelect;
export type NewCollaborationRoom = typeof collaborationRooms.$inferInsert;
export type CollaborationRooms = CollaborationRoom;
export type NewCollaborationRooms = NewCollaborationRoom;

export type CollaborationParticipant = typeof collaborationParticipants.$inferSelect;
export type NewCollaborationParticipant = typeof collaborationParticipants.$inferInsert;
export type CollaborationParticipants = CollaborationParticipant;
export type NewCollaborationParticipants = NewCollaborationParticipant;

export type CollaborationMessage = typeof collaborationMessages.$inferSelect;
export type NewCollaborationMessage = typeof collaborationMessages.$inferInsert;
export type CollaborationMessages = CollaborationMessage;
export type NewCollaborationMessages = NewCollaborationMessage;

export type CollaborationTask = typeof collaborationTasks.$inferSelect;
export type NewCollaborationTask = typeof collaborationTasks.$inferInsert;
export type CollaborationTasks = CollaborationTask;
export type NewCollaborationTasks = NewCollaborationTask;

export type ModerationReport = typeof moderationReports.$inferSelect;
export type NewModerationReport = typeof moderationReports.$inferInsert;
export type ModerationReports = ModerationReport;
export type NewModerationReports = NewModerationReport;

export type ModerationAction = typeof moderationActions.$inferSelect;
export type NewModerationAction = typeof moderationActions.$inferInsert;
export type ModerationActions = ModerationAction;
export type NewModerationActions = NewModerationAction;

// Phase 16 Enum Value Types
export type AlumniVerificationStatus = (typeof alumniVerificationStatusEnum.enumValues)[number];
export type MentorshipRequestStatus = (typeof mentorshipRequestStatusEnum.enumValues)[number];
export type PeerInterviewType = (typeof peerInterviewTypeEnum.enumValues)[number];
export type PeerInterviewMode = (typeof peerInterviewModeEnum.enumValues)[number];
export type PeerInterviewStatus = (typeof peerInterviewStatusEnum.enumValues)[number];
export type CollaborationRoomCategory = (typeof collaborationRoomCategoryEnum.enumValues)[number];
export type CollaborationRoomStatus = (typeof collaborationRoomStatusEnum.enumValues)[number];
export type ModerationReportStatus = (typeof moderationReportStatusEnum.enumValues)[number];
export type ModerationActionType = (typeof moderationActionEnum.enumValues)[number];
export type ModerationActionEnum = (typeof moderationActionEnum.enumValues)[number];

// ============================================================================
// Phase 17 — Institutional Governance, Accreditation & Outreach Types
// ============================================================================

export type InstitutionalMetricSnapshot = typeof institutionalMetricSnapshots.$inferSelect;
export type NewInstitutionalMetricSnapshot = typeof institutionalMetricSnapshots.$inferInsert;
export type InstitutionalMetricSnapshots = InstitutionalMetricSnapshot;
export type NewInstitutionalMetricSnapshots = NewInstitutionalMetricSnapshot;

export type TrainingIntervention = typeof trainingInterventions.$inferSelect;
export type NewTrainingIntervention = typeof trainingInterventions.$inferInsert;
export type TrainingInterventions = TrainingIntervention;
export type NewTrainingInterventions = NewTrainingIntervention;

export type TrainingInterventionParticipant = typeof trainingInterventionParticipants.$inferSelect;
export type NewTrainingInterventionParticipant = typeof trainingInterventionParticipants.$inferInsert;
export type TrainingInterventionParticipants = TrainingInterventionParticipant;
export type NewTrainingInterventionParticipants = NewTrainingInterventionParticipant;

export type FairnessReviewCase = typeof fairnessReviewCases.$inferSelect;
export type NewFairnessReviewCase = typeof fairnessReviewCases.$inferInsert;
export type FairnessReviewCases = FairnessReviewCase;
export type NewFairnessReviewCases = NewFairnessReviewCase;

export type InstitutionalReportTemplate = typeof institutionalReportTemplates.$inferSelect;
export type NewInstitutionalReportTemplate = typeof institutionalReportTemplates.$inferInsert;
export type InstitutionalReportTemplates = InstitutionalReportTemplate;
export type NewInstitutionalReportTemplates = NewInstitutionalReportTemplate;

export type InstitutionalReportRun = typeof institutionalReportRuns.$inferSelect;
export type NewInstitutionalReportRun = typeof institutionalReportRuns.$inferInsert;
export type InstitutionalReportRuns = InstitutionalReportRun;
export type NewInstitutionalReportRuns = NewInstitutionalReportRun;

export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type NewOutreachCampaign = typeof outreachCampaigns.$inferInsert;
export type OutreachCampaigns = OutreachCampaign;
export type NewOutreachCampaigns = NewOutreachCampaign;

export type OutreachCampaignRecipient = typeof outreachCampaignRecipients.$inferSelect;
export type NewOutreachCampaignRecipient = typeof outreachCampaignRecipients.$inferInsert;
export type OutreachCampaignRecipients = OutreachCampaignRecipient;
export type NewOutreachCampaignRecipients = NewOutreachCampaignRecipient;

export type InstitutionalDataQualityEvent = typeof institutionalDataQualityEvents.$inferSelect;
export type NewInstitutionalDataQualityEvent = typeof institutionalDataQualityEvents.$inferInsert;
export type InstitutionalDataQualityEvents = InstitutionalDataQualityEvent;
export type NewInstitutionalDataQualityEvents = NewInstitutionalDataQualityEvent;

// ============================================================================
// Student Profile Management — New Tables (Additive Only)
// ============================================================================

/**
 * academicCorrectionRequests — Students request corrections to locked academic fields.
 */
export const academicCorrectionRequests = pgTable('academic_correction_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  currentValue: text('current_value'),
  requestedValue: text('requested_value').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

/**
 * studentCustomLinks — Additional custom professional links beyond fixed URL columns.
 */
export const studentCustomLinks = pgTable(
  'student_custom_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 100 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    label: varchar('label', { length: 200 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('uq_student_custom_links_student_platform').on(table.studentId, table.platform)
  ]
);

// ============================================================================
// Student Profile Management — Relations
// ============================================================================

export const academicCorrectionRequestsRelations = relations(academicCorrectionRequests, ({ one }) => ({
  student: one(students, {
    fields: [academicCorrectionRequests.studentId],
    references: [students.id]
  }),
  tenant: one(tenants, {
    fields: [academicCorrectionRequests.tenantId],
    references: [tenants.id]
  }),
  reviewer: one(users, {
    fields: [academicCorrectionRequests.reviewedBy],
    references: [users.id]
  })
}));

export const studentCustomLinksRelations = relations(studentCustomLinks, ({ one }) => ({
  student: one(students, {
    fields: [studentCustomLinks.studentId],
    references: [students.id]
  }),
  tenant: one(tenants, {
    fields: [studentCustomLinks.tenantId],
    references: [tenants.id]
  })
}));

// ============================================================================
// Student Profile Management — Types
// ============================================================================

export type AcademicCorrectionRequest = typeof academicCorrectionRequests.$inferSelect;
export type NewAcademicCorrectionRequest = typeof academicCorrectionRequests.$inferInsert;
export type StudentCustomLink = typeof studentCustomLinks.$inferSelect;
export type NewStudentCustomLink = typeof studentCustomLinks.$inferInsert;

// Phase 17 Enum Value Types
export type InterventionStatus = (typeof interventionStatusEnum.enumValues)[number];
export type InterventionStatusEnum = (typeof interventionStatusEnum.enumValues)[number];

export type FairnessReviewStatus = (typeof fairnessReviewStatusEnum.enumValues)[number];
export type FairnessReviewStatusEnum = (typeof fairnessReviewStatusEnum.enumValues)[number];

export type ReportFormat = (typeof reportFormatEnum.enumValues)[number];
export type ReportFormatEnum = (typeof reportFormatEnum.enumValues)[number];

export type ReportCategory = (typeof reportCategoryEnum.enumValues)[number];
export type ReportCategoryEnum = (typeof reportCategoryEnum.enumValues)[number];

export type OutreachCampaignStatus = (typeof outreachCampaignStatusEnum.enumValues)[number];
export type OutreachCampaignStatusEnum = (typeof outreachCampaignStatusEnum.enumValues)[number];








