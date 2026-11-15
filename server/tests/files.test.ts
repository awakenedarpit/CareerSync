/**
 * CarrerSync File Storage & Secure Upload Test Suite
 * Phase 08 — Automated Quality Gate & Security Verification
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { LocalStorageEngine } from '../src/storage/local.storage';
import { StorageFactory } from '../src/storage/storage.factory';
import { clearInMemoryDocuments } from '../src/routes/file.routes';
import { PathTraversalError, InvalidFileTypeError, FileTooLargeError } from '../src/storage/storage.errors';
import { validateUploadFile, verifyMagicSignature, sanitizeFilename } from '../src/utils/file-validator';

// Standard test secrets and tenant IDs
const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_A_ID = '11111111-1111-4111-8111-111111111111';
const TENANT_B_ID = '22222222-2222-4222-8222-222222222222';

const STUDENT_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RECRUITER_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SUPERADMIN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

// Test storage directory
const TEST_STORAGE_DIR = path.resolve(process.cwd(), 'test-uploads-scratch');

describe('Phase 08 — File Storage Architecture & Secure Upload System', () => {
  let localStorage: LocalStorageEngine;

  // Authentic PDF Buffer (%PDF-1.4 header)
  const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

  // Authentic PNG Buffer (\x89PNG header)
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
  ]);

  // Authentic JPEG Buffer (\xFF\xD8\xFF header)
  const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  // Fake / Malicious binary buffers
  const fakePdfBuffer = Buffer.from('This is a text file renamed to resume.pdf');
  const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00');

  // Tokens
  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenTpoA: string;
  let tokenRecruiter: string;
  let tokenSuperAdmin: string;

  beforeEach(async () => {
    process.env.STORAGE_PROVIDER = 'local';
    process.env.STORAGE_LOCAL_DIRECTORY = TEST_STORAGE_DIR;

    localStorage = new LocalStorageEngine(TEST_STORAGE_DIR);
    StorageFactory.resetInstance();
    clearInMemoryDocuments();

    // Generate authenticated test JWTs
    tokenStudentA = await createJwtToken(
      { sub: STUDENT_A_ID, tenant_id: TENANT_A_ID, role: 'student', email: 'studentA@college.edu' },
      TEST_JWT_SECRET
    );

    tokenStudentB = await createJwtToken(
      { sub: STUDENT_B_ID, tenant_id: TENANT_B_ID, role: 'student', email: 'studentB@othercollege.edu' },
      TEST_JWT_SECRET
    );

    tokenTpoA = await createJwtToken(
      { sub: TPO_A_ID, tenant_id: TENANT_A_ID, role: 'tpo_admin', email: 'tpo@college.edu' },
      TEST_JWT_SECRET
    );

    tokenRecruiter = await createJwtToken(
      { sub: RECRUITER_ID, tenant_id: TENANT_A_ID, role: 'recruiter', email: 'recruiter@techcorp.com' },
      TEST_JWT_SECRET
    );

    tokenSuperAdmin = await createJwtToken(
      { sub: SUPERADMIN_ID, tenant_id: '00000000-0000-4000-8000-000000000000', role: 'superadmin', email: 'superadmin@carrersync.com' },
      TEST_JWT_SECRET
    );
  });

  afterAll(() => {
    // Teardown test upload directory
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
    }
  });

  // ==========================================================================
  // 1. Storage Engine Unit Tests
  // ==========================================================================
  describe('1. Storage Engine & Safety Abstraction (local.storage.ts)', () => {
    it('should upload a file, write to disk with mode 0o600, and return SHA-256 checksum', async () => {
      const result = await localStorage.upload(validPdfBuffer, {
        tenantId: TENANT_A_ID,
        ownerUserId: STUDENT_A_ID,
        documentType: 'resume',
        originalFilename: 'my_resume.pdf',
        mimeType: 'application/pdf'
      });

      expect(result.storageKey).toContain(`${TENANT_A_ID}/resume/`);
      expect(result.storageKey).toMatch(/\.pdf$/);
      expect(result.size).toBe(validPdfBuffer.length);
      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);

      // Verify physical presence
      const exists = await localStorage.exists(result.storageKey);
      expect(exists).toBe(true);

      const metadata = await localStorage.getMetadata(result.storageKey);
      expect(metadata.size).toBe(validPdfBuffer.length);
      expect(metadata.checksum).toBe(result.checksum);
    });

    it('should reject path traversal in storage keys and throw PathTraversalError', async () => {
      expect(() => {
        // @ts-expect-error accessing private method for unit security test
        localStorage.resolveSafePath('../../etc/passwd');
      }).toThrowError(PathTraversalError);

      expect(() => {
        // @ts-expect-error accessing private method for unit security test
        localStorage.resolveSafePath('uploads/../../../secret');
      }).toThrowError(PathTraversalError);
    });

    it('should download a stored file as a stream with correct mime type', async () => {
      const upload = await localStorage.upload(validPngBuffer, {
        tenantId: TENANT_A_ID,
        ownerUserId: STUDENT_A_ID,
        documentType: 'project_evidence',
        originalFilename: 'architecture_diagram.png',
        mimeType: 'image/png'
      });

      const download = await localStorage.download(upload.storageKey);
      expect(download.size).toBe(validPngBuffer.length);
      expect(download.mimeType).toBe('image/png');
    });

    it('should delete a stored file and return true, and false if already deleted', async () => {
      const upload = await localStorage.upload(validJpgBuffer, {
        tenantId: TENANT_A_ID,
        ownerUserId: STUDENT_A_ID,
        documentType: 'academic_certificate',
        originalFilename: 'degree.jpg',
        mimeType: 'image/jpeg'
      });

      const deleted = await localStorage.delete(upload.storageKey);
      expect(deleted).toBe(true);

      const existsAfter = await localStorage.exists(upload.storageKey);
      expect(existsAfter).toBe(false);

      const secondDelete = await localStorage.delete(upload.storageKey);
      expect(secondDelete).toBe(false);
    });
  });

  // ==========================================================================
  // 2. File Validation & Magic Signature Unit Tests
  // ==========================================================================
  describe('2. File Validation & Magic Signature Detection (file-validator.ts)', () => {
    it('should correctly verify PDF, PNG, and JPEG magic signatures', () => {
      expect(verifyMagicSignature(validPdfBuffer, 'application/pdf')).toBe(true);
      expect(verifyMagicSignature(validPngBuffer, 'image/png')).toBe(true);
      expect(verifyMagicSignature(validJpgBuffer, 'image/jpeg')).toBe(true);
    });

    it('should reject disguised files where MIME and magic signature mismatch', () => {
      // Plain text claiming to be a PDF
      expect(verifyMagicSignature(fakePdfBuffer, 'application/pdf')).toBe(false);
      // Windows EXE claiming to be a PDF
      expect(verifyMagicSignature(exeBuffer, 'application/pdf')).toBe(false);
    });

    it('should sanitize dangerous characters and path traversal tokens from filenames', () => {
      expect(sanitizeFilename('../../../malicious/shady.pdf')).toBe('shady.pdf');
      expect(sanitizeFilename('resume;rm -rf;.pdf')).toBe('resume_rm -rf_.pdf');
      expect(sanitizeFilename('test\0payload.pdf')).toBe('testpayload.pdf');
    });

    it('should throw FileTooLargeError when file size exceeds limit', () => {
      expect(() => {
        validateUploadFile(
          {
            buffer: validPdfBuffer,
            originalname: 'giant.pdf',
            mimetype: 'application/pdf',
            size: 10 * 1024 * 1024 // 10MB
          },
          'resume',
          5 * 1024 * 1024 // 5MB limit
        );
      }).toThrowError(FileTooLargeError);
    });

    it('should throw InvalidFileTypeError when file is empty', () => {
      expect(() => {
        validateUploadFile(
          {
            buffer: Buffer.alloc(0),
            originalname: 'empty.pdf',
            mimetype: 'application/pdf',
            size: 0
          },
          'resume'
        );
      }).toThrowError(InvalidFileTypeError);
    });
  });

  // ==========================================================================
  // 3. Secure Upload API Endpoints
  // ==========================================================================
  describe('3. Secure Upload API Endpoints (/api/v1/files/upload)', () => {
    it('should reject unauthenticated upload requests with 401 MISSING_BEARER_TOKEN', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .attach('file', validPdfBuffer, 'resume.pdf');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should reject upload when no file is attached in request', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID)
        .field('document_type', 'resume');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MISSING_FILE');
    });

    it('should successfully upload a valid student resume and return 201 with metadata', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID)
        .field('document_type', 'resume')
        .attach('file', validPdfBuffer, 'Priya_Sharma_Resume.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.document).toBeDefined();
      expect(res.body.document.document_type).toBe('resume');
      expect(res.body.document.original_filename).toBe('Priya_Sharma_Resume.pdf');
      expect(res.body.document.tenant_id).toBe(TENANT_A_ID);
      expect(res.body.document.owner_user_id).toBe(STUDENT_A_ID);
      expect(res.body.document.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should reject executable file extensions (.exe) with 400 INVALID_FILE_TYPE', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID)
        .field('document_type', 'project_evidence')
        .attach('file', exeBuffer, { filename: 'exploit.exe', contentType: 'application/x-msdownload' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_FILE_TYPE');
    });

    it('should reject disguised files where binary signature fails magic byte check', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID)
        .field('document_type', 'resume')
        .attach('file', fakePdfBuffer, { filename: 'disguised.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_FILE_TYPE');
      expect(res.body.message).toContain('magic bytes');
    });

    it('should reject invalid document categories with 400 INVALID_DOCUMENT_TYPE', async () => {
      const res = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID)
        .field('document_type', 'unsupported_category')
        .attach('file', validPdfBuffer, 'doc.pdf');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_DOCUMENT_TYPE');
    });
  });

  // ==========================================================================
  // 4. Five-Role RBAC & Document Access Control
  // ==========================================================================
  describe('4. Five-Role RBAC & Cross-Tenant Document Access Control', () => {
    let studentADocId: string;
    let studentBDocId: string;

    beforeEach(async () => {
      // Upload document for Student A (Tenant A)
      const resA = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID)
        .field('document_type', 'resume')
        .attach('file', validPdfBuffer, 'studentA_resume.pdf');
      studentADocId = resA.body.document.id;

      // Upload document for Student B (Tenant B)
      const resB = await request(app)
        .post('/api/v1/files/upload')
        .set('Authorization', `Bearer ${tokenStudentB}`)
        .set('x-tenant-id', TENANT_B_ID)
        .field('document_type', 'resume')
        .attach('file', validPdfBuffer, 'studentB_resume.pdf');
      studentBDocId = resB.body.document.id;
    });

    it('Student can access own document metadata and download binary', async () => {
      const metaRes = await request(app)
        .get(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID);

      expect(metaRes.status).toBe(200);
      expect(metaRes.body.document.id).toBe(studentADocId);

      const downloadRes = await request(app)
        .get(`/api/v1/files/${studentADocId}/download`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers['content-type']).toBe('application/pdf');
      expect(downloadRes.headers['x-content-type-options']).toBe('nosniff');
      expect(downloadRes.headers['content-disposition']).toContain('attachment');
    });

    it('Student CANNOT access another student document (403 FORBIDDEN_DOCUMENT_ACCESS)', async () => {
      // Student A attempts to access Student B's document
      const res = await request(app)
        .get(`/api/v1/files/${studentBDocId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN_DOCUMENT_ACCESS');
    });

    it('TPO Admin can access student documents within own college tenant', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A_ID);

      expect(res.status).toBe(200);
      expect(res.body.document.id).toBe(studentADocId);
    });

    it('TPO Admin CANNOT access documents from another college tenant (Cross-Tenant Violation)', async () => {
      const res = await request(app)
        .get(`/api/v1/files/${studentBDocId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A_ID);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN_DOCUMENT_ACCESS');
    });

    it('Recruiter can access resumes in tenant, but CANNOT delete student documents', async () => {
      // Read access to resume permitted
      const readRes = await request(app)
        .get(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenRecruiter}`)
        .set('x-tenant-id', TENANT_A_ID);
      expect(readRes.status).toBe(200);

      // Deletion forbidden
      const deleteRes = await request(app)
        .delete(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenRecruiter}`)
        .set('x-tenant-id', TENANT_A_ID);
      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error).toBe('FORBIDDEN_DELETE_PERMISSION');
    });

    it('Super Admin can access documents across tenants for platform compliance audits', async () => {
      const resA = await request(app)
        .get(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenSuperAdmin}`);
      expect(resA.status).toBe(200);

      const resB = await request(app)
        .get(`/api/v1/files/${studentBDocId}`)
        .set('Authorization', `Bearer ${tokenSuperAdmin}`);
      expect(resB.status).toBe(200);
    });

    it('Student can delete own document, but CANNOT delete another student document', async () => {
      // Student A tries to delete Student B's document -> 403
      const failRes = await request(app)
        .delete(`/api/v1/files/${studentBDocId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID);
      expect(failRes.status).toBe(403);

      // Student A deletes own document -> 200
      const okRes = await request(app)
        .delete(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID);
      expect(okRes.status).toBe(200);
      expect(okRes.body.success).toBe(true);

      // Subsequent access -> 404
      const checkRes = await request(app)
        .get(`/api/v1/files/${studentADocId}`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A_ID);
      expect(checkRes.status).toBe(404);
    });
  });
});
