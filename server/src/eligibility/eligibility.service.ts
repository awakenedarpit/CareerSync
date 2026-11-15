/**
 * CarrerSync Job Requirement and Eligibility Engine Service
 * Phase 10 — Declarative Job Requirements & Eligibility Determination
 *
 * Implements two-stage evaluation pipeline:
 * 1. Hard Administrative Criteria (Department, Graduation Year, CGPA)
 * 2. Competency & Skill Gap Matching (Verified & Evidence-backed skills)
 *
 * Master Policy Enforced:
 * - Declarative Objective Gating
 * - Missing Data Is Not Ineligibility (missing CGPA -> NEEDS_REVIEW, never INELIGIBLE)
 * - Multi-tenant isolation & immutable TPO override audit logging
 * - Offline test resilience with full in-memory fallback stores
 */

import crypto from 'crypto';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  jobRequirements,
  jobEligibilityEvaluations,
  students,
  users,
  profileSkillEvidence,
  studentSkills,
  skills,
  auditEvents,
  type JobRequirement,
  type JobEligibilityEvaluation,
  type Student,
  type User
} from '../db/schema';
import type {
  JobRequirementDTO,
  JobFilters,
  JobRequirementRecord,
  JobEligibilityEvaluationRecord,
  EligibilityResult,
  AdministrativeEligibilityStatus,
  SkillMatchStatus,
  OverallReviewStatus,
  RuleEvaluation,
  RuleEvaluationStatus,
  EvaluationResponse,
  EvaluationOverride,
  CohortEligibilityBreakdown,
  StudentCohortEvaluationItem,
  RecruitmentJobStatus
} from './eligibility.types';

export interface StudentSkillClaim {
  name: string;
  status: 'VERIFIED' | 'EVIDENCE_FOUND' | 'PENDING_REVIEW' | 'SELF_DECLARED';
  category?: string;
  confidence?: number;
}

export interface InMemoryStudent {
  id: string;
  userId: string;
  tenantId: string;
  rollNumber: string;
  name?: string;
  email?: string;
  department: string;
  batchYear: number;
  cgpa: number | null;
  skills: StudentSkillClaim[];
}

export class EligibilityService {
  private static instance: EligibilityService | null = null;

  // In-memory fallback stores for offline testing and fast unit tests
  private inMemoryJobs = new Map<string, JobRequirementRecord>();
  private inMemoryEvaluations = new Map<string, JobEligibilityEvaluationRecord>();
  private inMemoryStudents = new Map<string, InMemoryStudent>();
  private inMemoryAudits: any[] = [];

  public static getInstance(): EligibilityService {
    if (!this.instance) {
      this.instance = new EligibilityService();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearInMemoryStore();
    }
    this.instance = null;
  }

  public clearInMemoryStore(): void {
    this.inMemoryJobs.clear();
    this.inMemoryEvaluations.clear();
    this.inMemoryStudents.clear();
    this.inMemoryAudits = [];
  }

  /**
   * Helper for unit tests to register student profiles into the in-memory fallback store.
   */
  public seedStudent(studentData: {
    id?: string;
    userId?: string;
    tenantId: string;
    rollNumber?: string;
    name?: string;
    email?: string;
    department?: string;
    batchYear?: number;
    graduationYear?: number;
    cgpa?: number | string | null;
    skills?: Array<{ name: string; verificationStatus?: string; category?: string; confidence?: number }>;
  }): InMemoryStudent {
    const studentId = studentData.id || crypto.randomUUID();
    const userId = studentData.userId || studentData.id || crypto.randomUUID();
    const gradYear = studentData.batchYear || studentData.graduationYear || 2025;
    const parsedCgpa =
      studentData.cgpa !== undefined && studentData.cgpa !== null && studentData.cgpa !== ''
        ? parseFloat(String(studentData.cgpa))
        : null;

    const skillClaims: StudentSkillClaim[] = (studentData.skills || []).map((s) => {
      let status: 'VERIFIED' | 'EVIDENCE_FOUND' | 'PENDING_REVIEW' | 'SELF_DECLARED' = 'PENDING_REVIEW';
      const rawStatus = (s.verificationStatus || '').toUpperCase();
      if (rawStatus === 'VERIFIED') status = 'VERIFIED';
      else if (rawStatus === 'EVIDENCE_FOUND') status = 'EVIDENCE_FOUND';
      else if (rawStatus === 'SELF_DECLARED') status = 'SELF_DECLARED';
      else status = 'PENDING_REVIEW';

      return {
        name: s.name,
        status,
        category: s.category || 'General',
        confidence: s.confidence ?? 0.8
      };
    });

    const record: InMemoryStudent = {
      id: studentId,
      userId,
      tenantId: studentData.tenantId,
      rollNumber: studentData.rollNumber || `CS-${Math.floor(1000 + Math.random() * 9000)}`,
      name: studentData.name || 'Sample Student',
      email: studentData.email || 'student@college.edu',
      department: studentData.department || 'Computer Science',
      batchYear: gradYear,
      cgpa: parsedCgpa,
      skills: skillClaims
    };

    this.inMemoryStudents.set(studentId, record);
    // Index by both studentId and userId for easy lookup
    if (userId !== studentId) {
      this.inMemoryStudents.set(userId, record);
    }

    return record;
  }

  /**
   * Helper to register skill evidence directly for offline testing
   */
  public seedSkillEvidence(evidence: {
    tenantId: string;
    userId: string;
    skillName: string;
    verificationStatus: 'VERIFIED' | 'EVIDENCE_FOUND' | 'PENDING_REVIEW' | 'SELF_DECLARED';
    category?: string;
    confidence?: number;
  }): void {
    const student = this.inMemoryStudents.get(evidence.userId);
    if (student) {
      const existing = student.skills.find(
        (s) => s.name.toLowerCase() === evidence.skillName.toLowerCase()
      );
      if (existing) {
        existing.status = evidence.verificationStatus;
        if (evidence.confidence) existing.confidence = evidence.confidence;
      } else {
        student.skills.push({
          name: evidence.skillName,
          status: evidence.verificationStatus,
          category: evidence.category || 'Technical',
          confidence: evidence.confidence ?? 0.85
        });
      }
    }
  }

  // ==========================================================================
  // 1. Job Requirement Specifications (CRUD)
  // ==========================================================================

