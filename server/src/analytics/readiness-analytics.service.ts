/**
 * CarrerSync Phase 14 — Placement Readiness Analytics Service
 *
 * Implements:
 * 1. 4-Tier Student Placement Readiness Classification (HIGH_READINESS, MODERATE_READINESS, DEVELOPING_READINESS, INSUFFICIENT_DATA).
 * 2. Multi-dimensional evidence synthesis across 6 core dimensions:
 *    - verifiedSkills (25%)
 *    - evidenceCoverage (20%)
 *    - assessmentScores (20%)
 *    - academicRecords (15%)
 *    - interviewPractice (10%)
 *    - targetRoleAlignment (10%)
 * 3. Ethical missing data handling:
 *    - Missing assessment != 0 (unobserved data is never penalized as a failure).
 *    - Missing evidence != lack of ability.
 *    - Low coverage (< 40% or fewer than 3 observed dimensions) strictly produces INSUFFICIENT_DATA.
 *    - Observed dimensions are dynamically re-weighted to prevent artificial score suppression.
 * 4. Transparent contribution factor breakdowns and actionable recommendations.
 */

import {
  ReadinessTier,
  ReadinessDimension,
  DimensionContribution,
  ContributingFactor,
  StudentReadinessRecord,
  AnalyticsQueryFilters
} from './analytics.types';

export interface StudentInputData {
  studentId: string;
  studentName: string;
  tenantId: string;
  department: string;
  batchYear: string;
  targetRole: string;
  verifiedSkillsCount?: number | null;
  totalSkillsClaimed?: number | null;
  verifiedSkillsScore?: number | null; // 0-100
  evidenceCoverageRate?: number | null; // 0-1.0
  aptitudeScore?: number | null; // 0-100 or null if not taken
  codingScore?: number | null; // 0-100 or null if not taken
  cgpa?: number | null; // e.g. 8.2 or null
  activeBacklogs?: number | null;
  interviewScore?: number | null; // 0-100 or null if not taken
  mockInterviewsCompleted?: number | null;
  targetRoleSkillOverlapRate?: number | null; // 0-1.0
}

const DIMENSION_WEIGHTS: Record<ReadinessDimension, number> = {
  verifiedSkills: 0.25,
  evidenceCoverage: 0.20,
  assessmentScores: 0.20,
  academicRecords: 0.15,
  interviewPractice: 0.10,
  targetRoleAlignment: 0.10
};

export class ReadinessAnalyticsService {
  private static instance: ReadinessAnalyticsService;

  // In-memory store: `${tenantId}:${studentId}` -> StudentReadinessRecord
  private readinessStore = new Map<string, StudentReadinessRecord>();

  private constructor() {
    this.seedDefaultStudentData();
  }

  public static getInstance(): ReadinessAnalyticsService {
    if (!ReadinessAnalyticsService.instance) {
      ReadinessAnalyticsService.instance = new ReadinessAnalyticsService();
    }
    return ReadinessAnalyticsService.instance;
  }

