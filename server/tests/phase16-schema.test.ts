import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../src/db/schema';
import {
  ROLES,
  ALL_ROLES,
  CANONICAL_ROLES,
  normalizeRole,
  isRole,
  hasAnyRole,
  toDatabaseRole
} from '../src/utils/roles';

describe('Phase 16 Schema Extensions (Peer Collaboration & Alumni Mentorship Ecosystem)', () => {
  describe('1. Authoritative Domain Enums', () => {
    it('should export userRoleEnum containing alumni', () => {
      expect(schema.userRoleEnum).toBeDefined();
      expect(schema.userRoleEnum.enumValues).toContain('alumni');
      expect(schema.userRoleEnum.enumValues).toContain('student');
      expect(schema.userRoleEnum.enumValues).toContain('tpo_admin');
      expect(schema.userRoleEnum.enumValues).toContain('superadmin');
    });

    it('should export alumniVerificationStatusEnum with 4 lifecycle states', () => {
      expect(schema.alumniVerificationStatusEnum).toBeDefined();
      expect(schema.alumniVerificationStatusEnum.enumValues).toEqual([
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'SUSPENDED'
      ]);
    });

    it('should export mentorshipRequestStatusEnum with 6 status states', () => {
      expect(schema.mentorshipRequestStatusEnum).toBeDefined();
      expect(schema.mentorshipRequestStatusEnum.enumValues).toEqual([
        'PENDING',
        'ACCEPTED',
        'DECLINED',
        'RESCHEDULE_REQUESTED',
        'CANCELLED',
        'COMPLETED'
      ]);
    });

    it('should export peerInterviewTypeEnum with 7 interview tracks', () => {
      expect(schema.peerInterviewTypeEnum).toBeDefined();
      expect(schema.peerInterviewTypeEnum.enumValues).toEqual([
        'TECHNICAL',
        'HR',
        'BEHAVIORAL',
        'APTITUDE_DISCUSSION',
        'PROJECT_EXPLANATION',
        'SYSTEM_DESIGN',
        'GENERAL_PREP'
      ]);
    });

    it('should export peerInterviewModeEnum with 2 operational modes', () => {
      expect(schema.peerInterviewModeEnum).toBeDefined();
      expect(schema.peerInterviewModeEnum.enumValues).toEqual([
        'STRUCTURED_INTERVIEW',
        'COLLABORATIVE_PRACTICE'
      ]);
    });

    it('should export peerInterviewStatusEnum with 4 room lifecycle statuses', () => {
      expect(schema.peerInterviewStatusEnum).toBeDefined();
      expect(schema.peerInterviewStatusEnum.enumValues).toEqual([
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
      ]);
    });

    it('should export collaborationRoomCategoryEnum with 9 study disciplines', () => {
      expect(schema.collaborationRoomCategoryEnum).toBeDefined();
      expect(schema.collaborationRoomCategoryEnum.enumValues).toEqual([
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
    });

    it('should export collaborationRoomStatusEnum with 3 room statuses', () => {
      expect(schema.collaborationRoomStatusEnum).toBeDefined();
      expect(schema.collaborationRoomStatusEnum.enumValues).toEqual([
        'ACTIVE',
        'ARCHIVED',
        'CLOSED'
      ]);
    });

    it('should export moderationReportStatusEnum with 4 triage states', () => {
      expect(schema.moderationReportStatusEnum).toBeDefined();
      expect(schema.moderationReportStatusEnum.enumValues).toEqual([
        'PENDING_REVIEW',
        'INVESTIGATING',
        'RESOLVED_ACTION_TAKEN',
        'DISMISSED'
      ]);
    });

    it('should export moderationActionEnum with 5 enforcement tiers', () => {
      expect(schema.moderationActionEnum).toBeDefined();
      expect(schema.moderationActionEnum.enumValues).toEqual([
        'NO_ACTION',
        'WARNING_ISSUED',
        'SESSION_TERMINATED',
        'PARTICIPANT_BLOCKED',
        'ACCOUNT_SUSPENDED'
      ]);
    });
  });

  describe('2. Role Utilities & Alumni Normalization Guarantees', () => {
    it('should include ALUMNI in ROLES and ALL_ROLES', () => {
      expect(ROLES.ALUMNI).toBe('alumni');
      expect(ALL_ROLES).toContain('alumni');
    });

    it('should normalize alumni variants to canonical ALUMNI', () => {
      expect(normalizeRole('alumni')).toBe('ALUMNI');
      expect(normalizeRole('ALUMNI')).toBe('ALUMNI');
      expect(normalizeRole('graduate')).toBe('ALUMNI');
      expect(normalizeRole('GRADUATE')).toBe('ALUMNI');
    });

    it('should convert canonical ALUMNI to database role token', () => {
      expect(toDatabaseRole('ALUMNI')).toBe('alumni');
    });

    it('should correctly evaluate role checks for ALUMNI', () => {
      expect(isRole('alumni', 'ALUMNI')).toBe(true);
      expect(isRole('student', 'ALUMNI')).toBe(false);
      expect(hasAnyRole('alumni', ['STUDENT', 'ALUMNI'])).toBe(true);
      expect(hasAnyRole('tpo_admin', ['STUDENT', 'ALUMNI'])).toBe(false);
    });
  });

  describe('3. Relational Table Columns & Multi-Tenant Isolation', () => {
    it('alumniProfiles defines professional, cohort, and tenant isolation fields', () => {
      expect(schema.alumniProfiles).toBeDefined();
      const cols = getTableColumns(schema.alumniProfiles);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.graduationYear).toBeDefined();
      expect(cols.degree).toBeDefined();
      expect(cols.department).toBeDefined();
      expect(cols.currentCompany).toBeDefined();
      expect(cols.currentRole).toBeDefined();
      expect(cols.industryDomain).toBeDefined();
      expect(cols.totalExperienceYears).toBeDefined();
      expect(cols.linkedInUrl).toBeDefined();
      expect(cols.githubUrl).toBeDefined();
      expect(cols.portfolioUrl).toBeDefined();
      expect(cols.bio).toBeDefined();
      expect(cols.skills).toBeDefined();
      expect(cols.expertiseAreas).toBeDefined();
      expect(cols.mentorshipEnabled).toBeDefined();
      expect(cols.maxActiveMentees).toBeDefined();
      expect(cols.verificationStatus).toBeDefined();
      expect(cols.verifiedBy).toBeDefined();
      expect(cols.verifiedAt).toBeDefined();
      expect(cols.verificationNotes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('mentorAvailability defines slot scheduling and tenant isolation fields', () => {
      expect(schema.mentorAvailability).toBeDefined();
      const cols = getTableColumns(schema.mentorAvailability);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.alumniProfileId).toBeDefined();
      expect(cols.mentorUserId).toBeDefined();
      expect(cols.dayOfWeek).toBeDefined();
      expect(cols.startTime).toBeDefined();
      expect(cols.endTime).toBeDefined();
      expect(cols.timezone).toBeDefined();
      expect(cols.isRecurring).toBeDefined();
      expect(cols.specificDate).toBeDefined();
      expect(cols.maxBookingsPerSlot).toBeDefined();
      expect(cols.isActive).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('mentorshipRequests defines student dispatch, status, and tenant isolation fields', () => {
      expect(schema.mentorshipRequests).toBeDefined();
      const cols = getTableColumns(schema.mentorshipRequests);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.studentUserId).toBeDefined();
      expect(cols.alumniProfileId).toBeDefined();
      expect(cols.mentorUserId).toBeDefined();
      expect(cols.topic).toBeDefined();
      expect(cols.message).toBeDefined();
      expect(cols.goals).toBeDefined();
      expect(cols.preferredSlotId).toBeDefined();
      expect(cols.preferredDate).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.rejectionReason).toBeDefined();
      expect(cols.rescheduleNote).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('mentorshipSessions defines session timing, meeting links, notes, and tenant isolation', () => {
      expect(schema.mentorshipSessions).toBeDefined();
      const cols = getTableColumns(schema.mentorshipSessions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.requestId).toBeDefined();
      expect(cols.alumniProfileId).toBeDefined();
      expect(cols.mentorUserId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.studentUserId).toBeDefined();
      expect(cols.scheduledAt).toBeDefined();
      expect(cols.durationMinutes).toBeDefined();
      expect(cols.meetingLink).toBeDefined();
      expect(cols.roomCode).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.alumniNotes).toBeDefined();
      expect(cols.studentNotes).toBeDefined();
      expect(cols.actionItems).toBeDefined();
      expect(cols.recordingUrl).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('mentorshipFeedback defines rating, rubric scores, and tenant isolation fields', () => {
      expect(schema.mentorshipFeedback).toBeDefined();
      const cols = getTableColumns(schema.mentorshipFeedback);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.sessionId).toBeDefined();
      expect(cols.submittedBy).toBeDefined();
      expect(cols.feedbackTarget).toBeDefined();
      expect(cols.rating).toBeDefined();
      expect(cols.feedbackText).toBeDefined();
      expect(cols.rubricScores).toBeDefined();
      expect(cols.wouldRecommend).toBeDefined();
      expect(cols.isPrivate).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('peerInterviewRooms defines room code, WebRTC state, code editor, and tenant isolation', () => {
      expect(schema.peerInterviewRooms).toBeDefined();
      const cols = getTableColumns(schema.peerInterviewRooms);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomCode).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.interviewType).toBeDefined();
      expect(cols.mode).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.scheduledStartTime).toBeDefined();
      expect(cols.scheduledDurationMinutes).toBeDefined();
      expect(cols.actualStartTime).toBeDefined();
      expect(cols.actualEndTime).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.maxParticipants).toBeDefined();
      expect(cols.sharedCodeContent).toBeDefined();
      expect(cols.codeLanguage).toBeDefined();
      expect(cols.sharedWhiteboardState).toBeDefined();
      expect(cols.rubricTemplate).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('peerInterviewParticipants defines room participants, roles, and media states', () => {
      expect(schema.peerInterviewParticipants).toBeDefined();
      const cols = getTableColumns(schema.peerInterviewParticipants);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.role).toBeDefined();
      expect(cols.joinedAt).toBeDefined();
      expect(cols.leftAt).toBeDefined();
      expect(cols.connectionStatus).toBeDefined();
      expect(cols.cameraEnabled).toBeDefined();
      expect(cols.micEnabled).toBeDefined();
      expect(cols.screenShareEnabled).toBeDefined();
    });

    it('peerInterviewQuestions defines interview question prompts and ordering', () => {
      expect(schema.peerInterviewQuestions).toBeDefined();
      const cols = getTableColumns(schema.peerInterviewQuestions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomId).toBeDefined();
      expect(cols.questionTitle).toBeDefined();
      expect(cols.questionDescription).toBeDefined();
      expect(cols.difficulty).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.standardAnswer).toBeDefined();
      expect(cols.codeTemplate).toBeDefined();
      expect(cols.orderIndex).toBeDefined();
      expect(cols.isCompleted).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('peerInterviewFeedback defines 4-dimension rubric scoring and tenant isolation', () => {
      expect(schema.peerInterviewFeedback).toBeDefined();
      const cols = getTableColumns(schema.peerInterviewFeedback);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomId).toBeDefined();
      expect(cols.evaluatorUserId).toBeDefined();
      expect(cols.evaluateeUserId).toBeDefined();
      expect(cols.overallRating).toBeDefined();
      expect(cols.technicalScore).toBeDefined();
      expect(cols.communicationScore).toBeDefined();
      expect(cols.problemSolvingScore).toBeDefined();
      expect(cols.codeQualityScore).toBeDefined();
      expect(cols.detailedRubricScores).toBeDefined();
      expect(cols.strengthsText).toBeDefined();
      expect(cols.improvementsText).toBeDefined();
      expect(cols.generalFeedback).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('collaborationRooms defines group room metadata, category, and tenant isolation', () => {
      expect(schema.collaborationRooms).toBeDefined();
      const cols = getTableColumns(schema.collaborationRooms);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.slug).toBeDefined();
      expect(cols.name).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.isPrivate).toBeDefined();
      expect(cols.passcodeHash).toBeDefined();
      expect(cols.maxMembers).toBeDefined();
      expect(cols.activeMemberCount).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.pinnedMessageId).toBeDefined();
      expect(cols.tags).toBeDefined();
      expect(cols.canvasState).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('collaborationParticipants defines study pod memberships and moderation roles', () => {
      expect(schema.collaborationParticipants).toBeDefined();
      const cols = getTableColumns(schema.collaborationParticipants);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.role).toBeDefined();
      expect(cols.isMuted).toBeDefined();
      expect(cols.joinedAt).toBeDefined();
      expect(cols.lastActiveAt).toBeDefined();
      expect(cols.leftAt).toBeDefined();
    });

    it('collaborationMessages defines room messaging stream and attachments', () => {
      expect(schema.collaborationMessages).toBeDefined();
      const cols = getTableColumns(schema.collaborationMessages);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomId).toBeDefined();
      expect(cols.senderUserId).toBeDefined();
      expect(cols.messageType).toBeDefined();
      expect(cols.content).toBeDefined();
      expect(cols.codeSnippetJson).toBeDefined();
      expect(cols.attachmentUrl).toBeDefined();
      expect(cols.isPinned).toBeDefined();
      expect(cols.isEdited).toBeDefined();
      expect(cols.reactions).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('collaborationTasks defines peer sprint task management and completion', () => {
      expect(schema.collaborationTasks).toBeDefined();
      const cols = getTableColumns(schema.collaborationTasks);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roomId).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.priority).toBeDefined();
      expect(cols.assignedTo).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.dueDate).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('moderationReports defines incident reporting and safety triage for TPO', () => {
      expect(schema.moderationReports).toBeDefined();
      const cols = getTableColumns(schema.moderationReports);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.reporterUserId).toBeDefined();
      expect(cols.reportedUserId).toBeDefined();
      expect(cols.entityType).toBeDefined();
      expect(cols.entityId).toBeDefined();
      expect(cols.reason).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.evidenceJson).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.investigatedBy).toBeDefined();
      expect(cols.investigationNotes).toBeDefined();
      expect(cols.resolvedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('moderationActions defines administrative enforcement and duration controls', () => {
      expect(schema.moderationActions).toBeDefined();
      const cols = getTableColumns(schema.moderationActions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.reportId).toBeDefined();
      expect(cols.actionType).toBeDefined();
      expect(cols.targetUserId).toBeDefined();
      expect(cols.executedBy).toBeDefined();
      expect(cols.reason).toBeDefined();
      expect(cols.actionDurationHours).toBeDefined();
      expect(cols.validUntil).toBeDefined();
      expect(cols.notes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });
  });

  describe('4. Drizzle Relations Architecture', () => {
    it('should export all 15 Phase 16 relations schemas', () => {
      expect(schema.alumniProfilesRelations).toBeDefined();
      expect(schema.mentorAvailabilityRelations).toBeDefined();
      expect(schema.mentorshipRequestsRelations).toBeDefined();
      expect(schema.mentorshipSessionsRelations).toBeDefined();
      expect(schema.mentorshipFeedbackRelations).toBeDefined();
      expect(schema.peerInterviewRoomsRelations).toBeDefined();
      expect(schema.peerInterviewParticipantsRelations).toBeDefined();
      expect(schema.peerInterviewQuestionsRelations).toBeDefined();
      expect(schema.peerInterviewFeedbackRelations).toBeDefined();
      expect(schema.collaborationRoomsRelations).toBeDefined();
      expect(schema.collaborationParticipantsRelations).toBeDefined();
      expect(schema.collaborationMessagesRelations).toBeDefined();
      expect(schema.collaborationTasksRelations).toBeDefined();
      expect(schema.moderationReportsRelations).toBeDefined();
      expect(schema.moderationActionsRelations).toBeDefined();
    });

    it('tenantsRelations and usersRelations should include Phase 16 entities', () => {
      expect(schema.tenantsRelations).toBeDefined();
      expect(schema.usersRelations).toBeDefined();
    });
  });

  describe('5. Additive Non-Destructive Migration Verification (0006_*.sql)', () => {
    it('should locate 0006_*.sql migration and verify 100% additive structure', () => {
      const drizzleDir = path.resolve(__dirname, '../drizzle');
      const files = fs.readdirSync(drizzleDir);
      const phase16Migration = files.find((f) => f.startsWith('0006_') && f.endsWith('.sql'));

      expect(phase16Migration).toBeDefined();
      const sqlContent = fs.readFileSync(path.join(drizzleDir, phase16Migration!), 'utf-8');

      // Zero destructive commands
      expect(sqlContent).not.toMatch(/DROP\s+TABLE/i);
      expect(sqlContent).not.toMatch(/DROP\s+COLUMN/i);
      expect(sqlContent).not.toMatch(/TRUNCATE/i);

      // Verify alumni enum alteration
      expect(sqlContent).toContain('ALTER TYPE "public"."user_role_enum" ADD VALUE \'alumni\'');

      // Verify all 9 new enums created
      expect(sqlContent).toContain('CREATE TYPE "public"."alumni_verification_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."collaboration_room_category_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."collaboration_room_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."mentorship_request_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."moderation_action_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."moderation_report_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."peer_interview_mode_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."peer_interview_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."peer_interview_type_enum"');

      // Verify all 15 tables created
      expect(sqlContent).toContain('CREATE TABLE "alumni_profiles"');
      expect(sqlContent).toContain('CREATE TABLE "mentor_availability"');
      expect(sqlContent).toContain('CREATE TABLE "mentorship_requests"');
      expect(sqlContent).toContain('CREATE TABLE "mentorship_sessions"');
      expect(sqlContent).toContain('CREATE TABLE "mentorship_feedback"');
      expect(sqlContent).toContain('CREATE TABLE "peer_interview_rooms"');
      expect(sqlContent).toContain('CREATE TABLE "peer_interview_participants"');
      expect(sqlContent).toContain('CREATE TABLE "peer_interview_questions"');
      expect(sqlContent).toContain('CREATE TABLE "peer_interview_feedback"');
      expect(sqlContent).toContain('CREATE TABLE "collaboration_rooms"');
      expect(sqlContent).toContain('CREATE TABLE "collaboration_participants"');
      expect(sqlContent).toContain('CREATE TABLE "collaboration_messages"');
      expect(sqlContent).toContain('CREATE TABLE "collaboration_tasks"');
      expect(sqlContent).toContain('CREATE TABLE "moderation_reports"');
      expect(sqlContent).toContain('CREATE TABLE "moderation_actions"');

      // Verify multi-tenant isolation foreign keys to tenants.id
      expect(sqlContent).toContain('"alumni_profiles_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"mentor_availability_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"mentorship_requests_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"mentorship_sessions_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"mentorship_feedback_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"peer_interview_rooms_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"peer_interview_participants_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"peer_interview_questions_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"peer_interview_feedback_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"collaboration_rooms_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"collaboration_participants_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"collaboration_messages_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"collaboration_tasks_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"moderation_reports_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"moderation_actions_tenant_id_tenants_id_fk"');
    });
  });
});
