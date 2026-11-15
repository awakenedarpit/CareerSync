import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import * as schema from '../src/db/schema';

describe('Phase 12 Schema Extensions (Mock Drive, Assessment Engine & Learning Intelligence)', () => {
  describe('1. Phase 12 Authoritative Domain Enums', () => {
    it('should export mockDriveStatusEnum with expected values', () => {
      expect(schema.mockDriveStatusEnum).toBeDefined();
      expect(schema.mockDriveStatusEnum.enumValues).toEqual([
        'DRAFT',
        'PUBLISHED',
        'ACTIVE',
        'COMPLETED',
        'ARCHIVED'
      ]);
    });

    it('should export mockRoundTypeEnum with expected values', () => {
      expect(schema.mockRoundTypeEnum).toBeDefined();
      expect(schema.mockRoundTypeEnum.enumValues).toEqual([
        'APTITUDE',
        'TECHNICAL_CODING',
        'INTERVIEW'
      ]);
    });

    it('should export assessmentAttemptStatusEnum with expected values', () => {
      expect(schema.assessmentAttemptStatusEnum).toBeDefined();
      expect(schema.assessmentAttemptStatusEnum.enumValues).toEqual([
        'IN_PROGRESS',
        'COMPLETED',
        'TIMED_OUT',
        'ABANDONED'
      ]);
    });

    it('should export codingLanguageEnum with expected values', () => {
      expect(schema.codingLanguageEnum).toBeDefined();
      expect(schema.codingLanguageEnum.enumValues).toEqual([
        'python',
        'java',
        'cpp',
        'javascript'
      ]);
    });

    it('should export codingVerdictEnum with expected values', () => {
      expect(schema.codingVerdictEnum).toBeDefined();
      expect(schema.codingVerdictEnum.enumValues).toEqual([
        'ACCEPTED',
        'WRONG_ANSWER',
        'TIME_LIMIT_EXCEEDED',
        'MEMORY_LIMIT_EXCEEDED',
        'COMPILATION_ERROR',
        'RUNTIME_ERROR',
        'DEMO_EVALUATION'
      ]);
    });

    it('should export skillProficiencyCategoryEnum with expected values', () => {
      expect(schema.skillProficiencyCategoryEnum).toBeDefined();
      expect(schema.skillProficiencyCategoryEnum.enumValues).toEqual([
        'ASSESSED_STRENGTH',
        'IMPROVEMENT_NEEDED',
        'NOT_ASSESSED',
        'INSUFFICIENT_DATA'
      ]);
    });

    it('should export learningTaskStatusEnum with expected values', () => {
      expect(schema.learningTaskStatusEnum).toBeDefined();
      expect(schema.learningTaskStatusEnum.enumValues).toEqual([
        'RECOMMENDED',
        'IN_PROGRESS',
        'SUBMITTED_FOR_REVIEW',
        'COMPLETED',
        'REJECTED',
        'PAUSED'
      ]);
    });

    it('should export learningTaskCategoryEnum with expected values', () => {
      expect(schema.learningTaskCategoryEnum).toBeDefined();
      expect(schema.learningTaskCategoryEnum.enumValues).toEqual([
        'CONCEPT_LEARNING',
        'CODING_EXERCISE',
        'PRACTICAL_PROJECT',
        'DATABASE_PRACTICE',
        'PROBLEM_SOLVING',
        'INTERVIEW_PREP',
        'PORTFOLIO_IMPROVEMENT'
      ]);
    });
  });

  describe('2. Phase 12 Tables Column Specifications & Tenant Isolation', () => {
    it('assessmentQuestionBanks should define all required columns', () => {
      expect(schema.assessmentQuestionBanks).toBeDefined();
      const cols = getTableColumns(schema.assessmentQuestionBanks);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('assessmentQuestions should define all required columns', () => {
      expect(schema.assessmentQuestions).toBeDefined();
      const cols = getTableColumns(schema.assessmentQuestions);
      expect(cols.id).toBeDefined();
      expect(cols.bankId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.topic).toBeDefined();
      expect(cols.difficulty).toBeDefined();
      expect(cols.questionText).toBeDefined();
      expect(cols.questionType).toBeDefined();
      expect(cols.optionsJson).toBeDefined();
      expect(cols.correctAnswer).toBeDefined();
      expect(cols.explanation).toBeDefined();
      expect(cols.testCasesJson).toBeDefined();
      expect(cols.starterCodeJson).toBeDefined();
      expect(cols.marks).toBeDefined();
      expect(cols.negativeMarks).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('mockDriveConfigurations should define all required columns', () => {
      expect(schema.mockDriveConfigurations).toBeDefined();
      const cols = getTableColumns(schema.mockDriveConfigurations);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.eligibleDepartmentsJson).toBeDefined();
      expect(cols.minCgpa).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.scheduledStart).toBeDefined();
      expect(cols.scheduledEnd).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('mockDriveRounds should define all required columns', () => {
      expect(schema.mockDriveRounds).toBeDefined();
      const cols = getTableColumns(schema.mockDriveRounds);
      expect(cols.id).toBeDefined();
      expect(cols.driveId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roundType).toBeDefined();
      expect(cols.roundOrder).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.durationMinutes).toBeDefined();
      expect(cols.cutoffScore).toBeDefined();
      expect(cols.questionBankId).toBeDefined();
      expect(cols.configJson).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('mockDriveParticipants should define all required columns', () => {
      expect(schema.mockDriveParticipants).toBeDefined();
      const cols = getTableColumns(schema.mockDriveParticipants);
      expect(cols.id).toBeDefined();
      expect(cols.driveId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.registrationStatus).toBeDefined();
      expect(cols.currentRoundOrder).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.finalReportId).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('assessmentAttempts should define all required columns', () => {
      expect(schema.assessmentAttempts).toBeDefined();
      const cols = getTableColumns(schema.assessmentAttempts);
      expect(cols.id).toBeDefined();
      expect(cols.driveId).toBeDefined();
      expect(cols.roundId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roundType).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.score).toBeDefined();
      expect(cols.maxScore).toBeDefined();
      expect(cols.percentage).toBeDefined();
      expect(cols.topicAnalysisJson).toBeDefined();
      expect(cols.startedAt).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.expiresAt).toBeDefined();
      expect(cols.timeSpentSeconds).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('assessmentResponses should define all required columns', () => {
      expect(schema.assessmentResponses).toBeDefined();
      const cols = getTableColumns(schema.assessmentResponses);
      expect(cols.id).toBeDefined();
      expect(cols.attemptId).toBeDefined();
      expect(cols.questionId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.selectedOption).toBeDefined();
      expect(cols.answerText).toBeDefined();
      expect(cols.isCorrect).toBeDefined();
      expect(cols.marksAwarded).toBeDefined();
      expect(cols.isMarkedForReview).toBeDefined();
      expect(cols.timeSpentSeconds).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('codingSubmissions should define all required columns', () => {
      expect(schema.codingSubmissions).toBeDefined();
      const cols = getTableColumns(schema.codingSubmissions);
      expect(cols.id).toBeDefined();
      expect(cols.attemptId).toBeDefined();
      expect(cols.problemId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.language).toBeDefined();
      expect(cols.sourceCode).toBeDefined();
      expect(cols.verdict).toBeDefined();
      expect(cols.testCasesPassed).toBeDefined();
      expect(cols.totalTestCases).toBeDefined();
      expect(cols.executionTimeMs).toBeDefined();
      expect(cols.memoryKb).toBeDefined();
      expect(cols.outputDetailsJson).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('interviewPracticeSessions should define all required columns', () => {
      expect(schema.interviewPracticeSessions).toBeDefined();
      const cols = getTableColumns(schema.interviewPracticeSessions);
      expect(cols.id).toBeDefined();
      expect(cols.driveId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.totalQuestions).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.startedAt).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('interviewPracticeFeedback should define all required columns', () => {
      expect(schema.interviewPracticeFeedback).toBeDefined();
      const cols = getTableColumns(schema.interviewPracticeFeedback);
      expect(cols.id).toBeDefined();
      expect(cols.sessionId).toBeDefined();
      expect(cols.questionId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentAnswer).toBeDefined();
      expect(cols.audioRecordingUrl).toBeDefined();
      expect(cols.correctnessScore).toBeDefined();
      expect(cols.understandingScore).toBeDefined();
      expect(cols.completenessScore).toBeDefined();
      expect(cols.relevanceScore).toBeDefined();
      expect(cols.clarityScore).toBeDefined();
      expect(cols.overallScore).toBeDefined();
      expect(cols.strengthsText).toBeDefined();
      expect(cols.weaknessesText).toBeDefined();
      expect(cols.suggestedAnswerText).toBeDefined();
      expect(cols.evaluatorType).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('assessmentReports should define all required columns', () => {
      expect(schema.assessmentReports).toBeDefined();
      const cols = getTableColumns(schema.assessmentReports);
      expect(cols.id).toBeDefined();
      expect(cols.driveId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.aptitudeScore).toBeDefined();
      expect(cols.technicalScore).toBeDefined();
      expect(cols.interviewScore).toBeDefined();
      expect(cols.compositeScore).toBeDefined();
      expect(cols.strengthsJson).toBeDefined();
      expect(cols.weaknessesJson).toBeDefined();
      expect(cols.questionsAttempted).toBeDefined();
      expect(cols.questionsUnanswered).toBeDefined();
      expect(cols.timeUtilizationSeconds).toBeDefined();
      expect(cols.recommendationsJson).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('learningPaths should define all required columns', () => {
      expect(schema.learningPaths).toBeDefined();
      const cols = getTableColumns(schema.learningPaths);
      expect(cols.id).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.readinessScore).toBeDefined();
      expect(cols.activeGoal).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.generatedAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('learningTasks should define all required columns', () => {
      expect(schema.learningTasks).toBeDefined();
      const cols = getTableColumns(schema.learningTasks);
      expect(cols.id).toBeDefined();
      expect(cols.pathId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.targetSkill).toBeDefined();
      expect(cols.difficulty).toBeDefined();
      expect(cols.estimatedHours).toBeDefined();
      expect(cols.completionCriteria).toBeDefined();
      expect(cols.expectedEvidenceType).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.taskOrder).toBeDefined();
      expect(cols.startedAt).toBeDefined();
      expect(cols.completedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('learningTaskSubmissions should define all required columns', () => {
      expect(schema.learningTaskSubmissions).toBeDefined();
      const cols = getTableColumns(schema.learningTaskSubmissions);
      expect(cols.id).toBeDefined();
      expect(cols.taskId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.repositoryUrl).toBeDefined();
      expect(cols.projectUrl).toBeDefined();
      expect(cols.documentationText).toBeDefined();
      expect(cols.reviewStatus).toBeDefined();
      expect(cols.feedbackText).toBeDefined();
      expect(cols.reviewedBy).toBeDefined();
      expect(cols.reviewedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('learningEvidenceLinks should define all required columns', () => {
      expect(schema.learningEvidenceLinks).toBeDefined();
      const cols = getTableColumns(schema.learningEvidenceLinks);
      expect(cols.id).toBeDefined();
      expect(cols.taskId).toBeDefined();
      expect(cols.submissionId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.skillId).toBeDefined();
      expect(cols.evidenceType).toBeDefined();
      expect(cols.evidenceUrl).toBeDefined();
      expect(cols.verificationStatus).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });
  });
});