  /**
   * Evaluates student readiness using multi-dimensional synthesis and missing data safeguards.
   */
  public evaluateStudentReadiness(input: StudentInputData): StudentReadinessRecord {
    const dimensions: Record<ReadinessDimension, DimensionContribution> = {
      verifiedSkills: this.evaluateVerifiedSkills(input),
      evidenceCoverage: this.evaluateEvidenceCoverage(input),
      assessmentScores: this.evaluateAssessmentScores(input),
      academicRecords: this.evaluateAcademicRecords(input),
      interviewPractice: this.evaluateInterviewPractice(input),
      targetRoleAlignment: this.evaluateTargetRoleAlignment(input)
    };

    const observedDimensions = (Object.keys(dimensions) as ReadinessDimension[]).filter(
      (k) => dimensions[k].isObserved
    );
    const missingDimensions = (Object.keys(dimensions) as ReadinessDimension[]).filter(
      (k) => !dimensions[k].isObserved
    );

    const totalObservedWeight = observedDimensions.reduce(
      (sum, k) => sum + DIMENSION_WEIGHTS[k],
      0
    );

    const dataCoveragePercentage = Math.round(
      (observedDimensions.length / Object.keys(dimensions).length) * 100
    );

    // Safeguard: Missing data handling
    // If fewer than 3 dimensions observed or coverage < 40%, strictly classify as INSUFFICIENT_DATA
    const isDataSufficient =
      observedDimensions.length >= 3 && dataCoveragePercentage >= 40 && totalObservedWeight > 0;

    let compositeScore: number | null = null;
    let readinessTier: ReadinessTier = 'INSUFFICIENT_DATA';
    const limitations: string[] = [];

    if (!isDataSufficient) {
      readinessTier = 'INSUFFICIENT_DATA';
      limitations.push(
        'Student profile has unobserved dimensions. Insufficient evidence to compute reliable placement readiness.'
      );
      if (missingDimensions.includes('assessmentScores')) {
        limitations.push('Aptitude or coding assessments have not been attempted (unobserved, not scored as 0).');
      }
      if (missingDimensions.includes('evidenceCoverage')) {
        limitations.push('Skill evidence documentation is pending submission.');
      }
    } else {
      // Re-weight observed dimensions proportionally
      let weightedSum = 0;
      for (const dimKey of observedDimensions) {
        const dim = dimensions[dimKey];
        if (dim.normalizedScore !== null) {
          const normalizedWeight = dim.weight / totalObservedWeight;
          dim.weightedContribution = Math.round(dim.normalizedScore * normalizedWeight * 10) / 10;
          weightedSum += dim.normalizedScore * normalizedWeight;
        }
      }

      compositeScore = Math.round(weightedSum * 10) / 10;

      if (compositeScore >= 75) {
        readinessTier = 'HIGH_READINESS';
      } else if (compositeScore >= 50) {
        readinessTier = 'MODERATE_READINESS';
      } else {
        readinessTier = 'DEVELOPING_READINESS';
      }

      if (missingDimensions.length > 0) {
        limitations.push(
          `Evaluated with partial data coverage (${dataCoveragePercentage}%). Missing: ${missingDimensions.join(', ')}.`
        );
      }
    }

    const contributingFactors = this.synthesizeContributingFactors(dimensions);
    const supportRecommendations = this.generateSupportRecommendations(
      readinessTier,
      dimensions,
      missingDimensions
    );

    const record: StudentReadinessRecord = {
      studentId: input.studentId,
      studentName: input.studentName,
      tenantId: input.tenantId,
      department: input.department,
      batchYear: input.batchYear,
      targetRole: input.targetRole,
      readinessTier,
      compositeScore,
      dataCoveragePercentage,
      isDataSufficient,
      dimensions,
      missingDimensions,
      contributingFactors,
      supportRecommendations,
      limitations,
      evaluatedAt: new Date().toISOString()
    };

    // Store in-memory cache
    this.readinessStore.set(`${input.tenantId}:${input.studentId}`, record);

    return record;
  }

  /**
   * Retrieves single student readiness record.
   */
  public getStudentReadiness(studentId: string, tenantId: string): StudentReadinessRecord | null {
    const record = this.readinessStore.get(`${tenantId}:${studentId}`);
    if (record) return record;

    // Search across default tenant if not found
    for (const [key, value] of this.readinessStore.entries()) {
      if (key.endsWith(`:${studentId}`)) {
        return value;
      }
    }
    return null;
  }

  /**
   * Lists student readiness records matching optional filters.
   */
  public listStudentReadiness(
    tenantId: string,
    filters?: AnalyticsQueryFilters
  ): StudentReadinessRecord[] {
    const results: StudentReadinessRecord[] = [];

    const tenantRecords = Array.from(this.readinessStore.values()).filter((r) => r.tenantId === tenantId);
    const candidateList =
      tenantRecords.length > 0
        ? tenantRecords
        : Array.from(this.readinessStore.values()).filter((r) => r.tenantId === 'default');

    for (const record of candidateList) {
      if (filters?.department && record.department.toLowerCase() !== filters.department.toLowerCase()) {
        continue;
      }
      if (filters?.batchYear && record.batchYear !== filters.batchYear) {
        continue;
      }
      if (filters?.readinessTier && record.readinessTier !== filters.readinessTier) {
        continue;
      }
      if (filters?.targetRole && !record.targetRole.toLowerCase().includes(filters.targetRole.toLowerCase())) {
        continue;
      }
      if (filters?.minCoverage && record.dataCoveragePercentage < filters.minCoverage) {
        continue;
      }
      results.push(record);
    }

    return results;
  }

