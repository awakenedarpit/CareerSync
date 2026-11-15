/**
 * Placement Readiness Intelligence Engine & Skill Gap Diagnostics Types
 * CarrerSync Phase 10
 */

export type ReadinessCategory =
  | 'READY'
  | 'DEVELOPING'
  | 'NEEDS_SUPPORT'
  | 'INSUFFICIENT_DATA';

export type SkillGapStatus =
  | 'VERIFIED_MATCH'
  | 'EVIDENCE_MATCH'
  | 'PENDING_VERIFICATION'
  | 'MISSING_SKILL';

export type SkillGapSeverity = 'CRITICAL' | 'MODERATE' | 'MINOR';

export interface ReadinessDimensions {
  verifiedSkillsScore: number; // 0-100 (Weight: 35%)
  evidenceCoverageScore: number; // 0-100 (Weight: 25%)
  projectScore: number; // 0-100 (Weight: 20%)
  academicScore: number; // 0-100 (Weight: 20%)
}

export interface ReadinessResult {
  studentId?: string;
  score: number; // 0-100
  category: ReadinessCategory;
  dimensions: ReadinessDimensions;
  explanation: string;
  verifiedStrengths: string[];
  evidenceStrengths: string[];
  skillsRequiringVerification: string[];
  missingRequiredSkills: string[];
  recommendedActions: string[];
  dataCompleteness: number; // 0.00 to 1.00
  calculatedAt?: string;
}

export interface StudentReadinessSnapshotRecord {
  id: string;
  tenantId: string;
  studentId: string;
  score: number;
  category: ReadinessCategory;
  dimensions: ReadinessDimensions;
  explanation: string;
  dataCompleteness: number;
  calculatedAt: Date | string;
}

export interface SkillGapItem {
  skillName: string;
  category: string;
  status: SkillGapStatus;
  gapSeverity: SkillGapSeverity;
  suggestedLearning: string;
  recommendedActivity: string;
}

export interface SkillGapDiagnosis {
  studentId: string;
  targetRole?: string;
  overallFitScore: number; // 0-100
  summary: {
    totalRequired: number;
    verifiedMatches: number;
    evidenceMatches: number;
    pendingVerification: number;
    missingSkills: number;
  };
  gaps: SkillGapItem[];
  recommendations: string[];
}

export interface CohortReadiness {
  totalStudents: number;
  averageScore: number;
  categoryDistributions: Record<ReadinessCategory, number>;
  skillVerificationProgress: {
    totalSkills: number;
    verifiedSkills: number;
    pendingVerification: number;
    selfDeclared: number;
    verificationRate: number; // 0.00 to 1.00
  };
  commonSkillGaps: Array<{
    skillName: string;
    category?: string;
    count: number;
    severity: SkillGapSeverity;
  }>;
  studentsNeedingSupport: Array<{
    studentId: string;
    studentName?: string;
    rollNumber?: string;
    department?: string;
    score: number;
    category: ReadinessCategory;
    criticalGaps: string[];
  }>;
}

export interface DepartmentReadiness {
  department: string;
  totalStudents: number;
  averageScore: number;
  categoryDistributions: Record<ReadinessCategory, number>;
  topVerifiedSkills: string[];
  topSkillGaps: string[];
}