  /**
   * Creates a new declarative job requirement listing.
   * Inserts into `jobRequirements` table and caches in memory.
   */
  public async createJob(
    data: JobRequirementDTO,
    createdBy: string,
    tenantId: string
  ): Promise<JobRequirementRecord> {
    if (!tenantId) {
      throw new Error('tenantId is required to create a job requirement');
    }
    if (!createdBy) {
      throw new Error('createdBy user ID is required to create a job requirement');
    }

    const companyName = (data.companyName || (data as any).company || '').trim();
    const jobTitle = (data.jobTitle || (data as any).title || '').trim();
    const jobDescription = (data.jobDescription || (data as any).description || '').trim();

    if (!companyName) {
      throw new Error('Company name is required');
    }
    if (!jobTitle) {
      throw new Error('Job title is required');
    }
    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    const eligibleDepartments: string[] = Array.isArray(data.eligibleDepartments)
      ? data.eligibleDepartments
      : Array.isArray((data as any).departments)
      ? (data as any).departments
      : [];

    const graduationYear: number | null =
      data.graduationYear !== undefined && data.graduationYear !== null
        ? Number(data.graduationYear)
        : null;

    let minimumCgpa: string | null = null;
    const rawCgpa = data.minimumCgpa ?? (data as any).minCgpa;
    if (rawCgpa !== undefined && rawCgpa !== null && rawCgpa !== '') {
      minimumCgpa = Number(rawCgpa).toFixed(2);
    }

    const requiredSkills: string[] = Array.isArray(data.requiredSkills)
      ? data.requiredSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const preferredSkills: string[] = Array.isArray(data.preferredSkills)
      ? data.preferredSkills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const assessmentRequirements: string[] = Array.isArray(data.assessmentRequirements)
      ? data.assessmentRequirements.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const deadline: Date | null = data.deadline ? new Date(data.deadline) : null;
    const status: RecruitmentJobStatus = (data.status || 'ACTIVE') as RecruitmentJobStatus;

    const id = crypto.randomUUID();
    const now = new Date();

    const record: JobRequirementRecord = {
      id,
      tenantId,
      companyName,
      jobTitle,
      jobDescription,
      eligibleDepartments,
      graduationYear,
      minimumCgpa,
      requiredSkills,
      preferredSkills,
      assessmentRequirements,
      deadline,
      status,
      createdBy,
      createdAt: now,
      updatedAt: now
    };

    // Attempt DB write with in-memory fallback
    try {
      const db = getDb();
      await db.insert(jobRequirements).values({
        id,
        tenantId,
        companyName,
        jobTitle,
        jobDescription,
        eligibleDepartments,
        graduationYear,
        minimumCgpa: minimumCgpa ? minimumCgpa : null,
        requiredSkills,
        preferredSkills,
        assessmentRequirements,
        deadline,
        status,
        createdBy,
        createdAt: now,
        updatedAt: now
      });
    } catch (err) {
      // In-memory fallback
    }

    this.inMemoryJobs.set(id, record);
    return record;
  }

  /**
   * Retrieves active job requirements for a tenant with optional filtering.
   */
  public async listJobs(
    tenantId: string,
    filters: JobFilters = {}
  ): Promise<JobRequirementRecord[]> {
    if (!tenantId) {
      throw new Error('tenantId is required to list jobs');
    }

    let records: JobRequirementRecord[] = [];

    try {
      const db = getDb();
      const conditions = [eq(jobRequirements.tenantId, tenantId)];

      if (filters.status) {
        conditions.push(eq(jobRequirements.status, filters.status));
      }

      const rows = await db
        .select()
        .from(jobRequirements)
        .where(and(...conditions))
        .orderBy(desc(jobRequirements.createdAt));

      records = rows.map((r) => this.mapDbRowToJob(r));
    } catch {
      // Fallback to in-memory store
      records = Array.from(this.inMemoryJobs.values()).filter(
        (j) => j.tenantId === tenantId
      );
    }

    // Apply in-memory secondary filters (search, department, status)
    if (filters.status) {
      records = records.filter((j) => j.status === filters.status);
    }

    if (filters.companyName) {
      const c = filters.companyName.toLowerCase();
      records = records.filter((j) => j.companyName.toLowerCase().includes(c));
    }

    if (filters.department) {
      const dept = filters.department.trim().toLowerCase();
      records = records.filter((j) => {
        if (!j.eligibleDepartments || j.eligibleDepartments.length === 0) {
          return true; // All departments eligible
        }
        return j.eligibleDepartments.some((d) => d.trim().toLowerCase() === dept);
      });
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      records = records.filter(
        (j) =>
          j.jobTitle.toLowerCase().includes(term) ||
          j.companyName.toLowerCase().includes(term) ||
          j.jobDescription.toLowerCase().includes(term)
      );
    }

    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return records;
  }

  /**
   * Retrieves details of a specific job requirement by ID with tenant isolation verification.
   */
  public async getJobById(
    jobId: string,
    tenantId: string
  ): Promise<JobRequirementRecord | null> {
    if (!jobId || !tenantId) return null;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(jobRequirements)
        .where(and(eq(jobRequirements.id, jobId), eq(jobRequirements.tenantId, tenantId)))
        .limit(1);

      if (rows && rows.length > 0) {
        const job = this.mapDbRowToJob(rows[0]);
        this.inMemoryJobs.set(job.id, job);
        return job;
      }
    } catch {
      // In-memory fallback
    }

    const cached = this.inMemoryJobs.get(jobId);
    if (cached && cached.tenantId === tenantId) {
      return cached;
    }

