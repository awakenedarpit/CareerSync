/**
 * CarrerSync AI Student Profiling & Job Queue Integration Test Suite
 * Phase 09 — Verification & Quality Gate
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { clearInMemoryDocuments, inMemoryDocuments, type InMemDocRecord } from '../src/routes/file.routes';
import { jobQueueService } from '../src/services/job-queue.service';
import { profilingService } from '../src/services/profiling.service';
import { LocalStorageEngine } from '../src/storage/local.storage';
import { StorageFactory } from '../src/storage/storage.factory';

// Standard test secrets and identifiers
const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_A_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_B_ID = '22222222-2222-4222-8222-222222222222';

const STUDENT_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RECRUITER_A_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SUPERADMIN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const TEST_STORAGE_DIR = path.resolve(process.cwd(), 'test-uploads-profiling-scratch');

describe('Phase 09 — AI Student Profiling & Evidence Ingestion API', () => {
  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenTpoA: string;
  let tokenRecruiterA: string;
  let tokenSuperAdmin: string;

  let docAId: string;
  let docBId: string;
  let docImageId: string;

  beforeEach(async () => {
    process.env.STORAGE_PROVIDER = 'local';
    process.env.STORAGE_LOCAL_DIRECTORY = TEST_STORAGE_DIR;

    clearInMemoryDocuments();
    jobQueueService.clearInMemoryJobs();
    profilingService.clearInMemoryStore();
    StorageFactory.resetInstance();

    // Generate test JWT tokens
    tokenStudentA = await createJwtToken(
      { sub: STUDENT_A_ID, tenant_id: TENANT_A_ID, role: 'student', email: 'student.a@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenStudentB = await createJwtToken(
      { sub: STUDENT_B_ID, tenant_id: TENANT_B_ID, role: 'student', email: 'student.b@college-b.edu' },
      TEST_JWT_SECRET
    );

    tokenTpoA = await createJwtToken(
      { sub: TPO_A_ID, tenant_id: TENANT_A_ID, role: 'tpo_admin', email: 'tpo@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenRecruiterA = await createJwtToken(
      { sub: RECRUITER_A_ID, tenant_id: TENANT_A_ID, role: 'recruiter', email: 'recruiter@techcorp.com' },
      TEST_JWT_SECRET
    );

    tokenSuperAdmin = await createJwtToken(
      { sub: SUPERADMIN_ID, tenant_id: TENANT_A_ID, role: 'superadmin', email: 'platform.admin@carrersync.io' },
      TEST_JWT_SECRET
    );

    // Setup local storage with test files
    const storage = StorageFactory.getStorage();

    // 1. Text Resume Document for Student A in Tenant A
    const resumeText = `
John Doe
Email: john.doe@example.com
Phone: +91 9876543210
Education: B.Tech Computer Science, CGPA 8.8

Technical Skills:
- Languages: TypeScript, Python, SQL
- Frameworks: React, Node.js, Express.js
- Databases: PostgreSQL, MongoDB
- Cloud & Tools: Docker, AWS, Git

Projects:
- Placement Intelligence Platform: Built fullstack platform using TypeScript, React, and Node.js with PostgreSQL backend. Implemented role-based access control and resume parsing.
- E-Commerce Microservices: Developed distributed order processing service in Python and Docker with RabbitMQ messaging.

Certifications:
- AWS Certified Cloud Practitioner
    `;

    const resumeUpload = await storage.upload(Buffer.from(resumeText, 'utf-8'), {
      tenantId: TENANT_A_ID,
      ownerUserId: STUDENT_A_ID,
      documentType: 'resume',
      originalFilename: 'john_resume.txt',
      mimeType: 'text/plain'
    });

    docAId = '10000000-0000-4000-8000-000000000001';
    const docARecord: InMemDocRecord = {
      id: docAId,
      tenantId: TENANT_A_ID,
      ownerUserId: STUDENT_A_ID,
      originalFilename: 'john_resume.txt',
      storageKey: resumeUpload.storageKey,
      mimeType: 'text/plain',
      fileSize: resumeUpload.size,
      checksum: resumeUpload.checksum,
      documentType: 'resume',
      uploadStatus: 'completed',
      isPrivate: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryDocuments.set(docAId, docARecord);

    // 2. Document for Student B in Tenant B
    const docBUpload = await storage.upload(Buffer.from('Student B resume with Java and Spring Boot', 'utf-8'), {
      tenantId: TENANT_B_ID,
      ownerUserId: STUDENT_B_ID,
      documentType: 'resume',
      originalFilename: 'student_b_resume.txt',
      mimeType: 'text/plain'
    });

    docBId = '20000000-0000-4000-8000-000000000002';
    const docBRecord: InMemDocRecord = {
      id: docBId,
      tenantId: TENANT_B_ID,
      ownerUserId: STUDENT_B_ID,
      originalFilename: 'student_b_resume.txt',
      storageKey: docBUpload.storageKey,
      mimeType: 'text/plain',
      fileSize: docBUpload.size,
      checksum: docBUpload.checksum,
      documentType: 'resume',
      uploadStatus: 'completed',
      isPrivate: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryDocuments.set(docBId, docBRecord);

    // 3. Scanned Image Document (Requires Manual Review)
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const imageUpload = await storage.upload(pngHeader, {
      tenantId: TENANT_A_ID,
      ownerUserId: STUDENT_A_ID,
      documentType: 'academic_certificate',
      originalFilename: 'scanned_cert.png',
      mimeType: 'image/png'
    });

    docImageId = '30000000-0000-4000-8000-000000000003';
    const docImageRecord: InMemDocRecord = {
      id: docImageId,
      tenantId: TENANT_A_ID,
      ownerUserId: STUDENT_A_ID,
      originalFilename: 'scanned_cert.png',
      storageKey: imageUpload.storageKey,
      mimeType: 'image/png',
      fileSize: imageUpload.size,
      checksum: imageUpload.checksum,
      documentType: 'academic_certificate',
      uploadStatus: 'completed',
      isPrivate: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryDocuments.set(docImageId, docImageRecord);
  });

  // ==========================================================================
  // Suite 1: POST /api/v1/profiling/documents/:documentId/analyze
  // ==========================================================================
  describe('POST /api/v1/profiling/documents/:documentId/analyze', () => {
    it('should successfully enqueue an analysis job when requested by student owner', async () => {
      const res = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.job).toBeDefined();
      expect(res.body.job.status).toBe('QUEUED');
      expect(res.body.job.documentId).toBe(docAId);
      expect(res.body.job.userId).toBe(STUDENT_A_ID);
      expect(res.body.job.tenantId).toBe(TENANT_A_ID);
    });

    it('should allow college admin/TPO to enqueue job for a student within the tenant', async () => {
      const res = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .expect(202);

      expect(res.body.success).toBe(true);
      expect(res.body.job.documentId).toBe(docAId);
    });

    it('should be idempotent and avoid creating duplicate running jobs for the same document', async () => {
      const res1 = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(202);

      const res2 = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(202);

      expect(res1.body.job.id).toBe(res2.body.job.id);
    });

    it('should reject student attempting to analyze another student document in same tenant', async () => {
      // Create second student in Tenant A
      const otherStudentToken = await createJwtToken(
        { sub: '99999999-9999-4999-8999-999999999999', tenant_id: TENANT_A_ID, role: 'student', email: 'other@college-a.edu' },
        TEST_JWT_SECRET
      );

      const res = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_OWNERSHIP_MISMATCH');
    });

    it('should strictly reject cross-tenant document analysis requests with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/profiling/documents/${docBId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CROSS_TENANT_ACCESS_FORBIDDEN');
    });

    it('should reject recruiters attempting to initiate document analysis with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should return 404 when document does not exist', async () => {
      const nonExistentDocId = '99999999-0000-4000-8000-000000000999';
      const res = await request(app)
        .post(`/api/v1/profiling/documents/${nonExistentDocId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  // ==========================================================================
  // Suite 2: GET /api/v1/profiling/jobs/:jobId & Processing
  // ==========================================================================
  describe('Job Queue Status & Processing Lifecycle', () => {
    it('should retrieve job status accurately', async () => {
      const enqueueRes = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      const jobId = enqueueRes.body.job.id;

      const jobRes = await request(app)
        .get(`/api/v1/profiling/jobs/${jobId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      expect(jobRes.body.success).toBe(true);
      expect(jobRes.body.job.id).toBe(jobId);
      expect(jobRes.body.job.status).toBeDefined();
    });

    it('should reject cross-tenant job polling with 403', async () => {
      const enqueueRes = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      const jobId = enqueueRes.body.job.id;

      const jobRes = await request(app)
        .get(`/api/v1/profiling/jobs/${jobId}`)
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .expect(403);

      expect(jobRes.body.success).toBe(false);
      expect(jobRes.body.code).toBe('CROSS_TENANT_ACCESS_FORBIDDEN');
    });

    it('should synchronously process job via /jobs/:jobId/process and populate extraction', async () => {
      const enqueueRes = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      const jobId = enqueueRes.body.job.id;

      const processRes = await request(app)
        .post(`/api/v1/profiling/jobs/${jobId}/process`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      expect(processRes.body.success).toBe(true);
      if (processRes.body.job.status !== 'COMPLETED') {
        console.error('Job failed with error:', processRes.body.job.errorMessage);
      }
      expect(processRes.body.job.status).toBe('COMPLETED');
      expect(processRes.body.job.result).toBeDefined();
      expect(processRes.body.job.result.extractionId).toBeDefined();
      expect(processRes.body.job.result.skillsCount).toBeGreaterThan(0);
    });

    it('should correctly flag scanned image documents as requiring manual review without fake text', async () => {
      const enqueueRes = await request(app)
        .post(`/api/v1/profiling/documents/${docImageId}/analyze`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      const jobId = enqueueRes.body.job.id;

      const processRes = await request(app)
        .post(`/api/v1/profiling/jobs/${jobId}/process`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      if (processRes.body.job.status !== 'COMPLETED') {
        console.error('Job failed with error:', processRes.body.job.errorMessage);
      }
      expect(processRes.body.job.status).toBe('COMPLETED');
      expect(processRes.body.job.result.manualReviewRequired).toBe(true);

      const extractionId = processRes.body.job.result.extractionId;
      const extractionRes = await request(app)
        .get(`/api/v1/profiling/extractions/${extractionId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      expect(extractionRes.body.extraction.providerUsed).toBe('manual-review');
      expect(extractionRes.body.extraction.overallConfidence).toBe('0.00');
      expect(extractionRes.body.extraction.extractedSkills).toEqual([]);
      expect(extractionRes.body.extraction.warnings[0].code).toBe('MANUAL_REVIEW_REQUIRED');
    });
  });

  // ==========================================================================
  // Suite 3: Extractions, Approval, Rejection & Evidence Preservation
  // ==========================================================================
  describe('Student Review Workflow & Evidence Verification Boundary', () => {
    let extractionId: string;

    beforeEach(async () => {
      const enqueueRes = await request(app)
        .post(`/api/v1/profiling/documents/${docAId}/analyze?sync=true`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      extractionId = enqueueRes.body.job.result.extractionId;
    });

    it('should retrieve extraction details via GET /extractions/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/profiling/extractions/${extractionId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.extraction.id).toBe(extractionId);
      expect(res.body.extraction.status).toBe('PENDING_REVIEW');
      expect(Array.isArray(res.body.extraction.extractedSkills)).toBe(true);
      expect(res.body.extraction.extractedSkills.length).toBeGreaterThan(0);
    });

    it('should list unapproved extractions via GET /students/:studentId/proposed-profile', async () => {
      const res = await request(app)
        .get(`/api/v1/profiling/students/${STUDENT_A_ID}/proposed-profile`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.extractions.length).toBeGreaterThan(0);
      expect(res.body.extractions[0].id).toBe(extractionId);
    });

    it('should convert approved skills to profileSkillEvidence with EVIDENCE_FOUND or PENDING_REVIEW, never auto-VERIFIED', async () => {
      const approveRes = await request(app)
        .post(`/api/v1/profiling/extractions/${extractionId}/approve`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          approvedSkillNames: ['TypeScript', 'Python', 'PostgreSQL', 'Docker']
        })
        .expect(200);

      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.approvedCount).toBe(4);
      expect(approveRes.body.versionNumber).toBeGreaterThanOrEqual(1);

      // Verify evidence recorded via GET /students/:studentId/evidence
      const evidenceRes = await request(app)
        .get(`/api/v1/profiling/students/${STUDENT_A_ID}/evidence`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(200);

      expect(evidenceRes.body.success).toBe(true);
      expect(evidenceRes.body.evidence.length).toBe(4);

      // Verify strict evidence preservation:
      // None of the skills must be automatically marked 'VERIFIED'
      for (const ev of evidenceRes.body.evidence) {
        expect(['EVIDENCE_FOUND', 'PENDING_REVIEW']).toContain(ev.verificationStatus);
        expect(ev.verificationStatus).not.toBe('VERIFIED');
      }
    });

    it('should allow student rejection of extraction and mark status REJECTED', async () => {
      const rejectRes = await request(app)
        .post(`/api/v1/profiling/extractions/${extractionId}/reject`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          reason: 'I want to re-upload an updated resume version'
        })
        .expect(200);

      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.status).toBe('REJECTED');

      const checkRes = await request(app)
        .get(`/api/v1/profiling/extractions/${extractionId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(checkRes.body.extraction.status).toBe('REJECTED');
    });

    it('should reject student attempting to approve another student extraction with 403', async () => {
      const otherStudentToken = await createJwtToken(
        { sub: '99999999-9999-4999-8999-999999999999', tenant_id: TENANT_A_ID, role: 'student', email: 'other@college-a.edu' },
        TEST_JWT_SECRET
      );

      const res = await request(app)
        .post(`/api/v1/profiling/extractions/${extractionId}/approve`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({ approvedSkillNames: ['TypeScript'] })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_OWNERSHIP_MISMATCH');
    });

    it('should reject recruiter attempting to approve extraction with 403', async () => {
      const res = await request(app)
        .post(`/api/v1/profiling/extractions/${extractionId}/approve`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .send({ approvedSkillNames: ['TypeScript'] })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should allow recruiter in the same tenant to inspect student evidence', async () => {
      // First approve skills as student
      await request(app)
        .post(`/api/v1/profiling/extractions/${extractionId}/approve`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({ approvedSkillNames: ['TypeScript', 'Python'] });

      // Recruiter reads evidence
      const res = await request(app)
        .get(`/api/v1/profiling/students/${STUDENT_A_ID}/evidence`)
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.evidence.length).toBe(2);
    });
  });

  afterAll(() => {
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });
});
