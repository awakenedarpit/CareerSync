import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import * as schema from '../src/db/schema';

describe('Phase 09 AI Profiling & Document Ingestion Schema Extensions', () => {
  describe('1. Authoritative Phase 09 Enums', () => {
    it('should export jobStatusEnum with all required statuses', () => {
      expect(schema.jobStatusEnum).toBeDefined();
      expect(schema.jobStatusEnum.enumValues).toEqual([
        'QUEUED',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED'
      ]);
    });

    it('should export extractionStatusEnum with all required review statuses', () => {
      expect(schema.extractionStatusEnum).toBeDefined();
      expect(schema.extractionStatusEnum.enumValues).toEqual([
        'PENDING_REVIEW',
        'APPROVED',
        'REJECTED',
        'PARTIALLY_APPROVED'
      ]);
    });

    it('should export reviewActionEnum with all required actions', () => {
      expect(schema.reviewActionEnum).toBeDefined();
      expect(schema.reviewActionEnum.enumValues).toEqual([
        'APPROVE',
        'REJECT',
        'MODIFY'
      ]);
    });

    it('should export profileEvidenceTypeEnum with all required evidence categories', () => {
      expect(schema.profileEvidenceTypeEnum).toBeDefined();
      expect(schema.profileEvidenceTypeEnum.enumValues).toEqual([
        'RESUME',
        'PROJECT',
        'CERTIFICATE',
        'ASSESSMENT',
        'SELF_DECLARED'
      ]);
      expect(schema.profilingEvidenceTypeEnum).toBe(schema.profileEvidenceTypeEnum);
    });

    it('should export profileVerificationStatusEnum with all required 6 verification states', () => {
      expect(schema.profileVerificationStatusEnum).toBeDefined();
      expect(schema.profileVerificationStatusEnum.enumValues).toEqual([
        'SELF_DECLARED',
        'EVIDENCE_FOUND',
        'PENDING_REVIEW',
        'VERIFIED',
        'REJECTED',
        'NEEDS_MORE_EVIDENCE'
      ]);
      expect(schema.profilingVerificationStatusEnum).toBe(schema.profileVerificationStatusEnum);
    });
  });

  describe('2. Table Structure & Tenant Isolation Column Guarantees', () => {
    it('documentProcessingJobs should define all required columns with tenant foreign key', () => {
      expect(schema.documentProcessingJobs).toBeDefined();
      const cols = getTableColumns(schema.documentProcessingJobs);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.documentId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.retryCount).toBeDefined();
      expect(cols.errorMessage).toBeDefined();
      expect(cols.payload).toBeDefined();
      expect(cols.result).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
      expect(cols.completedAt).toBeDefined();
    });

    it('profileExtractions should define all required extraction & confidence columns', () => {
      expect(schema.profileExtractions).toBeDefined();
      const cols = getTableColumns(schema.profileExtractions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.documentId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.rawTextPreview).toBeDefined();
      expect(cols.sanitizedText).toBeDefined();
      expect(cols.extractedSkills).toBeDefined();
      expect(cols.extractedProjects).toBeDefined();
      expect(cols.extractedCertifications).toBeDefined();
      expect(cols.warnings).toBeDefined();
      expect(cols.overallConfidence).toBeDefined();
      expect(cols.providerUsed).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('profileSkillEvidence should define granular evidence mapping and verification columns', () => {
      expect(schema.profileSkillEvidence).toBeDefined();
      const cols = getTableColumns(schema.profileSkillEvidence);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.skillName).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.proficiencyClaim).toBeDefined();
      expect(cols.evidenceType).toBeDefined();
      expect(cols.documentId).toBeDefined();
      expect(cols.extractionId).toBeDefined();
      expect(cols.confidence).toBeDefined();
      expect(cols.verificationStatus).toBeDefined();
      expect(cols.reviewedBy).toBeDefined();
      expect(cols.reviewedAt).toBeDefined();
      expect(cols.reviewNotes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('profileReviewEvents should capture complete review audit trail', () => {
      expect(schema.profileReviewEvents).toBeDefined();
      const cols = getTableColumns(schema.profileReviewEvents);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.extractionId).toBeDefined();
      expect(cols.skillId).toBeDefined();
      expect(cols.action).toBeDefined();
      expect(cols.reviewerId).toBeDefined();
      expect(cols.reviewerRole).toBeDefined();
      expect(cols.previousState).toBeDefined();
      expect(cols.newState).toBeDefined();
      expect(cols.comment).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('profileVersions should capture immutable profile snapshots with versioning', () => {
      expect(schema.profileVersions).toBeDefined();
      const cols = getTableColumns(schema.profileVersions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.versionNumber).toBeDefined();
      expect(cols.snapshot).toBeDefined();
      expect(cols.triggerEvent).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });
  });

  describe('3. Drizzle Relations & Aliases', () => {
    it('should export relations for all Phase 09 tables', () => {
      expect(schema.documentProcessingJobsRelations).toBeDefined();
      expect(schema.profileExtractionsRelations).toBeDefined();
      expect(schema.profileSkillEvidenceRelations).toBeDefined();
      expect(schema.profileReviewEventsRelations).toBeDefined();
      expect(schema.profileVersionsRelations).toBeDefined();
    });

    it('should export college tenant aliases for Phase 09 interoperability', () => {
      expect(schema.colleges).toBe(schema.tenants);
      expect(schema.collegesRelations).toBe(schema.tenantsRelations);
    });
  });
});
