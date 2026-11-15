import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import * as schema from '../src/db/schema';

describe('Phase 10 Schema Extensions (Skill Verification, Readiness, Eligibility)', () => {
  describe('1. Authoritative Domain Enums', () => {
    it('should export readinessCategoryEnum with authoritative categories', () => {
      expect(schema.readinessCategoryEnum).toBeDefined();
      expect(schema.readinessCategoryEnum.enumValues).toEqual([
        'READY',
        'DEVELOPING',
        'NEEDS_SUPPORT',
        'INSUFFICIENT_DATA'
      ]);
    });

    it('should export eligibilityResultEnum with authoritative statuses', () => {
      expect(schema.eligibilityResultEnum).toBeDefined();
      expect(schema.eligibilityResultEnum.enumValues).toEqual([
        'ELIGIBLE',
        'INELIGIBLE',
        'NEEDS_REVIEW',
        'INSUFFICIENT_DATA'
      ]);
    });

    it('should export recruitmentJobStatusEnum with authoritative lifecycle statuses', () => {
      expect(schema.recruitmentJobStatusEnum).toBeDefined();
      expect(schema.recruitmentJobStatusEnum.enumValues).toEqual([
        'DRAFT',
        'ACTIVE',
        'CLOSED',
        'ARCHIVED'
      ]);
    });
  });

  describe('2. Table Structure & Tenant Isolation Column Guarantees', () => {
    it('skillVerificationReviews should define all required columns and tenant isolation', () => {
      expect(schema.skillVerificationReviews).toBeDefined();
      const cols = getTableColumns(schema.skillVerificationReviews);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.evidenceId).toBeDefined();
      expect(cols.reviewerId).toBeDefined();
      expect(cols.previousStatus).toBeDefined();
      expect(cols.newStatus).toBeDefined();
      expect(cols.reason).toBeDefined();
      expect(cols.reviewerNotes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('studentReadinessSnapshots should define all required scoring & completeness columns', () => {
      expect(schema.studentReadinessSnapshots).toBeDefined();
      const cols = getTableColumns(schema.studentReadinessSnapshots);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.score).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.dimensions).toBeDefined();
      expect(cols.explanation).toBeDefined();
      expect(cols.dataCompleteness).toBeDefined();
      expect(cols.calculatedAt).toBeDefined();
    });

    it('jobRequirements should define all required recruitment job posting columns', () => {
      expect(schema.jobRequirements).toBeDefined();
      const cols = getTableColumns(schema.jobRequirements);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.companyName).toBeDefined();
      expect(cols.jobTitle).toBeDefined();
      expect(cols.jobDescription).toBeDefined();
      expect(cols.eligibleDepartments).toBeDefined();
      expect(cols.graduationYear).toBeDefined();
      expect(cols.minimumCgpa).toBeDefined();
      expect(cols.requiredSkills).toBeDefined();
      expect(cols.preferredSkills).toBeDefined();
      expect(cols.assessmentRequirements).toBeDefined();
      expect(cols.deadline).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();

      // Aliases
      expect(schema.recruitmentJobRequirements).toBe(schema.jobRequirements);
      expect(schema.recruitmentJobs).toBe(schema.jobRequirements);
    });

    it('jobEligibilityEvaluations should define evaluation and override audit columns', () => {
      expect(schema.jobEligibilityEvaluations).toBeDefined();
      const cols = getTableColumns(schema.jobEligibilityEvaluations);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.jobId).toBeDefined();
      expect(cols.result).toBeDefined();
      expect(cols.matchedRequirements).toBeDefined();
      expect(cols.unmetRequirements).toBeDefined();
      expect(cols.missingInformation).toBeDefined();
      expect(cols.explanation).toBeDefined();
      expect(cols.overriddenBy).toBeDefined();
      expect(cols.overrideReason).toBeDefined();
      expect(cols.evaluatedAt).toBeDefined();
    });
  });

  describe('3. Drizzle Relations Definitions', () => {
    it('should export all Phase 10 table relations', () => {
      expect(schema.skillVerificationReviewsRelations).toBeDefined();
      expect(schema.studentReadinessSnapshotsRelations).toBeDefined();
      expect(schema.jobRequirementsRelations).toBeDefined();
      expect(schema.jobEligibilityEvaluationsRelations).toBeDefined();
      expect(schema.roleJobRequirementsRelations).toBeDefined();
    });

    it('should preserve backward compatible Canonical Domain Tables', () => {
      expect(schema.roleJobRequirements).toBeDefined();
      expect(schema.legacyJobRequirements).toBe(schema.roleJobRequirements);
      expect(schema.legacyJobRequirementsRelations).toBe(schema.roleJobRequirementsRelations);
    });
  });
});
