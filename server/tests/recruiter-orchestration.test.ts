/**
 * CarrerSync Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Integration Tests
 * Validates the complete recruiter-to-college workflow, TPO governance, and student offer response.
 *
 * Test Suites:
 * 1. Authentication & Role-Based Access Control (RBAC)
 * 2. Company Profile Management & TPO Corporate Verification
 * 3. Job Requirements Lifecycle (Draft -> Submit -> TPO Approval -> Active)
 * 4. Campus Placement Drive Orchestration & Timeline Conflict Detection
 * 5. Evidence-Based Explainable Candidate Discovery (Administrative vs Skill Separation)
 * 6. Candidate Shortlisting Workflow & TPO Endorsement Gating
 * 7. Assessment Scheduling & Score Recording
 * 8. Multi-Stage Interview Management & Feedback Recording
 * 9. Offer Lifecycle Management (Draft -> TPO Review -> Release -> Student Accept/Decline)
 * 10. Placement Intelligence Dashboard Analytics & Funnel Calculations
 * 11. Unified TPO Approval Queue Multi-Category Verification
 * 12. Multi-Tenant Isolation & Anti-Tampering Boundaries
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';

describe('Phase 11 — Recruiter Drive Orchestration & Placement Intelligence API', () => {
  const TENANT_A_ID = '11111111-1111-4111-8111-111111111111';
  const TENANT_B_ID = '22222222-2222-4222-8222-222222222222';

  const recruiterUserA = {
    id: 'r0000000-0000-0000-0000-000000000001',
    email: 'recruiter.acme@example.com',
    role: 'recruiter',
    tenantId: TENANT_A_ID
  };

  const recruiterTenantB = {
    id: 'r0000000-0000-0000-0000-000000000002',
    email: 'recruiter.beta@college-b.edu',
    role: 'recruiter',
    tenantId: TENANT_B_ID
  };

  const tpoAdminA = {
    id: 't0000000-0000-0000-0000-000000000001',
    email: 'tpo.lead@college-a.edu',
    role: 'tpo_admin',
    tenantId: TENANT_A_ID
  };

  const studentA = {
    id: 's0000000-0000-0000-0000-000000000001',
    email: 'aarav.sharma@campus.example.edu',
    role: 'student',
    tenantId: TENANT_A_ID
  };

  let recruiterTokenA: string;
  let recruiterTokenB: string;
  let tpoTokenA: string;
  let studentTokenA: string;

  beforeAll(async () => {
    recruiterTokenA = await createJwtToken({
      sub: recruiterUserA.id,
      tenant_id: recruiterUserA.tenantId,
      role: recruiterUserA.role,
      email: recruiterUserA.email,
    });

    recruiterTokenB = await createJwtToken({
      sub: recruiterTenantB.id,
      tenant_id: recruiterTenantB.tenantId,
      role: recruiterTenantB.role,
      email: recruiterTenantB.email,
    });

    tpoTokenA = await createJwtToken({
      sub: tpoAdminA.id,
      tenant_id: tpoAdminA.tenantId,
      role: tpoAdminA.role,
      email: tpoAdminA.email,
    });

    studentTokenA = await createJwtToken({
      sub: studentA.id,
      tenant_id: studentA.tenantId,
      role: studentA.role,
      email: studentA.email,
    });
  });

  // ==========================================================================
  // 1. Authentication & RBAC Guard Tests
  // ==========================================================================

  describe('1. Authentication & RBAC Access Controls', () => {
    it('rejects unauthenticated requests to recruiter routes with 401', async () => {
      const res = await request(app).get('/api/v1/recruiter/companies');
      expect(res.status).toBe(401);
    });

    it('rejects student attempting to access recruiter portal with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const res = await request(app)
        .get('/api/v1/recruiter/jobs')
        .set('Authorization', `Bearer ${studentTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('allows recruiter to access recruiter portal endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/recruiter/companies')
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects recruiter attempting to access TPO approvals queue with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/approvals')
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('allows TPO to access TPO approvals queue with 200', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/approvals')
        .set('Authorization', `Bearer ${tpoTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Company Management & TPO Corporate Verification
  // ==========================================================================

  describe('2. Company Management & Verification Workflow', () => {
    let createdCompanyId: string;

    it('allows recruiter to create a company profile in PENDING status', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/companies')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          name: 'Apex Cloud Solutions',
          industryDomain: 'Enterprise Cloud',
          website: 'https://apexcloud.example.com',
          description: 'Next-generation hybrid cloud orchestration platforms.',
          headquarters: 'Hyderabad, India',
          contactEmail: 'talent@apexcloud.example.com'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Apex Cloud Solutions');
      expect(res.body.data.verificationStatus).toBe('PENDING');
      createdCompanyId = res.body.data.id;
    });

    it('allows recruiter to view company profile details', async () => {
      const res = await request(app)
        .get(`/api/v1/recruiter/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Apex Cloud Solutions');
    });

    it('allows TPO to review and verify the company profile', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/approvals/companies/${createdCompanyId}/review`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .send({
          decision: 'VERIFIED',
          reviewNotes: 'Corporate registration and placement MoU verified by institutional placement committee.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.verificationStatus).toBe('VERIFIED');
    });
  });

  // ==========================================================================
  // 3. Job Requirements Lifecycle
  // ==========================================================================

  describe('3. Job Requirements Lifecycle & TPO Gate', () => {
    let createdJobId: string;

    it('creates job requirement draft defaulting to DRAFT status', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/jobs')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          companyName: 'Apex Cloud Solutions',
          jobTitle: 'Cloud Systems Engineer',
          jobRole: 'Backend & Infrastructure',
          employmentType: 'Full-Time',
          workLocation: 'Bengaluru / Hybrid',
          salaryMinLpa: 8.5,
          salaryMaxLpa: 14.0,
          vacancies: 6,
          jobDescription: 'Design, develop, and maintain high-throughput cloud distributed backend microservices.',
          eligibleDepartments: ['Computer Science', 'Information Technology'],
          graduationYear: 2026,
          minimumCgpa: 7.5,
          requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
          preferredSkills: ['Kubernetes', 'Go']
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.tpoApprovalStatus).toBe('PENDING_TPO_APPROVAL');
      createdJobId = res.body.data.id;
    });

    it('allows recruiter to edit DRAFT job requirement', async () => {
      const res = await request(app)
        .patch(`/api/v1/recruiter/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          vacancies: 8
        });

      expect(res.status).toBe(200);
      expect(res.body.data.vacancies).toBe(8);
    });

    it('allows recruiter to submit draft job for TPO review', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/jobs/${createdJobId}/submit`)
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUBMITTED_FOR_REVIEW');
    });

    it('allows TPO to approve and activate the job requirement', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/approvals/jobs/${createdJobId}/approve`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .send({
          reason: 'Meets college eligibility standards and CTC threshold.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.tpoApprovalStatus).toBe('APPROVED');
    });

    it('blocks recruiter from editing ACTIVE job with 403 FORBIDDEN_RECRUITER_DRAFT_ONLY', async () => {
      const res = await request(app)
        .patch(`/api/v1/recruiter/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          vacancies: 12
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_RECRUITER_DRAFT_ONLY');
    });
  });

  // ==========================================================================
  // 4. Campus Placement Drive Orchestration & Scheduling
  // ==========================================================================

  describe('4. Campus Placement Drive Management & Conflict Detection', () => {
    let driveId: string;

    it('allows recruiter to create a placement drive in DRAFT stage status', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/drives')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          title: 'Apex Cloud Campus Hiring 2026',
          companyName: 'Apex Cloud Solutions',
          batchYear: 2026,
          minCgpa: 7.0,
          maxBacklogsAllowed: 0,
          eligibleDepartments: ['Computer Science', 'Information Technology'],
          registrationStart: '2026-11-20T09:00:00Z',
          registrationEnd: '2026-11-25T18:00:00Z',
          driveDate: '2026-11-28T09:00:00Z',
          availablePositions: 10
        });

      expect(res.status).toBe(201);
      expect(res.body.data.stageStatus).toBe('DRAFT');
      driveId = res.body.data.id;
    });

    it('allows scheduling an event slot on the drive timeline', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/drives/${driveId}/schedules`)
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          eventTitle: 'Pre-Placement Talk & Q&A',
          eventType: 'PRE_PLACEMENT_TALK',
          startTime: '2026-11-28T09:30:00Z',
          endTime: '2026-11-28T10:30:00Z',
          venueOrLink: 'Main Auditorium / Zoom Room A'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.conflictFlag).toBe(false);
    });

    it('detects and flags conflict when an overlapping slot is added', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/drives/${driveId}/schedules`)
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          eventTitle: 'Technical Coding Round',
          eventType: 'ASSESSMENT',
          startTime: '2026-11-28T10:00:00Z', // Overlaps with 09:30 - 10:30
          endTime: '2026-11-28T11:30:00Z',
          venueOrLink: 'Computer Lab 3'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.conflictFlag).toBe(true);
    });

    it('allows recruiter to submit drive for TPO approval', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/drives/${driveId}/submit`)
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stageStatus).toBe('PENDING_TPO_APPROVAL');
    });

    it('allows TPO to approve drive schedule', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/approvals/drives/${driveId}/approve`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .send({
          reason: 'Auditorium and lab slots approved.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stageStatus).toBe('APPROVED');
    });
  });

  // ==========================================================================
  // 5. Candidate Discovery & Explainable Matching
  // ==========================================================================

  describe('5. Evidence-Based Candidate Discovery', () => {
    it('returns explainable candidate match cards with administrative vs skill separation', async () => {
      const res = await request(app)
        .get('/api/v1/recruiter/candidates?department=Computer Science')
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const candidate = res.body.data[0];
      expect(candidate).toHaveProperty('administrativeEligibility');
      expect(candidate).toHaveProperty('verifiedSkills');
      expect(candidate).toHaveProperty('evidenceLinkedSkills');
      expect(candidate).toHaveProperty('matchExplanation');
      expect(candidate.matchExplanation).toContain('mandatory criteria');
    });
  });

  // ==========================================================================
  // 6. Candidate Shortlisting Workflow (TPO Governance)
  // ==========================================================================

  describe('6. Candidate Shortlisting Workflow & TPO Endorsement Gating', () => {
    let shortlistId: string;
    const testDriveId = 'd0000000-0000-0000-0000-000000000001';
    const testJobId = 'j0000000-0000-0000-0000-000000000001';
    const testStudentId = 's0000000-0000-0000-0000-000000000001';

    it('allows recruiter to recommend candidate for shortlist', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/shortlists')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          driveId: testDriveId,
          jobId: testJobId,
          studentId: testStudentId,
          recruiterNotes: 'Exceptional open-source distributed systems projects.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('RECOMMENDED');
      shortlistId = res.body.data.id;
    });

    it('allows recruiter to submit shortlist recommendation for TPO endorsement', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/shortlists/${shortlistId}/submit`)
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUBMITTED_FOR_TPO_REVIEW');
    });

    it('allows TPO to review and approve candidate shortlist recommendation', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/approvals/shortlists/${shortlistId}/review`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .send({
          decision: 'APPROVED',
          reason: 'Endorsed for technical interview rounds.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.tpoDecisionReason).toBe('Endorsed for technical interview rounds.');
    });
  });

  // ==========================================================================
  // 7. Assessment & Interview Coordination
  // ==========================================================================

  describe('7. Assessment & Interview Coordination', () => {
    let assessmentId: string;
    let interviewId: string;
    const testDriveId = 'd0000000-0000-0000-0000-000000000001';
    const testStudentId = 's0000000-0000-0000-0000-000000000001';

    it('allows recruiter to schedule a technical coding assessment', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/assessments')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          driveId: testDriveId,
          assessmentType: 'CODING',
          title: 'Cloud Infrastructure Coding Challenge',
          durationMinutes: 90,
          scheduledAt: '2026-11-28T14:00:00Z'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.assessmentType).toBe('CODING');
      assessmentId = res.body.data.id;
    });

    it('records candidate assessment score and feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/assessments/${assessmentId}/scores`)
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          studentId: testStudentId,
          score: 94.5,
          maxScore: 100,
          feedback: 'Optimal time complexity on graph traversal problems.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.score).toBe(94.5);
    });

    it('allows recruiter to schedule an interview round', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/interviews')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          driveId: testDriveId,
          studentId: testStudentId,
          roundStage: 'TECHNICAL_1',
          scheduledAt: '2026-11-29T10:00:00Z',
          interviewerName: 'Vikram Seth, Lead Cloud Architect'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.roundStage).toBe('TECHNICAL_1');
      interviewId = res.body.data.id;
    });

    it('records interview completion feedback and rating', async () => {
      const res = await request(app)
        .patch(`/api/v1/recruiter/interviews/${interviewId}/feedback`)
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          status: 'COMPLETED',
          feedback: 'Strong understanding of distributed consensus and concurrency primitives.',
          rating: 5
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.rating).toBe(5);
    });
  });

  // ==========================================================================
  // 8. Offer Lifecycle Management (Draft -> TPO Review -> Release -> Student)
  // ==========================================================================

  describe('8. Offer Lifecycle Management & Student Acceptance', () => {
    let offerId: string;
    const testDriveId = 'd0000000-0000-0000-0000-000000000001';
    const testJobId = 'j0000000-0000-0000-0000-000000000001';
    const testStudentId = studentA.id;

    it('allows recruiter to draft an offer in DRAFT status', async () => {
      const res = await request(app)
        .post('/api/v1/recruiter/offers')
        .set('Authorization', `Bearer ${recruiterTokenA}`)
        .send({
          driveId: testDriveId,
          jobId: testJobId,
          studentId: testStudentId,
          roleTitle: 'Associate Cloud Engineer',
          ctcLpa: 12.5,
          joiningDate: '2026-07-15T09:00:00Z',
          expiryDate: '2026-12-10T18:00:00Z'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      offerId = res.body.data.id;
    });

    it('allows recruiter to submit draft offer for TPO review', async () => {
      const res = await request(app)
        .post(`/api/v1/recruiter/offers/${offerId}/submit`)
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUBMITTED_FOR_REVIEW');
    });

    it('allows TPO to approve and automatically release the offer to student', async () => {
      const res = await request(app)
        .post(`/api/v1/tpo/approvals/offers/${offerId}/review`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .send({
          decision: 'APPROVED',
          reason: 'Meets dream offer category criteria.'
        });

      expect(res.status).toBe(200);
      expect(['APPROVED', 'RELEASED']).toContain(res.body.data.status);
    });

    it('allows student to view their released offers', async () => {
      const res = await request(app)
        .get('/api/v1/student/offers')
        .set('Authorization', `Bearer ${studentTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      const studentOffer = res.body.data.find((o: any) => o.id === offerId);
      expect(studentOffer).toBeDefined();
      expect(studentOffer.status).toBe('RELEASED');
    });

    it('allows student to record ACCEPTED response to their offer', async () => {
      const res = await request(app)
        .post(`/api/v1/student/offers/${offerId}/respond`)
        .set('Authorization', `Bearer ${studentTokenA}`)
        .send({
          decision: 'ACCEPTED',
          notes: 'Delighted to accept the offer for Associate Cloud Engineer!'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');
    });

    it('preserves immutable audit history across all offer status transitions', async () => {
      const res = await request(app)
        .get(`/api/v1/recruiter/offers/${offerId}/history`)
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      const statuses = res.body.data.map((h: any) => h.newStatus);
      expect(statuses).toContain('DRAFT');
      expect(statuses).toContain('SUBMITTED_FOR_REVIEW');
      expect(statuses).toContain('RELEASED');
      expect(statuses).toContain('ACCEPTED');
    });
  });

  // ==========================================================================
  // 9. Placement Intelligence Analytics & TPO Queue
  // ==========================================================================

  describe('9. Placement Intelligence Analytics & Unified Queue', () => {
    it('returns recruiter analytics with real candidate funnel numbers', async () => {
      const res = await request(app)
        .get('/api/v1/recruiter/analytics/overview')
        .set('Authorization', `Bearer ${recruiterTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('jobsCreated');
      expect(res.body.data).toHaveProperty('activeDrives');
      expect(res.body.data).toHaveProperty('candidateFunnel');
      expect(res.body.data).toHaveProperty('skillDemand');
    });

    it('returns categorized TPO approval items in unified queue', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/approvals')
        .set('Authorization', `Bearer ${tpoTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  // ==========================================================================
  // 10. Multi-Tenant Isolation Tests
  // ==========================================================================

  describe('10. Multi-Tenant Isolation & Anti-Tampering', () => {
    it('rejects cross-tenant recruiter access with 403 on tenant mismatch', async () => {
      // Recruiter B supplies College A header
      const res = await request(app)
        .get('/api/v1/recruiter/jobs')
        .set('Authorization', `Bearer ${recruiterTokenB}`)
        .set('x-tenant-id', TENANT_A_ID);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });
  });
});
