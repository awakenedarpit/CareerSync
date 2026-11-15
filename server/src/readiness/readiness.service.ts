/**
 * Placement Readiness Intelligence Engine
 * CarrerSync Phase 10
 *
 * Deterministic, explainable scoring engine evaluating student technical
 * readiness across 4 dimensions:
 * 1. Verified Skills (35%)
 * 2. Evidence Coverage (25%)
 * 3. Project Depth (20%)
 * 4. Academic & Assessment Performance (20%)
 *
 * Missing optional records (e.g. CGPA) are handled gracefully via the
 * Data Completeness Indicator (C) without penalizing student competency scores.
 */

import { getDb } from '../db/client';
import {
  studentReadinessSnapshots,
  students,
  users,
  profileSkillEvidence,
  profileExtractions,
  documents,
  ReadinessCategory
} from '../db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { profilingService } from '../services/profiling.service';
import { skillGapService } from './skill-gap.service';
import { verificationService } from '../verification/verification.service';
import {
  ReadinessResult,
  ReadinessDimensions,
  StudentReadinessSnapshotRecord,
  CohortReadiness,
  DepartmentReadiness
} from './readiness.types';

export class ReadinessService {
  private static instance: ReadinessService;

  // In-memory snapshot cache for zero-cost runtime & unit test reliability
  private inMemorySnapshots: Map<string, StudentReadinessSnapshotRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): ReadinessService {
    if (!ReadinessService.instance) {
      ReadinessService.instance = new ReadinessService();
    }
    return ReadinessService.instance;
  }

  /**
   * Calculates deterministic placement readiness for a student.
   * Persists snapshot in PostgreSQL studentReadinessSnapshots and memory.
   */
  public async calculateStudentReadiness(
    studentId: string,
    tenantId: string,
    targetRole?: string
  ): Promise<ReadinessResult> {
    // 1. Resolve student and user profile
    const { userId, studentRecord, userName } = await this.resolveStudentProfile(studentId, tenantId);

    // 2. Fetch skill evidence records (both memory and DB)
    const evidenceList = await profilingService.getStudentEvidence(userId, tenantId);

    // 3. Collect unique skills
    const skillMap = new Map<
      string,
      {
        skillName: string;
        category: string;
        verificationStatus: string;
        evidenceType: string;
      }
    >();

    for (const ev of evidenceList) {
      const key = skillGapService.normalizeSkillName(ev.skillName);
      const existing = skillMap.get(key);
      if (!existing || ev.verificationStatus === 'VERIFIED') {
        skillMap.set(key, {
          skillName: ev.skillName,
          category: ev.category || 'Technical',
          verificationStatus: ev.verificationStatus,
          evidenceType: ev.evidenceType
        });
      }
    }

    const allSkills = Array.from(skillMap.values());
    const verifiedSkills = allSkills.filter((s) => s.verificationStatus === 'VERIFIED');
    const evidenceFoundSkills = allSkills.filter((s) => s.verificationStatus === 'EVIDENCE_FOUND');
    const pendingSkills = allSkills.filter((s) => s.verificationStatus === 'PENDING_REVIEW');
    const selfDeclaredSkills = allSkills.filter(
      (s) => s.verificationStatus === 'SELF_DECLARED' || s.verificationStatus === 'NEEDS_MORE_EVIDENCE'
    );

    // -------------------------------------------------------------
    // Dimension 1: Verified Technical Skills Score (Weight: 35%)
    // -------------------------------------------------------------
    // Each verified skill contributes based on category relevance:
    // Core Engineering: 15.0 pts; Applied CS/Frameworks: 12.75 pts; Secondary Tools: 9.0 pts
    let rawVerifiedPoints = 0;
    for (const v of verifiedSkills) {
      const cat = (v.category || '').toLowerCase();
      if (
        cat.includes('programming') ||
        cat.includes('language') ||
        cat.includes('database') ||
        cat.includes('cloud') ||
        cat.includes('devops')
      ) {
        rawVerifiedPoints += 15.0;
      } else if (
        cat.includes('framework') ||
        cat.includes('web') ||
        cat.includes('backend') ||
        cat.includes('core') ||
        cat.includes('ai')
      ) {
        rawVerifiedPoints += 12.75;
      } else {
        rawVerifiedPoints += 9.0;
      }
    }
    const verifiedSkillsScore = Math.min(100, Number(rawVerifiedPoints.toFixed(2)));

    // -------------------------------------------------------------
    // Dimension 2: Evidence Coverage Score (Weight: 25%)
    // -------------------------------------------------------------
    // Ratio of evidence-backed claims vs total declared claims
    const totalDeclared = allSkills.length;
    let evidenceCoverageScore = 0;
    if (totalDeclared > 0) {
      const effectiveEvidenceCount =
        verifiedSkills.length + evidenceFoundSkills.length + 0.5 * pendingSkills.length;
      const coverageRatio = Math.min(1.0, effectiveEvidenceCount / totalDeclared);
      evidenceCoverageScore = Math.min(100, Number((coverageRatio * 100).toFixed(2)));
    }

    // -------------------------------------------------------------
    // Dimension 3: Project Evidence Depth Score (Weight: 20%)
    // -------------------------------------------------------------
    // Evaluate practical engineering projects
    const projectEvidence = evidenceList.filter((e) => e.evidenceType === 'PROJECT');
    const distinctProjectSkills = new Set(projectEvidence.map((e) => skillGapService.normalizeSkillName(e.skillName)));

    // Count projects from profile extractions if available
    let projectCount = distinctProjectSkills.size;
    try {
      const extractions = await profilingService.getStudentProposedProfile(userId, tenantId);
      for (const ext of extractions) {
        if (Array.isArray(ext.extractedProjects) && ext.extractedProjects.length > 0) {
          projectCount = Math.max(projectCount, ext.extractedProjects.length);
        }
      }
    } catch {
      // Fallback
    }

    let rawProjectScore = 0;
    if (projectCount >= 4) {
      rawProjectScore = 100;
    } else if (projectCount === 3) {
      rawProjectScore = 80;
    } else if (projectCount === 2) {
      rawProjectScore = 60;
    } else if (projectCount === 1) {
      rawProjectScore = 35;
    } else if (distinctProjectSkills.size > 0) {
      rawProjectScore = Math.min(100, distinctProjectSkills.size * 25);
    }
    const projectScore = Math.min(100, Number(rawProjectScore.toFixed(2)));

    // -------------------------------------------------------------
    // Dimension 4: Academic & Assessment Score (Weight: 20%)
    // -------------------------------------------------------------
    let academicScore = 0;
    let hasAcademicData = false;

    if (studentRecord && studentRecord.cgpa && Number(studentRecord.cgpa) > 0) {
      hasAcademicData = true;
      const cgpa = Number(studentRecord.cgpa);
      const cgpaNormalized = (cgpa / 10.0) * 100;
      const backlogPenalty = (studentRecord.backlogCount || 0) * 10;
      academicScore = Math.max(0, Math.min(100, Number((cgpaNormalized - backlogPenalty).toFixed(2))));
    }

    // -------------------------------------------------------------
    // Data Completeness Indicator (C: 0.00 to 1.00)
    // -------------------------------------------------------------
    let completeness = 0.0;
    // Profile & Student details present
    if (studentRecord || userName) completeness += 0.20;
    // At least 1 document uploaded
    const hasDocuments = await this.checkStudentDocuments(userId, tenantId);
    if (hasDocuments) completeness += 0.25;
    // Minimum 3 declared skills
    if (totalDeclared >= 3) {
      completeness += 0.25;
    } else if (totalDeclared > 0) {
      completeness += 0.15;
    }
    // Project artifacts uploaded
    if (projectCount > 0 || distinctProjectSkills.size > 0) completeness += 0.15;
    // Academic record present
    if (hasAcademicData) completeness += 0.15;

    const dataCompleteness = Math.min(1.0, Number(completeness.toFixed(2)));

    // -------------------------------------------------------------
    // Composite Readiness Score (S) — Generalized Dynamic Reweighting
    // Base Weights: Verified Skills 35%, Coverage 25%, Projects 20%, Academics 20%
    // -------------------------------------------------------------
    const hasVerifiedSkillsData = allSkills.length > 0;
    const hasEvidenceCoverageData = totalDeclared > 0;
    const hasProjectData = projectCount > 0 || distinctProjectSkills.size > 0 || projectEvidence.length > 0;

    const activeDimensions: Array<{ name: string; weight: number; score: number }> = [];
    const missingDimensions: Array<{ name: string; weight: number }> = [];

    if (hasVerifiedSkillsData) {
      activeDimensions.push({ name: 'Verified Skills', weight: 0.35, score: verifiedSkillsScore });
    } else {
      missingDimensions.push({ name: 'Verified Skills', weight: 0.35 });
    }

    if (hasEvidenceCoverageData) {
      activeDimensions.push({ name: 'Evidence Coverage', weight: 0.25, score: evidenceCoverageScore });
    } else {
      missingDimensions.push({ name: 'Evidence Coverage', weight: 0.25 });
    }

    if (hasProjectData) {
      activeDimensions.push({ name: 'Project Depth', weight: 0.20, score: projectScore });
    } else {
      missingDimensions.push({ name: 'Project Depth', weight: 0.20 });
    }

    if (hasAcademicData) {
      activeDimensions.push({ name: 'Academic Record', weight: 0.20, score: academicScore });
    } else {
      missingDimensions.push({ name: 'Academic Record', weight: 0.20 });
    }

    const availableWeightSum = activeDimensions.reduce((sum, d) => sum + d.weight, 0);

    let score = 0;
    if (availableWeightSum > 0) {
      const weightedSum = activeDimensions.reduce((sum, d) => sum + d.weight * d.score, 0);
      score = Number((weightedSum / availableWeightSum).toFixed(2));
    }
    score = Math.min(100, Math.max(0, score));

    // -------------------------------------------------------------
    // Readiness Category Mapping & Threshold Safeguards
    // -------------------------------------------------------------
    let category: ReadinessCategory = 'NEEDS_SUPPORT';
    if (dataCompleteness < 0.40 || availableWeightSum < 0.40) {
      category = 'INSUFFICIENT_DATA';
    } else if (score >= 80.0) {
      category = 'READY';
    } else if (score >= 60.0) {
      category = 'DEVELOPING';
    } else {
      category = 'NEEDS_SUPPORT';
    }

    // -------------------------------------------------------------
    // Strengths, Missing Skills, and Advisory Actions
    // -------------------------------------------------------------
    const verifiedStrengths = verifiedSkills.map((s) => s.skillName);
    const evidenceStrengths = evidenceFoundSkills.map((s) => s.skillName);
    const skillsRequiringVerification = [
      ...pendingSkills.map((s) => s.skillName),
      ...selfDeclaredSkills.map((s) => s.skillName)
    ];

    let missingRequiredSkills: string[] = [];
    if (targetRole) {
      const diagnosis = await skillGapService.diagnoseSkillGaps(
        userId,
        tenantId,
        [targetRole],
        [],
        targetRole
      );
      missingRequiredSkills = diagnosis.gaps
        .filter((g) => g.status === 'MISSING_SKILL')
        .map((g) => g.skillName);
    }

    const recommendedActions: string[] = [];
    if (skillsRequiringVerification.length > 0) {
      recommendedActions.push(
        `Submit verifiable project code or certification for: ${skillsRequiringVerification.slice(0, 3).join(', ')}.`
      );
    }
    if (projectScore < 60) {
      recommendedActions.push(
        'Develop and document a multi-tier capstone project demonstrating end-to-end full-stack or systems architecture.'
      );
    }
    if (evidenceCoverageScore < 70) {
      recommendedActions.push(
        'Link evidence documents (GitHub repositories, certificates) to your self-declared resume claims to improve evidence coverage.'
      );
    }
    if (!hasAcademicData) {
      recommendedActions.push(
        'Provide verified semester transcript records to complete academic readiness verification.'
      );
    }
    if (recommendedActions.length === 0) {
      recommendedActions.push(
        'Candidate is fully prepared for technical screening rounds. Focus on behavioral interviews and system design practice.'
      );
    }

    // Explainability generation
    const dimensions: ReadinessDimensions = {
      verifiedSkillsScore,
      evidenceCoverageScore,
      projectScore,
      academicScore
    };

    const explanation = this.generateExplanation(
      score,
      category,
      dimensions,
      dataCompleteness,
      activeDimensions,
      missingDimensions,
      verifiedStrengths.length
    );

    const calculatedAt = new Date().toISOString();

    const result: ReadinessResult = {
      studentId: userId,
      score,
      category,
      dimensions,
      explanation,
      verifiedStrengths,
      evidenceStrengths,
      skillsRequiringVerification,
      missingRequiredSkills,
      recommendedActions,
      dataCompleteness,
      calculatedAt
    };

    // 4. Persist Snapshot
    await this.persistSnapshot(tenantId, userId, result);

    return result;
  }

  /**
   * Retrieves current readiness assessment and historical snapshots for a student.
   */
  public async getStudentReadiness(
    studentId: string,
    tenantId: string
  ): Promise<{ current: ReadinessResult; history: ReadinessResult[] }> {
    const { userId } = await this.resolveStudentProfile(studentId, tenantId);

    const history: ReadinessResult[] = [];

    // Query DB for historical snapshots
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(studentReadinessSnapshots)
        .where(
          and(
            eq(studentReadinessSnapshots.tenantId, tenantId),
            eq(studentReadinessSnapshots.studentId, userId)
          )
        )
        .orderBy(desc(studentReadinessSnapshots.calculatedAt));

      for (const row of rows) {
        history.push({
          studentId: row.studentId,
          score: Number(row.score),
          category: row.category as ReadinessCategory,
          dimensions: (row.dimensions || {}) as ReadinessDimensions,
          explanation: row.explanation,
          verifiedStrengths: [],
          evidenceStrengths: [],
          skillsRequiringVerification: [],
          missingRequiredSkills: [],
          recommendedActions: [],
          dataCompleteness: Number(row.dataCompleteness || '1.00'),
          calculatedAt: row.calculatedAt ? row.calculatedAt.toISOString() : new Date().toISOString()
        });
      }
    } catch {
      // DB offline fallback
    }

    // Also check memory cache
    const memList = this.inMemorySnapshots.get(`${tenantId}:${userId}`) || [];
    for (const mem of memList) {
      if (!history.some((h) => h.calculatedAt === (mem.calculatedAt instanceof Date ? mem.calculatedAt.toISOString() : mem.calculatedAt))) {
        history.push({
          studentId: mem.studentId,
          score: mem.score,
          category: mem.category,
          dimensions: mem.dimensions,
          explanation: mem.explanation,
          verifiedStrengths: [],
          evidenceStrengths: [],
          skillsRequiringVerification: [],
          missingRequiredSkills: [],
          recommendedActions: [],
          dataCompleteness: mem.dataCompleteness,
          calculatedAt: mem.calculatedAt instanceof Date ? mem.calculatedAt.toISOString() : mem.calculatedAt
        });
      }
    }

    // If history is empty, calculate fresh readiness
    if (history.length === 0) {
      const fresh = await this.calculateStudentReadiness(userId, tenantId);
      return {
        current: fresh,
        history: [fresh]
      };
    }

    return {
      current: history[0],
      history
    };
  }

  /**
   * Aggregates macro readiness analytics across the entire tenant cohort.
   */
  public async getCohortReadiness(tenantId: string): Promise<CohortReadiness> {
    const studentUserIds: string[] = [];

    // Gather student IDs in tenant
    try {
      const db = getDb();
      const studentRows = await db
        .select({ userId: students.userId })
        .from(students)
        .where(eq(students.tenantId, tenantId));

      for (const r of studentRows) {
        if (r.userId && !studentUserIds.includes(r.userId)) {
          studentUserIds.push(r.userId);
        }
      }

      if (studentUserIds.length === 0) {
        // Check users table for student role
        const userRows = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.tenantId, tenantId), eq(users.role, 'student')));

        for (const u of userRows) {
          if (!studentUserIds.includes(u.id)) {
            studentUserIds.push(u.id);
          }
        }
      }
    } catch {
      // DB offline fallback: scan inMemorySnapshots
      for (const key of this.inMemorySnapshots.keys()) {
        const [tId, uId] = key.split(':');
        if (tId === tenantId && !studentUserIds.includes(uId)) {
          studentUserIds.push(uId);
        }
      }
    }

    const categoryDistributions: Record<ReadinessCategory, number> = {
      READY: 0,
      DEVELOPING: 0,
      NEEDS_SUPPORT: 0,
      INSUFFICIENT_DATA: 0
    };

    let totalScore = 0;
    const studentsNeedingSupport: CohortReadiness['studentsNeedingSupport'] = [];
    const skillCounts = {
      total: 0,
      verified: 0,
      pending: 0,
      selfDeclared: 0
    };
    const gapFrequencyMap = new Map<string, number>();

    if (studentUserIds.length === 0) {
      return {
        totalStudents: 0,
        averageScore: 0,
        categoryDistributions,
        skillVerificationProgress: {
          totalSkills: 0,
          verifiedSkills: 0,
          pendingVerification: 0,
          selfDeclared: 0,
          verificationRate: 0
        },
        commonSkillGaps: [],
        studentsNeedingSupport: []
      };
    }

    for (const uId of studentUserIds) {
      const readiness = await this.calculateStudentReadiness(uId, tenantId);
      totalScore += readiness.score;
      categoryDistributions[readiness.category] = (categoryDistributions[readiness.category] || 0) + 1;

      // Track skills
      skillCounts.verified += readiness.verifiedStrengths.length;
      skillCounts.pending += readiness.skillsRequiringVerification.length;
      skillCounts.total += readiness.verifiedStrengths.length + readiness.skillsRequiringVerification.length;

      // Track common gaps
      for (const gap of readiness.skillsRequiringVerification) {
        gapFrequencyMap.set(gap, (gapFrequencyMap.get(gap) || 0) + 1);
      }

      if (readiness.category === 'NEEDS_SUPPORT' || readiness.category === 'INSUFFICIENT_DATA') {
        const { studentRecord, userName } = await this.resolveStudentProfile(uId, tenantId);
        studentsNeedingSupport.push({
          studentId: uId,
          studentName: userName || 'Student',
          rollNumber: studentRecord?.rollNumber,
          department: studentRecord?.department || 'General',
          score: readiness.score,
          category: readiness.category,
          criticalGaps: readiness.skillsRequiringVerification.slice(0, 3)
        });
      }
    }

    const averageScore = Number((totalScore / studentUserIds.length).toFixed(2));
    const verificationRate =
      skillCounts.total > 0
        ? Number((skillCounts.verified / skillCounts.total).toFixed(2))
        : 0;

    const commonSkillGaps = Array.from(gapFrequencyMap.entries())
      .map(([skillName, count]) => ({
        skillName,
        count,
        severity: count > 3 ? ('CRITICAL' as const) : ('MODERATE' as const)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalStudents: studentUserIds.length,
      averageScore,
      categoryDistributions,
      skillVerificationProgress: {
        totalSkills: skillCounts.total,
        verifiedSkills: skillCounts.verified,
        pendingVerification: skillCounts.pending,
        selfDeclared: skillCounts.selfDeclared,
        verificationRate
      },
      commonSkillGaps,
      studentsNeedingSupport
    };
  }

  /**
   * Aggregates readiness analytics grouped by academic department.
   */
  public async getDepartmentReadiness(tenantId: string): Promise<DepartmentReadiness[]> {
    const deptMap = new Map<
      string,
      {
        totalStudents: number;
        scoreSum: number;
        categoryCounts: Record<ReadinessCategory, number>;
        verifiedSkillCounts: Map<string, number>;
        gapCounts: Map<string, number>;
      }
    >();

    // Fetch all students in tenant
    try {
      const db = getDb();
      const studentList = await db
        .select({
          userId: students.userId,
          department: students.department
        })
        .from(students)
        .where(eq(students.tenantId, tenantId));

      for (const s of studentList) {
        const dept = s.department || 'General';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, {
            totalStudents: 0,
            scoreSum: 0,
            categoryCounts: { READY: 0, DEVELOPING: 0, NEEDS_SUPPORT: 0, INSUFFICIENT_DATA: 0 },
            verifiedSkillCounts: new Map(),
            gapCounts: new Map()
          });
        }

        const data = deptMap.get(dept)!;
        const readiness = await this.calculateStudentReadiness(s.userId, tenantId);

        data.totalStudents++;
        data.scoreSum += readiness.score;
        data.categoryCounts[readiness.category] = (data.categoryCounts[readiness.category] || 0) + 1;

        for (const v of readiness.verifiedStrengths) {
          data.verifiedSkillCounts.set(v, (data.verifiedSkillCounts.get(v) || 0) + 1);
        }
        for (const g of readiness.skillsRequiringVerification) {
          data.gapCounts.set(g, (data.gapCounts.get(g) || 0) + 1);
        }
      }
    } catch {
      // Fallback
    }

    const results: DepartmentReadiness[] = [];
    for (const [dept, data] of deptMap.entries()) {
      const averageScore =
        data.totalStudents > 0 ? Number((data.scoreSum / data.totalStudents).toFixed(2)) : 0;

      const topVerifiedSkills = Array.from(data.verifiedSkillCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill]) => skill);

      const topSkillGaps = Array.from(data.gapCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill]) => skill);

      results.push({
        department: dept,
        totalStudents: data.totalStudents,
        averageScore,
        categoryDistributions: data.categoryCounts,
        topVerifiedSkills,
        topSkillGaps
      });
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private async resolveStudentProfile(studentId: string, tenantId: string) {
    let userId = studentId;
    let studentRecord: any = null;
    let userName = '';

    try {
      const db = getDb();
      const matchedStudents = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.tenantId, tenantId),
            or(eq(students.id, studentId), eq(students.userId, studentId))
          )
        );

      if (matchedStudents.length > 0) {
        studentRecord = matchedStudents[0];
        userId = studentRecord.userId;
      }

      const userRow = await db
        .select({ name: users.fullName })
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, userId)));

      if (userRow.length > 0) {
        userName = userRow[0].name;
      }
    } catch {
      // DB offline fallback
      try {
        studentRecord = verificationService.getSeededStudent(studentId);
        const memUser =
          verificationService.getSeededUser(studentId) ||
          (studentRecord ? verificationService.getSeededUser(studentRecord.userId) : null);
        if (memUser) {
          userName = memUser.fullName || memUser.name || memUser.email || '';
        }
      } catch {
        // fallback resilient
      }
    }

    return { userId, studentRecord, userName };
  }

  private async checkStudentDocuments(userId: string, tenantId: string): Promise<boolean> {
    try {
      const db = getDb();
      const docs = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.tenantId, tenantId), eq(documents.ownerUserId, userId)))
        .limit(1);

      if (docs.length > 0) return true;

      const extractions = await db
        .select({ id: profileExtractions.id })
        .from(profileExtractions)
        .where(and(eq(profileExtractions.tenantId, tenantId), eq(profileExtractions.userId, userId)))
        .limit(1);

      return extractions.length > 0;
    } catch {
      return false;
    }
  }

  private generateExplanation(
    score: number,
    category: ReadinessCategory,
    dim: ReadinessDimensions,
    completeness: number,
    activeDimensions: Array<{ name: string; weight: number; score: number }>,
    missingDimensions: Array<{ name: string; weight: number }>,
    verifiedCount: number
  ): string {
    const completenessPct = Math.round(completeness * 100);
    const disclaimer =
      'Disclaimer: Readiness score indicates profile preparedness based on institutional evidence and does not guarantee placement.';

    if (category === 'INSUFFICIENT_DATA') {
      const activeSum = activeDimensions.reduce((s, d) => s + d.weight, 0);
      return `Placement readiness evaluation incomplete (${completenessPct}% profile completeness; available criteria weight ${(activeSum * 100).toFixed(0)}%). Please upload your primary resume, project evidence, or academic transcripts to unlock complete advisory indexing. ${disclaimer}`;
    }

    const contributingPhrase = `Contributing dimensions: ${activeDimensions
      .map((d) => `${d.name} (${(d.weight * 100).toFixed(0)}%, score: ${d.score.toFixed(1)}/100)`)
      .join(', ')}.`;

    const reweightingPhrase =
      missingDimensions.length > 0
        ? `Reweighted dimensions: ${missingDimensions
            .map((d) => `${d.name} (${(d.weight * 100).toFixed(0)}%)`)
            .join(', ')} omitted without scoring penalty due to sparse records (weights dynamically reweighted across available criteria).`
        : 'All 4 evaluation dimensions active.';

    if (category === 'READY') {
      return `Candidate exhibits high placement readiness (${score.toFixed(1)}/100, READY) with strong institutional verification across ${verifiedCount} core skills (${dim.verifiedSkillsScore.toFixed(1)}/100). Evidence coverage is robust at ${dim.evidenceCoverageScore.toFixed(1)}%, backed by ${dim.projectScore.toFixed(1)}/100 project depth. ${contributingPhrase} ${reweightingPhrase} Recommended for direct placement interviews. ${disclaimer}`;
    }

    if (category === 'DEVELOPING') {
      return `Candidate demonstrates solid technical foundations (${score.toFixed(1)}/100, DEVELOPING). Verified skill score is ${dim.verifiedSkillsScore.toFixed(1)}/100 with evidence coverage at ${dim.evidenceCoverageScore.toFixed(1)}% and project depth at ${dim.projectScore.toFixed(1)}/100. ${contributingPhrase} ${reweightingPhrase} Advancing to READY status requires submitting verifiable project repositories and securing TPO verification for pending claims. ${disclaimer}`;
    }

    return `Candidate requires targeted skill verification and hands-on portfolio enhancement (${score.toFixed(1)}/100, NEEDS_SUPPORT). Verified skill score is ${dim.verifiedSkillsScore.toFixed(1)}/100 and project depth is ${dim.projectScore.toFixed(1)}/100. ${contributingPhrase} ${reweightingPhrase} Recommended for specialized department workshops and structured capstone project mentoring. ${disclaimer}`;
  }

  private async persistSnapshot(
    tenantId: string,
    userId: string,
    result: ReadinessResult
  ): Promise<void> {
    const record: StudentReadinessSnapshotRecord = {
      id: crypto.randomUUID(),
      tenantId,
      studentId: userId,
      score: result.score,
      category: result.category,
      dimensions: result.dimensions,
      explanation: result.explanation,
      dataCompleteness: result.dataCompleteness,
      calculatedAt: new Date(result.calculatedAt || Date.now())
    };

    // Store in memory cache
    const key = `${tenantId}:${userId}`;
    const list = this.inMemorySnapshots.get(key) || [];
    list.unshift(record);
    this.inMemorySnapshots.set(key, list.slice(0, 20)); // Keep recent 20

    // Persist in Postgres if available
    try {
      const db = getDb();
      await db.insert(studentReadinessSnapshots).values({
        id: record.id,
        tenantId,
        studentId: userId,
        score: result.score.toFixed(2),
        category: result.category,
        dimensions: result.dimensions,
        explanation: result.explanation,
        dataCompleteness: result.dataCompleteness.toFixed(2),
        calculatedAt: record.calculatedAt as Date
      });

      // Update student table readiness score if row exists
      await db
        .update(students)
        .set({
          readinessScore: result.score.toFixed(2),
          updatedAt: new Date()
        })
        .where(and(eq(students.tenantId, tenantId), eq(students.userId, userId)));
    } catch {
      // In-memory fallback
    }
  }
}

export const readinessService = ReadinessService.getInstance();
