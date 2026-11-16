/**
 * CarrerSync Student Profile Management REST API Test Suite
 * Phase 18 — Comprehensive Student Profile Editing, Social Links & Academic Integrity Safeguards
 *
 * Verifies:
 * 1. Profile fetch with completeness score, suggestions, user metadata, and verified skills count.
 * 2. Personal info update persistence (bio, summary, objective, avatar, location, DOB, gender).
 * 3. Contact info update persistence and login email immutability safeguard.
 * 4. Social & coding links update (valid URLs accepted, invalid URLs rejected, custom links managed).
 * 5. Placement preferences and privacy consent settings update.
 * 6. Academic correction request creation and listing (locked academic fields cannot be directly modified).
 * 7. Anti-tampering safeguards (rejection of role tampering, tenant tampering, self-verification).
 * 8. Rejection of unauthenticated or unauthorized role access (HTTP 401/403).
 * 9. Rejection of cross-tenant profile access.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { studentProfileService } from '../src/services/student-profile.service';

const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RECRUITER_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const SUPERADMIN = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

describe('Student Profile Management & Safeguards Integration Suite', () => {
  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenTpoA: string;
  let tokenRecruiterA: string;
  let tokenSuperAdmin: string;

  beforeEach(async () => {
    studentProfileService.clearInMemoryStore();

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

    // Seed Student A
    studentProfileService.seedUser({
      id: STUDENT_A,
      tenantId: TENANT_A,
      email: 'student.a@college-a.edu',
      fullName: 'Aarav Sharma',
      role: 'student'
    });

    studentProfileService.seedStudent({
      id: 's1111111-1111-4111-8111-111111111111',
      userId: STUDENT_A,
      tenantId: TENANT_A,
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

    // Seed Student B in Tenant B
    studentProfileService.seedUser({
      id: STUDENT_B,
      tenantId: TENANT_B,
      email: 'student.b@college-b.edu',
      fullName: 'Diya Patel',
      role: 'student'
    });

    studentProfileService.seedStudent({
      id: 's2222222-2222-4222-8222-222222222222',
      userId: STUDENT_B,
      tenantId: TENANT_B,
      rollNumber: 'IT2021-042',
      department: 'Information Technology',
      batchYear: 2025,
      degree: 'B.Tech',
      cgpa: '9.10',
      backlogCount: 0,
      dateOfBirth: '2003-08-20',
      gender: 'female',
      currentCity: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // ==========================================================================
  // 1. Authentication & RBAC Authorization Guards
  // ==========================================================================
  describe('1. Authentication & RBAC Authorization Guards', () => {
    it('should reject unauthenticated request with 401 MISSING_BEARER_TOKEN', async () => {
      const res = await request(app).get('/api/v1/student/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should reject invalid or expired bearer token with 401 TOKEN_VERIFICATION_FAILED', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', 'Bearer invalid_garbage_token_value');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should reject unauthorized role (recruiter) with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenRecruiterA}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should reject unauthorized role (tpo_admin) with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenTpoA}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });
  });

  // ==========================================================================
  // 2. Cross-Tenant Isolation & Anti-Spoofing
  // ==========================================================================
  describe('2. Cross-Tenant Isolation & Anti-Spoofing', () => {
    it('should reject client header tenant spoofing with 403 TENANT_SPOOFING_REJECTED', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_B); // Spoofed tenant header
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('should reject request body tenant spoofing with 403 TENANT_SPOOFING_REJECTED', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          bio: 'Malicious update attempt',
          tenantId: TENANT_B // Spoofed tenant in payload
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('should strictly isolate Student B to Tenant B profile data without cross-tenant leakage', async () => {
      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentB}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(STUDENT_B);
      expect(res.body.data.tenantId).toBe(TENANT_B);
      expect(res.body.data.rollNumber).toBe('IT2021-042');
      expect(res.body.data.department).toBe('Information Technology');
    });
  });

  // ==========================================================================
  // 3. Profile Fetch, Completeness Score & Missing Suggestions
  // ==========================================================================
  describe('3. Profile Fetch, Completeness Score & Missing Suggestions', () => {
    it('should fetch student profile with completeness score and suggestions for missing fields', async () => {
      // Seed a verified skill for Student A
      studentProfileService.seedVerifiedSkill('s1111111-1111-4111-8111-111111111111', 'TypeScript');

      const res = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const profile = res.body.data;

      // Identity & User metadata
      expect(profile.userId).toBe(STUDENT_A);
      expect(profile.tenantId).toBe(TENANT_A);
      expect(profile.user.email).toBe('student.a@college-a.edu');
      expect(profile.user.fullName).toBe('Aarav Sharma');
      expect(profile.user.role).toBe('student');

      // Academic credentials
      expect(profile.rollNumber).toBe('CS2021-001');
      expect(profile.department).toBe('Computer Science and Engineering');
      expect(profile.cgpa).toBe('8.75');
      expect(profile.academicInfo.isLocked).toBe(true);

      // Verified skills count
      expect(profile.verifiedSkillsCount).toBe(1);

      // Completeness score & suggestions
      expect(typeof profile.profileCompleteness).toBe('number');
      expect(profile.profileCompleteness).toBeGreaterThan(0);
      expect(profile.profileCompleteness).toBeLessThan(100);
      expect(Array.isArray(profile.suggestions)).toBe(true);

      // Specific missing suggestions
      expect(profile.suggestions).toContain('GitHub profile not added yet');
      expect(profile.suggestions).toContain('Target job roles not selected');
    });
  });

  // ==========================================================================
  // 4. Personal Information Update Persistence
  // ==========================================================================
  describe('4. Personal Information Update Persistence', () => {
    it('should update personal info and persist changes', async () => {
      const updatePayload = {
        fullName: 'Aarav Sharma (Updated)',
        bio: 'Passionate Backend Engineer skilled in Distributed Systems and Node.js.',
        professionalSummary: '3+ years hands-on experience building fault-tolerant APIs.',
        careerObjective: 'Seeking SDE-1 / Backend roles in high-scale tech organizations.',
        avatarUrl: 'https://cdn.carrersync.io/avatars/aarav.png',
        gender: 'male',
        currentCity: 'Bengaluru',
        state: 'Karnataka',
        country: 'India'
      };

      const patchRes = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send(updatePayload);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.success).toBe(true);
      expect(patchRes.body.data.bio).toBe(updatePayload.bio);
      expect(patchRes.body.data.professionalSummary).toBe(updatePayload.professionalSummary);
      expect(patchRes.body.data.careerObjective).toBe(updatePayload.careerObjective);
      expect(patchRes.body.data.avatarUrl).toBe(updatePayload.avatarUrl);
      expect(patchRes.body.data.currentCity).toBe('Bengaluru');
      expect(patchRes.body.data.state).toBe('Karnataka');
      expect(patchRes.body.data.user.fullName).toBe('Aarav Sharma (Updated)');

      // Verify persistence via GET
      const getRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.bio).toBe(updatePayload.bio);
      expect(getRes.body.data.currentCity).toBe('Bengaluru');
      expect(getRes.body.data.personalInfo.avatarUrl).toBe(updatePayload.avatarUrl);
    });
  });

  // ==========================================================================
  // 5. Contact Information Update & Login Email Safeguard
  // ==========================================================================
  describe('5. Contact Information Update & Login Email Safeguard', () => {
    it('should update contact details successfully', async () => {
      const contactPayload = {
        phoneNumber: '+919876543210',
        alternatePhoneNumber: '+919876543211',
        personalEmail: 'aarav.personal@gmail.com',
        preferredContactMethod: 'phone',
        currentCity: 'Bengaluru',
        state: 'Karnataka'
      };

      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send(contactPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phoneNumber).toBe('+919876543210');
      expect(res.body.data.alternatePhoneNumber).toBe('+919876543211');
      expect(res.body.data.personalEmail).toBe('aarav.personal@gmail.com');
      expect(res.body.data.preferredContactMethod).toBe('phone');

      // Verify persistence via GET
      const getRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);
      expect(getRes.body.data.contactInfo.personalEmail).toBe('aarav.personal@gmail.com');
      expect(getRes.body.data.contactInfo.phoneNumber).toBe('+919876543210');
    });

    it('should reject unauthorized attempts to alter login email with 400 LOGIN_EMAIL_IMMUTABLE', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          email: 'hacked.aarav@attacker.com', // Attempting to change login email
          phoneNumber: '+919876543210'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('LOGIN_EMAIL_IMMUTABLE');
    });

    it('should reject invalid email format for personalEmail with 400', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/contact')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          personalEmail: 'not_an_email_address'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 6. Social & Coding Links Update (Valid URLs Accepted, Invalid Rejected)
  // ==========================================================================
  describe('6. Social & Coding Links Update', () => {
    it('should accept and persist valid URLs and custom links', async () => {
      const linksPayload = {
        githubUrl: 'https://github.com/aaravsharma',
        linkedinUrl: 'https://linkedin.com/in/aaravsharma',
        portfolioUrl: 'https://aaravsharma.dev',
        leetcodeUrl: 'https://leetcode.com/aarav_codes',
        hackerrankUrl: 'https://hackerrank.com/aarav_hr',
        codeforcesUrl: 'https://codeforces.com/profile/aarav_cf',
        codechefUrl: 'https://codechef.com/users/aarav_cc',
        kaggleUrl: 'https://kaggle.com/aarav_k',
        geeksforgeeksUrl: 'https://geeksforgeeks.org/user/aarav_gfg',
        personalWebsiteUrl: 'https://aarav.io',
        customLinks: [
          {
            platform: 'Medium',
            url: 'https://medium.com/@aaravsharma',
            label: 'Tech Blog'
          },
          {
            platform: 'Substack',
            url: 'https://aarav.substack.com',
            label: 'System Design Newsletter'
          }
        ]
      };

      const res = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send(linksPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.githubUrl).toBe('https://github.com/aaravsharma');
      expect(res.body.data.leetcodeUrl).toBe('https://leetcode.com/aarav_codes');
      expect(res.body.data.customLinks.length).toBe(2);
      expect(res.body.data.customLinks[0].platform).toBe('Medium');

      // Completeness score should increase and GitHub suggestion removed
      expect(res.body.data.suggestions).not.toContain('GitHub profile not added yet');

      // Verify persistence via GET
      const getRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(getRes.body.data.socialLinks.githubUrl).toBe('https://github.com/aaravsharma');
      expect(getRes.body.data.socialLinks.customLinks.length).toBe(2);
    });

    it('should reject invalid URL format for githubUrl with 400', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          githubUrl: 'not_a_valid_url'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid URL format in custom links with 400', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile/social-links')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          customLinks: [
            {
              platform: 'Medium',
              url: 'ftp://not-http-or-https-protocol'
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 7. Preferences & Privacy Visibility Controls
  // ==========================================================================
  describe('7. Preferences & Privacy Visibility Controls', () => {
    it('should update career preferences and privacy consent settings', async () => {
      const preferencesPayload = {
        targetJobRoles: ['Backend Engineer', 'Distributed Systems Engineer', 'Cloud Architect'],
        preferredIndustries: ['Fintech', 'Enterprise SaaS', 'Artificial Intelligence'],
        careerInterests: 'High-throughput event streaming, consensus algorithms, microservices',
        preferredLocations: ['Bengaluru', 'Hyderabad', 'Remote'],
        preferredEmploymentTypes: ['Full-Time', 'Internship'],
        profileVisibility: {
          tpoTeam: true,
          recruitersOnShare: true,
          professionalLinksVisible: false,
          contactDetailsHidden: true,
          portfolioOnShare: true
        }
      };

      const res = await request(app)
        .patch('/api/v1/student/profile/preferences')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send(preferencesPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetJobRoles).toEqual(preferencesPayload.targetJobRoles);
      expect(res.body.data.preferredLocations).toEqual(preferencesPayload.preferredLocations);
      expect(res.body.data.profileVisibility.recruitersOnShare).toBe(true);
      expect(res.body.data.profileVisibility.professionalLinksVisible).toBe(false);

      // Suggestions should no longer include target roles missing
      expect(res.body.data.suggestions).not.toContain('Target job roles not selected');

      // Verify persistence via GET
      const getRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(getRes.body.data.preferences.targetJobRoles).toEqual(preferencesPayload.targetJobRoles);
      expect(getRes.body.data.preferences.profileVisibility.portfolioOnShare).toBe(true);
    });
  });

  // ==========================================================================
  // 8. Academic Correction Requests (Verified Fields Cannot Be Modified Directly)
  // ==========================================================================
  describe('8. Academic Correction Requests & Academic Field Safeguards', () => {
    it('should reject direct student modification of CGPA with 400 ACADEMIC_FIELDS_LOCKED', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          cgpa: '9.95' // Attempt to self-elevate CGPA
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ACADEMIC_FIELDS_LOCKED');
    });

    it('should reject direct student modification of rollNumber or department with 400 ACADEMIC_FIELDS_LOCKED', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          rollNumber: 'CS2021-999',
          department: 'Data Science'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ACADEMIC_FIELDS_LOCKED');
    });

    it('should successfully submit an academic correction request with status PENDING', async () => {
      const requestPayload = {
        fieldName: 'cgpa',
        currentValue: '8.75',
        requestedValue: '8.92',
        reason: 'Semester 6 grade card revaluation increased CGPA from 8.75 to 8.92'
      };

      const postRes = await request(app)
        .post('/api/v1/student/profile/academic-correction-request')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send(requestPayload);

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.data.fieldName).toBe('cgpa');
      expect(postRes.body.data.requestedValue).toBe('8.92');
      expect(postRes.body.data.status).toBe('PENDING');
      expect(postRes.body.data.studentId).toBeDefined();

      // Retrieve correction requests
      const getReqsRes = await request(app)
        .get('/api/v1/student/profile/academic-correction-requests')
        .set('Authorization', `Bearer ${tokenStudentA}`);

      expect(getReqsRes.status).toBe(200);
      expect(getReqsRes.body.success).toBe(true);
      expect(getReqsRes.body.count).toBe(1);
      expect(getReqsRes.body.data[0].fieldName).toBe('cgpa');
      expect(getReqsRes.body.data[0].status).toBe('PENDING');

      // Verify that the actual CGPA in student record remains unchanged (locked until review)
      const profileRes = await request(app)
        .get('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`);
      expect(profileRes.body.data.cgpa).toBe('8.75');
    });

    it('should reject correction request with missing fieldName or reason with 400', async () => {
      const res = await request(app)
        .post('/api/v1/student/profile/academic-correction-request')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          requestedValue: '9.00',
          reason: 'ab' // Reason too short (min 3 chars)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // 9. Anti-Tampering Safeguards (Role, Tenant & Self-Verification)
  // ==========================================================================
  describe('9. Anti-Tampering Safeguards (Role, Tenant & Self-Verification)', () => {
    it('should reject attempt to tamper with account role (superadmin) with 403 ROLE_TAMPERING_FORBIDDEN', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          role: 'superadmin',
          bio: 'Elevating myself'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ROLE_TAMPERING_FORBIDDEN');
    });

    it('should reject attempt to tamper with account role (tpo_admin) with 403 ROLE_TAMPERING_FORBIDDEN', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          role: 'tpo_admin'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ROLE_TAMPERING_FORBIDDEN');
    });

    it('should reject student self-verification attempt with 403 SELF_VERIFICATION_FORBIDDEN', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          isVerified: true,
          bio: 'Self verified'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('SELF_VERIFICATION_FORBIDDEN');
    });

    it('should reject student skill self-verification via state=Verified with 403 SELF_VERIFICATION_FORBIDDEN', async () => {
      const res = await request(app)
        .patch('/api/v1/student/profile')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          state: 'Verified'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('SELF_VERIFICATION_FORBIDDEN');
    });
  });
});