  /**
   * Computes an overview summary across readiness tiers.
   */
  public getReadinessOverview(tenantId: string, filters?: AnalyticsQueryFilters) {
    const list = this.listStudentReadiness(tenantId, filters);

    const tierDistribution: Record<ReadinessTier, number> = {
      HIGH_READINESS: 0,
      MODERATE_READINESS: 0,
      DEVELOPING_READINESS: 0,
      INSUFFICIENT_DATA: 0
    };

    let totalScoreSum = 0;
    let scoredCount = 0;
    let totalCoverageSum = 0;

    for (const item of list) {
      tierDistribution[item.readinessTier]++;
      totalCoverageSum += item.dataCoveragePercentage;
      if (item.compositeScore !== null) {
        totalScoreSum += item.compositeScore;
        scoredCount++;
      }
    }

    return {
      totalEvaluated: list.length,
      tierDistribution,
      averageScore: scoredCount > 0 ? Math.round((totalScoreSum / scoredCount) * 10) / 10 : null,
      coverageAverage: list.length > 0 ? Math.round(totalCoverageSum / list.length) : 0,
      evaluatedCountWithSufficientData: scoredCount,
      evaluatedCountWithInsufficientData: tierDistribution.INSUFFICIENT_DATA
    };
  }

  // ---------------------------------------------------------------------------
  // Dimension Evaluation Helpers
  // ---------------------------------------------------------------------------

  private evaluateVerifiedSkills(input: StudentInputData): DimensionContribution {
    const weight = DIMENSION_WEIGHTS.verifiedSkills;
    if (input.verifiedSkillsScore !== undefined && input.verifiedSkillsScore !== null) {
      const score = Math.min(100, Math.max(0, input.verifiedSkillsScore));
      return {
        name: 'verifiedSkills',
        label: 'Verified Skill Competencies',
        rawScore: score,
        normalizedScore: score,
        weight,
        weightedContribution: Math.round(score * weight * 10) / 10,
        isObserved: true,
        status: score >= 75 ? 'STRONG' : score >= 50 ? 'ADEQUATE' : 'NEEDS_ATTENTION',
        explanation: `${input.verifiedSkillsCount || 0} skills verified by institutional TPO / faculty evaluation.`
      };
    }
    return {
      name: 'verifiedSkills',
      label: 'Verified Skill Competencies',
      rawScore: null,
      normalizedScore: null,
      weight,
      weightedContribution: 0,
      isObserved: false,
      status: 'UNOBSERVED',
      explanation: 'No verified skill evaluations on record yet.'
    };
  }

  private evaluateEvidenceCoverage(input: StudentInputData): DimensionContribution {
    const weight = DIMENSION_WEIGHTS.evidenceCoverage;
    if (input.evidenceCoverageRate !== undefined && input.evidenceCoverageRate !== null) {
      const normalizedScore = Math.min(100, Math.max(0, Math.round(input.evidenceCoverageRate * 100)));
      return {
        name: 'evidenceCoverage',
        label: 'Artifact & Project Evidence Coverage',
        rawScore: normalizedScore,
        normalizedScore,
        weight,
        weightedContribution: Math.round(normalizedScore * weight * 10) / 10,
        isObserved: true,
        status: normalizedScore >= 70 ? 'STRONG' : normalizedScore >= 40 ? 'ADEQUATE' : 'NEEDS_ATTENTION',
        explanation: `${normalizedScore}% of claimed competencies substantiated by artifacts, GitHub repos, or certifications.`
      };
    }
    return {
      name: 'evidenceCoverage',
      label: 'Artifact & Project Evidence Coverage',
      rawScore: null,
      normalizedScore: null,
      weight,
      weightedContribution: 0,
      isObserved: false,
      status: 'UNOBSERVED',
      explanation: 'Evidence submissions pending (unobserved, not penalizing baseline capability).'
    };
  }

