/**
 * Student Profile Update Authentication & Security Integration Test Suite
 * CarrerSync Placement Intelligence Platform
 *
 * Covers:
 * 1. Bearer token validation edge cases:
 *    - Missing Authorization header (401 MISSING_BEARER_TOKEN)
 *    - Malformed / non-Bearer scheme (401 MISSING_BEARER_TOKEN)
 *    - Empty Bearer tokens, whitespace, 'null', and 'undefined' (401 EMPTY_BEARER_TOKEN)
 *    - Invalid and expired tokens (401 TOKEN_VERIFICATION_FAILED)
 *    - Case-insensitive scheme: 'bearer <token>', 'BeArEr <token>'
 *    - Duplicate Bearer prefix: 'Bearer Bearer <token>'
 * 2. Contact details update (phoneNumber, personalEmail, alternatePhoneNumber, preferredContactMethod)
 * 3. Professional links update (githubUrl, linkedinUrl, portfolioUrl, leetcodeUrl, customLinks)
 * 4. Multi-field simultaneous updates and state persistence
 * 5. Strict multi-tenant and cross-student isolation:
 *    - Student A cannot modify Student B's profile
 *    - Injected student/user IDs in body are ignored
 *    - Tenant header spoofing is rejected with 403
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { studentProfileService } from '../src/services/student-profile.service';

const TEST_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_ALPHA = '11111111-1111-4111-8111-111111111111';
const TENANT_BETA = '22222222-2222-4222-8222-222222222222';

const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('Student Profile Authentication & Update Test Suite', () => {
  let tokenA: string;
  let tokenB: string;

  beforeEach(async () => {
    studentProfileService.clearInMemoryStore();

    tokenA = await createJwtToken(
      { sub: STUDENT_A, tenant_id: TENANT_ALPHA, role: 'student', email: 'aarav.sharma@college-alpha.edu' },
      TEST_SECRET
    );

    tokenB = await createJwtToken(
      { sub: STUDENT_B, tenant_id: TENANT_BETA, role: 'student', email: 'diya.patel@college-beta.edu' },
      TEST_SECRET
    );

    // Seed Student A
    studentProfileService.seedUser({
      id: STUDENT_A,
      tenantId: TENANT_ALPHA,
      email: 'aarav.sharma@college-alpha.edu',
      fullName: 'Aarav Sharma',
      role: 'student'
    });

    studentProfileService.seedStudent({
      id: 's1111111-1111-4111-8111-111111111111',
      userId: STUDENT_A,
      tenantId: TENANT_ALPHA,
      rollNumber: 'CS2021-001',
      department: 'Computer Science and Engineering',
      batchYear: 2025,
      degree: 'B.Tech',
      cgpa: '8.75',
      backlogCount: 0,
      dateOfBirth: '2003-04-12',
      gender: 'male',
      bio: null,
      professionalSummary: null,
      careerObjective: null,
      avatarUrl: null,
      phoneNumber: null,
      alternatePhoneNumber: null,
      personalEmail: null,
      preferredContactMethod: 'email',
      currentCity: null,
      state: null,
      country: 'India',
      githubUrl: null,
      linkedinUrl: null,
      portfolioUrl: null,
      leetcodeUrl: null,
      hackerrankUrl: null,
      codeforcesUrl: null,
      codechefUrl: null,
      kaggleUrl: null,
      geeksforgeeksUrl: null,
      personalWebsiteUrl: null,
      profileVisibility: null,
      preferredLocations: [],
      targetJobRoles: [],
      preferredIndustries: [],
      preferredEmploymentTypes: [],
      careerInterests: null,
      resumeUrl: null,
      resumeR2Url: null,
      readinessScore: '75.00',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Seed Student B
    studentProfileService.seedUser({
      id: STUDENT_B,
      tenantId: TENANT_BETA,
      email: 'diya.patel@college-beta.edu',
      fullName: 'Diya Patel',
      role: 'student'
    });

    studentProfileService.seedStudent({
      id: 's2222222-2222-4222-8222-222222222222',
      userId: STUDENT_B,
      tenantId: TENANT_BETA,
      rollNumber: 'IT2021-042',
      department: 'Information Technology',
      batchYear: 2025,
      degree: 'B.Tech',
      cgpa: '9.10',
      backlogCount: 0,
      dateOfBirth: '2003-08-20',
      gender: 'female',
      bio: 'Pre-existing bio for Student B',
      professionalSummary: null,
      careerObjective: null,
      avatarUrl: null,
      phoneNumber: '+91 99999 88888',
      alternatePhoneNumber: null,
      personalEmail: 'diya.personal@example.com',
      preferredContactMethod: 'phone',
      currentCity: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      githubUrl: 'https://github.com/diyapatel-orig',
      linkedinUrl: 'https://linkedin.com/in/diyapatel-orig',
      portfolioUrl: 'https://diyapatel.dev',
      leetcodeUrl: null,
      hackerrankUrl: null,
      codeforcesUrl: null,
      codechefUrl: null,
      kaggleUrl: null,
      geeksforgeeksUrl: null,
      personalWebsiteUrl: null,
      profileVisibility: null,
      preferredLocations: [],
      targetJobRoles: [],
      preferredIndustries: [],
      preferredEmploymentTypes: [],
      careerInterests: null,
      resumeUrl: null,
      resumeR2Url: null,
      readinessScore: '88.00',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // ==========================================================================
  // 1. Authorization Header & Bearer Scheme Tests
  // ==========================================================================
  describe('Authorization Header & Bearer Scheme Robustness', () => {
    it('should return 401 with MISSING_BEARER_TOKEN when Authorization header is absent', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .send({ phoneNumber: '+91 98765 43210' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
      expect(res.body.error).toBe('Unauthorized: Missing or malformed authorization header');
    });

    it('should return 401 with MISSING_BEARER_TOKEN for non-Bearer schemes (e.g. Basic)', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', 'Basic dXNlcjpwYXNzd29yZA==')
        .send({ githubUrl: 'https://github.com/aaravsharma' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
      expect(res.body.error).toBe('Unauthorized: Missing or malformed authorization header');
    });

    it('should return 401 with EMPTY_BEARER_TOKEN when token is whitespace or empty', async () => {
      const res1 = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', 'Bearer')
        .send({ phoneNumber: '+91 98765 43210' });

      expect(res1.status).toBe(401);
      expect(res1.body.code).toBe('EMPTY_BEARER_TOKEN');

      const res2 = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', 'Bearer    ')
        .send({ phoneNumber: '+91 98765 43210' });

      expect(res2.status).toBe(401);
      expect(res2.body.code).toBe('EMPTY_BEARER_TOKEN');
    });

    it("should return 401 with EMPTY_BEARER_TOKEN when token is 'null' or 'undefined' string", async () => {
      const resNull = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', 'Bearer null')
        .send({ phoneNumber: '+91 98765 43210' });

      expect(resNull.status).toBe(401);
      expect(resNull.body.code).toBe('EMPTY_BEARER_TOKEN');

      const resUndef = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', 'Bearer undefined')
        .send({ phoneNumber: '+91 98765 43210' });

      expect(resUndef.status).toBe(401);
      expect(resUndef.body.code).toBe('EMPTY_BEARER_TOKEN');
    });

    it('should return 401 with TOKEN_VERIFICATION_FAILED for invalid or corrupted token', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupt.signature')
        .send({ phoneNumber: '+91 98765 43210' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should return 401 with TOKEN_VERIFICATION_FAILED for expired JWT token', async () => {
      const expiredToken = await createJwtToken(
        { sub: STUDENT_A, tenant_id: TENANT_ALPHA, role: 'student', email: 'aarav.sharma@college-alpha.edu' },
        TEST_SECRET,
        -120 // Expired 2 minutes ago
      );

      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ phoneNumber: '+91 98765 43210' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should accept lowercase bearer scheme: bearer <token>', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `bearer ${tokenA}`)
        .send({ phoneNumber: '+91 98765 43210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneNumber).toBe('+91 98765 43210');
    });

    it('should accept duplicate prefix: Bearer Bearer <token>', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer Bearer ${tokenA}`)
        .send({ phoneNumber: '+91 91234 56789' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneNumber).toBe('+91 91234 56789');
    });

    it('should accept multi-prefix case-insensitive header: bearer Bearer bearer <token>', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `bearer Bearer bearer ${tokenA}`)
        .send({ alternatePhoneNumber: '+91 99887 76655' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alternatePhoneNumber).toBe('+91 99887 76655');
    });
  });

  // ==========================================================================
  // 2. Contact Details Updates & Persistence
  // ==========================================================================
  describe('Contact Details Updates & Persistence', () => {
    it('should successfully update contact details and persist across fetches', async () => {
      const updatePayload = {
        phoneNumber: '+91 98765 11223',
        alternatePhoneNumber: '+91 98765 33445',
        personalEmail: 'aarav.personal@gmail.com',
        preferredContactMethod: 'phone'
      };

      const patchRes = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(updatePayload);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.phoneNumber).toBe(updatePayload.phoneNumber);
      expect(patchRes.body.data.alternatePhoneNumber).toBe(updatePayload.alternatePhoneNumber);
      expect(patchRes.body.data.personalEmail).toBe(updatePayload.personalEmail);
      expect(patchRes.body.data.preferredContactMethod).toBe(updatePayload.preferredContactMethod);

      // Verify persistence via GET /api/v1/student/profile
      const getRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.phoneNumber).toBe(updatePayload.phoneNumber);
      expect(getRes.body.data.personalEmail).toBe(updatePayload.personalEmail);
      expect(getRes.body.data.preferredContactMethod).toBe(updatePayload.preferredContactMethod);
    });

    it('should reject direct modification of login email with 400 LOGIN_EMAIL_IMMUTABLE', async () => {
      const tamperPayload = {
        email: 'attacker@evil.com',
        phoneNumber: '+91 98765 11223'
      };

      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(tamperPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('LOGIN_EMAIL_IMMUTABLE');
    });
  });

  // ==========================================================================
  // 3. GitHub, LinkedIn, Portfolio, and Custom Links Updates
  // ==========================================================================
  describe('Professional & Social Links Updates', () => {
    it('should update all social links and custom links successfully', async () => {
      const socialPayload = {
        githubUrl: 'https://github.com/aarav-dev',
        linkedinUrl: 'https://linkedin.com/in/aarav-sharma-dev',
        portfolioUrl: 'https://aaravsharma.me',
        leetcodeUrl: 'https://leetcode.com/u/aarav_code',
        hackerrankUrl: 'https://hackerrank.com/profile/aarav_h',
        codeforcesUrl: 'https://codeforces.com/profile/aarav_cf',
        codechefUrl: 'https://codechef.com/users/aarav_cc',
        kaggleUrl: 'https://kaggle.com/aaravsharma',
        geeksforgeeksUrl: 'https://auth.geeksforgeeks.org/user/aarav_gfg',
        personalWebsiteUrl: 'https://aarav.tech',
        customLinks: [
          {
            platform: 'GitLab',
            url: 'https://gitlab.com/aarav-gitlab',
            label: 'Open Source Repos'
          },
          {
            platform: 'Medium',
            url: 'https://medium.com/@aarav-tech',
            label: 'Tech Blogs'
          }
        ]
      };

      const patchRes = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(socialPayload);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.githubUrl).toBe(socialPayload.githubUrl);
      expect(patchRes.body.data.linkedinUrl).toBe(socialPayload.linkedinUrl);
      expect(patchRes.body.data.portfolioUrl).toBe(socialPayload.portfolioUrl);
      expect(patchRes.body.data.leetcodeUrl).toBe(socialPayload.leetcodeUrl);
      expect(patchRes.body.data.customLinks.length).toBe(2);

      // Verify database/in-memory persistence
      const getRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.githubUrl).toBe(socialPayload.githubUrl);
      expect(getRes.body.data.portfolioUrl).toBe(socialPayload.portfolioUrl);
      expect(getRes.body.data.customLinks).toHaveLength(2);
    });

    it('should reject invalid URL format with 400 VALIDATION_ERROR', async () => {
      const invalidPayload = {
        githubUrl: 'not-a-valid-http-url'
      };

      const res = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================================================
  // 4. Simultaneous Multi-Field Updates & Completeness Calculation
  // ==========================================================================
  describe('Simultaneous Multi-Field Updates & State Persistence', () => {
    it('should apply personal info, contact info, and preferences in sequence and maintain consistency', async () => {
      // 1. Update Personal Info
      const personalUpdate = {
        bio: 'Passionate full-stack systems developer with deep interest in distributed architectures.',
        professionalSummary: 'Building resilient cloud-native tools using Node.js and TypeScript.',
        careerObjective: 'Aspiring Systems Engineer in high-scale enterprise environments.',
        currentCity: 'Bangalore',
        state: 'Karnataka',
        country: 'India'
      };

      const personalRes = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(personalUpdate);

      expect(personalRes.status).toBe(200);
      expect(personalRes.body.data.bio).toBe(personalUpdate.bio);

      // 2. Update Contact Details
      const contactUpdate = {
        phoneNumber: '+91 98450 12345',
        personalEmail: 'aarav.dev@gmail.com',
        preferredContactMethod: 'email'
      };

      const contactRes = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(contactUpdate);

      expect(contactRes.status).toBe(200);

      // 3. Update Social Links
      const linksUpdate = {
        githubUrl: 'https://github.com/aarav-systems',
        linkedinUrl: 'https://linkedin.com/in/aarav-sharma-systems'
      };

      const linksRes = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(linksUpdate);

      expect(linksRes.status).toBe(200);

      // 4. Verify all fields persisted simultaneously without regression
      const finalRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(finalRes.status).toBe(200);
      const profile = finalRes.body.data;
      expect(profile.bio).toBe(personalUpdate.bio);
      expect(profile.currentCity).toBe(personalUpdate.currentCity);
      expect(profile.phoneNumber).toBe(contactUpdate.phoneNumber);
      expect(profile.personalEmail).toBe(contactUpdate.personalEmail);
      expect(profile.githubUrl).toBe(linksUpdate.githubUrl);
      expect(profile.linkedinUrl).toBe(linksUpdate.linkedinUrl);
      expect(profile.profileCompleteness).toBeGreaterThan(60);
    });
  });

  // ==========================================================================
  // 5. Cross-Student & Multi-Tenant Isolation
  // ==========================================================================
  describe('Cross-Student & Multi-Tenant Security Isolation', () => {
    it("should never allow Student A to update Student B's profile via injected body IDs", async () => {
      // Student A sends an update with injected studentId and userId pointing to Student B
      const maliciousPayload = {
        id: 's2222222-2222-4222-8222-222222222222', // Student B's student ID
        userId: STUDENT_B, // Student B's user ID
        phoneNumber: '+91 00000 00000',
        personalEmail: 'hacked.by.studenta@evil.com'
      };

      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(maliciousPayload);

      // Endpoint must update Student A's own record (resolved strictly from JWT sub)
      // or reject body ID injection
      expect(res.status).toBe(200);

      // Confirm Student B's profile is completely unchanged
      const studentBProfile = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(studentBProfile.status).toBe(200);
      expect(studentBProfile.body.data.phoneNumber).toBe('+91 99999 88888');
      expect(studentBProfile.body.data.personalEmail).toBe('diya.personal@example.com');
      expect(studentBProfile.body.data.githubUrl).toBe('https://github.com/diyapatel-orig');
    });

    it('should reject tenant header spoofing attempt with 403 TENANT_SPOOFING_REJECTED', async () => {
      // Student A attempts to access their endpoint while spoofing Student B's tenant ID
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-Tenant-ID', TENANT_BETA) // Spoofed Tenant Header
        .send({ phoneNumber: '+91 98765 99999' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });
  });
});