    return null;
  }

  /**
   * Retrieves a job requirement by ID across all tenants.
   * Used for anti-spoofing tenant isolation checks and cross-tenant access denial.
   */
  public async findJobById(jobId: string): Promise<JobRequirementRecord | null> {
    if (!jobId) return null;

    // Check in-memory store
    const memJob = this.inMemoryJobs.get(jobId);
    if (memJob) return memJob;

    // Check database
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(jobRequirements)
        .where(eq(jobRequirements.id, jobId))
        .limit(1);

      if (rows && rows.length > 0) {
        const job = this.mapDbRowToJob(rows[0]);
        this.inMemoryJobs.set(job.id, job);
        return job;
      }
    } catch {
      // In-memory fallback
    }

    return null;
  }

  /**
   * Updates an existing job requirement specification.
   * Strictly enforces tenant isolation (403 FORBIDDEN_TENANT_MISMATCH).
   * Critical criteria modifications on active jobs trigger status reset to DRAFT for re-review.
   */
  public async updateJob(
    jobId: string,
    data: Partial<JobRequirementDTO>,
    tenantId: string
  ): Promise<JobRequirementRecord> {
    const existing = await this.findJobById(jobId);
    if (!existing) {
      const err = new Error(`Job requirement not found with ID: ${jobId}`);
      (err as any).statusCode = 404;
      (err as any).code = 'NOT_FOUND';
      throw err;
    }

    if (existing.tenantId !== tenantId) {
      const err = new Error('Forbidden: Access denied. Cannot modify job requirement belonging to another tenant');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_TENANT_MISMATCH';
      throw err;
    }

    const updatedEligibleDepts =
      data.eligibleDepartments !== undefined
        ? data.eligibleDepartments
        : (data as any).departments !== undefined
        ? (data as any).departments
        : existing.eligibleDepartments;

    const updatedGraduationYear =
      data.graduationYear !== undefined
        ? data.graduationYear !== null
          ? Number(data.graduationYear)
          : null
        : existing.graduationYear;

    let updatedMinCgpa = existing.minimumCgpa;
    const rawCgpa = data.minimumCgpa ?? (data as any).minCgpa;
    if (rawCgpa !== undefined) {
      updatedMinCgpa =
        rawCgpa !== null && rawCgpa !== '' ? Number(rawCgpa).toFixed(2) : null;
    }

    // Critical changes check: modifying critical criteria on an ACTIVE job transitions it back to DRAFT for re-review
    let targetStatus = (data.status || existing.status) as RecruitmentJobStatus;
    if (existing.status === 'ACTIVE' && data.status === undefined) {
      const deptsChanged =
        data.eligibleDepartments !== undefined &&
        JSON.stringify(updatedEligibleDepts) !== JSON.stringify(existing.eligibleDepartments);
      const gradYearChanged =
        data.graduationYear !== undefined && updatedGraduationYear !== existing.graduationYear;
      const cgpaChanged =
        rawCgpa !== undefined && updatedMinCgpa !== existing.minimumCgpa;
      const skillsChanged =
        data.requiredSkills !== undefined &&
        JSON.stringify(data.requiredSkills) !== JSON.stringify(existing.requiredSkills);

      if (deptsChanged || gradYearChanged || cgpaChanged || skillsChanged) {
        targetStatus = 'DRAFT';
      }
    }

    const updatedRecord: JobRequirementRecord = {
      ...existing,
      companyName: (data.companyName || (data as any).company || existing.companyName).trim(),
      jobTitle: (data.jobTitle || (data as any).title || existing.jobTitle).trim(),
      jobDescription: (data.jobDescription || (data as any).description || existing.jobDescription).trim(),
      eligibleDepartments: updatedEligibleDepts,
      graduationYear: updatedGraduationYear,
      minimumCgpa: updatedMinCgpa,
      requiredSkills: data.requiredSkills !== undefined ? data.requiredSkills : existing.requiredSkills,
      preferredSkills: data.preferredSkills !== undefined ? data.preferredSkills : existing.preferredSkills,
      assessmentRequirements:
        data.assessmentRequirements !== undefined
          ? data.assessmentRequirements
          : existing.assessmentRequirements,
      deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : existing.deadline,
      status: targetStatus,
      updatedAt: new Date()
    };

    try {
      const db = getDb();
      await db
        .update(jobRequirements)
        .set({
          companyName: updatedRecord.companyName,
          jobTitle: updatedRecord.jobTitle,
          jobDescription: updatedRecord.jobDescription,
          eligibleDepartments: updatedRecord.eligibleDepartments,
          graduationYear: updatedRecord.graduationYear,
          minimumCgpa: updatedRecord.minimumCgpa ? String(updatedRecord.minimumCgpa) : null,
          requiredSkills: updatedRecord.requiredSkills,
          preferredSkills: updatedRecord.preferredSkills,
          assessmentRequirements: updatedRecord.assessmentRequirements,
          deadline: updatedRecord.deadline ? new Date(updatedRecord.deadline) : null,
          status: updatedRecord.status,
          updatedAt: updatedRecord.updatedAt
        })
        .where(and(eq(jobRequirements.id, jobId), eq(jobRequirements.tenantId, tenantId)));
    } catch {
      // In-memory fallback
    }

    this.inMemoryJobs.set(jobId, updatedRecord);
    return updatedRecord;
  }

  // ==========================================================================
  // 2. Candidate Eligibility Determination Engine
  // ==========================================================================

  /**
   * Evaluates an individual student against a job requirement.
   *
   * Hard Criteria vs Advisory Criteria:
   * - Department: PASS/FAIL (or INSUFFICIENT_INFO if missing)
   * - Graduation Year: PASS/FAIL (or INSUFFICIENT_INFO if missing)
   * - Minimum CGPA: PASS/FAIL. Missing CGPA -> NEEDS_REVIEW (never rejected as INELIGIBLE)
   * - Required Skills: Verified/Evidence-backed match. Missing -> UNMET
   *
   * Persists evaluation in `jobEligibilityEvaluations`.
   */
  public async evaluateStudent(
    jobId: string,
    studentId: string,
    tenantId: string
  ): Promise<EvaluationResponse> {
    const job = await this.getJobById(jobId, tenantId);
    if (!job) {
      throw new Error(`Job requirement not found with ID ${jobId} in this tenant`);
    }

    // 1. Fetch Student Record & Skill Evidence
    const studentData = await this.resolveStudentProfile(studentId, tenantId);

    // If student record completely does not exist
    if (!studentData) {
      const response: EvaluationResponse = {
        result: 'INSUFFICIENT_DATA',
        administrativeEligibility: 'NEEDS_REVIEW',
        skillMatchStatus: 'NOT_ASSESSED',
        overallReviewStatus: 'NEEDS_REVIEW',
        matchedRequirements: [],
        unmetRequirements: [],
        missingInformation: ['Student record not found in tenant database'],
        explanation:
          'Cannot evaluate eligibility: Student profile does not exist in the tenant database.',
        ruleEvaluations: [
          {
            ruleName: 'Student Profile Record',
            status: 'INSUFFICIENT_INFO',
            details: 'No student record found for studentId: ' + studentId
          }
        ],
        override: null
      };

      await this.persistEvaluation(jobId, studentId, tenantId, response);
      return response;
    }

    const ruleEvaluations: RuleEvaluation[] = [];
    const matchedRequirements: string[] = [];
    const unmetRequirements: string[] = [];
    const missingInformation: string[] = [];

    // ------------------------------------------------------------------------
    // Stage 1: Hard Administrative Criteria
    // ------------------------------------------------------------------------

    // Rule 1: Department Match
    if (job.eligibleDepartments && job.eligibleDepartments.length > 0) {
      if (!studentData.department || !studentData.department.trim()) {
        ruleEvaluations.push({
          ruleName: 'Department Eligibility',
          status: 'INSUFFICIENT_INFO',
          details: 'Student academic department is not specified in profile record.'
        });
        missingInformation.push('Student academic department is not recorded');
      } else {
        const studentDept = studentData.department.trim().toLowerCase();
        const isMatch = job.eligibleDepartments.some(
          (d) => d.trim().toLowerCase() === studentDept
        );

        if (isMatch) {
          ruleEvaluations.push({
            ruleName: 'Department Eligibility',
            status: 'PASSED',
            details: `Student department '${studentData.department}' matches eligible departments: [${job.eligibleDepartments.join(', ')}]`
          });
          matchedRequirements.push(`Department: ${studentData.department}`);
        } else {
          ruleEvaluations.push({
            ruleName: 'Department Eligibility',
            status: 'FAILED',
            details: `Student department '${studentData.department}' is not in eligible departments: [${job.eligibleDepartments.join(', ')}]`
          });
          unmetRequirements.push(
            `Department '${studentData.department}' is not eligible (allowed: ${job.eligibleDepartments.join(', ')})`
          );
        }
      }
    } else {
      ruleEvaluations.push({
        ruleName: 'Department Eligibility',
        status: 'PASSED',
        details: 'All academic departments are eligible for this recruitment drive.'
      });
      matchedRequirements.push('All academic departments eligible');
    }

    // Rule 2: Graduation Year Match
    if (job.graduationYear !== null && job.graduationYear !== undefined) {
      if (!studentData.batchYear) {
        ruleEvaluations.push({
          ruleName: 'Graduation Year',
          status: 'INSUFFICIENT_INFO',
          details: 'Student graduation / batch year is not recorded in profile.'
        });
        missingInformation.push('Student graduation year is not recorded');
      } else if (Number(studentData.batchYear) === Number(job.graduationYear)) {
        ruleEvaluations.push({
          ruleName: 'Graduation Year',
          status: 'PASSED',
          details: `Student graduation year ${studentData.batchYear} matches required year ${job.graduationYear}`
        });
        matchedRequirements.push(`Graduation year: ${studentData.batchYear}`);
      } else {
        ruleEvaluations.push({
          ruleName: 'Graduation Year',
          status: 'FAILED',
          details: `Student graduation year ${studentData.batchYear} does not match required year ${job.graduationYear}`
        });
        unmetRequirements.push(
          `Graduation year ${studentData.batchYear} does not match required ${job.graduationYear}`
        );
      }
    } else {
      ruleEvaluations.push({
        ruleName: 'Graduation Year',
        status: 'PASSED',
        details: 'No specific graduation year cutoff required.'
      });
      matchedRequirements.push('Graduation year: any');
    }

    // Rule 3: Minimum CGPA Cutoff
    // Core Guarantee: Never rejected for missing optional/unrecorded CGPA
    if (job.minimumCgpa !== null && job.minimumCgpa !== undefined && job.minimumCgpa !== '') {
      const minCutoff = parseFloat(String(job.minimumCgpa));

      if (studentData.cgpa === null || studentData.cgpa === undefined || isNaN(studentData.cgpa)) {
        ruleEvaluations.push({
          ruleName: 'Minimum CGPA',
          status: 'NEEDS_REVIEW',
          details: `Required CGPA is ${minCutoff.toFixed(2)}, but student CGPA is not recorded in the institutional database; held for manual review rather than rejected.`
        });
        missingInformation.push(
          'Cumulative CGPA not yet recorded in student profile; held for manual TPO review'
        );
      } else if (Number(studentData.cgpa) >= minCutoff) {
        ruleEvaluations.push({
          ruleName: 'Minimum CGPA',
          status: 'PASSED',
          details: `Student CGPA ${Number(studentData.cgpa).toFixed(2)} meets or exceeds minimum cutoff ${minCutoff.toFixed(2)}`
        });
        matchedRequirements.push(`CGPA: ${Number(studentData.cgpa).toFixed(2)} >= ${minCutoff.toFixed(2)}`);
      } else {
        ruleEvaluations.push({
          ruleName: 'Minimum CGPA',
          status: 'FAILED',
          details: `Student CGPA ${Number(studentData.cgpa).toFixed(2)} is below minimum cutoff ${minCutoff.toFixed(2)}`
        });
        unmetRequirements.push(
          `CGPA ${Number(studentData.cgpa).toFixed(2)} is below required cutoff ${minCutoff.toFixed(2)}`
        );
      }
    } else {
      ruleEvaluations.push({
        ruleName: 'Minimum CGPA',
        status: 'PASSED',
        details: 'No minimum CGPA cutoff specified for this position.'
      });
      matchedRequirements.push('Minimum CGPA: none');
    }

    // ------------------------------------------------------------------------
    // Stage 1 Summary: Hard Administrative Evaluation
    // ------------------------------------------------------------------------
    const adminRuleNames = ['Department Eligibility', 'Graduation Year', 'Minimum CGPA'];
    const adminRules = ruleEvaluations.filter((r) => adminRuleNames.includes(r.ruleName));
    const adminFailed = adminRules.some((r) => r.status === 'FAILED');
    const adminNeedsReview = adminRules.some(
      (r) => r.status === 'NEEDS_REVIEW' || r.status === 'INSUFFICIENT_INFO'
    );

    let administrativeEligibility: AdministrativeEligibilityStatus;
    if (adminFailed) {
      administrativeEligibility = 'INELIGIBLE';
    } else if (adminNeedsReview) {
      administrativeEligibility = 'NEEDS_REVIEW';
    } else {
      administrativeEligibility = 'ELIGIBLE';
    }

    // ------------------------------------------------------------------------
    // Stage 2: Competency & Skill Gap Matching
    // ------------------------------------------------------------------------
    let skillMatchStatus: SkillMatchStatus = 'NOT_ASSESSED';

    // Rule 4: Required Skills Match
    if (job.requiredSkills && job.requiredSkills.length > 0) {
      let missingSkillsCount = 0;
      let pendingSkillsCount = 0;
      let evidenceCount = 0;
      let verifiedCount = 0;
      const missingSkillNames: string[] = [];
      const pendingSkillNames: string[] = [];

      for (const reqSkill of job.requiredSkills) {
        const normalizedReq = reqSkill.trim().toLowerCase();
        const claim = studentData.skills.find(
          (s) => s.name.trim().toLowerCase() === normalizedReq
        );

        if (!claim) {
          missingSkillsCount++;
          missingSkillNames.push(reqSkill);
          missingInformation.push(`Missing required skill claim/evidence: ${reqSkill}`);
        } else if (claim.status === 'VERIFIED') {
          verifiedCount++;
          matchedRequirements.push(`Verified skill match: ${reqSkill}`);
        } else if (claim.status === 'EVIDENCE_FOUND') {
          evidenceCount++;
          matchedRequirements.push(`Evidence-backed skill match: ${reqSkill}`);
        } else {
          // PENDING_REVIEW or SELF_DECLARED
          pendingSkillsCount++;
          pendingSkillNames.push(reqSkill);
          missingInformation.push(
            `Required skill '${reqSkill}' has unverified claims; pending institutional review`
          );
        }
      }

      if (missingSkillsCount > 0) {
        skillMatchStatus = 'MISSING_SKILL';
        ruleEvaluations.push({
          ruleName: 'Required Skills Match',
          status: 'NEEDS_REVIEW',
          details: `${missingSkillsCount} of ${job.requiredSkills.length} required skill(s) (${missingSkillNames.join(', ')}) are unrecorded or missing evidence in candidate profile.`
        });
      } else if (pendingSkillsCount > 0) {
        skillMatchStatus = 'PENDING_VERIFICATION';
        ruleEvaluations.push({
          ruleName: 'Required Skills Match',
          status: 'NEEDS_REVIEW',
          details: `${pendingSkillsCount} required skill(s) (${pendingSkillNames.join(', ')}) are claimed by candidate but pending institutional verification.`
        });
      } else if (evidenceCount > 0) {
        skillMatchStatus = 'EVIDENCE_MATCH';
        ruleEvaluations.push({
          ruleName: 'Required Skills Match',
          status: 'PASSED',
          details: `All ${job.requiredSkills.length} required skill(s) are satisfied by evidence-backed competencies (${verifiedCount} verified, ${evidenceCount} evidence-backed).`
        });
      } else {
        skillMatchStatus = 'VERIFIED_MATCH';
        ruleEvaluations.push({
          ruleName: 'Required Skills Match',
          status: 'PASSED',
          details: `All ${job.requiredSkills.length} required skill(s) are fully verified.`
        });
      }
    } else {
      skillMatchStatus = 'NOT_ASSESSED';
      ruleEvaluations.push({
        ruleName: 'Required Skills Match',
        status: 'PASSED',
        details: 'No mandatory technical skills specified for this job requirement.'
      });
      matchedRequirements.push('Required skills: none');
    }

    // Preferred Skills (Advisory only — never fails candidates)
    if (job.preferredSkills && job.preferredSkills.length > 0) {
      for (const prefSkill of job.preferredSkills) {
        const normalizedPref = prefSkill.trim().toLowerCase();
        const claim = studentData.skills.find(
          (s) => s.name.trim().toLowerCase() === normalizedPref
        );
        if (claim && (claim.status === 'VERIFIED' || claim.status === 'EVIDENCE_FOUND')) {
          matchedRequirements.push(`Preferred skill bonus: ${prefSkill}`);
        }
      }
    }

    // ------------------------------------------------------------------------
    // Overall Status Synthesis & Human-Readable Explanation
    // ------------------------------------------------------------------------

    // Check existing persisted override
    const existingEvaluation = await this.getExistingEvaluation(jobId, studentId, tenantId);
    let override: EvaluationOverride | null = null;
    let finalResult: EligibilityResult;
    let overallReviewStatus: OverallReviewStatus;

    if (existingEvaluation && existingEvaluation.overriddenBy) {
      override = {
        overriddenBy: existingEvaluation.overriddenBy,
        overrideReason: existingEvaluation.overrideReason,
        overriddenAt: existingEvaluation.evaluatedAt
      };
      finalResult = existingEvaluation.result;
      overallReviewStatus =
        finalResult === 'ELIGIBLE'
          ? 'ELIGIBLE'
          : finalResult === 'INELIGIBLE'
          ? 'INELIGIBLE'
          : 'NEEDS_REVIEW';
    } else {
      // Prompt 10.1 FAIRNESS RULE:
      // Missing skill evidence must NEVER automatically make a student INELIGIBLE.
      // If administrative eligibility is satisfied, but skill evidence is missing or unverified,
      // the student's status MUST be NEEDS_REVIEW.
      // Only an administrative criteria failure (wrong dept, CGPA below cutoff, wrong grad year)
      // may result in INELIGIBLE.
      if (administrativeEligibility === 'INELIGIBLE') {
        overallReviewStatus = 'INELIGIBLE';
        finalResult = 'INELIGIBLE';
      } else if (administrativeEligibility === 'NEEDS_REVIEW') {
        overallReviewStatus = 'NEEDS_REVIEW';
        if (!studentData.department || !studentData.batchYear) {
          finalResult = 'INSUFFICIENT_DATA';
        } else {
          finalResult = 'NEEDS_REVIEW';
        }
      } else {
        // administrativeEligibility === 'ELIGIBLE'
        if (skillMatchStatus === 'MISSING_SKILL' || skillMatchStatus === 'PENDING_VERIFICATION') {
          overallReviewStatus = 'NEEDS_REVIEW';
          finalResult = 'NEEDS_REVIEW';
        } else {
          overallReviewStatus = 'ELIGIBLE';
          finalResult = 'ELIGIBLE';
        }
      }
    }

    const explanation = this.buildExplanation(
      finalResult,
      administrativeEligibility,
      skillMatchStatus,
      ruleEvaluations,
      unmetRequirements,
      missingInformation,
      override
    );

    const response: EvaluationResponse = {
      result: finalResult,
      administrativeEligibility,
      skillMatchStatus,
      overallReviewStatus,
      matchedRequirements,
      unmetRequirements,
      missingInformation,
      explanation,
      ruleEvaluations,
      override
    };

    await this.persistEvaluation(jobId, studentId, tenantId, response);
    return response;
  }

  /**
   * Runs batch eligibility evaluation across all enrolled students in the tenant.
   * Returns complete cohort breakdown and rule evaluations.
   */
  public async evaluateCohort(
    jobId: string,
    tenantId: string
  ): Promise<CohortEligibilityBreakdown> {
    const job = await this.getJobById(jobId, tenantId);
    if (!job) {
      throw new Error(`Job requirement not found with ID ${jobId} in this tenant`);
    }

    const allStudents = await this.listTenantStudents(tenantId);

    const evaluations: StudentCohortEvaluationItem[] = [];
    let eligibleCount = 0;
    let ineligibleCount = 0;
    let needsReviewCount = 0;
    let insufficientDataCount = 0;

    for (const student of allStudents) {
      const evaluation = await this.evaluateStudent(jobId, student.id, tenantId);

      if (evaluation.result === 'ELIGIBLE') eligibleCount++;
      else if (evaluation.result === 'INELIGIBLE') ineligibleCount++;
      else if (evaluation.result === 'NEEDS_REVIEW') needsReviewCount++;
      else if (evaluation.result === 'INSUFFICIENT_DATA') insufficientDataCount++;

      evaluations.push({
        studentId: student.id,
        studentName: student.name,
        department: student.department,
        evaluation
      });
    }

    return {
      jobId,
      tenantId,
      totalEvaluated: evaluations.length,
      eligibleCount,
      ineligibleCount,
      needsReviewCount,
      insufficientDataCount,
      evaluations
    };
  }

  /**
   * Allows authorized TPO_ADMIN / COLLEGE_ADMIN to record a human override of student eligibility.
   * Mandates explicit justification reason (>= 10 characters) and creates immutable audit event.
   */
  public async overrideEvaluation(
    jobId: string,
    studentId: string,
    newResult: EligibilityResult,
    overrideReason: string,
    reviewerId: string,
    tenantId: string
  ): Promise<EvaluationResponse> {
    if (!overrideReason || typeof overrideReason !== 'string' || overrideReason.trim().length < 10) {
      throw new Error('A detailed justification reason (minimum 10 characters) is required for TPO override.');
    }

    const validResults: EligibilityResult[] = [
      'ELIGIBLE',
      'INELIGIBLE',
      'NEEDS_REVIEW',
      'INSUFFICIENT_DATA'
    ];
    if (!validResults.includes(newResult)) {
      throw new Error(`Invalid eligibility result: ${newResult}`);
    }

    const job = await this.getJobById(jobId, tenantId);
    if (!job) {
      throw new Error(`Job requirement not found with ID ${jobId} in this tenant`);
    }

    // Get current evaluation or run initial evaluation
    let currentEvaluation = await this.getExistingEvaluation(jobId, studentId, tenantId);
    const previousResult = currentEvaluation ? currentEvaluation.result : 'UNKNOWN';

    const now = new Date();
    const evaluationKey = `${jobId}:${studentId}`;

    // Update in DB
    try {
      const db = getDb();
      if (currentEvaluation) {
        await db
          .update(jobEligibilityEvaluations)
          .set({
            result: newResult,
            overriddenBy: reviewerId,
            overrideReason: overrideReason.trim(),
            evaluatedAt: now
          })
          .where(
            and(
              eq(jobEligibilityEvaluations.jobId, jobId),
              eq(jobEligibilityEvaluations.studentId, studentId),
              eq(jobEligibilityEvaluations.tenantId, tenantId)
            )
          );
      } else {
        const id = crypto.randomUUID();
        await db.insert(jobEligibilityEvaluations).values({
          id,
          tenantId,
          studentId,
          jobId,
          result: newResult,
          matchedRequirements: [],
          unmetRequirements: [],
          missingInformation: [],
          explanation: `TPO Manual Override: status set to ${newResult}. Reason: ${overrideReason.trim()}`,
          overriddenBy: reviewerId,
          overrideReason: overrideReason.trim(),
          evaluatedAt: now
        });
      }

      // Append tamper-proof audit event
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        tenantId,
        actorId: reviewerId,
        action: 'TPO_OVERRIDE_JOB_ELIGIBILITY',
        resourceType: 'JOB_ELIGIBILITY_EVALUATION',
        resourceId: evaluationKey,
        changesDiff: {
          jobId,
          studentId,
          previousResult,
          newResult,
          overrideReason: overrideReason.trim(),
          timestamp: now.toISOString()
        },
        timestamp: now
      });
    } catch {
      // In-memory fallback
    }

    // Update in-memory evaluation
    const administrativeEligibility: AdministrativeEligibilityStatus =
      currentEvaluation?.administrativeEligibility || (newResult === 'INELIGIBLE' ? 'INELIGIBLE' : 'ELIGIBLE');
    const skillMatchStatus: SkillMatchStatus =
      currentEvaluation?.skillMatchStatus || 'NOT_ASSESSED';
    const overallReviewStatus: OverallReviewStatus =
      newResult === 'ELIGIBLE'
        ? 'ELIGIBLE'
        : newResult === 'INELIGIBLE'
        ? 'INELIGIBLE'
        : 'NEEDS_REVIEW';

    const updatedRecord: JobEligibilityEvaluationRecord = {
      id: currentEvaluation ? currentEvaluation.id : crypto.randomUUID(),
      tenantId,
      studentId,
      jobId,
      result: newResult,
      administrativeEligibility,
      skillMatchStatus,
      overallReviewStatus,
      matchedRequirements: currentEvaluation ? currentEvaluation.matchedRequirements : [],
      unmetRequirements: currentEvaluation ? currentEvaluation.unmetRequirements : [],
      missingInformation: currentEvaluation ? currentEvaluation.missingInformation : [],
      explanation: `TPO Manual Override: Status set to ${newResult}. Reason: ${overrideReason.trim()}`,
      overriddenBy: reviewerId,
      overrideReason: overrideReason.trim(),
      evaluatedAt: now
    };

    this.inMemoryEvaluations.set(evaluationKey, updatedRecord);

    // Record audit event in memory
    this.inMemoryAudits.push({
      tenantId,
      actorId: reviewerId,
      action: 'TPO_OVERRIDE_JOB_ELIGIBILITY',
      resourceType: 'JOB_ELIGIBILITY_EVALUATION',
      resourceId: evaluationKey,
      changesDiff: {
        jobId,
        studentId,
        previousResult,
        newResult,
        overrideReason: overrideReason.trim()
      },
      timestamp: now
    });

    return {
      result: newResult,
      administrativeEligibility,
      skillMatchStatus,
      overallReviewStatus,
      matchedRequirements: updatedRecord.matchedRequirements,
      unmetRequirements: updatedRecord.unmetRequirements,
      missingInformation: updatedRecord.missingInformation,
      explanation: updatedRecord.explanation,
      ruleEvaluations: [],
      override: {
        overriddenBy: reviewerId,
        overrideReason: overrideReason.trim(),
        overriddenAt: now
      }
    };
  }

  /**
   * Retrieves full eligibility evaluation matrix and rule breakdowns for all candidates against a job.
   * Formatted for TPO portal & candidate matrix UI.
   */
  public async getJobEligibility(jobId: string, tenantId: string): Promise<any> {
    const job = await this.getJobById(jobId, tenantId);
    if (!job) {
      throw new Error(`Job requirement not found with ID ${jobId} in this tenant`);
    }

    const cohort = await this.evaluateCohort(jobId, tenantId);

    const candidates = cohort.evaluations.map((item) => {
      const student = this.inMemoryStudents.get(item.studentId);
      const deptRule = item.evaluation.ruleEvaluations.find((r) => r.ruleName.includes('Department'));
      const gradRule = item.evaluation.ruleEvaluations.find((r) => r.ruleName.includes('Graduation'));
      const cgpaRule = item.evaluation.ruleEvaluations.find((r) => r.ruleName.includes('CGPA'));
      const skillRule = item.evaluation.ruleEvaluations.find((r) => r.ruleName.includes('Skill'));

      const matchedVerified = item.evaluation.matchedRequirements
        .filter((m) => m.startsWith('Verified skill match:'))
        .map((m) => m.replace('Verified skill match: ', ''));

      const matchedEvidence = item.evaluation.matchedRequirements
        .filter((m) => m.startsWith('Evidence-backed skill match:'))
        .map((m) => m.replace('Evidence-backed skill match: ', ''));

      const missingSkills = item.evaluation.missingInformation
        .concat(item.evaluation.unmetRequirements)
        .filter((u) => u.toLowerCase().includes('missing required skill'))
        .map((u) => u.replace(/^Missing required skill( claim\/evidence)?: /i, ''));

      return {
        studentId: item.studentId,
        studentName: item.studentName || student?.name || 'Student',
        rollNumber: student?.rollNumber || '',
        department: item.department || student?.department || '',
        graduationYear: student?.batchYear || job.graduationYear || 2025,
        cgpa: student?.cgpa ?? undefined,
        status: item.evaluation.result,
        administrativeEligibility: item.evaluation.administrativeEligibility,
        skillMatchStatus: item.evaluation.skillMatchStatus,
        overallReviewStatus: item.evaluation.overallReviewStatus,
        rules: {
          department: {
            passed: deptRule?.status === 'PASSED',
            expected: job.eligibleDepartments,
            actual: item.department || student?.department || ''
          },
          graduationYear: {
            passed: gradRule?.status === 'PASSED',
            expected: job.graduationYear || 0,
            actual: student?.batchYear || 0
          },
          cgpa: {
            passed: cgpaRule?.status === 'PASSED',
            expected: job.minimumCgpa ? parseFloat(String(job.minimumCgpa)) : 0,
            actual: student?.cgpa ?? undefined,
            status:
              cgpaRule?.status === 'PASSED'
                ? ('PASS' as const)
                : cgpaRule?.status === 'FAILED'
                ? ('FAIL' as const)
                : ('NEEDS_REVIEW' as const)
          },
          requiredSkills: {
            passed: skillRule?.status === 'PASSED',
            required: job.requiredSkills,
            matchedVerified,
            matchedEvidence,
            missing: missingSkills
          }
        },
        override: item.evaluation.override
          ? {
              overridden: true,
              originalStatus: 'INELIGIBLE',
              reviewerId: item.evaluation.override.overriddenBy || '',
              reason: item.evaluation.override.overrideReason || '',
              createdAt: item.evaluation.override.overriddenAt
                ? new Date(item.evaluation.override.overriddenAt).toISOString()
                : new Date().toISOString()
            }
          : undefined
      };
    });

    return {
      jobId,
      job,
      summary: {
        totalEvaluated: cohort.totalEvaluated,
        eligible: cohort.eligibleCount,
        ineligible: cohort.ineligibleCount,
        needsReview: cohort.needsReviewCount,
        insufficientData: cohort.insufficientDataCount
      },
      candidates
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async getExistingEvaluation(
    jobId: string,
    studentId: string,
    tenantId: string
  ): Promise<JobEligibilityEvaluationRecord | null> {
    const key = `${jobId}:${studentId}`;

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(jobEligibilityEvaluations)
        .where(
          and(
            eq(jobEligibilityEvaluations.jobId, jobId),
            eq(jobEligibilityEvaluations.studentId, studentId),
            eq(jobEligibilityEvaluations.tenantId, tenantId)
          )
        )
        .limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const record: JobEligibilityEvaluationRecord = {
          id: row.id,
          tenantId: row.tenantId,
          studentId: row.studentId,
          jobId: row.jobId,
          result: row.result as EligibilityResult,
          matchedRequirements: (row.matchedRequirements as string[]) || [],
          unmetRequirements: (row.unmetRequirements as string[]) || [],
          missingInformation: (row.missingInformation as string[]) || [],
          explanation: row.explanation,
          overriddenBy: row.overriddenBy,
          overrideReason: row.overrideReason,
          evaluatedAt: row.evaluatedAt
        };
        this.inMemoryEvaluations.set(key, record);
        return record;
      }
    } catch {
      // In-memory fallback
    }

    return this.inMemoryEvaluations.get(key) || null;
  }

  private async persistEvaluation(
    jobId: string,
    studentId: string,
    tenantId: string,
    response: EvaluationResponse
  ): Promise<void> {
    const key = `${jobId}:${studentId}`;
    const now = new Date();

    const record: JobEligibilityEvaluationRecord = {
      id: crypto.randomUUID(),
      tenantId,
      studentId,
      jobId,
      result: response.result,
      administrativeEligibility: response.administrativeEligibility,
      skillMatchStatus: response.skillMatchStatus,
      overallReviewStatus: response.overallReviewStatus,
      matchedRequirements: response.matchedRequirements,
      unmetRequirements: response.unmetRequirements,
      missingInformation: response.missingInformation,
      explanation: response.explanation,
      overriddenBy: response.override?.overriddenBy || null,
      overrideReason: response.override?.overrideReason || null,
      evaluatedAt: now
    };

    try {
      const db = getDb();
      const existing = await this.getExistingEvaluation(jobId, studentId, tenantId);

      if (existing) {
        await db
          .update(jobEligibilityEvaluations)
          .set({
            result: response.result,
            matchedRequirements: response.matchedRequirements,
            unmetRequirements: response.unmetRequirements,
            missingInformation: response.missingInformation,
            explanation: response.explanation,
            evaluatedAt: now
          })
          .where(
            and(
              eq(jobEligibilityEvaluations.jobId, jobId),
              eq(jobEligibilityEvaluations.studentId, studentId),
              eq(jobEligibilityEvaluations.tenantId, tenantId)
            )
          );
      } else {
        await db.insert(jobEligibilityEvaluations).values({
          id: record.id,
          tenantId,
          studentId,
          jobId,
          result: record.result,
          matchedRequirements: record.matchedRequirements,
          unmetRequirements: record.unmetRequirements,
          missingInformation: record.missingInformation,
          explanation: record.explanation,
          overriddenBy: record.overriddenBy,
          overrideReason: record.overrideReason,
          evaluatedAt: now
        });
      }
    } catch {
      // In-memory fallback
    }

    this.inMemoryEvaluations.set(key, record);
  }

  private async resolveStudentProfile(
    studentId: string,
    tenantId: string
  ): Promise<InMemoryStudent | null> {
    // Check in-memory store first
    const cached = this.inMemoryStudents.get(studentId);
    if (cached && cached.tenantId === tenantId) {
      return cached;
    }

    // Attempt DB query
    try {
      const db = getDb();
      // Look up student by student.id or student.userId
      const studentRows = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.tenantId, tenantId),
            sql`(${students.id} = ${studentId} OR ${students.userId} = ${studentId})`
          )
        )
        .limit(1);

      if (studentRows && studentRows.length > 0) {
        const row = studentRows[0];
        const studentUserId = row.userId;

        // Fetch user name/email if available
        let studentName = 'Student';
        let studentEmail = 'student@college.edu';
        try {
          const userRows = await db
            .select()
            .from(users)
            .where(eq(users.id, studentUserId))
            .limit(1);
          if (userRows && userRows.length > 0) {
            studentName = userRows[0].fullName || 'Student';
            studentEmail = userRows[0].email;
          }
        } catch {
          // ignore user query failure
        }

        // Fetch skills from profileSkillEvidence
        const skillClaims: StudentSkillClaim[] = [];
        try {
          const evidenceRows = await db
            .select()
            .from(profileSkillEvidence)
            .where(
              and(
                eq(profileSkillEvidence.tenantId, tenantId),
                eq(profileSkillEvidence.userId, studentUserId)
              )
            );

          for (const ev of evidenceRows) {
            let status: 'VERIFIED' | 'EVIDENCE_FOUND' | 'PENDING_REVIEW' | 'SELF_DECLARED' = 'PENDING_REVIEW';
            const raw = (ev.verificationStatus || '').toUpperCase();
            if (raw === 'VERIFIED') status = 'VERIFIED';
            else if (raw === 'EVIDENCE_FOUND') status = 'EVIDENCE_FOUND';
            else if (raw === 'SELF_DECLARED') status = 'SELF_DECLARED';
            else status = 'PENDING_REVIEW';

            skillClaims.push({
              name: ev.skillName,
              status,
              category: ev.category,
              confidence: ev.confidence ? parseFloat(String(ev.confidence)) : 0.8
            });
          }
        } catch {
          // ignore skill evidence failure
        }

        // Also fetch from studentSkills if available
        try {
          const studentSkillRows = await db
            .select({
              name: skills.name,
              state: studentSkills.state
            })
            .from(studentSkills)
            .innerJoin(skills, eq(studentSkills.skillId, skills.id))
            .where(
              and(
                eq(studentSkills.tenantId, tenantId),
                eq(studentSkills.studentId, row.id)
              )
            );

          for (const ss of studentSkillRows) {
            if (!skillClaims.some((c) => c.name.toLowerCase() === ss.name.toLowerCase())) {
              const status = ss.state === 'Claimed' ? 'SELF_DECLARED' : 'VERIFIED';
              skillClaims.push({
                name: ss.name,
                status
              });
            }
          }
        } catch {
          // ignore student skills query failure
        }

        const studentProfile: InMemoryStudent = {
          id: row.id,
          userId: row.userId,
          tenantId: row.tenantId,
          rollNumber: row.rollNumber,
          name: studentName,
          email: studentEmail,
          department: row.department,
          batchYear: row.batchYear,
          cgpa: row.cgpa ? parseFloat(String(row.cgpa)) : null,
          skills: skillClaims
        };

        this.inMemoryStudents.set(studentProfile.id, studentProfile);
        this.inMemoryStudents.set(studentProfile.userId, studentProfile);
        return studentProfile;
      }
    } catch {
      // In-memory fallback
    }

    return null;
  }

  private async listTenantStudents(tenantId: string): Promise<InMemoryStudent[]> {
    const list: InMemoryStudent[] = [];

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(students)
        .where(eq(students.tenantId, tenantId));

      for (const row of rows) {
        const student = await this.resolveStudentProfile(row.id, tenantId);
        if (student) list.push(student);
      }
    } catch {
      // Fallback to in-memory store
      const seenIds = new Set<string>();
      for (const s of this.inMemoryStudents.values()) {
        if (s.tenantId === tenantId && !seenIds.has(s.id)) {
          seenIds.add(s.id);
          list.push(s);
        }
      }
    }

    return list;
  }

  private buildExplanation(
    result: EligibilityResult,
    adminStatus: AdministrativeEligibilityStatus,
    skillStatus: SkillMatchStatus,
    rules: RuleEvaluation[],
    unmet: string[],
    missing: string[],
    override: EvaluationOverride | null
  ): string {
    if (override && override.overriddenBy) {
      return `Candidate status overridden to ${result} by institutional placement officer. Documented reason: "${override.overrideReason}".`;
    }

    if (result === 'ELIGIBLE') {
      const passedRules = rules.map((r) => r.ruleName).join(', ');
      return `Candidate is fully ELIGIBLE. Satisfies all administrative criteria and verified skill requirements (${passedRules}).`;
    }

    if (result === 'INELIGIBLE') {
      const unmetDetails = unmet.length > 0 ? unmet.join('; ') : 'Hard administrative criteria not satisfied.';
      return `Candidate is INELIGIBLE for this position. Administrative criteria failure: ${unmetDetails}`;
    }

    if (result === 'NEEDS_REVIEW') {
      if (adminStatus === 'ELIGIBLE') {
        const skillNotes = missing.filter((m) => m.toLowerCase().includes('skill')).join('; ');
        return `Administratively eligible; pending skill verification for required skills (${skillNotes || 'evidence assessment pending'}).`;
      }
      const missingDetails = missing.length > 0 ? missing.join('; ') : 'Pending verification.';
      return `Candidate evaluation held for manual TPO review: ${missingDetails}`;
    }

    // INSUFFICIENT_DATA
    return 'Insufficient candidate data: Critical profile attributes (e.g. academic department or cohort year) are missing from the student record.';
  }

  private mapDbRowToJob(row: any): JobRequirementRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      companyName: row.companyName,
      jobTitle: row.jobTitle,
      jobDescription: row.jobDescription,
      eligibleDepartments: (row.eligibleDepartments as string[]) || [],
      graduationYear: row.graduationYear,
      minimumCgpa: row.minimumCgpa ? String(row.minimumCgpa) : null,
      requiredSkills: (row.requiredSkills as string[]) || [],
      preferredSkills: (row.preferredSkills as string[]) || [],
      assessmentRequirements: (row.assessmentRequirements as string[]) || [],
      deadline: row.deadline ? new Date(row.deadline) : null,
      status: row.status as RecruitmentJobStatus,
      createdBy: row.createdBy,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date()
    };
  }
}

export const eligibilityService = EligibilityService.getInstance();
