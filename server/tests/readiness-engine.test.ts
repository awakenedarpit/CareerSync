import { describe, it, expect, beforeEach } from 'vitest';
import { readinessService } from '../src/readiness/readiness.service';
import { skillGapService } from '../src/readiness/skill-gap.service';
import { profilingService } from '../src/services/profiling.service';

describe('Placement Readiness Intelligence Engine & Skill Gap Diagnostics', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const studentA = '11111111-1111-1111-1111-111111111111';
  const studentB = '22222222-2222-2222-2222-222222222222';
  const studentC = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    // Clear in-memory caches where applicable
    (readinessService as any).inMemorySnapshots.clear();
    (profilingService as any).inMemorySkillEvidence.clear();
  });

  describe('Skill Gap Diagnostics', () => {
    it('should correctly classify VERIFIED_MATCH, EVIDENCE_MATCH, PENDING_VERIFICATION, and MISSING_SKILL', async () => {
      // Seed evidence for studentA
      (profilingService as any).inMemorySkillEvidence.set('ev-1', {
        id: 'ev-1',
        tenantId,
        userId: studentA,
        skillName: 'TypeScript',
        category: 'Programming Languages',
        verificationStatus: 'VERIFIED',
        evidenceType: 'CERTIFICATE'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-2', {
        id: 'ev-2',
        tenantId,
        userId: studentA,
        skillName: 'React',
        category: 'Web Development',
        verificationStatus: 'EVIDENCE_FOUND',
        evidenceType: 'PROJECT'
      });
      (profilingService as any).inMemorySkillEvidence.set('ev-3', {
        id: 'ev-3',
        tenantId,
        userId: studentA,
        skillName: 'Docker',
        category: 'Cloud & DevOps',
        verificationStatus: 'PENDING_REVIEW',
        evidenceType: 'RESUME'
      });

      const requiredSkills = ['TypeScript', 'React', 'Docker', 'Kubernetes'];
      const diagnosis = await skillGapService.diagnoseSkillGaps(
        studentA,
        tenantId,
        requiredSkills,
        ['GraphQL'],
        'Full Stack Engineer'
      );

      expect(diagnosis.studentId).toBe(studentA);
      expect(diagnosis.targetRole).toBe('Full Stack Engineer');
      expect(diagnosis.summary.totalRequired).toBe(4);
      expect(diagnosis.summary.verifiedMatches).toBe(1);
      expect(diagnosis.summary.evidenceMatches).toBe(1);
      expect(diagnosis.summary.pendingVerification).toBe(1);
      expect(diagnosis.summary.missingSkills).toBe(1);

      // Verify item statuses
      const tsItem = diagnosis.gaps.find((g) => g.skillName === 'TypeScript');
      expect(tsItem?.status).toBe('VERIFIED_MATCH');
      expect(tsItem?.gapSeverity).toBe('MINOR');

      const reactItem = diagnosis.gaps.find((g) => g.skillName === 'React');
      expect(reactItem?.status).toBe('EVIDENCE_MATCH');
      expect(reactItem?.gapSeverity).toBe('MODERATE');

      const dockerItem = diagnosis.gaps.find((g) => g.skillName === 'Docker');
      expect(dockerItem?.status).toBe('PENDING_VERIFICATION');

      const k8sItem = diagnosis.gaps.find((g) => g.skillName === 'Kubernetes');
      expect(k8sItem?.status).toBe('MISSING_SKILL');
      expect(k8sItem?.gapSeverity).toBe('CRITICAL');

      expect(diagnosis.recommendations.length).toBeGreaterThan(0);
    });

    it('should normalize skill aliases (e.g. nodejs -> node.js, postgres -> postgresql)', () => {
      expect(skillGapService.normalizeSkillName('NodeJS')).toBe('node.js');
      expect(skillGapService.normalizeSkillName('node.js')).toBe('node.js');
      expect(skillGapService.normalizeSkillName('ReactJS')).toBe('react');
      expect(skillGapService.normalizeSkillName('Postgres')).toBe('postgresql');
      expect(skillGapService.normalizeSkillName('k8s')).toBe('kubernetes');
    });
  });

  describe('Placement Readiness Engine Scoring & Weights', () => {
    it('should produce 100% deterministic score for identical inputs', async () => {
      // Seed 5 verified skills for studentB
      const skillsToSeed = ['Python', 'SQL', 'PostgreSQL', 'Docker', 'AWS'];
      skillsToSeed.forEach((skill, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-b-${idx}`, {
          id: `ev-b-${idx}`,
          tenantId,
          userId: studentB,
          skillName: skill,
          category: 'Programming Languages',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const res1 = await readinessService.calculateStudentReadiness(studentB, tenantId);
      const res2 = await readinessService.calculateStudentReadiness(studentB, tenantId);

      expect(res1.score).toBe(res2.score);
      expect(res1.category).toBe(res2.category);
      expect(res1.dimensions).toEqual(res2.dimensions);
      expect(res1.dataCompleteness).toBe(res2.dataCompleteness);
    });

    it('should handle missing academic records gracefully without zeroing score', async () => {
      // Student C has 4 verified skills, but no academic/CGPA record
      const skillsToSeed = ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'];
      skillsToSeed.forEach((skill, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-c-${idx}`, {
          id: `ev-c-${idx}`,
          tenantId,
          userId: studentC,
          skillName: skill,
          category: 'Core Engineering',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const result = await readinessService.calculateStudentReadiness(studentC, tenantId);

      // Score should NOT be zeroed out
      expect(result.score).toBeGreaterThan(50);
      // Academic dimension is 0 because no transcript was provided
      expect(result.dimensions.academicScore).toBe(0);
      // Data completeness reflects missing academic records (< 1.00)
      expect(result.dataCompleteness).toBeLessThan(1.0);
      // Explanation informs user about missing academic record without penalty
      expect(result.explanation).toContain('without scoring penalty');
    });

    it('should classify candidate as INSUFFICIENT_DATA when completeness < 0.40', async () => {
      // Empty student with zero evidence or profile
      const emptyStudent = '44444444-4444-4444-4444-444444444444';
      const result = await readinessService.calculateStudentReadiness(emptyStudent, tenantId);

      expect(result.dataCompleteness).toBeLessThan(0.40);
      expect(result.category).toBe('INSUFFICIENT_DATA');
      expect(result.explanation).toContain('incomplete');
    });

    it('should classify candidate as READY when score >= 80 and completeness >= 0.40', async () => {
      const readyStudent = '55555555-5555-5555-5555-555555555555';
      const topSkills = ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'Redis', 'Kubernetes'];
      topSkills.forEach((skill, idx) => {
        (profilingService as any).inMemorySkillEvidence.set(`ev-r-${idx}`, {
          id: `ev-r-${idx}`,
          tenantId,
          userId: readyStudent,
          skillName: skill,
          category: 'Programming Languages',
          verificationStatus: 'VERIFIED',
          evidenceType: 'PROJECT'
        });
      });

      const result = await readinessService.calculateStudentReadiness(readyStudent, tenantId);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.category).toBe('READY');
      expect(result.verifiedStrengths.length).toBeGreaterThanOrEqual(5);
    });

    it('should return student readiness history', async () => {
      const histStudent = '66666666-6666-6666-6666-666666666666';
      (profilingService as any).inMemorySkillEvidence.set('ev-h-1', {
        id: 'ev-h-1',
        tenantId,
        userId: histStudent,
        skillName: 'JavaScript',
        category: 'Web Development',
        verificationStatus: 'VERIFIED',
        evidenceType: 'PROJECT'
      });

      const { current, history } = await readinessService.getStudentReadiness(histStudent, tenantId);
      expect(current).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(current.studentId).toBe(histStudent);
    });

    it('should calculate cohort and department aggregations', async () => {
      const cohort = await readinessService.getCohortReadiness(tenantId);
      expect(cohort).toBeDefined();
      expect(typeof cohort.averageScore).toBe('number');
      expect(cohort.categoryDistributions).toHaveProperty('READY');
      expect(cohort.categoryDistributions).toHaveProperty('DEVELOPING');
      expect(cohort.categoryDistributions).toHaveProperty('NEEDS_SUPPORT');
      expect(cohort.categoryDistributions).toHaveProperty('INSUFFICIENT_DATA');

      const departments = await readinessService.getDepartmentReadiness(tenantId);
      expect(Array.isArray(departments)).toBe(true);
    });
  });
});