  private evaluateAssessmentScores(input: StudentInputData): DimensionContribution {
    const weight = DIMENSION_WEIGHTS.assessmentScores;
    const hasAptitude = input.aptitudeScore !== undefined && input.aptitudeScore !== null;
    const hasCoding = input.codingScore !== undefined && input.codingScore !== null;

    if (hasAptitude || hasCoding) {
      let combinedScore = 0;
      if (hasAptitude && hasCoding) {
        combinedScore = Math.round(((input.aptitudeScore! + input.codingScore!) / 2) * 10) / 10;
      } else {
        combinedScore = hasAptitude ? input.aptitudeScore! : input.codingScore!;
      }
      return {
        name: 'assessmentScores',
        label: 'Aptitude & Technical Assessments',
        rawScore: combinedScore,
        normalizedScore: combinedScore,
        weight,
        weightedContribution: Math.round(combinedScore * weight * 10) / 10,
        isObserved: true,
        status: combinedScore >= 70 ? 'STRONG' : combinedScore >= 50 ? 'ADEQUATE' : 'NEEDS_ATTENTION',
        explanation: `Composite assessment performance: Aptitude ${hasAptitude ? input.aptitudeScore + '%' : 'N/A'}, Coding ${hasCoding ? input.codingScore + '%' : 'N/A'}.`
      };
    }

    return {
      name: 'assessmentScores',
      label: 'Aptitude & Technical Assessments',
      rawScore: null,
      normalizedScore: null,
      weight,
      weightedContribution: 0,
      isObserved: false,
      status: 'UNOBSERVED',
      explanation: 'Assessments not yet taken. Unobserved data is strictly not scored as zero.'
    };
  }

  private evaluateAcademicRecords(input: StudentInputData): DimensionContribution {
    const weight = DIMENSION_WEIGHTS.academicRecords;
    if (input.cgpa !== undefined && input.cgpa !== null) {
      // Normalize CGPA: 10-point scale -> 100-point scale with minor backlog deduction
      const backlogs = input.activeBacklogs || 0;
      const rawNormalized = Math.min(100, Math.max(0, input.cgpa * 10));
      const penalty = Math.min(30, backlogs * 10);
      const normalizedScore = Math.max(0, rawNormalized - penalty);

      return {
        name: 'academicRecords',
        label: 'Academic Consistency & CGPA',
        rawScore: input.cgpa,
        normalizedScore,
        weight,
        weightedContribution: Math.round(normalizedScore * weight * 10) / 10,
        isObserved: true,
        status: normalizedScore >= 75 ? 'STRONG' : normalizedScore >= 55 ? 'ADEQUATE' : 'NEEDS_ATTENTION',
        explanation: `CGPA of ${input.cgpa}/10 with ${backlogs} active backlogs.`
      };
    }

    return {
      name: 'academicRecords',
      label: 'Academic Consistency & CGPA',
      rawScore: null,
      normalizedScore: null,
      weight,
      weightedContribution: 0,
      isObserved: false,
      status: 'UNOBSERVED',
      explanation: 'Academic transcripts pending verification.'
    };
  }

  private evaluateInterviewPractice(input: StudentInputData): DimensionContribution {
    const weight = DIMENSION_WEIGHTS.interviewPractice;
    if (input.interviewScore !== undefined && input.interviewScore !== null) {
      const score = Math.min(100, Math.max(0, input.interviewScore));
      const sessions = input.mockInterviewsCompleted || 1;
      return {
        name: 'interviewPractice',
        label: 'Mock Interview Simulation',
        rawScore: score,
        normalizedScore: score,
        weight,
        weightedContribution: Math.round(score * weight * 10) / 10,
        isObserved: true,
        status: score >= 70 ? 'STRONG' : score >= 50 ? 'ADEQUATE' : 'NEEDS_ATTENTION',
        explanation: `Mock interview average score ${score}% across ${sessions} practice sessions.`
      };
    }

    return {
      name: 'interviewPractice',
      label: 'Mock Interview Simulation',
      rawScore: null,
      normalizedScore: null,
      weight,
      weightedContribution: 0,
      isObserved: false,
      status: 'UNOBSERVED',
      explanation: 'No mock interview sessions recorded yet.'
    };
  }

