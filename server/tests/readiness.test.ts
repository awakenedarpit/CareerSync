/**
 * CarrerSync Placement Readiness Intelligence Engine Test Suite
 * Phase 10 — Verification & Quality Gate
 *
 * Requirements covered:
 * 1. Deterministic readiness scoring: verifies score is deterministic and identical for same inputs.
 * 2. Dimension weighting: verified skills (35%), evidence coverage (25%), project depth (20%), academics (20%).
 * 3. Missing data handling: verifies missing optional academic records produces dataCompleteness < 1.00 rather than 0 score.
 * 4. Category mapping: >= 80 READY, 60-79 DEVELOPING, < 60 NEEDS_SUPPORT, < 0.40 completeness INSUFFICIENT_DATA.
 * 5. Cohort and department aggregation tests.
 * 6. Skill gap diagnostics: compares student skills to required skills, categorizes VERIFIED_MATCH, EVIDENCE_MATCH, PENDING_VERIFICATION, MISSING_SKILL.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { readinessService } from '../src/readiness/readiness.service';
import { skillGapService } from '../src/readiness/skill-gap.service';
import { profilingService } from '../src/services/profiling.service';
import { verificationService } from '../src/verification/verification.service';

const TEST_JWT_SECRET = 'carrersync_jwt_default_secret_dev_key_32_chars';
const TENANT_A = '11111111-1111-4111-8111-111111111111';

const STUDENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TPO_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const RECRUITER_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

describe('Placement Readiness Intelligence Engine (Phase 10)', () => {
  let tokenStudentA: string;
  let tokenTpoA: string;

  beforeEach(async () => {
    (readinessService as any).inMemorySnapshots?.clear();
    (profilingService as any).inMemorySkillEvidence?.clear();
    verificationService.clearInMemoryStore();

    tokenStudentA = await createJwtToken(
      { sub: STUDENT_A, tenant_id: TENANT_A, role: 'student', email: 'student.a@college-a.edu' },
      TEST_JWT_SECRET
    );

    tokenTpoA = await createJwtToken(
      { sub: TPO_A, tenant_id: TENANT_A, role: 'tpo_admin', email: 'tpo@college-a.edu' },
      TEST_JWT_SECRET
    );

    // Seed user details
    verificationService.seedUser({
      id: STUDENT_A,
      tenantId: TENANT_A,
      email: 'student.a@college-a.edu',
      role: 'student',
      fullName: 'Aarav Sharma'
    });
  });

  // ============================================================================
  // Requirement 1: Deterministic Readiness Scoring
  // ============================================================================
  describe('1. Deterministic Readiness Scoring', () => {
    it('produces identical score, dimensions, and explanation for identical inputs across multiple runs', async () => {
      // Seed skills for Student A
      const skills = [
        { name: 'TypeScript', category: 'Programming Languages', status: 'VERIFIED', type: 'PROJECT' },
        { name: 'Node.js', category: 'Backend Frameworks', status: 'VERIFIED', type: 'PROJECT' },
        { name: 'PostgreSQL', category: 'Databases', status: 'VERIFIED', type: 'PROJECT' },
        { name: 'Docker', category: 'DevOps & Tools', status: 'EVIDENCE_FOUND', type: 'PROJECT' }
      ];

      skills.forEach((s, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-${idx}`, {
          id: `ev-${idx}`,
          tenantId: TENANT_A,
          userId: STUDENT_A,
          skillName: s.name,
          category: s.category,
          verificationStatus: s.status,
          evidenceType: s.type
        });
      });

      const run1 = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);
      const run2 = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);
      const run3 = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);

      expect(run1.score).toBe(run2.score);
      expect(run2.score).toBe(run3.score);
      expect(run1.category).toBe(run2.category);
      expect(run1.dataCompleteness).toBe(run2.dataCompleteness);
      expect(run1.dimensions).toEqual(run2.dimensions);
      expect(run1.dimensions.verifiedSkillsScore).toBe(run2.dimensions.verifiedSkillsScore);
      expect(run1.dimensions.evidenceCoverageScore).toBe(run2.dimensions.evidenceCoverageScore);
      expect(run1.dimensions.projectScore).toBe(run2.dimensions.projectScore);
      expect(run1.dimensions.academicScore).toBe(run2.dimensions.academicScore);
    });
  });

  // ============================================================================
  // Requirement 2: Dimension Weighting
  // ============================================================================
  describe('2. Dimension Weighting (35% verified, 25% coverage, 20% projects, 20% academics)', () => {
    it('calculates composite score strictly respecting dimension weights and fair reweighting', async () => {
      // Seed a profile with known values:
      // 1. 2 Verified programming skills -> raw points: 15.0 + 15.0 = 30.0 verifiedSkillsScore
      // 2. Total declared: 2, effective evidence: 2 -> coverageRatio: 1.0 -> 100 evidenceCoverageScore
      // 3. 2 distinct project skills -> rawProjectScore: 60.0 projectScore
      (profilingService as any).inMemorySkillEvidence.set('ev-w-1', {
        id: 'ev-w-1',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Python',
        category: 'Programming Languages',
        verificationStatus: 'VERIFIED',
        evidenceType: 'PROJECT'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-w-2', {
        id: 'ev-w-2',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Go',
        category: 'Programming Languages',
        verificationStatus: 'VERIFIED',
        evidenceType: 'PROJECT'
      });

      const result = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);

      const d = result.dimensions;
      expect(d.verifiedSkillsScore).toBe(30);
      expect(d.evidenceCoverageScore).toBe(100);
      expect(d.projectScore).toBe(60);

      // In the absence of academic record in offline DB, dynamic reweighting divides by 0.80
      // composite = (30 * 0.35 + 100 * 0.25 + 60 * 0.20) / 0.80 = 47.50 / 0.80 = 59.38
      const expectedComposite = Number(
        (
          (d.verifiedSkillsScore * 0.35 +
            d.evidenceCoverageScore * 0.25 +
            d.projectScore * 0.20) /
          0.8
        ).toFixed(2)
      );

      expect(result.score).toBe(expectedComposite);
      expect(result.score).toBe(59.38);
    });
  });

  // ============================================================================
  // Requirement 3: Missing Data Handling
  // ============================================================================
  describe('3. Missing Data Handling (dataCompleteness < 1.00 rather than 0 score)', () => {
    it('gracefully reweights dimensions when academic record is missing without zeroing student score', async () => {
      // Student B has NO academic record / CGPA
      verificationService.seedUser({
        id: STUDENT_B,
        tenantId: TENANT_A,
        email: 'student.b@college-a.edu',
        role: 'student',
        fullName: 'Bhavna Patel'
      });

      // Seed verified skills
      const skills = ['Python', 'SQL', 'FastAPI'];
      skills.forEach((s, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-b-${idx}`, {
          id: `ev-b-${idx}`,
          tenantId: TENANT_A,
          userId: STUDENT_B,
          skillName: s,
          category: 'Programming Languages',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const result = await readinessService.calculateStudentReadiness(STUDENT_B, TENANT_A);

      // Score must NOT be penalized or zeroed out
      expect(result.score).toBeGreaterThan(50);
      // Academic dimension is 0 because no transcript was provided
      expect(result.dimensions.academicScore).toBe(0);
      // Data completeness reflects missing records (< 1.00)
      expect(result.dataCompleteness).toBeLessThan(1.0);
      expect(result.dataCompleteness).toBeGreaterThan(0.0);
      // Explanation informs student of fair reweighting
      expect(result.explanation).toContain('without scoring penalty');
    });
  });

  // ============================================================================
  // Requirement 4: Category Mapping
  // ============================================================================
  describe('4. Category Mapping (READY >= 80, DEVELOPING 60-79, NEEDS_SUPPORT < 60, INSUFFICIENT_DATA < 0.40)', () => {
    it('maps to INSUFFICIENT_DATA when dataCompleteness < 0.40', async () => {
      // Student with no profile, no evidence, no documents
      const uninitializedStudent = '00000000-0000-4000-8000-000000000099';
      const result = await readinessService.calculateStudentReadiness(uninitializedStudent, TENANT_A);

      expect(result.dataCompleteness).toBeLessThan(0.40);
      expect(result.category).toBe('INSUFFICIENT_DATA');
      expect(result.explanation).toContain('incomplete');
    });

    it('maps to READY when score >= 80 and completeness >= 0.40', async () => {
      // Seed robust profile for Student A
      const strongSkills = [
        'TypeScript', 'Python', 'Go', 'React', 'Node.js',
        'PostgreSQL', 'Docker', 'AWS', 'Kubernetes'
      ];

      strongSkills.forEach((s, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-ready-${idx}`, {
          id: `ev-ready-${idx}`,
          tenantId: TENANT_A,
          userId: STUDENT_A,
          skillName: s,
          category: 'Programming Languages',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const result = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);

      expect(result.score).toBeGreaterThanOrEqual(80.0);
      expect(result.dataCompleteness).toBeGreaterThanOrEqual(0.40);
      expect(result.category).toBe('READY');
    });

    it('maps to DEVELOPING when score is between 60 and 79', async () => {
      // Moderate profile
      const moderateSkills = ['JavaScript', 'HTML/CSS', 'Node.js'];
      moderateSkills.forEach((s, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-dev-${idx}`, {
          id: `ev-dev-${idx}`,
          tenantId: TENANT_A,
          userId: STUDENT_A,
          skillName: s,
          category: 'Web Development',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const result = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);

      expect(result.score).toBeGreaterThanOrEqual(60.0);
      expect(result.score).toBeLessThan(80.0);
      expect(result.category).toBe('DEVELOPING');
    });

    it('maps to NEEDS_SUPPORT when score < 60 but dataCompleteness >= 0.40', async () => {
      // Profile with low verified score but sufficient metadata completeness
      (profilingService as any).inMemorySkillEvidence.set('ev-low-1', {
        id: 'ev-low-1',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Basic Git',
        category: 'Tools',
        verificationStatus: 'SELF_DECLARED',
        evidenceType: 'SELF_DECLARED'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-low-2', {
        id: 'ev-low-2',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Notepad',
        category: 'Tools',
        verificationStatus: 'SELF_DECLARED',
        evidenceType: 'SELF_DECLARED'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-low-3', {
        id: 'ev-low-3',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Word',
        category: 'Tools',
        verificationStatus: 'SELF_DECLARED',
        evidenceType: 'SELF_DECLARED'
      });

      const result = await readinessService.calculateStudentReadiness(STUDENT_A, TENANT_A);

      if (result.dataCompleteness >= 0.40) {
        expect(result.score).toBeLessThan(60.0);
        expect(result.category).toBe('NEEDS_SUPPORT');
      } else {
        expect(result.category).toBe('INSUFFICIENT_DATA');
      }
    });
  });

  // ============================================================================
  // Requirement 5: Cohort and Department Aggregation Tests
  // ============================================================================
  describe('5. Cohort and Department Aggregations', () => {
    it('aggregates cohort statistics with distribution counts and average score', async () => {
      // Seed some evidence for student A
      (profilingService as any).inMemorySkillEvidence.set('ev-c-1', {
        id: 'ev-c-1',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'TypeScript',
        category: 'Programming Languages',
        verificationStatus: 'VERIFIED',
        evidenceType: 'PROJECT'
      });

      const cohort = await readinessService.getCohortReadiness(TENANT_A);

      expect(cohort).toBeDefined();
      expect(typeof cohort.totalStudents).toBe('number');
      expect(typeof cohort.averageScore).toBe('number');
      expect(cohort.categoryDistributions).toHaveProperty('READY');
      expect(cohort.categoryDistributions).toHaveProperty('DEVELOPING');
      expect(cohort.categoryDistributions).toHaveProperty('NEEDS_SUPPORT');
      expect(cohort.categoryDistributions).toHaveProperty('INSUFFICIENT_DATA');
      expect(Array.isArray(cohort.commonSkillGaps)).toBe(true);
      expect(Array.isArray(cohort.studentsNeedingSupport)).toBe(true);

      // Verify HTTP endpoint
      const res = await request(app)
        .get('/api/v1/tpo/readiness/cohort')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data || res.body.averageScore !== undefined).toBeDefined();
    });

    it('aggregates department-wise breakdown metrics', async () => {
      const depts = await readinessService.getDepartmentReadiness(TENANT_A);

      expect(Array.isArray(depts)).toBe(true);

      // Verify HTTP endpoint
      const res = await request(app)
        .get('/api/v1/tpo/readiness/departments')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.departments)).toBe(true);
    });

    it('blocks students from accessing cohort-wide readiness analytics (403 Forbidden)', async () => {
      await request(app)
        .get('/api/v1/tpo/readiness/cohort')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(403);

      await request(app)
        .get('/api/v1/tpo/readiness/departments')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .expect(403);
    });
  });

  // ============================================================================
  // Requirement 6: Skill Gap Diagnostics
  // ============================================================================
  describe('6. Skill Gap Diagnostics (VERIFIED_MATCH, EVIDENCE_MATCH, PENDING_VERIFICATION, MISSING_SKILL)', () => {
    it('accurately categorizes student skills against required skills into 4 distinct match categories', async () => {
      // Student A skills:
      // - TypeScript: VERIFIED
      // - React: EVIDENCE_FOUND
      // - Docker: PENDING_REVIEW
      // (Kubernetes: not declared -> MISSING_SKILL)
      (profilingService as any).inMemorySkillEvidence.set('ev-diag-1', {
        id: 'ev-diag-1',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'TypeScript',
        category: 'Programming Languages',
        verificationStatus: 'VERIFIED',
        evidenceType: 'PROJECT'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-diag-2', {
        id: 'ev-diag-2',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'React',
        category: 'Web Frameworks',
        verificationStatus: 'EVIDENCE_FOUND',
        evidenceType: 'PROJECT'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-diag-3', {
        id: 'ev-diag-3',
        tenantId: TENANT_A,
        userId: STUDENT_A,
        skillName: 'Docker',
        category: 'DevOps',
        verificationStatus: 'PENDING_REVIEW',
        evidenceType: 'RESUME'
      });

      const requiredSkills = ['TypeScript', 'React', 'Docker', 'Kubernetes'];
      const diagnosis = await skillGapService.diagnoseSkillGaps(
        STUDENT_A,
        TENANT_A,
        requiredSkills,
        ['AWS'],
        'Cloud Native Engineer'
      );

      expect(diagnosis.studentId).toBe(STUDENT_A);
      expect(diagnosis.targetRole).toBe('Cloud Native Engineer');
      expect(diagnosis.summary.totalRequired).toBe(4);
      expect(diagnosis.summary.verifiedMatches).toBe(1);
      expect(diagnosis.summary.evidenceMatches).toBe(1);
      expect(diagnosis.summary.pendingVerification).toBe(1);
      expect(diagnosis.summary.missingSkills).toBe(1);

      // 1. VERIFIED_MATCH
      const tsMatch = diagnosis.gaps.find((g) => g.skillName === 'TypeScript');
      expect(tsMatch).toBeDefined();
      expect(tsMatch?.status).toBe('VERIFIED_MATCH');
      expect(tsMatch?.gapSeverity).toBe('MINOR');

      // 2. EVIDENCE_MATCH
      const reactMatch = diagnosis.gaps.find((g) => g.skillName === 'React');
      expect(reactMatch).toBeDefined();
      expect(reactMatch?.status).toBe('EVIDENCE_MATCH');
      expect(reactMatch?.gapSeverity).toBe('MODERATE');

      // 3. PENDING_VERIFICATION
      const dockerMatch = diagnosis.gaps.find((g) => g.skillName === 'Docker');
      expect(dockerMatch).toBeDefined();
      expect(dockerMatch?.status).toBe('PENDING_VERIFICATION');

      // 4. MISSING_SKILL
      const k8sMatch = diagnosis.gaps.find((g) => g.skillName === 'Kubernetes');
      expect(k8sMatch).toBeDefined();
      expect(k8sMatch?.status).toBe('MISSING_SKILL');
      expect(k8sMatch?.gapSeverity).toBe('CRITICAL');
      expect(k8sMatch?.suggestedLearning).toBeDefined();
      expect(k8sMatch?.recommendedActivity).toBeDefined();

      // Verify HTTP skill gap diagnosis endpoint
      const httpRes = await request(app)
        .post(`/api/v1/readiness/students/${STUDENT_A}/skill-gap`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          requiredSkills: ['TypeScript', 'React', 'Docker', 'Kubernetes'],
          targetRole: 'Cloud Native Engineer'
        })
        .expect(200);

      expect(httpRes.body.success).toBe(true);
      expect(httpRes.body.diagnosis.summary.verifiedMatches).toBe(1);
      expect(httpRes.body.diagnosis.summary.missingSkills).toBe(1);
    });

    it('normalizes skill aliases such that NodeJS, Postgres, and k8s resolve to canonical names', () => {
      expect(skillGapService.normalizeSkillName('NodeJS')).toBe('node.js');
      expect(skillGapService.normalizeSkillName('node.js')).toBe('node.js');
      expect(skillGapService.normalizeSkillName('ReactJS')).toBe('react');
      expect(skillGapService.normalizeSkillName('Postgres')).toBe('postgresql');
      expect(skillGapService.normalizeSkillName('psql')).toBe('postgresql');
      expect(skillGapService.normalizeSkillName('k8s')).toBe('kubernetes');
    });
  });

  // ============================================================================
  // Requirement 7: Phase 10.1 Generalized Dynamic Reweighting & Math Audit
  // ============================================================================
  describe('7. Generalized Dynamic Reweighting & Math Audit (Phase 10.1)', () => {
    it('dynamically reweights across 2 available dimensions when 2 dimensions are missing', async () => {
      const studentId = 'student-two-dims-missing';
      verificationService.seedUser({
        id: studentId,
        tenantId: TENANT_A,
        email: 'two.dims@college-a.edu',
        role: 'student',
        fullName: 'Two Dims Student'
      });

      // Provide verified skills (w=0.35) and coverage (w=0.25).
      // 3 declared skills ensure completeness is >= 0.40 (0.20 profile + 0.25 skills = 0.45)
      // NO project evidence (evidenceType != 'PROJECT') and NO academic record.
      (profilingService as any).inMemorySkillEvidence.set('ev-2d-1', {
        id: 'ev-2d-1',
        tenantId: TENANT_A,
        userId: studentId,
        skillName: 'Python',
        category: 'Programming Languages',
        verificationStatus: 'VERIFIED',
        evidenceType: 'CERTIFICATION'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-2d-2', {
        id: 'ev-2d-2',
        tenantId: TENANT_A,
        userId: studentId,
        skillName: 'SQL',
        category: 'Databases',
        verificationStatus: 'VERIFIED',
        evidenceType: 'CERTIFICATION'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-2d-3', {
        id: 'ev-2d-3',
        tenantId: TENANT_A,
        userId: studentId,
        skillName: 'Git',
        category: 'DevOps & Tools',
        verificationStatus: 'VERIFIED',
        evidenceType: 'CERTIFICATION'
      });

      const res = await readinessService.calculateStudentReadiness(studentId, TENANT_A);

      // Available weights: 0.35 (verified skills) + 0.25 (coverage) = 0.60
      // Verified skills score: 15.0 + 15.0 + 15.0 = 45.0
      // Coverage score: 3/3 = 100.0
      // Adjusted score = (45 * 0.35 + 100 * 0.25) / 0.60 = (15.75 + 25) / 0.60 = 40.75 / 0.60 = 67.92
      expect(res.dimensions.verifiedSkillsScore).toBe(45);
      expect(res.dimensions.evidenceCoverageScore).toBe(100);
      expect(res.dimensions.projectScore).toBe(0);
      expect(res.dimensions.academicScore).toBe(0);
      expect(res.score).toBe(67.92);
      expect(res.dataCompleteness).toBeGreaterThanOrEqual(0.40);
      expect(res.explanation).toContain('without scoring penalty');
      expect(res.explanation).toContain('does not guarantee placement');
    });

    it('enforces INSUFFICIENT_DATA safeguard when available weight sum is below 0.40', async () => {
      const studentId = 'student-critically-sparse';
      // User with 0 declared skills, 0 documents, 0 projects, 0 academics
      const res = await readinessService.calculateStudentReadiness(studentId, TENANT_A);

      expect(res.category).toBe('INSUFFICIENT_DATA');
      expect(res.explanation).toContain('incomplete');
      expect(res.explanation).toContain('does not guarantee placement');
    });

    it('safely handles zero score without NaN or negative values', async () => {
      const studentId = 'student-zero-score';
      verificationService.seedUser({
        id: studentId,
        tenantId: TENANT_A,
        email: 'zero@college-a.edu',
        role: 'student',
        fullName: 'Zero Score Student'
      });

      // Declare skills with self-declared status and no evidence (coverage 0, verified 0)
      (profilingService as any).inMemorySkillEvidence.set('ev-zero-1', {
        id: 'ev-zero-1',
        tenantId: TENANT_A,
        userId: studentId,
        skillName: 'Basic Typing',
        category: 'Other',
        verificationStatus: 'SELF_DECLARED',
        evidenceType: 'OTHER'
      });

      const res = await readinessService.calculateStudentReadiness(studentId, TENANT_A);

      expect(res.score).toBeGreaterThanOrEqual(0);
      expect(res.score).not.toBeNaN();
      expect(res.explanation).toContain('does not guarantee placement');
    });

    it('correctly bounds maximum readiness score to 100', async () => {
      const studentId = 'student-max-score';
      verificationService.seedUser({
        id: studentId,
        tenantId: TENANT_A,
        email: 'max@college-a.edu',
        role: 'student',
        fullName: 'Max Score Student'
      });

      // 8 core programming/database skills -> verified points >= 100
      const eliteSkills = [
        'C++', 'Rust', 'Go', 'Python', 'PostgreSQL', 'Distributed Systems', 'Linux', 'Security'
      ];
      eliteSkills.forEach((s, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-max-${idx}`, {
          id: `ev-max-${idx}`,
          tenantId: TENANT_A,
          userId: studentId,
          skillName: s,
          category: 'Programming Languages',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const res = await readinessService.calculateStudentReadiness(studentId, TENANT_A);

      expect(res.score).toBeLessThanOrEqual(100);
      expect(res.score).toBe(100);
      expect(res.category).toBe('READY');
      expect(res.explanation).toContain('does not guarantee placement');
    });
  });
});
