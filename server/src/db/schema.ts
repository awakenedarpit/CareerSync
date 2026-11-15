import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
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
  'student'
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
 * 11. Job Requirements Table
 */
export const jobRequirements = pgTable(
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
    batchYear: integer('batch_year').notNull(),
    minCgpa: numeric('min_cgpa', { precision: 4, scale: 2 }).default('6.00').notNull(),
    maxBacklogsAllowed: integer('max_backlogs_allowed').default(0).notNull(),
    eligibleDepartments: jsonb('eligible_departments').default([]).notNull(),
    registrationStart: timestamp('registration_start', { withTimezone: true }).notNull(),
    registrationEnd: timestamp('registration_end', { withTimezone: true }).notNull(),
    driveDate: timestamp('drive_date', { withTimezone: true }),
    status: driveStatusEnum('status').default('draft').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_drives_tenant_status_batch').on(table.tenantId, table.status, table.batchYear)
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
    probabilityScore: numeric('probability_score', { precision: 5, scale: 4 }).notNull(),
    riskTier: riskTierEnum('risk_tier').default('moderate_risk').notNull(),
    contributingFactorsJson: jsonb('contributing_factors_json').default([]).notNull(),
    isAdvisoryOnly: boolean('is_advisory_only').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_predictions_tenant_student').on(table.tenantId, table.studentId),
    index('ix_placement_predictions_drive_id').on(table.driveId)
  ]
);

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
 */
export const agentWorkflows = pgTable(
  'agent_workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    workflowName: varchar('workflow_name', { length: 150 }).notNull(),
    targetEntityType: varchar('target_entity_type', { length: 50 }).notNull(),
    targetEntityId: uuid('target_entity_id').notNull(),
    currentStage: varchar('current_stage', { length: 100 }).notNull(),
    stateHistory: jsonb('state_history').default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('ix_workflows_tenant_entity').on(table.tenantId, table.targetEntityType, table.targetEntityId)
  ]
);

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
  agentWorkflows: many(agentWorkflows)
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
  agentLogs: many(agentExecutionLogs)
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id]
  }),
  owner: one(users, {
    fields: [documents.ownerUserId],
    references: [users.id]
  })
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
  recommendations: many(learningRecommendations)
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  studentSkills: many(studentSkills),
  jobRequirements: many(jobRequirements),
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
  jobRoles: many(jobRoles)
}));

export const jobRolesRelations = relations(jobRoles, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobRoles.companyId],
    references: [companies.id]
  }),
  requirements: many(jobRequirements),
  placementDrives: many(placementDrives),
  gapAnalyses: many(skillGapAnalyses)
}));

export const jobRequirementsRelations = relations(jobRequirements, ({ one }) => ({
  jobRole: one(jobRoles, {
    fields: [jobRequirements.jobRoleId],
    references: [jobRoles.id]
  }),
  skill: one(skills, {
    fields: [jobRequirements.skillId],
    references: [skills.id]
  })
}));

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
  predictions: many(placementPredictions)
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

export const agentWorkflowsRelations = relations(agentWorkflows, ({ one }) => ({
  tenant: one(tenants, {
    fields: [agentWorkflows.tenantId],
    references: [tenants.id]
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

export type AgentWorkflow = typeof agentWorkflows.$inferSelect;
export type NewAgentWorkflow = typeof agentWorkflows.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
