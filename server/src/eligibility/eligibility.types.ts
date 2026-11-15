/**
 * CarrerSync Eligibility Engine Types
 * Phase 10 — Job Requirement Specification & Eligibility Determination
 */

export type RecruitmentJobStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export type EligibilityResult = 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW' | 'INSUFFICIENT_DATA';

export type AdministrativeEligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW';

export type SkillMatchStatus =
  | 'VERIFIED_MATCH'
  | 'EVIDENCE_MATCH'
  | 'PENDING_VERIFICATION'
  | 'MISSING_SKILL'
  | 'NOT_ASSESSED';

export type OverallReviewStatus = 'ELIGIBLE' | 'NEEDS_REVIEW' | 'INELIGIBLE';

export type RuleEvaluationStatus = 'PASSED' | 'FAILED' | 'NEEDS_REVIEW' | 'INSUFFICIENT_INFO';

export interface RuleEvaluation {
  ruleName: string;
  status: RuleEvaluationStatus;
  details: string;
}

export interface EvaluationOverride {
  overriddenBy: string | null;
  overrideReason: string | null;
  overriddenAt?: string | Date | null;
}

export interface EvaluationResponse {
  result: EligibilityResult;
  administrativeEligibility: AdministrativeEligibilityStatus;
  skillMatchStatus: SkillMatchStatus;
  overallReviewStatus: OverallReviewStatus;
  matchedRequirements: string[];
  unmetRequirements: string[];
  missingInformation: string[];
  explanation: string;
  ruleEvaluations: RuleEvaluation[];
  override?: EvaluationOverride | null;
}

export interface JobRequirementDTO {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  eligibleDepartments?: string[];
  graduationYear?: number | null;
  minimumCgpa?: number | null;
  requiredSkills?: string[];
  preferredSkills?: string[];
  assessmentRequirements?: string[];
  deadline?: string | Date | null;
  status?: RecruitmentJobStatus;
}

export interface JobFilters {
  status?: RecruitmentJobStatus;
  companyName?: string;
  department?: string;
  search?: string;
}

export interface JobRequirementRecord {
  id: string;
  tenantId: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  eligibleDepartments: string[];
  graduationYear: number | null;
  minimumCgpa: string | number | null;
  requiredSkills: string[];
  preferredSkills: string[];
  assessmentRequirements: string[];
  deadline: Date | string | null;
  status: RecruitmentJobStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobEligibilityEvaluationRecord {
  id: string;
  tenantId: string;
  studentId: string;
  jobId: string;
  result: EligibilityResult;
  administrativeEligibility?: AdministrativeEligibilityStatus;
  skillMatchStatus?: SkillMatchStatus;
  overallReviewStatus?: OverallReviewStatus;
  matchedRequirements: string[];
  unmetRequirements: string[];
  missingInformation: string[];
  explanation: string;
  overriddenBy: string | null;
  overrideReason: string | null;
  evaluatedAt: Date;
}

export interface StudentCohortEvaluationItem {
  studentId: string;
  studentName?: string;
  department?: string;
  evaluation: EvaluationResponse;
}

export interface CohortEligibilityBreakdown {
  jobId: string;
  tenantId: string;
  totalEvaluated: number;
  eligibleCount: number;
  ineligibleCount: number;
  needsReviewCount: number;
  insufficientDataCount: number;
  evaluations: StudentCohortEvaluationItem[];
}
