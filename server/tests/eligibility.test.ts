/**
 * CarrerSync Job Eligibility Engine Unit & Integration Tests
 * Phase 10 — Declarative Job Requirements & Eligibility Determination
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EligibilityService } from '../src/eligibility/eligibility.service';
import type { JobRequirementDTO } from '../src/eligibility/eligibility.types';

describe('Job Requirement & Eligibility Engine (Phase 10)', () => {
  let service: EligibilityService;
  const tenantA = 'tenant-college-alpha-1111';
  const tenantB = 'tenant-college-beta-2222';
  const adminId = 'user-tpo-admin-9999';

  beforeEach(() => {
    EligibilityService.resetInstance();
    service = EligibilityService.getInstance();
    service.clearInMemoryStore();
  });

  describe('1. Declarative Job Requirements CRUD', () => {
    it('creates a job requirement with all declarative criteria', async () => {
      const payload: JobRequirementDTO = {
        companyName: 'Acme Robotics',
        jobTitle: 'Full Stack Engineer',
        jobDescription: 'Develop next-gen autonomous systems using TypeScript and React.',
        eligibleDepartments: ['Computer Science', 'Information Technology'],
        graduationYear: 2025,
        minimumCgpa: 7.5,
        requiredSkills: ['TypeScript', 'React', 'Node.js'],
        preferredSkills: ['Docker', 'AWS'],
        assessmentRequirements: ['System Design Round'],
        status: 'ACTIVE'
      };

      const job = await service.createJob(payload, adminId, tenantA);

      expect(job.id).toBeDefined();
      expect(job.tenantId).toBe(tenantA);
      expect(job.companyName).toBe('Acme Robotics');
      expect(job.jobTitle).toBe('Full Stack Engineer');
      expect(job.eligibleDepartments).toEqual(['Computer Science', 'Information Technology']);
      expect(job.graduationYear).toBe(2025);
      expect(job.minimumCgpa).toBe('7.50');
      expect(job.requiredSkills).toEqual(['TypeScript', 'React', 'Node.js']);
      expect(job.preferredSkills).toEqual(['Docker', 'AWS']);
      expect(job.status).toBe('ACTIVE');
    });

    it('rejects job creation with missing mandatory parameters', async () => {
      await expect(
        service.createJob(
          { companyName: '', jobTitle: 'Dev', jobDescription: 'Desc' },
          adminId,
          tenantA
        )
      ).rejects.toThrow('Company name is required');

      await expect(
        service.createJob(
          { companyName: 'Acme', jobTitle: '', jobDescription: 'Desc' },
          adminId,
          tenantA
        )
      ).rejects.toThrow('Job title is required');

      await expect(
        service.createJob(
          { companyName: 'Acme', jobTitle: 'Dev', jobDescription: '' },
          adminId,
          tenantA
        )
      ).rejects.toThrow('Job description is required');
    });

    it('enforces multi-tenant isolation when listing and retrieving jobs', async () => {
      const jobA = await service.createJob(
        { companyName: 'Alpha Corp', jobTitle: 'Dev A', jobDescription: 'Desc A' },
        adminId,
        tenantA
      );

      const jobB = await service.createJob(
        { companyName: 'Beta Corp', jobTitle: 'Dev B', jobDescription: 'Desc B' },
        adminId,
        tenantB
      );

      const listA = await service.listJobs(tenantA);
      expect(listA.length).toBe(1);
      expect(listA[0].id).toBe(jobA.id);

      const listB = await service.listJobs(tenantB);
      expect(listB.length).toBe(1);
      expect(listB[0].id).toBe(jobB.id);

      // Cross-tenant access must return null
      const crossTenantFetch = await service.getJobById(jobA.id, tenantB);
      expect(crossTenantFetch).toBeNull();
    });

    it('updates job criteria and parameters within tenant boundary', async () => {
      const job = await service.createJob(
        {
          companyName: 'TechCorp',
          jobTitle: 'Backend Engineer',
          jobDescription: 'Initial desc',
          minimumCgpa: 6.5
        },
        adminId,
        tenantA
      );

      const updated = await service.updateJob(
        job.id,
        {
          jobTitle: 'Senior Backend Engineer',
          minimumCgpa: 8.0,
          requiredSkills: ['Go', 'PostgreSQL']
        },
        tenantA
      );

      expect(updated.jobTitle).toBe('Senior Backend Engineer');
      expect(updated.minimumCgpa).toBe('8.00');
      expect(updated.requiredSkills).toEqual(['Go', 'PostgreSQL']);

      // Attempting to update from another tenant must fail
      await expect(
        service.updateJob(job.id, { jobTitle: 'Hacked' }, tenantB)
      ).rejects.toThrow();
    });
  });

  describe('2. Hard Administrative Criteria & Gating', () => {
    it('evaluates student as ELIGIBLE when all criteria and skills are satisfied', async () => {
      const job = await service.createJob(
        {
          companyName: 'MetaLogic',
          jobTitle: 'Frontend Developer',
          jobDescription: 'React dev role',
          eligibleDepartments: ['Computer Science', 'Information Science'],
          graduationYear: 2025,
          minimumCgpa: 7.0,
          requiredSkills: ['JavaScript', 'React']
        },
        adminId,
        tenantA
      );

      const studentId = 'student-alice-1001';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: 8.2,
        skills: [
          { name: 'JavaScript', verificationStatus: 'VERIFIED' },
          { name: 'React', verificationStatus: 'EVIDENCE_FOUND' }
        ]
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.result).toBe('ELIGIBLE');
      expect(evaluation.unmetRequirements.length).toBe(0);
      expect(evaluation.missingInformation.length).toBe(0);
      expect(evaluation.ruleEvaluations.every((r) => r.status === 'PASSED')).toBe(true);
      expect(evaluation.explanation).toContain('Candidate is fully ELIGIBLE');
    });

    it('marks student INELIGIBLE when academic department does not match', async () => {
      const job = await service.createJob(
        {
          companyName: 'DataCorp',
          jobTitle: 'AI Engineer',
          jobDescription: 'ML dev',
          eligibleDepartments: ['Computer Science', 'AI & DS'],
          graduationYear: 2025
        },
        adminId,
        tenantA
      );

      const studentId = 'student-bob-1002';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Mechanical Engineering',
        batchYear: 2025,
        cgpa: 9.0
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.result).toBe('INELIGIBLE');
      expect(evaluation.unmetRequirements.some((u) => u.includes('Mechanical Engineering'))).toBe(true);
      const deptRule = evaluation.ruleEvaluations.find((r) => r.ruleName === 'Department Eligibility');
      expect(deptRule?.status).toBe('FAILED');
    });

    it('marks student INELIGIBLE when graduation cohort year does not match', async () => {
      const job = await service.createJob(
        {
          companyName: 'FinTech Labs',
          jobTitle: 'Analyst',
          jobDescription: '2025 Batch only',
          graduationYear: 2025
        },
        adminId,
        tenantA
      );

      const studentId = 'student-charlie-1003';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2026 // Junior batch
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.result).toBe('INELIGIBLE');
      expect(evaluation.unmetRequirements.some((u) => u.includes('Graduation year'))).toBe(true);
      const gradRule = evaluation.ruleEvaluations.find((r) => r.ruleName === 'Graduation Year');
      expect(gradRule?.status).toBe('FAILED');
    });

    it('marks student INELIGIBLE when CGPA is strictly below cutoff', async () => {
      const job = await service.createJob(
        {
          companyName: 'CloudCorp',
          jobTitle: 'DevOps Engineer',
          jobDescription: 'Cutoff 7.50',
          minimumCgpa: 7.5
        },
        adminId,
        tenantA
      );

      const studentId = 'student-david-1004';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: 6.8
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.result).toBe('INELIGIBLE');
      expect(evaluation.unmetRequirements.some((u) => u.includes('below required cutoff'))).toBe(true);
      const cgpaRule = evaluation.ruleEvaluations.find((r) => r.ruleName === 'Minimum CGPA');
      expect(cgpaRule?.status).toBe('FAILED');
    });

    it('CRITICAL GUARANTEE: Missing CGPA produces NEEDS_REVIEW rather than rejection as INELIGIBLE', async () => {
      const job = await service.createJob(
        {
          companyName: 'Equitable Corp',
          jobTitle: 'Software Engineer',
          jobDescription: 'Requires CGPA 7.50 if available',
          eligibleDepartments: ['Computer Science'],
          graduationYear: 2025,
          minimumCgpa: 7.5,
          requiredSkills: ['Java']
        },
        adminId,
        tenantA
      );

      const studentId = 'student-elena-1005';
      // Student has no CGPA record (null)
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: null,
        skills: [{ name: 'Java', verificationStatus: 'VERIFIED' }]
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      // Must NEVER be INELIGIBLE
      expect(evaluation.result).toBe('NEEDS_REVIEW');
      expect(evaluation.result).not.toBe('INELIGIBLE');
      expect(evaluation.missingInformation.some((m) => m.includes('Cumulative CGPA not yet recorded'))).toBe(true);

      const cgpaRule = evaluation.ruleEvaluations.find((r) => r.ruleName === 'Minimum CGPA');
      expect(cgpaRule?.status).toBe('NEEDS_REVIEW');
      expect(cgpaRule?.details).toContain('held for manual review rather than rejected');
    });

    it('returns INSUFFICIENT_DATA when student basic profile attributes are unrecorded', async () => {
      const job = await service.createJob(
        {
          companyName: 'Acme',
          jobTitle: 'Engineer',
          jobDescription: 'Desc'
        },
        adminId,
        tenantA
      );

      // Non-existent student ID
      const evaluation = await service.evaluateStudent(job.id, 'non-existent-student-id', tenantA);

      expect(evaluation.result).toBe('INSUFFICIENT_DATA');
      expect(evaluation.missingInformation.some((m) => m.includes('Student record not found'))).toBe(true);
    });
  });

  describe('3. Competency Matching & Skill Diagnostics', () => {
    it('accepts both VERIFIED and EVIDENCE_FOUND skills towards satisfying requirements', async () => {
      const job = await service.createJob(
        {
          companyName: 'FullStack Inc',
          jobTitle: 'Web Developer',
          jobDescription: 'TypeScript + Python',
          requiredSkills: ['TypeScript', 'Python']
        },
        adminId,
        tenantA
      );

      const studentId = 'student-frank-1006';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        skills: [
          { name: 'TypeScript', verificationStatus: 'VERIFIED' },
          { name: 'Python', verificationStatus: 'EVIDENCE_FOUND' }
        ]
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.result).toBe('ELIGIBLE');
      expect(evaluation.matchedRequirements).toContain('Verified skill match: TypeScript');
      expect(evaluation.matchedRequirements).toContain('Evidence-backed skill match: Python');
    });

    it('flags NEEDS_REVIEW when skills are only claimed/pending institutional review', async () => {
      const job = await service.createJob(
        {
          companyName: 'CloudCorp',
          jobTitle: 'Cloud Architect',
          jobDescription: 'AWS required',
          requiredSkills: ['AWS']
        },
        adminId,
        tenantA
      );

      const studentId = 'student-grace-1007';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        skills: [{ name: 'AWS', verificationStatus: 'PENDING_REVIEW' }]
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.result).toBe('NEEDS_REVIEW');
      expect(evaluation.missingInformation.some((m) => m.includes('pending institutional review'))).toBe(true);
    });

    it('flags NEEDS_REVIEW when a mandatory technical skill is missing evidence while preserving administrative eligibility', async () => {
      const job = await service.createJob(
        {
          companyName: 'Systems Co',
          jobTitle: 'Rust Engineer',
          jobDescription: 'Rust and C++ required',
          eligibleDepartments: ['Computer Science'],
          graduationYear: 2025,
          minimumCgpa: 7.0,
          requiredSkills: ['Rust', 'C++']
        },
        adminId,
        tenantA
      );

      const studentId = 'student-hank-1008';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: 8.0,
        skills: [{ name: 'Rust', verificationStatus: 'VERIFIED' }]
        // Missing C++
      });

      const evaluation = await service.evaluateStudent(job.id, studentId, tenantA);

      expect(evaluation.administrativeEligibility).toBe('ELIGIBLE');
      expect(evaluation.skillMatchStatus).toBe('MISSING_SKILL');
      expect(evaluation.overallReviewStatus).toBe('NEEDS_REVIEW');
      expect(evaluation.result).toBe('NEEDS_REVIEW');
      expect(evaluation.result).not.toBe('INELIGIBLE');
      expect(evaluation.missingInformation.some((m) => m.includes('C++'))).toBe(true);
      const skillRule = evaluation.ruleEvaluations.find((r) => r.ruleName === 'Required Skills Match');
      expect(skillRule?.status).toBe('NEEDS_REVIEW');
      expect(evaluation.explanation).toContain('Administratively eligible; pending skill verification');
    });
  });

  describe('4. Cohort Evaluation Breakdown & Matrix', () => {
    it('evaluates entire cohort and aggregates accurate statistical breakdowns', async () => {
      const job = await service.createJob(
        {
          companyName: 'CohortCorp',
          jobTitle: 'Graduate Trainee',
          jobDescription: 'CSE / 2025 / 7.00 CGPA',
          eligibleDepartments: ['Computer Science'],
          graduationYear: 2025,
          minimumCgpa: 7.0,
          requiredSkills: ['Java']
        },
        adminId,
        tenantA
      );

      // Student 1: Fully eligible
      service.seedStudent({
        id: 's1',
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: 8.5,
        skills: [{ name: 'Java', verificationStatus: 'VERIFIED' }]
      });

      // Student 2: Ineligible (Mechanical Dept)
      service.seedStudent({
        id: 's2',
        tenantId: tenantA,
        department: 'Mechanical',
        batchYear: 2025,
        cgpa: 8.0,
        skills: [{ name: 'Java', verificationStatus: 'VERIFIED' }]
      });

      // Student 3: Needs review (Missing CGPA)
      service.seedStudent({
        id: 's3',
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: null,
        skills: [{ name: 'Java', verificationStatus: 'VERIFIED' }]
      });

      const cohort = await service.evaluateCohort(job.id, tenantA);

      expect(cohort.totalEvaluated).toBe(3);
      expect(cohort.eligibleCount).toBe(1);
      expect(cohort.ineligibleCount).toBe(1);
      expect(cohort.needsReviewCount).toBe(1);
      expect(cohort.insufficientDataCount).toBe(0);
      expect(cohort.evaluations.length).toBe(3);
    });

    it('formats candidate matrix correctly in getJobEligibility', async () => {
      const job = await service.createJob(
        {
          companyName: 'MatrixLabs',
          jobTitle: 'Engineer',
          jobDescription: 'Test',
          eligibleDepartments: ['Computer Science'],
          graduationYear: 2025,
          minimumCgpa: 7.0,
          requiredSkills: ['React']
        },
        adminId,
        tenantA
      );

      service.seedStudent({
        id: 'student-matrix-1',
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: 8.0,
        skills: [{ name: 'React', verificationStatus: 'VERIFIED' }]
      });

      const matrix = await service.getJobEligibility(job.id, tenantA);

      expect(matrix.jobId).toBe(job.id);
      expect(matrix.summary.totalEvaluated).toBe(1);
      expect(matrix.candidates.length).toBe(1);
      expect(matrix.candidates[0].rules.department.passed).toBe(true);
      expect(matrix.candidates[0].rules.cgpa.passed).toBe(true);
      expect(matrix.candidates[0].rules.requiredSkills.matchedVerified).toContain('React');
    });
  });

  describe('5. TPO Administrative Override & Immutable Audit Logging', () => {
    it('mandates detailed justification reason (>= 10 characters) for TPO override', async () => {
      const job = await service.createJob(
        { companyName: 'Corp', jobTitle: 'Dev', jobDescription: 'Desc' },
        adminId,
        tenantA
      );

      // Short reason must be rejected
      await expect(
        service.overrideEvaluation(job.id, 's1', 'ELIGIBLE', 'Short', adminId, tenantA)
      ).rejects.toThrow('A detailed justification reason (minimum 10 characters) is required');

      // Empty reason must be rejected
      await expect(
        service.overrideEvaluation(job.id, 's1', 'ELIGIBLE', '', adminId, tenantA)
      ).rejects.toThrow();
    });

    it('successfully overrides candidate evaluation and preserves override in re-evaluation', async () => {
      const job = await service.createJob(
        {
          companyName: 'StrictCorp',
          jobTitle: 'Engineer',
          jobDescription: 'Desc',
          minimumCgpa: 8.0
        },
        adminId,
        tenantA
      );

      const studentId = 'student-override-1';
      service.seedStudent({
        id: studentId,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025,
        cgpa: 7.2 // Below 8.00 cutoff
      });

      // Initial evaluation is INELIGIBLE
      const initial = await service.evaluateStudent(job.id, studentId, tenantA);
      expect(initial.result).toBe('INELIGIBLE');

      // TPO overrides to ELIGIBLE
      const justification = 'Dean approval granted due to published research and major open-source contribution';
      const overridden = await service.overrideEvaluation(
        job.id,
        studentId,
        'ELIGIBLE',
        justification,
        adminId,
        tenantA
      );

      expect(overridden.result).toBe('ELIGIBLE');
      expect(overridden.override?.overriddenBy).toBe(adminId);
      expect(overridden.override?.overrideReason).toBe(justification);

      // Re-evaluation must honor the human override
      const reevaluated = await service.evaluateStudent(job.id, studentId, tenantA);
      expect(reevaluated.result).toBe('ELIGIBLE');
      expect(reevaluated.override?.overriddenBy).toBe(adminId);
      expect(reevaluated.explanation).toContain('Candidate status overridden to ELIGIBLE');
    });
  });

  describe('6. Tenant Isolation & Cross-College Security Boundaries', () => {
    it('verifies jobs and evaluations cannot cross college boundaries', async () => {
      const jobA = await service.createJob(
        {
          companyName: 'College A Exclusive Job',
          jobTitle: 'Data Engineer',
          jobDescription: 'Only for College A students'
        },
        adminId,
        tenantA
      );

      const studentA = 'student-alpha-safe';
      service.seedStudent({
        id: studentA,
        tenantId: tenantA,
        department: 'Computer Science',
        batchYear: 2025
      });

      // College B attempts to evaluate College A's job
      await expect(
        service.evaluateStudent(jobA.id, studentA, tenantB)
      ).rejects.toThrow(/Job requirement not found/i);

      // College B attempts to evaluate cohort for College A's job
      await expect(
        service.evaluateCohort(jobA.id, tenantB)
      ).rejects.toThrow(/Job requirement not found/i);

      // College B attempts to get eligibility matrix for College A's job
      await expect(
        service.getJobEligibility(jobA.id, tenantB)
      ).rejects.toThrow(/Job requirement not found/i);

      // College B attempts to override evaluation for College A's job
      await expect(
        service.overrideEvaluation(
          jobA.id,
          studentA,
          'ELIGIBLE',
          'Attempted cross-tenant override justification',
          adminId,
          tenantB
        )
      ).rejects.toThrow(/Job requirement not found/i);
    });
  });
});