  private evaluateTargetRoleAlignment(input: StudentInputData): DimensionContribution {
    const weight = DIMENSION_WEIGHTS.targetRoleAlignment;
    if (input.targetRoleSkillOverlapRate !== undefined && input.targetRoleSkillOverlapRate !== null) {
      const score = Math.min(100, Math.max(0, Math.round(input.targetRoleSkillOverlapRate * 100)));
      return {
        name: 'targetRoleAlignment',
        label: 'Target Role Alignment',
        rawScore: score,
        normalizedScore: score,
        weight,
        weightedContribution: Math.round(score * weight * 10) / 10,
        isObserved: true,
        status: score >= 70 ? 'STRONG' : score >= 45 ? 'ADEQUATE' : 'NEEDS_ATTENTION',
        explanation: `${score}% verified skill match with institutional profile requirements for '${input.targetRole}'.`
      };
    }

    return {
      name: 'targetRoleAlignment',
      label: 'Target Role Alignment',
      rawScore: null,
      normalizedScore: null,
      weight,
      weightedContribution: 0,
      isObserved: false,
      status: 'UNOBSERVED',
      explanation: 'Target role preferences not finalized.'
    };
  }

  private synthesizeContributingFactors(
    dimensions: Record<ReadinessDimension, DimensionContribution>
  ): ContributingFactor[] {
    const factors: ContributingFactor[] = [];

    for (const dim of Object.values(dimensions)) {
      if (!dim.isObserved) continue;
      if (dim.status === 'STRONG') {
        factors.push({
          dimension: dim.name,
          factor: dim.label,
          impact: 'POSITIVE',
          weight: dim.weight,
          explanation: `Strong foundation in ${dim.label.toLowerCase()} (${dim.normalizedScore}%).`
        });
      } else if (dim.status === 'NEEDS_ATTENTION') {
        factors.push({
          dimension: dim.name,
          factor: dim.label,
          impact: 'NEGATIVE',
          weight: dim.weight,
          explanation: `Opportunity to strengthen ${dim.label.toLowerCase()} (currently ${dim.normalizedScore}%).`
        });
      } else {
        factors.push({
          dimension: dim.name,
          factor: dim.label,
          impact: 'NEUTRAL',
          weight: dim.weight,
          explanation: `Adequate baseline established for ${dim.label.toLowerCase()}.`
        });
      }
    }

    return factors;
  }

  private generateSupportRecommendations(
    tier: ReadinessTier,
    dimensions: Record<ReadinessDimension, DimensionContribution>,
    missingDimensions: ReadinessDimension[]
  ): string[] {
    const recs: string[] = [];

    if (tier === 'INSUFFICIENT_DATA') {
      recs.push('Complete preliminary profile assessment and upload portfolio artifacts to establish baseline readiness.');
      if (missingDimensions.includes('assessmentScores')) {
        recs.push('Schedule initial Aptitude & Coding diagnostic mock drive.');
      }
      return recs;
    }

    if (dimensions.assessmentScores.status === 'NEEDS_ATTENTION') {
      recs.push('Participate in Phase 12 Aptitude Practice Modules focused on Data Interpretation and Quantitative Logic.');
    }
    if (dimensions.interviewPractice.status === 'NEEDS_ATTENTION' || !dimensions.interviewPractice.isObserved) {
      recs.push('Book a 1-on-1 AI Mock Interview session to gain real-time conversational confidence.');
    }
    if (dimensions.evidenceCoverage.status === 'NEEDS_ATTENTION') {
      recs.push('Link verified GitHub repositories or industry capstone projects to substantiate claimed skills.');
    }
    if (dimensions.targetRoleAlignment.status === 'NEEDS_ATTENTION') {
      recs.push('Review recommended curriculum roadmap for the target role to address key missing competencies.');
    }

    if (recs.length === 0) {
      recs.push('Maintain high placement readiness through advanced coding challenges and tier-1 mock interview tracks.');
    }

    return recs;
  }

  // ---------------------------------------------------------------------------
  // Default Seed Data
  // ---------------------------------------------------------------------------

