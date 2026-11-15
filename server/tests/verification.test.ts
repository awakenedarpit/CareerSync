/**
 * CarrerSync Skill Verification & Institutional Governance Test Suite
 * Phase 10 — TPO Verification Portal & Security Enforcement
 *
 * Verifies:
 * 1. TPO verification: verifies authorized TPO can mark evidence as VERIFIED, REJECTED, or NEEDS_MORE_EVIDENCE.
 * 2. Security rule: verifies Student CANNOT grant themselves VERIFIED status (403 Forbidden).
 * 3. Security rule: verifies Recruiter CANNOT verify evidence (403 Forbidden).
 * 4. Invalid state transition rejection: verifies invalid state transitions (e.g., jumping from SELF_DECLARED to VERIFIED directly without evidence) are rejected.
 * 5. History preservation: verifies skillVerificationReviews logs every decision with reviewerId, previousStatus, newStatus, reason.
 * 6. Student resubmission: verifies student can resubmit evidence when status is NEEDS_MORE_EVIDENCE or REJECTED.
 * 7. Tenant isolation: verifies College A TPO cannot verify or view College B evidence (403 Forbidden).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { verificationService } from '../src/verification/verification.service';
import {
  isValidVerificationTransition,
  assertValidVerificationTransition
} from '../src/verification/verification.types';

const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TPO_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc-b';
const RECRUITER_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const COLLEGE_ADMIN_A = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('Skill Verification & Institutional Governance (Phase 10)', () => {
  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenTpoA: string;
  let tokenTpoB: string;
  let tokenRecruiterA: string;
  let tokenCollegeAdminA: string;

  let evidencePendingId: string;
  let evidenceSelfDeclaredId: string;
  let evidenceEvidenceFoundId: string;
  let evidenceTenantBId: string;

  beforeEach(async () => {
    verificationService.clearInMemoryStore();

    tokenStudentA = await createJwtToken(
      { sub: STUDENT_A, tenant_id: TENANT_A, role: 'student', email: 'student.a@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenStudentB = await createJwtToken(
      { sub: STUDENT_B, tenant_id: TENANT_B, role: 'student', email: 'student.b@college-b.edu' },
      TEST_JWT_SECRET
    );

    tokenTpoA = await createJwtToken(
      { sub: TPO_A, tenant_id: TENANT_A, role: 'tpo_admin', email: 'tpo@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenTpoB = await createJwtToken(
      { sub: TPO_B, tenant_id: TENANT_B, role: 'tpo_admin', email: 'tpo@college-b.edu' },
      TEST_JWT_SECRET
    );

    tokenRecruiterA = await createJwtToken(
      { sub: RECRUITER_A, tenant_id: TENANT_A, role: 'recruiter', email: 'recruiter@techcorp.com' },
      TEST_JWT_SECRET
    );

    tokenCollegeAdminA = await createJwtToken(
      { sub: COLLEGE_ADMIN_A, tenant_id: TENANT_A, role: 'college_admin', email: 'admin@college-a.edu' },
      TEST_JWT_SECRET
    );

    // Seed users
    verificationService.seedUser({
      id: STUDENT_A,
      tenantId: TENANT_A,
      email: 'student.a@college-a.edu',
      role: 'student',
      fullName: 'Aarav Sharma'
    });

    verificationService.seedUser({
      id: STUDENT_B,
      tenantId: TENANT_B,
      email: 'student.b@college-b.edu',
      role: 'student',
      fullName: 'Bhavna Patel'
    });

    // Seed students
    verificationService.seedStudent({
      id: 'student-profile-a',
      userId: STUDENT_A,
      tenantId: TENANT_A,
      rollNumber: 'CS2025-001',
      department: 'Computer Science',
      batchYear: 2025,
      cgpa: '8.80'
    });

    verificationService.seedStudent({
      id: 'student-profile-b',
      userId: STUDENT_B,
      tenantId: TENANT_B,
      rollNumber: 'IT2025-042',
      department: 'Information Technology',
      batchYear: 2025,
      cgpa: '9.10'
    });

    // Seed evidence items
    evidencePendingId = 'evidence-pending-001';
    verificationService.seedEvidence({
      id: evidencePendingId,
      tenantId: TENANT_A,
      userId: STUDENT_A,
      skillName: 'TypeScript',
      category: 'Languages',
      proficiencyClaim: 'ADVANCED',
      evidenceType: 'PROJECT',
      documentId: 'doc-001',
      extractionId: 'ext-001',
      confidence: '0.85',
      verificationStatus: 'PENDING_REVIEW',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    evidenceEvidenceFoundId = 'evidence-found-002';
    verificationService.seedEvidence({
      id: evidenceEvidenceFoundId,
      tenantId: TENANT_A,
      userId: STUDENT_A,
      skillName: 'React',
      category: 'Frameworks',
      proficiencyClaim: 'INTERMEDIATE',
      evidenceType: 'PROJECT',
      documentId: 'doc-002',
      extractionId: 'ext-002',
      confidence: '0.78',
      verificationStatus: 'EVIDENCE_FOUND',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    evidenceSelfDeclaredId = 'evidence-self-003';
    verificationService.seedEvidence({
      id: evidenceSelfDeclaredId,
      tenantId: TENANT_A,
      userId: STUDENT_A,
      skillName: 'Rust',
      category: 'Languages',
      proficiencyClaim: 'BEGINNER',
      evidenceType: 'SELF_DECLARED',
      documentId: null,
      extractionId: null,
      confidence: '0.30',
      verificationStatus: 'SELF_DECLARED',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    evidenceTenantBId = 'evidence-tenant-b-004';
    verificationService.seedEvidence({
      id: evidenceTenantBId,
      tenantId: TENANT_B,
      userId: STUDENT_B,
      skillName: 'Python',
      category: 'Languages',
      proficiencyClaim: 'ADVANCED',
      evidenceType: 'RESUME',
      documentId: 'doc-003',
      extractionId: 'ext-003',
      confidence: '0.70',
      verificationStatus: 'PENDING_REVIEW',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // ============================================================================
  // Requirement 1: TPO Verification Workflow
  // ============================================================================
  describe('1. TPO Verification (VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE)', () => {
    it('allows authorized TPO to mark evidence as VERIFIED', async () => {
      // Direct service evaluation
      const serviceResult = await verificationService.verifyEvidence({
        evidenceId: evidencePendingId,
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Inspected GitHub pull request and test coverage',
        reviewerNotes: 'Strong TypeScript architecture'
      });

      expect(serviceResult.success).toBe(true);
      expect(serviceResult.newStatus).toBe('VERIFIED');
      expect(serviceResult.previousStatus).toBe('PENDING_REVIEW');
      expect(serviceResult.reviewedBy).toBe(TPO_A);

      // Verify state was persisted
      const record = await verificationService.getEvidence(evidencePendingId, TENANT_A);
      expect(record.verificationStatus).toBe('VERIFIED');
      expect(record.reviewedBy).toBe(TPO_A);
      expect(record.reviewedAt).toBeDefined();

      // HTTP endpoint evaluation
      const httpRes = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceEvidenceFoundId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: 'Verified component code during live portfolio audit',
          reviewerNotes: 'Solid understanding of state management'
        })
        .expect(200);

      expect(httpRes.body.success).toBe(true);
      expect(httpRes.body.status || httpRes.body.result?.newStatus).toBe('VERIFIED');
      expect(httpRes.body.evidenceId).toBe(evidenceEvidenceFoundId);
    });

    it('rejects COLLEGE_ADMIN attempting to mark evidence as VERIFIED without explicit permission with 403', async () => {
      const httpRes = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenCollegeAdminA}`)
        .send({
          reason: 'College Admin approved capstone project evidence'
        })
        .expect(403);

      expect(httpRes.body.success).toBe(false);
      expect(httpRes.body.error).toContain('does not possess verification reviewer authority');
    });

    it('allows COLLEGE_ADMIN with explicit verification permission to mark evidence as VERIFIED', async () => {
      verificationService.delegateReviewer(TENANT_A, COLLEGE_ADMIN_A);
      const httpRes = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenCollegeAdminA}`)
        .send({
          reason: 'College Admin designated with explicit verification authority'
        })
        .expect(200);

      expect(httpRes.body.success).toBe(true);
      expect(httpRes.body.status || httpRes.body.result?.newStatus).toBe('VERIFIED');
    });

    it('allows authorized TPO to mark evidence as REJECTED with mandatory reason', async () => {
      const httpRes = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/reject`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: 'Repository link is broken and code is plagiarized from template',
          reviewerNotes: 'Flagged for academic review'
        })
        .expect(200);

      expect(httpRes.body.success).toBe(true);
      expect(httpRes.body.status || httpRes.body.result?.newStatus).toBe('REJECTED');

      const record = await verificationService.getEvidence(evidencePendingId, TENANT_A);
      expect(record.verificationStatus).toBe('REJECTED');
    });

    it('allows authorized TPO to request more evidence (NEEDS_MORE_EVIDENCE)', async () => {
      const httpRes = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/request-evidence`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: 'Need link to deployed application or Dockerfile to confirm mastery',
          reviewerNotes: 'Please provide demo link'
        })
        .expect(200);

      expect(httpRes.body.success).toBe(true);
      expect(httpRes.body.status || httpRes.body.result?.newStatus).toBe('NEEDS_MORE_EVIDENCE');

      const record = await verificationService.getEvidence(evidencePendingId, TENANT_A);
      expect(record.verificationStatus).toBe('NEEDS_MORE_EVIDENCE');
    });
  });

  // ============================================================================
  // Requirement 2: Security Rule — Student Cannot Self-Verify
  // ============================================================================
  describe('2. Security Rule: Student CANNOT grant themselves VERIFIED status', () => {
    it('strictly returns 403 Forbidden when student calls verify HTTP endpoint', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          reason: 'Self-proclaiming mastery'
        })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });

    it('throws 403 Forbidden in service layer when student role is passed to verifyEvidence', async () => {
      await expect(
        verificationService.verifyEvidence({
          evidenceId: evidencePendingId,
          reviewerId: STUDENT_A,
          reviewerRole: 'STUDENT',
          tenantId: TENANT_A,
          reason: 'Self-proclaimed verification'
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN_INSUFFICIENT_ROLE'
      });
    });

    it('ensures students cannot call reject or request-evidence endpoints (403 Forbidden)', async () => {
      await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/reject`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ reason: 'Student trying to reject' })
        .expect(403);

      await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/request-evidence`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ reason: 'Student trying to request evidence' })
        .expect(403);
    });
  });

  // ============================================================================
  // Requirement 3: Security Rule — Recruiter Cannot Verify Evidence
  // ============================================================================
  describe('3. Security Rule: Recruiter CANNOT verify evidence', () => {
    it('strictly returns 403 Forbidden when recruiter calls verify HTTP endpoint', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({
          reason: 'Recruiter trying to verify candidate'
        })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });

    it('throws 403 Forbidden in service layer when recruiter role is passed', async () => {
      await expect(
        verificationService.verifyEvidence({
          evidenceId: evidencePendingId,
          reviewerId: RECRUITER_A,
          reviewerRole: 'RECRUITER',
          tenantId: TENANT_A,
          reason: 'Recruiter verification attempt'
        })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN_INSUFFICIENT_ROLE'
      });
    });

    it('blocks recruiters from rejecting or requesting more evidence (403 Forbidden)', async () => {
      await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/reject`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({ reason: 'Recruiter rejecting' })
        .expect(403);

      await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/request-evidence`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({ reason: 'Recruiter asking for more info' })
        .expect(403);
    });
  });

  // ============================================================================
  // Requirement 4: Invalid State Transition Rejection
  // ============================================================================
  describe('4. Invalid State Transition Rejection', () => {
    it('rejects jumping from SELF_DECLARED to VERIFIED directly without evidence (HTTP 400)', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceSelfDeclaredId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: 'Attempting to verify self declared claim without artifacts'
        })
        .expect(400);

      expect(res.body.error).toMatch(/Cannot transition directly from SELF_DECLARED to VERIFIED/i);
    });

    it('service layer validates transition helper functions correctly', () => {
      // Disallowed: SELF_DECLARED -> VERIFIED
      expect(isValidVerificationTransition('SELF_DECLARED', 'VERIFIED')).toBe(false);
      expect(() => {
        assertValidVerificationTransition('SELF_DECLARED', 'VERIFIED');
      }).toThrow(/Cannot transition directly from SELF_DECLARED to VERIFIED/);

      // Disallowed: NEEDS_MORE_EVIDENCE -> VERIFIED directly (must resubmit to PENDING_REVIEW first)
      expect(isValidVerificationTransition('NEEDS_MORE_EVIDENCE', 'VERIFIED')).toBe(false);
      expect(() => {
        assertValidVerificationTransition('NEEDS_MORE_EVIDENCE', 'VERIFIED');
      }).toThrow(/Invalid state transition/);

      // Disallowed: REJECTED -> VERIFIED directly
      expect(isValidVerificationTransition('REJECTED', 'VERIFIED')).toBe(false);

      // Allowed transitions
      expect(isValidVerificationTransition('PENDING_REVIEW', 'VERIFIED')).toBe(true);
      expect(isValidVerificationTransition('PENDING_REVIEW', 'REJECTED')).toBe(true);
      expect(isValidVerificationTransition('PENDING_REVIEW', 'NEEDS_MORE_EVIDENCE')).toBe(true);
      expect(isValidVerificationTransition('EVIDENCE_FOUND', 'VERIFIED')).toBe(true);
      expect(isValidVerificationTransition('NEEDS_MORE_EVIDENCE', 'PENDING_REVIEW')).toBe(true);
      expect(isValidVerificationTransition('REJECTED', 'PENDING_REVIEW')).toBe(true);
    });
  });

  // ============================================================================
  // Requirement 5: History Preservation & Audit Trail
  // ============================================================================
  describe('5. History Preservation (skillVerificationReviews logging)', () => {
    it('logs every review decision with reviewerId, previousStatus, newStatus, reason', async () => {
      // 1. TPO requests more evidence
      await verificationService.requestMoreEvidence({
        evidenceId: evidencePendingId,
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Please attach deployment URL',
        reviewerNotes: 'Needs hosted demo'
      });

      // 2. Student resubmits
      await verificationService.studentResubmitEvidence({
        evidenceId: evidencePendingId,
        studentId: STUDENT_A,
        tenantId: TENANT_A,
        notes: 'Added demo URL: https://myapp.dev'
      });

      // 3. TPO marks VERIFIED
      await verificationService.verifyEvidence({
        evidenceId: evidencePendingId,
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Demo verified on live cluster',
        reviewerNotes: 'Confirmed functionality'
      });

      // Query history via service
      const history = await verificationService.getEvidenceHistory(evidencePendingId, TENANT_A);
      expect(history.length).toBe(3);

      // History is sorted descending (latest first)
      expect(history[0].previousStatus).toBe('PENDING_REVIEW');
      expect(history[0].newStatus).toBe('VERIFIED');
      expect(history[0].reviewerId).toBe(TPO_A);
      expect(history[0].reason).toContain('Demo verified on live cluster');

      expect(history[1].previousStatus).toBe('NEEDS_MORE_EVIDENCE');
      expect(history[1].newStatus).toBe('PENDING_REVIEW');
      expect(history[1].reviewerId).toBe(STUDENT_A);
      expect(history[1].reason).toContain('Added demo URL');

      expect(history[2].previousStatus).toBe('PENDING_REVIEW');
      expect(history[2].newStatus).toBe('NEEDS_MORE_EVIDENCE');
      expect(history[2].reviewerId).toBe(TPO_A);
      expect(history[2].reason).toContain('Please attach deployment URL');

      // Verify HTTP history endpoint
      const res = await request(app)
        .get(`/api/v1/tpo/verification/${evidencePendingId}/history`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.history.length).toBe(3);
    });
  });

  // ============================================================================
  // Requirement 6: Student Resubmission Workflow
  // ============================================================================
  describe('6. Student Resubmission Workflow', () => {
    it('allows student to resubmit evidence when status is NEEDS_MORE_EVIDENCE', async () => {
      // First put into NEEDS_MORE_EVIDENCE
      await verificationService.requestMoreEvidence({
        evidenceId: evidencePendingId,
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Missing supporting project docs'
      });

      // Student resubmits via HTTP endpoint
      const res = await request(app)
        .post(`/api/v1/students/me/evidence/${evidencePendingId}/resubmit`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          notes: 'Attached updated README and demo link',
          additionalDocumentId: 'doc-updated-099'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.status || res.body.result?.newStatus).toBe('PENDING_REVIEW');

      const updated = await verificationService.getEvidence(evidencePendingId, TENANT_A);
      expect(updated.verificationStatus).toBe('PENDING_REVIEW');
    });

    it('allows student to resubmit evidence when status is REJECTED', async () => {
      // First reject
      await verificationService.rejectEvidence({
        evidenceId: evidencePendingId,
        reviewerId: TPO_A,
        reviewerRole: 'TPO_ADMIN',
        tenantId: TENANT_A,
        reason: 'Initial code failed automated lint and test suites'
      });

      // Student appeals and resubmits
      const res = await request(app)
        .post(`/api/v1/students/me/evidence/${evidencePendingId}/resubmit`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          notes: 'Fixed all lint errors and added 95% test coverage suite'
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.status || res.body.result?.newStatus).toBe('PENDING_REVIEW');
    });

    it('blocks student from resubmitting another student evidence (403 Forbidden)', async () => {
      // Student B attempts to resubmit Student A's evidence
      const res = await request(app)
        .post(`/api/v1/students/me/evidence/${evidencePendingId}/resubmit`)
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .send({
          notes: 'Malicious resubmission attempt'
        })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });

    it('rejects resubmission when evidence is already VERIFIED or PENDING_REVIEW', async () => {
      // Evidence is currently PENDING_REVIEW
      const res = await request(app)
        .post(`/api/v1/students/me/evidence/${evidencePendingId}/resubmit`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ notes: 'Invalid attempt' })
        .expect(400);

      expect(res.body.error).toMatch(/only items with status NEEDS_MORE_EVIDENCE or REJECTED can be resubmitted/i);
    });
  });

  // ============================================================================
  // Requirement 7: Tenant Isolation
  // ============================================================================
  describe('7. Tenant Isolation (College Boundaries)', () => {
    it('verifies College A TPO cannot verify College B evidence (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceTenantBId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: 'Cross college verification attempt'
        })
        .expect(403);

      expect(res.body.error).toBeDefined();
    });

    it('verifies College A TPO cannot view College B evidence detail (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/tpo/verification/${evidenceTenantBId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .expect(403);

      expect(res.body.error).toBeDefined();
    });

    it('verifies College A TPO pending queue only returns College A evidence', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/verification/pending')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.items.every((item: any) => item.tenantId === TENANT_A)).toBe(true);
      expect(res.body.items.some((item: any) => item.id === evidenceTenantBId)).toBe(false);
    });

    it('verifies service getEvidence enforces tenant isolation strictly', async () => {
      await expect(
        verificationService.getEvidence(evidenceTenantBId, TENANT_A)
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'FORBIDDEN_TENANT_MISMATCH'
      });
    });
  });
});
