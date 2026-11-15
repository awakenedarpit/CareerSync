/**
 * CarrerSync Phase 10 REST Routes Integration Test Suite
 *
 * Verifies end-to-end HTTP behavior for:
 * 1. TPO Verification Routes (/api/v1/tpo/verification)
 * 2. Student Evidence Routes (/api/v1/students/me)
 * 3. Placement Readiness Intelligence Routes (/api/v1/readiness & /api/v1/tpo/readiness)
 * 4. Job Requirement Specification & Eligibility Routes (/api/v1/jobs)
 *
 * Enforces strict 5-role RBAC, anti-spoofing tenant boundaries, and audit logging.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { verificationService } from '../src/verification/verification.service';
import { readinessService } from '../src/readiness/readiness.service';
import { eligibilityService } from '../src/eligibility/eligibility.service';
import { profilingService } from '../src/services/profiling.service';

const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RECRUITER_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SUPERADMIN = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

describe('Phase 10 — Express REST Routes Integration', () => {
  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenTpoA: string;
  let tokenRecruiterA: string;
  let tokenSuperAdmin: string;

  let evidenceAId: string;
  let evidenceSelfDeclaredId: string;

  beforeEach(async () => {
    verificationService.clearInMemoryStore();
    (readinessService as any).inMemorySnapshots?.clear();
    (profilingService as any).inMemorySkillEvidence?.clear();
    eligibilityService.clearInMemoryStore();

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

    tokenRecruiterA = await createJwtToken(
      { sub: RECRUITER_A, tenant_id: TENANT_A, role: 'recruiter', email: 'recruiter@techcorp.com' },
      TEST_JWT_SECRET
    );

    tokenSuperAdmin = await createJwtToken(
      { sub: SUPERADMIN, tenant_id: TENANT_A, role: 'superadmin', email: 'admin@carrersync.io' },
      TEST_JWT_SECRET
    );

    // Seed test users & students
    verificationService.seedUser({
      id: STUDENT_A,
      tenantId: TENANT_A,
      email: 'student.a@college-a.edu',
      role: 'student',
      fullName: 'Aarav Sharma'
    });

    verificationService.seedStudent({
      id: 'student-row-a',
      userId: STUDENT_A,
      tenantId: TENANT_A,
      rollNumber: 'CS2025-001',
      department: 'Computer Science',
      batchYear: 2025,
      cgpa: '8.75'
    });


    eligibilityService.seedStudent({
      id: STUDENT_A,
      name: 'Aarav Sharma',
      tenantId: TENANT_A,
      rollNumber: 'CS2025-001',
      department: 'Computer Science',
      batchYear: 2025,
      cgpa: 8.75
    });

    // Seed evidence records
    evidenceAId = 'evidence-item-001';
    verificationService.seedEvidence({
      id: evidenceAId,
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

    evidenceSelfDeclaredId = 'evidence-item-self';
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
      confidence: '0.50',
      verificationStatus: 'SELF_DECLARED',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // ==========================================================================
  // 1. TPO Verification Routes
  // ==========================================================================
  describe('TPO Verification Routes (/api/v1/tpo/verification)', () => {
    it('GET /summary — TPO receives verification counts', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/verification/summary')
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalEvidence).toBeGreaterThanOrEqual(2);
      expect(res.body.pending).toBeGreaterThanOrEqual(1);
    });

    it('GET /summary — Blocks student with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/verification/summary')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('GET /pending — TPO fetches filterable pending evidence queue', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/verification/pending?department=Computer%20Science')
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('GET /:evidenceId — TPO fetches specific evidence detail', async () => {
      const res = await request(app)
        .get(`/api/v1/tpo/verification/${evidenceAId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.evidence.skillName).toBe('TypeScript');
    });

    it('POST /:evidenceId/verify — Blocks Student from verifying evidence (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/verify`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ reason: 'Self approving my own skill' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('POST /:evidenceId/verify — Blocks Recruiter from verifying evidence (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/verify`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({ reason: 'Recruiter verification' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('POST /:evidenceId/verify — Rejects request without mandatory reason (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('REASON_REQUIRED');
    });

    it('POST /:evidenceId/verify — Prevents direct jump from SELF_DECLARED to VERIFIED (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceSelfDeclaredId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: 'Attempting to verify self declared without evidence' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('POST /:evidenceId/verify — Allows TPO to verify evidence with reason', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/verify`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: 'Verified via GitHub capstone repository and transcript' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('VERIFIED');
    });

    it('POST /:evidenceId/reject — Allows TPO to reject evidence with reason', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/reject`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: 'Document does not contain substantial TypeScript evidence' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('REJECTED');
    });

    it('POST /:evidenceId/request-evidence — Allows TPO to request more information', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/request-evidence`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: 'Please upload production project code link or certificate' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('NEEDS_MORE_EVIDENCE');
    });

    it('GET /:evidenceId/history — Retrieves decision history audit trail', async () => {
      // First make a decision
      await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/request-evidence`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: 'Initial review requesting more evidence' });

      const res = await request(app)
        .get(`/api/v1/tpo/verification/${evidenceAId}/history`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.history.length).toBeGreaterThanOrEqual(1);
      expect(res.body.history[0].newStatus).toBe('NEEDS_MORE_EVIDENCE');
    });
  });

  // ==========================================================================
  // 2. Student Evidence Routes (/api/v1/students/me)
  // ==========================================================================
  describe('Student Evidence Routes (/api/v1/students/me)', () => {
    it('GET /verification — Student retrieves own verification records and summary', async () => {
      const res = await request(app)
        .get('/api/v1/students/me/verification')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.studentId).toBe(STUDENT_A);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.total).toBe(2);
    });

    it('POST /evidence/:id/correction-request — Student requests review correction', async () => {
      const res = await request(app)
        .post(`/api/v1/students/me/evidence/${evidenceAId}/correction-request`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ reason: 'Please recheck repository link in section 3' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Correction request submitted');
    });

    it('POST /evidence/:id/resubmit — Student resubmits evidence for review', async () => {
      // Transition to NEEDS_MORE_EVIDENCE first
      await request(app)
        .post(`/api/v1/tpo/verification/${evidenceAId}/request-evidence`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ reason: 'Need repository link' });

      const res = await request(app)
        .post(`/api/v1/students/me/evidence/${evidenceAId}/resubmit`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ notes: 'Added GitHub repository link to README' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('PENDING_REVIEW');
    });
  });

  // ==========================================================================
  // 3. Placement Readiness Routes (/api/v1/readiness & /api/v1/tpo/readiness)
  // ==========================================================================
  describe('Placement Readiness Routes (/api/v1/readiness)', () => {
    it('GET /students/:id — Student can view their own readiness evaluation', async () => {
      const res = await request(app)
        .get(`/api/v1/readiness/students/${STUDENT_A}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.studentId).toBe(STUDENT_A);
      expect(res.body.readinessScore).toBeDefined();
      expect(res.body.category).toBeDefined();
      expect(res.body.dimensions).toBeDefined();
    });

    it('GET /students/:id — Student CANNOT view another student readiness (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/readiness/students/${STUDENT_B}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_STUDENT_ACCESS');
    });

    it('GET /students/:id — TPO can view student readiness profile', async () => {
      const res = await request(app)
        .get(`/api/v1/readiness/students/${STUDENT_A}`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.studentId).toBe(STUDENT_A);
    });

    it('GET /students/:id/history — Retrieves longitudinal readiness history', async () => {
      const res = await request(app)
        .get(`/api/v1/readiness/students/${STUDENT_A}/history`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.history)).toBe(true);
    });

    it('POST /students/:id/skill-gap — Diagnoses skill gaps against job requirements', async () => {
      const res = await request(app)
        .post(`/api/v1/readiness/students/${STUDENT_A}/skill-gap`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          requiredSkills: ['TypeScript', 'Node.js', 'Python'],
          preferredSkills: ['Docker'],
          targetRole: 'Full Stack Engineer'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(res.body.matches).toBeDefined();
    });

    it('GET /cohort — TPO accesses cohort readiness metrics (/api/v1/tpo/readiness/cohort)', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/readiness/cohort')
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.distribution).toBeDefined();
    });

    it('GET /departments — TPO accesses department readiness (/api/v1/tpo/readiness/departments)', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/readiness/departments')
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.departments)).toBe(true);
    });
  });

  // ==========================================================================
  // 4. Job Requirements & Eligibility Routes (/api/v1/jobs)
  // ==========================================================================
  describe('Job Requirements & Eligibility Routes (/api/v1/jobs)', () => {
    let testJobId: string;

    it('POST / — TPO creates declarative job requirement', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          companyName: 'Acme Cloud Solutions',
          jobTitle: 'Backend Platform Engineer',
          jobDescription: 'Design scalable distributed microservices.',
          eligibleDepartments: ['Computer Science', 'Information Technology'],
          graduationYear: 2025,
          minimumCgpa: 8.0,
          requiredSkills: ['TypeScript', 'Node.js'],
          preferredSkills: ['Docker', 'PostgreSQL']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBeDefined();
      testJobId = res.body.id;
    });

    it('POST / — Student cannot create job requirement (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          companyName: 'Student Company',
          jobTitle: 'Hacker',
          jobDescription: 'Desc'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('GET / — Lists active jobs for institution tenant', async () => {
      const res = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.jobs)).toBe(true);
    });

    it('GET /:jobId — Retrieves job details', async () => {
      const createRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          companyName: 'FinTech Dynamics',
          jobTitle: 'Systems Engineer',
          jobDescription: 'High frequency trading architecture.'
        });

      const res = await request(app)
        .get(`/api/v1/jobs/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.job.companyName).toBe('FinTech Dynamics');
    });

    it('POST /:jobId/evaluate — Evaluates student eligibility against job criteria', async () => {
      const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          companyName: 'Stripe Payments',
          jobTitle: 'Software Engineer',
          jobDescription: 'Payments engine.',
          eligibleDepartments: ['Computer Science'],
          graduationYear: 2025,
          minimumCgpa: 8.0,
          requiredSkills: ['TypeScript']
        });

      const res = await request(app)
        .post(`/api/v1/jobs/${jobRes.body.id}/evaluate`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({ studentId: STUDENT_A });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.evaluation).toBeDefined();
      expect(res.body.evaluation.result).toBeDefined();
    });

    it('GET /:jobId/eligibility — Retrieves candidate matrix for TPO portal', async () => {
      const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          companyName: 'Google Cloud',
          jobTitle: 'Cloud Engineer',
          jobDescription: 'Kubernetes infra.',
          eligibleDepartments: ['Computer Science'],
          graduationYear: 2025
        });

      const res = await request(app)
        .get(`/api/v1/jobs/${jobRes.body.id}/eligibility`)
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toBeDefined();
      expect(Array.isArray(res.body.candidates)).toBe(true);
    });

    it('POST /:jobId/eligibility/:studentId/review — TPO overrides evaluation with reason', async () => {
      const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          companyName: 'Databricks',
          jobTitle: 'Spark Engineer',
          jobDescription: 'Lakehouse engine.'
        });

      const res = await request(app)
        .post(`/api/v1/jobs/${jobRes.body.id}/eligibility/${STUDENT_A}/review`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          status: 'ELIGIBLE',
          reason: 'Student demonstrated exceptional open-source contributions to Spark runtime'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.updatedStatus).toBe('ELIGIBLE');
      expect(res.body.evaluation.override.overrideReason).toContain('open-source contributions');
    });

    it('POST /:jobId/eligibility/:studentId/review — Rejects override when reason < 10 characters (400 Bad Request)', async () => {
      const jobRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          companyName: 'Databricks',
          jobTitle: 'Spark Engineer',
          jobDescription: 'Lakehouse engine.'
        });

      const res = await request(app)
        .post(`/api/v1/jobs/${jobRes.body.id}/eligibility/${STUDENT_A}/review`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          status: 'ELIGIBLE',
          reason: 'Too short'
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('REASON_TOO_SHORT');
    });
  });
});