  private seedDefaultStudentData() {
    const seeds: StudentInputData[] = [
      {
        studentId: 'std-cse-01',
        studentName: 'Aarav Sharma',
        tenantId: 'default',
        department: 'CSE',
        batchYear: '2026',
        targetRole: 'Full Stack Developer',
        verifiedSkillsCount: 9,
        totalSkillsClaimed: 10,
        verifiedSkillsScore: 88,
        evidenceCoverageRate: 0.9,
        aptitudeScore: 84,
        codingScore: 86,
        cgpa: 8.9,
        activeBacklogs: 0,
        interviewScore: 82,
        mockInterviewsCompleted: 3,
        targetRoleSkillOverlapRate: 0.85
      },
      {
        studentId: 'std-cse-02',
        studentName: 'Rhea Sen',
        tenantId: 'default',
        department: 'CSE',
        batchYear: '2026',
        targetRole: 'Backend Engineer',
        verifiedSkillsCount: 6,
        totalSkillsClaimed: 9,
        verifiedSkillsScore: 68,
        evidenceCoverageRate: 0.65,
        aptitudeScore: 65,
        codingScore: 72,
        cgpa: 7.8,
        activeBacklogs: 0,
        interviewScore: 60,
        mockInterviewsCompleted: 2,
        targetRoleSkillOverlapRate: 0.7
      },
      {
        studentId: 'std-it-01',
        studentName: 'Vikram Joshi',
        tenantId: 'default',
        department: 'IT',
        batchYear: '2026',
        targetRole: 'DevOps Engineer',
        verifiedSkillsCount: 8,
        totalSkillsClaimed: 9,
        verifiedSkillsScore: 82,
        evidenceCoverageRate: 0.8,
        aptitudeScore: 78,
        codingScore: 80,
        cgpa: 8.4,
        activeBacklogs: 0,
        interviewScore: 75,
        mockInterviewsCompleted: 2,
        targetRoleSkillOverlapRate: 0.8
      },
      {
        studentId: 'std-ece-01',
        studentName: 'Neha Nair',
        tenantId: 'default',
        department: 'ECE',
        batchYear: '2026',
        targetRole: 'Embedded Systems Engineer',
        verifiedSkillsCount: 5,
        totalSkillsClaimed: 8,
        verifiedSkillsScore: 58,
        evidenceCoverageRate: 0.5,
        aptitudeScore: 52,
        codingScore: 48,
        cgpa: 7.2,
        activeBacklogs: 0,
        interviewScore: 55,
        mockInterviewsCompleted: 1,
        targetRoleSkillOverlapRate: 0.6
      },
      {
        studentId: 'std-mech-01',
        studentName: 'Aditya Patil',
        tenantId: 'default',
        department: 'Mechanical',
        batchYear: '2026',
        targetRole: 'Design Engineer',
        verifiedSkillsCount: 4,
        totalSkillsClaimed: 8,
        verifiedSkillsScore: 45,
        evidenceCoverageRate: 0.4,
        aptitudeScore: 42,
        codingScore: 38,
        cgpa: 6.8,
        activeBacklogs: 1,
        interviewScore: 46,
        mockInterviewsCompleted: 1,
        targetRoleSkillOverlapRate: 0.45
      },
      {
        studentId: 'std-civil-01',
        studentName: 'Pooja Verma',
        tenantId: 'default',
        department: 'Civil',
        batchYear: '2026',
        targetRole: 'Structural Engineer',
        verifiedSkillsCount: 2,
        totalSkillsClaimed: 6,
        verifiedSkillsScore: null, // Missing verified scores
        evidenceCoverageRate: null, // Missing evidence
        aptitudeScore: null, // Has not taken assessments
        codingScore: null,
        cgpa: 7.0,
        activeBacklogs: 0,
        interviewScore: null,
        mockInterviewsCompleted: 0,
        targetRoleSkillOverlapRate: 0.3
      },
      {
        studentId: 'std-eee-01',
        studentName: 'Karan Mehra',
        tenantId: 'default',
        department: 'EEE',
        batchYear: '2026',
        targetRole: 'Power Systems Engineer',
        verifiedSkillsCount: 7,
        totalSkillsClaimed: 8,
        verifiedSkillsScore: 74,
        evidenceCoverageRate: 0.75,
        aptitudeScore: 70,
        codingScore: 68,
        cgpa: 8.0,
        activeBacklogs: 0,
        interviewScore: 72,
        mockInterviewsCompleted: 2,
        targetRoleSkillOverlapRate: 0.75
      }
    ];

    for (const seed of seeds) {
      this.evaluateStudentReadiness(seed);
    }
  }
}

export const readinessAnalyticsService = ReadinessAnalyticsService.getInstance();
