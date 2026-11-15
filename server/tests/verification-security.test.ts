/**
 * CarrerSync Phase 10.2 — Security Validation Regression Test Suite
 *
 * Verifies Critical Fixes:
 * 1. CRITICAL FIX A (Verification Authorization):
 *    - Completely eliminates trusting client-supplied headers like `x-verification-permission: true`.
 *    - Student sends `x-verification-permission: true` -> 403 Forbidden.
 *    - Recruiter sends `x-verification-permission: true` -> 403 Forbidden.
 *    - College Admin sends header without server delegation -> 403 Forbidden.
 *    - Super Admin sends header without server delegation -> 403 Forbidden.
 *    - Authorized TPO reviewer succeeds (200).
 *    - Explicitly server-delegated reviewer succeeds (200).
 *    - Reviewer identity, reason, timestamp, and decision preserved in audit history.
 *
 * 2. CRITICAL FIX B (Job Activation Authorization):
 *    - Authorized institutional reviewers (TPO_ADMIN, COLLEGE_ADMIN) can activate jobs (200).
 *    - Cross-tenant job activation fails (403 Forbidden).
 *    - Recruiter activating job fails (403 Forbidden).
 *    - Student activating job fails (403 Forbidden).
 *    - Recruiter attempting to edit active job fails (403 Forbidden).
 *    - Critical requirement updates to active jobs transition status to DRAFT for re-review.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { verificationService } from '../src/verification/verification.service';
import { eligibilityService } from '../src/eligibility/eligibility.service';
import type { ProfileSkillEvidence } from '../src/db/schema';

const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';

// Distinct Tenants
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

// Users
const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECRUITER_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const COLLEGE_ADMIN_A = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const SUPER_ADMIN = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const TPO_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TPO_B = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc-b';
const FACULTY_DELEGATE_A = '99999999-9999-4999-8999-999999999999';

describe('Phase 10.2 Security Validation — Verification & Job Activation Authorization', () => {
  let tokenStudentA: string;
  let tokenRecruiterA: string;
  let tokenCollegeAdminA: string;
  let tokenSuperAdmin: string;
  let tokenTpoA: string;
  let tokenTpoB: string;
  let tokenFacultyDelegateA: string;

  let evidencePendingId: string;
  let jobDraftTenantAId: string;
  let jobDraftTenantBId: string;
  let jobActiveTenantAId: string;

  beforeEach(async () => {
    verificationService.clearInMemoryStore();
    eligibilityService.clearInMemoryStore();

    // Generate JWT Tokens
    tokenStudentA = await createJwtToken(
      { sub: STUDENT_A, tenant_id: TENANT_A, role: 'student', email: 'student.a@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenRecruiterA = await createJwtToken(
      { sub: RECRUITER_A, tenant_id: TENANT_A, role: 'recruiter', email: 'recruiter@techcorp.com' },
      TEST_JWT_SECRET
    );

    tokenCollegeAdminA = await createJwtToken(
      { sub: COLLEGE_ADMIN_A, tenant_id: TENANT_A, role: 'college_admin', email: 'dean@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenSuperAdmin = await createJwtToken(
      { sub: SUPER_ADMIN, tenant_id: TENANT_A, role: 'superadmin', email: 'superadmin@carrersync.com' },
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

    tokenFacultyDelegateA = await createJwtToken(
      { sub: FACULTY_DELEGATE_A, tenant_id: TENANT_A, role: 'college_admin', email: 'delegate@college-a.edu' },
      TEST_JWT_SECRET
    );

    // Seed User Records
    verificationService.seedUser({
      id: STUDENT_A,
      tenantId: TENANT_A,
      email: 'student.a@college-a.edu',
      role: 'student',
      fullName: 'Aarav Sharma'
    });

    verificationService.seedUser({
      id: TPO_A,
      tenantId: TENANT_A,
      email: 'tpo@college-a.edu',
      role: 'tpo_admin',
      fullName: 'Vikram Joshi (TPO)'
    });

    // Seed Evidence in PENDING_REVIEW status
    evidencePendingId = crypto.randomUUID();
    const evidenceRecord: ProfileSkillEvidence = {
      id: evidencePendingId,
      tenantId: TENANT_A,
      userId: STUDENT_A,
      skillName: 'TypeScript',
      category: 'Software Engineering',
      proficiencyClaim: 'Advanced',
      evidenceType: 'PROJECT',
      documentId: null,
      extractionId: null,
      confidence: '0.92',
      verificationStatus: 'PENDING_REVIEW',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    verificationService.seedEvidence(evidenceRecord);

    // Seed Draft Job in Tenant A
    const jobA = await eligibilityService.createJob(
      {
        companyName: 'CloudScale Inc',
        jobTitle: 'Backend Engineer',
        jobDescription: 'Build high-performance microservices',
        eligibleDepartments: ['Computer Science'],
        graduationYear: 2025,
        minimumCgpa: 7.5,
        requiredSkills: ['Node.js', 'PostgreSQL'],
        status: 'DRAFT'
      },
      RECRUITER_A,
      TENANT_A
    );
    jobDraftTenantAId = jobA.id;

    // Seed Draft Job in Tenant B
    const jobB = await eligibilityService.createJob(
      {
        companyName: 'FinTech Solutions',
        jobTitle: 'DevOps Engineer',
        jobDescription: 'Manage Kubernetes and infrastructure',
        eligibleDepartments: ['Information Technology'],
        graduationYear: 2025,
        minimumCgpa: 8.0,
        requiredSkills: ['Kubernetes', 'Terraform'],
        status: 'DRAFT'
      },
      RECRUITER_A,
      TENANT_B
    );
    jobDraftTenantBId = jobB.id;

    // Seed Active Job in Tenant A
    const jobActiveA = await eligibilityService.createJob(
      {
        companyName: 'DataCorp Global',
        jobTitle: 'Data Analyst',
        jobDescription: 'Analyze large-scale business metrics',
        eligibleDepartments: ['Data Science', 'Computer Science'],
        graduationYear: 2025,
        minimumCgpa: 7.0,
        requiredSkills: ['Python', 'SQL'],
        status: 'ACTIVE'
      },
      TPO_A,
      TENANT_A
    );
    jobActiveTenantAId = jobActiveA.id;
  });

  // ==========================================================================
  // 1. CRITICAL FIX A: Verification Authorization Tests
  // ==========================================================================
  describe('1. Verification Authorization & Client-Supplied Header Elimination', () => {
    it('rejects Student sending x-verification-permission: true with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-verification-permission', 'true')
        .send({
          reason: 'Student attempting self-verification with spoofed header'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('rejects Recruiter sending x-verification-permission: true with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .set('x-verification-permission', 'true')
        .send({
          reason: 'Recruiter attempting verification with spoofed header'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('rejects College Admin sending header without server delegation with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenCollegeAdminA}`)
        .set('x-verification-permission', 'true')
        .send({
          reason: 'College Admin sending header without server delegation'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('does not possess verification reviewer authority');
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('rejects Super Admin sending header without server delegation with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenSuperAdmin}`)
        .set('x-verification-permission', 'true')
        .send({
          reason: 'Super Admin sending header without server delegation'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('does not possess verification reviewer authority');
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('allows Authorized TPO reviewer to succeed with 200 OK', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: 'TPO verified capstone project repository and commit logs',
          notes: 'Demonstrated mastery of TypeScript patterns'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('VERIFIED');

      const updated = await verificationService.getEvidence(evidencePendingId, TENANT_A);
      expect(updated.verificationStatus).toBe('VERIFIED');
      expect(updated.reviewedBy).toBe(TPO_A);
    });

    it('allows Explicitly server-delegated reviewer to succeed with 200 OK', async () => {
      // Server-side explicit delegation: TPO/system delegates faculty member
      verificationService.delegateReviewer(TENANT_A, FACULTY_DELEGATE_A);

      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenFacultyDelegateA}`)
        // Note: No spoofed header is sent, authority comes strictly from server-side registry
        .send({
          reason: 'Delegated faculty reviewer approved GitHub evidence and test coverage',
          notes: 'Approved under Department Verification Committee mandate'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('VERIFIED');

      const updated = await verificationService.getEvidence(evidencePendingId, TENANT_A);
      expect(updated.verificationStatus).toBe('VERIFIED');
      expect(updated.reviewedBy).toBe(FACULTY_DELEGATE_A);
    });

    it('preserves reviewer identity, reason, timestamp, and decision in audit history', async () => {
      const decisionReason = 'Verified via code review and pull request inspection';
      const decisionNotes = 'High code quality and test discipline';

      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          reason: decisionReason,
          notes: decisionNotes
        });

      expect(res.status).toBe(200);

      // Verify audit history
      const history = await verificationService.getEvidenceHistory(evidencePendingId, TENANT_A);
      expect(history.length).toBeGreaterThanOrEqual(1);

      const latestReview = history[0];
      expect(latestReview.reviewerId).toBe(TPO_A);
      expect(latestReview.reviewerRole).toBe('tpo_admin');
      expect(latestReview.previousStatus).toBe('PENDING_REVIEW');
      expect(latestReview.newStatus).toBe('VERIFIED');
      expect(latestReview.reason).toBe(decisionReason);
      expect(latestReview.reviewerNotes).toBe(decisionNotes);
      expect(latestReview.createdAt).toBeDefined();
    });

    it('rejects cross-tenant verification decision with 403 Forbidden', async () => {
      // TPO from Tenant B attempts to verify Tenant A evidence
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidencePendingId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoB}`)
        .send({
          reason: 'Cross-tenant illegal verification attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_TENANT_MISMATCH');
    });
  });

  // ==========================================================================
  // 2. CRITICAL FIX B: Job Activation Authorization Tests
  // ==========================================================================
  describe('2. Job Activation Authorization & Tenant Boundary Enforcement', () => {
    it('allows Authorized TPO reviewer to activate draft job posting in own tenant with 200 OK', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobDraftTenantAId}/activate`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.job.status).toBe('ACTIVE');

      const job = await eligibilityService.getJobById(jobDraftTenantAId, TENANT_A);
      expect(job?.status).toBe('ACTIVE');
    });

    it('denies cross-tenant job activation with 403 Forbidden', async () => {
      // TPO of Tenant A attempts to activate job belonging to Tenant B
      const res = await request(app)
        .post(`/api/v1/jobs/${jobDraftTenantBId}/activate`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_TENANT_MISMATCH');
      expect(res.body.error).toContain('Cannot activate job requirements belonging to another institution tenant');

      // Verify the job in Tenant B remains in DRAFT
      const jobB = await eligibilityService.getJobById(jobDraftTenantBId, TENANT_B);
      expect(jobB?.status).toBe('DRAFT');
    });

    it('denies Recruiter activating job with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobDraftTenantAId}/activate`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      expect(res.body.error).toContain('Only TPO or administrative authorities can activate job postings');

      const job = await eligibilityService.getJobById(jobDraftTenantAId, TENANT_A);
      expect(job?.status).toBe('DRAFT');
    });

    it('denies Student activating job with 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/api/v1/jobs/${jobDraftTenantAId}/activate`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');

      const job = await eligibilityService.getJobById(jobDraftTenantAId, TENANT_A);
      expect(job?.status).toBe('DRAFT');
    });

    it('denies Recruiter attempting to edit an ACTIVE job with 403 Forbidden', async () => {
      // Recruiters can only edit drafts; modifying an active job is strictly barred
      const res = await request(app)
        .put(`/api/v1/jobs/${jobActiveTenantAId}`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({
          jobTitle: 'Lead Data Analyst',
          minimumCgpa: 8.5
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_RECRUITER_DRAFT_ONLY');
      expect(res.body.error).toContain('Recruiters can only edit draft job postings');
    });

    it('denies Recruiter attempting to activate draft job via PUT with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/v1/jobs/${jobDraftTenantAId}`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({
          status: 'ACTIVE'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_TPO_APPROVAL_REQUIRED');
    });

    it('transitions ACTIVE job back to DRAFT when critical criteria are modified without explicit activation', async () => {
      // Authorized admin updates critical criteria (required skills) on an active job
      const res = await request(app)
        .put(`/api/v1/jobs/${jobActiveTenantAId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          requiredSkills: ['Python', 'SQL', 'Apache Spark', 'Databricks']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Status should transition back to DRAFT requiring re-review
      expect(res.body.job.status).toBe('DRAFT');

      const updatedJob = await eligibilityService.getJobById(jobActiveTenantAId, TENANT_A);
      expect(updatedJob?.status).toBe('DRAFT');
    });

    it('denies cross-tenant job update via PUT with 403 Forbidden', async () => {
      // Admin from Tenant A attempts to update job belonging to Tenant B
      const res = await request(app)
        .put(`/api/v1/jobs/${jobDraftTenantBId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          jobTitle: 'Malicious Cross-Tenant Tampering'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_TENANT_MISMATCH');
    });
  });
});
