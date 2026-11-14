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

// ============================================================================
// Tables Definition
// ============================================================================

/**
 * Tenants & Institutions Table
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
 * Users, Authentication & RBAC Table
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
 * Students Table
 * Extended profile for students enrolled within a tenant.
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
    resumeR2Url: varchar('resume_r2_url', { length: 512 }),
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
 * Standardized Skills Master Taxonomy
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
 * StudentSkills Table
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
 * Inspectable Evidence Records (Proof-of-work)
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
    r2StorageKey: varchar('r2_storage_key', { length: 512 }),
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
 * Standardized Skill Assessments
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
 * Academic Semesters Table
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
 * Companies Table
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
 * Job Roles Table
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
 * Job Requirements Table
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
 * Placement Drives Table
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
 * Applications Table
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
 * Interviews Table
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
 * Audit Events Table (Tamper-proof compliance logging)
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
 * Notifications Table
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
 * Invitations Table
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

// ============================================================================
// Drizzle Relations
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  students: many(students),
  placementDrives: many(placementDrives),
  auditEvents: many(auditEvents),
  notifications: many(notifications),
  invitations: many(invitations)
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
  notifications: many(notifications),
  auditEvents: many(auditEvents),
  sentInvitations: many(invitations)
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
  applications: many(applications)
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  studentSkills: many(studentSkills),
  jobRequirements: many(jobRequirements)
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

export const companiesRelations = relations(companies, ({ many }) => ({
  jobRoles: many(jobRoles)
}));

export const jobRolesRelations = relations(jobRoles, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobRoles.companyId],
    references: [companies.id]
  }),
  requirements: many(jobRequirements),
  placementDrives: many(placementDrives)
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
  applications: many(applications)
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

// Export inferred types for safety
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
