/**
 * Unit Test for Skill Verification Engine
 * Verifies role enforcement, state transitions, tenant isolation, resubmissions, queue, summary, and history.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { verificationService } from '../src/verification/verification.service';
import {
  ALLOWED_VERIFICATION_TRANSITIONS,
  isValidVerificationTransition,
  assertValidVerificationTransition
} from '../src/verification/verification.types';
import type { ProfileSkillEvidence } from '../src/db/schema';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RECRUITER_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

describe('Skill Verification Engine', () => {
  beforeEach(() => {
    verificationService.clearInMemoryStore();
  });

  describe('State Machine Transitions', () => {
    it('enforces allowed transitions correctly', () => {
      expect(isValidVerificationTransition('PENDING_REVIEW', 'VERIFIED')).toBe(true);
      expect(isValidVerificationTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
      expect(isValidVerificationTransition('PENDING_REVIEW', 'NEEDS_MORE_EVIDENCE')).toBe(true);

      expect(isValidVerificationTransition('EVIDENCE_FOUND', 'VERIFIED')).toBe(true);
      expect(isValidVerificationTransition('EVIDENCE_FOUND', 'REJECTED')).toBe(true);
      expect(isValidVerificationTransition('EVIDENCE_FOUND', 'NEEDS_MORE_EVIDENCE')).toBe(true);

      expect(isValidVerificationTransition('SELF_DECLARED', 'NEEDS_MORE_EVIDENCE')).toBe(true);
      expect(isValidVerificationTransition('SELF_DECLARED', 'REJECTED')).toBe(true);
      expect(isValidVerificationTransition('SELF_DECLARED', 'VERIFIED')).toBe(false);

      expect(isValidVerificationTransition('NEEDS_MORE_EVIDENCE', 'PENDING_REVIEW')).toBe(true);
      expect(isValidVerificationTransition('NEEDS_MORE_EVIDENCE', 'REJECTED')).toBe(true);
      expect(isValidVerificationTransition('NEEDS_MORE_EVIDENCE', 'VERIFIED')).toBe(false);

      expect(isValidVerificationTransition('REJECTED', 'PENDING_REVIEW')).toBe(true);
      expect(isValidVerificationTransition('REJECTED', 'VERIFIED')).toBe(false);
    });

    it('assertValidVerificationTransition throws 400 on SELF_DECLARED -> VERIFIED', () => {
      expect(() => {
        assertValidVerificationTransition('SELF_DECLARED', 'VERIFIED');
      }).toThrow(/Cannot transition directly from SELF_DECLARED to VERIFIED/);
    });
  });

  describe('Role-Based Access Control', () => {
    const mockEvidence: ProfileSkillEvidence = {
      id: 'ev-1',
      tenantId: TENANT_A,
      userId: STUDENT_A,
      skillName: 'TypeScript',
      category: 'languages',
      proficiencyClaim: 'advanced',
      evidenceType: 'PROJECT',
      documentId: 'doc-1',
      extractionId: 'ext-1',
      confidence: '0.85',
      verificationStatus: 'PENDING_REVIEW',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      verificationService.seedEvidence(mockEvidence);
    });

    it('allows TPO_ADMIN to verify evidence', async () => {
      const res = await verificationService.verifyEvidence({
        evidenceId: 'ev-1',
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Confirmed project commit in repository',
        reviewerNotes: 'Verified via GitHub project'
      });

      expect(res.success).toBe(true);
      expect(res.newStatus).toBe('VERIFIED');
      expect(res.reviewedBy).toBe(TPO_A);

      const updated = await verificationService.getEvidence('ev-1', TENANT_A);
      expect(updated.verificationStatus).toBe('VERIFIED');
    });

    it('rejects COLLEGE_ADMIN attempting to verify without explicit verification permission with 403 Forbidden', async () => {
      await expect(
        verificationService.verifyEvidence({
          evidenceId: 'ev-1',
          reviewerId: 'admin-1',
          reviewerRole: 'COLLEGE_ADMIN',
          tenantId: TENANT_A,
          reason: 'Department head confirmed skill without explicit delegation'
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('allows COLLEGE_ADMIN with explicit verification permission to verify evidence', async () => {
      const res = await verificationService.verifyEvidence({
        evidenceId: 'ev-1',
        reviewerId: 'admin-1',
        reviewerRole: 'COLLEGE_ADMIN',
        tenantId: TENANT_A,
        reason: 'Department head designated as faculty verification reviewer',
        hasExplicitVerificationPermission: true
      });

      expect(res.success).toBe(true);
      expect(res.newStatus).toBe('VERIFIED');
    });

    it('rejects STUDENT attempting to verify with 403 Forbidden', async () => {
      await expect(
        verificationService.verifyEvidence({
          evidenceId: 'ev-1',
          reviewerId: STUDENT_A,
          reviewerRole: 'STUDENT',
          tenantId: TENANT_A,
          reason: 'I want to verify myself'
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects RECRUITER attempting to verify with 403 Forbidden', async () => {
      await expect(
        verificationService.verifyEvidence({
          evidenceId: 'ev-1',
          reviewerId: RECRUITER_A,
          reviewerRole: 'RECRUITER',
          tenantId: TENANT_A,
          reason: 'Recruiter verification not allowed'
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('Tenant Isolation', () => {
    beforeEach(() => {
      verificationService.seedEvidence({
        id: 'ev-college-b',
        tenantId: TENANT_B,
        userId: STUDENT_B,
        skillName: 'Docker',
        category: 'devops',
        proficiencyClaim: 'intermediate',
        evidenceType: 'PROJECT',
        documentId: 'doc-b',
        extractionId: 'ext-b',
        confidence: '0.90',
        verificationStatus: 'PENDING_REVIEW',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('blocks College A TPO from accessing or verifying College B evidence (403 Forbidden)', async () => {
      await expect(
        verificationService.verifyEvidence({
          evidenceId: 'ev-college-b',
          reviewerId: TPO_A,
          reviewerRole: 'TPO_ADMIN',
          tenantId: TENANT_A, // TPO from Tenant A
          reason: 'Attempt cross-tenant verify'
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('Student Resubmission Workflow', () => {
    beforeEach(() => {
      verificationService.seedEvidence({
        id: 'ev-needs-more',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Kubernetes',
        category: 'cloud',
        proficiencyClaim: 'advanced',
        evidenceType: 'CERTIFICATE',
        documentId: 'doc-old',
        extractionId: 'ext-k8s',
        confidence: '0.70',
        verificationStatus: 'NEEDS_MORE_EVIDENCE',
        reviewedBy: TPO_A,
        reviewedAt: new Date(),
        reviewNotes: 'Please attach CKAD completion certificate',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('allows student owner to resubmit evidence with additional document', async () => {
      const res = await verificationService.studentResubmitEvidence({
        evidenceId: 'ev-needs-more',
        studentId: STUDENT_A,
        tenantId: TENANT_A,
        notes: 'Attached official CKAD PDF certificate',
        additionalDocumentId: 'doc-ckad-new'
      });

      expect(res.success).toBe(true);
      expect(res.newStatus).toBe('PENDING_REVIEW');

      const updated = await verificationService.getEvidence('ev-needs-more', TENANT_A);
      expect(updated.verificationStatus).toBe('PENDING_REVIEW');
      expect(updated.documentId).toBe('doc-ckad-new');
    });

    it('blocks other students from resubmitting someone else evidence (403 Forbidden)', async () => {
      await expect(
        verificationService.studentResubmitEvidence({
          evidenceId: 'ev-needs-more',
          studentId: 'other-student',
          tenantId: TENANT_A,
          notes: 'Attempting to resubmit for another student'
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('Verification Summary and Queue', () => {
    beforeEach(() => {
      verificationService.seedEvidence({
        id: 'ev-1',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'React',
        category: 'frontend',
        proficiencyClaim: 'intermediate',
        evidenceType: 'PROJECT',
        documentId: 'doc-1',
        extractionId: 'ext-1',
        confidence: '0.80',
        verificationStatus: 'PENDING_REVIEW',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      verificationService.seedEvidence({
        id: 'ev-2',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Node.js',
        category: 'backend',
        proficiencyClaim: 'advanced',
        evidenceType: 'PROJECT',
        documentId: 'doc-2',
        extractionId: 'ext-2',
        confidence: '0.90',
        verificationStatus: 'VERIFIED',
        reviewedBy: TPO_A,
        reviewedAt: new Date(),
        reviewNotes: 'Verified',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      verificationService.seedEvidence({
        id: 'ev-3',
        tenantId: TENANT_A,
        userId: 'student-2',
        skillName: 'Go',
        category: 'backend',
        proficiencyClaim: 'beginner',
        evidenceType: 'RESUME',
        documentId: 'doc-3',
        extractionId: 'ext-3',
        confidence: '0.60',
        verificationStatus: 'REJECTED',
        reviewedBy: TPO_A,
        reviewedAt: new Date(),
        reviewNotes: 'No verifiable projects found',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('calculates verification summary correctly', async () => {
      const summary = await verificationService.getVerificationSummary(TENANT_A);
      expect(summary.totalEvidence).toBe(3);
      expect(summary.totalStudents).toBe(2);
      expect(summary.pendingCount).toBe(1);
      expect(summary.verifiedCount).toBe(1);
      expect(summary.rejectedCount).toBe(1);
      expect(summary.needsMoreEvidenceCount).toBe(0);
    });

    it('returns pending queue filtered by category', async () => {
      const queue = await verificationService.getPendingQueue(TENANT_A, { category: 'frontend' });
      expect(queue.items.length).toBe(1);
      expect(queue.items[0].skillName).toBe('React');
    });
  });

  describe('Evidence Review History', () => {
    it('preserves complete audit trail of decisions', async () => {
      verificationService.seedEvidence({
        id: 'ev-history',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Python',
        category: 'languages',
        proficiencyClaim: 'intermediate',
        evidenceType: 'PROJECT',
        documentId: 'doc-py',
        extractionId: 'ext-py',
        confidence: '0.85',
        verificationStatus: 'PENDING_REVIEW',
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 1. Request more evidence
      await verificationService.requestMoreEvidence({
        evidenceId: 'ev-history',
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Please add README and live deployment link'
      });

      // 2. Student resubmits
      await verificationService.studentResubmitEvidence({
        evidenceId: 'ev-history',
        studentId: STUDENT_A,
        tenantId: TENANT_A,
        notes: 'Added deployment link to README'
      });

      // 3. TPO verifies
      await verificationService.verifyEvidence({
        evidenceId: 'ev-history',
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Deployment link verified working'
      });

      const history = await verificationService.getEvidenceHistory('ev-history', TENANT_A);
      expect(history.length).toBe(3);
      expect(history.map(h => h.newStatus)).toEqual(['VERIFIED', 'PENDING_REVIEW', 'NEEDS_MORE_EVIDENCE']);
    });
  });
});
