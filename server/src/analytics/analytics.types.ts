/**
 * CarrerSync Phase 14 — Predictive Placement Analytics Agent Types
 *
 * Comprehensive domain interfaces and schemas for:
 * 1. 4-Tier Student Placement Readiness Classification
 * 2. Multi-Dimensional Evidence Synthesis & Missing Data Handling
 * 3. Interpretable Statistical Prediction Models & Validation Metrics
 * 4. 7 Diagnostic Student Support Categories & Non-Stigmatizing Intervention Workflow
 * 5. Cohort & Departmental Analytics with Small-Group Suppression (N < 5)
 * 6. Phase 12 Mock Drive Intelligence & Progression Tracking
 * 7. Longitudinal Multi-Source Skill Tracking (Enforcing TPO Verification Authority)
 * 8. Historical Placement Trends & Corporate Recruiter Engagement Analytics
 * 9. Interpretable Placement Forecasting Engine (Zero Artificial Confidence Intervals)
 * 10. Audit-Oriented Fairness Monitoring System (Zero Sensitive Attribute Ranking)
 * 11. Institutional TPO Recommendations & Automated Audit Reports
 */

// ---------------------------------------------------------------------------
// 1. Placement Readiness Dimensions & Tiers
// ---------------------------------------------------------------------------

export const READINESS_TIERS = [
  'HIGH_READINESS',
  'MODERATE_READINESS',
  'DEVELOPING_READINESS',
  'INSUFFICIENT_DATA'
] as const;

export type ReadinessTier = (typeof READINESS_TIERS)[number];

export const READINESS_DIMENSIONS = [
  'verifiedSkills',
  'evidenceCoverage',
  'assessmentScores',
  'academicRecords',
  'interviewPractice',
  'targetRoleAlignment'
] as const;

export type ReadinessDimension = (typeof READINESS_DIMENSIONS)[number];

export interface DimensionContribution {
  name: ReadinessDimension;
  label: string;
  rawScore: number | null; // null if unobserved / missing
  normalizedScore: number | null; // 0-100 or null
  weight: number; // e.g. 0.25 (sums to 1.0)
  weightedContribution: number; // raw contribution to composite
  isObserved: boolean;
  status: 'STRONG' | 'ADEQUATE' | 'NEEDS_ATTENTION' | 'UNOBSERVED';
  explanation: string;
}

export interface ContributingFactor {
  dimension: ReadinessDimension | string;
  factor: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  weight: number;
  explanation: string;
}

export interface StudentReadinessRecord {
  studentId: string;
  studentName: string;
  tenantId: string;
  department: string;
  batchYear: string;
  targetRole: string;
  readinessTier: ReadinessTier;
  compositeScore: number | null; // null when INSUFFICIENT_DATA
  dataCoveragePercentage: number; // 0-100%
  isDataSufficient: boolean;
  dimensions: Record<ReadinessDimension, DimensionContribution>;
  missingDimensions: ReadinessDimension[];
  contributingFactors: ContributingFactor[];
  supportRecommendations: string[];
  limitations: string[];
  evaluatedAt: string;
}

// ---------------------------------------------------------------------------
// 2. Statistical Prediction Models & Validation Structures
// ---------------------------------------------------------------------------

export const PREDICTION_TARGETS = [
  'PLACEMENT_OFFER',
  'TIER_1_OFFER',
  'FIRST_ROUND_CLEARANCE',
  'MOCK_CONVERSION'
] as const;

export type PredictionTarget = (typeof PREDICTION_TARGETS)[number];

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface ModelValidationMetrics {
  modelName: string;
  target: PredictionTarget;
  sampleSize: number;
  trainSize: number;
  validationSize: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  brierScore: number;
  calibrationSlope: number;
  expectedCalibrationError: number;
  confusionMatrix: ConfusionMatrix;
  classImbalanceRatio: number; // minority / total
  hasSevereClassImbalance: boolean;
  validationDate: string;
}

export interface StudentPredictionRecord {
  id: string;
  studentId: string;
  studentName: string;
  tenantId: string;
  department: string;
  batchYear: string;
  target: PredictionTarget;
  estimatedProbability: number | null; // strictly null if INSUFFICIENT_DATA
  status: 'COMPUTED' | 'INSUFFICIENT_DATA';
  dataCoveragePercentage: number;
  modelUsed: string;
  confidenceInterval: [number, number] | null; // [lower, upper] based on standard error
  contributingFactors: ContributingFactor[];
  limitations: string[];
  canExcludeStudent: false; // Ethical rule: predictions never auto-reject students
  timestamp: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// 3. Diagnostic Student Support Categories & Review Workflow
// ---------------------------------------------------------------------------

export const SUPPORT_CATEGORIES = [
  'SKILL_DEVELOPMENT',
  'ASSESSMENT_PRACTICE',
  'PROJECT_GUIDANCE',
  'PROFILE_COMPLETION',
  'INTERVIEW_PREPARATION',
  'ADDITIONAL_REVIEW',
  'INSUFFICIENT_DATA'
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const INTERVENTION_STATUSES = [
  'IDENTIFIED',
  'UNDER_TPO_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'RESOLVED',
  'DISMISSED'
] as const;

export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

export interface StudentSupportItem {
  id: string;
  studentId: string;
  studentName: string;
  tenantId: string;
  department: string;
  batchYear: string;
  targetRole: string;
  category: SupportCategory;
  title: string;
  nonStigmatizingDescription: string;
  identifiedGaps: string[];
  recommendedActions: string[];
  status: InterventionStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  tpoReviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  auditTrail: {
    fromStatus: InterventionStatus;
    toStatus: InterventionStatus;
    changedBy: string;
    notes?: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 4. Cohort & Departmental Analytics with Small-Group Suppression
// ---------------------------------------------------------------------------

export const STANDARD_DEPARTMENTS = [
  'CSE',
  'IT',
  'ECE',
  'EEE',
  'Mechanical',
  'Civil'
] as const;

export type StandardDepartment = (typeof STANDARD_DEPARTMENTS)[number];

export const SMALL_GROUP_SUPPRESSION_THRESHOLD = 5;

export interface CohortAnalyticsSummary {
  tenantId: string;
  department: string;
  batchYear: string;
  totalStudents: number;
  sampleSize: number;
  dataCoveragePercentage: number;
  isSuppressed: boolean;
  suppressionReason?: string;
  readinessTierDistribution: Record<ReadinessTier, number>;
  averageReadinessScore: number | null;
  averageAptitudeScore: number | null;
  averageCodingScore: number | null;
  averageInterviewScore: number | null;
  placementRatePercentage: number | null;
  topStrengths: string[];
  commonSupportNeeds: string[];
  lastCalculatedAt: string;
}

export interface BatchComparisonItem {
  batchYear: string;
  totalStudents: number;
  sampleSize: number;
  coveragePercentage: number;
  averageScore: number | null;
  placedPercentage: number | null;
  isSuppressed: boolean;
}

// ---------------------------------------------------------------------------
// 5. Phase 12 Mock Drive Analytics
// ---------------------------------------------------------------------------

export interface MockDriveAnalyticsSummary {
  tenantId: string;
  totalMockDrives: number;
  totalParticipations: number;
  uniqueStudentsParticipated: number;
  aptitudePassRatePercentage: number;
  codingSubmissionPassRatePercentage: number;
  interviewAverageScore: number;
  roundProgression: {
    round: string;
    registeredCount: number;
    completedCount: number;
    clearedCount: number;
    clearanceRate: number;
  }[];
  topicWiseWeaknesses: {
    topic: string;
    category: 'Aptitude' | 'Coding' | 'Interview';
    difficultyLevel: string;
    averageScore: number;
    studentsNeedingPractice: number;
  }[];
  practiceDistinctionNotice: string; // Explains mock drives are safe practice, not exclusion criteria
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 6. Longitudinal Skill Improvement Tracking
// ---------------------------------------------------------------------------

export interface StudentSkillProgressItem {
  studentId: string;
  skillName: string;
  baselineScore: number;
  currentScore: number;
  improvementDelta: number;
  assessmentScoreDelta: number;
  completedTasksCount: number;
  isVerified: boolean;
  verifiedByTpo: boolean; // Enforce policy: learning tasks alone do NOT grant verified status without TPO
  verificationDate?: string;
  lastUpdated: string;
}

export interface SkillImprovementCohortSummary {
  tenantId: string;
  department?: string;
  batchYear?: string;
  totalTrackedSkills: number;
  averageDeltaScore: number;
  skillsWithMostGrowth: { skill: string; averageGain: number; studentCount: number }[];
  learningTaskCompletions: number;
  tpoVerificationsPending: number;
  tpoVerificationsApproved: number;
  policyNotice: string;
}

// ---------------------------------------------------------------------------
// 7. Historical Placement Trends & Recruiter Analytics
// ---------------------------------------------------------------------------

export interface HistoricalPlacementTrendYear {
  academicYear: string;
  batchYear: string;
  eligibleStudents: number;
  totalOffers: number;
  uniqueStudentsPlaced: number;
  placementRatePercentage: number;
  conversionRatePercentage: number; // offers / eligible
  participatingCompanies: number;
  roleDistribution: { role: string; count: number; percentage: number }[];
  salaryDistribution?: {
    minLpa: number;
    medianLpa: number;
    meanLpa: number;
    maxLpa: number;
    p25Lpa: number;
    p75Lpa: number;
  };
  sampleSize: number;
  isDataComplete: boolean;
  dataNotes?: string;
}

export interface RecruiterEngagementMetric {
  companyId: string;
  companyName: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'STARTUP';
  status: 'ACTIVE' | 'ONBOARDED' | 'COMPLETED';
  drivesConducted: number;
  jobsPosted: number;
  jobsApproved: number;
  studentsApplied: number;
  studentsShortlisted: number;
  studentsInterviewed: number;
  offersReleased: number;
  offersAccepted: number;
  conversionRatePercentage: number; // offers / applicants
  averagePackageLpa: number;
  lastDriveDate: string;
}

// ---------------------------------------------------------------------------
// 8. Placement Forecasting Engine
// ---------------------------------------------------------------------------

export type ForecastMethod =
  | 'WEIGHTED_MOVING_AVERAGE'
  | 'LINEAR_REGRESSION'
  | 'HISTORICAL_AVERAGE';

export interface PlacementForecastItem {
  targetPeriod: string; // e.g. "Batch 2026" or "2026-H1"
  forecastValue: number | null; // e.g. estimated placement rate % or offers
  status: 'FORECAST_AVAILABLE' | 'FORECAST_UNAVAILABLE';
  observationCount: number;
  range: [number, number] | null; // [minForecast, maxForecast]
  uncertaintyPercentage: number | null; // Standard error / uncertainty
  freshnessTimestamp: string;
  methodUsed: ForecastMethod;
  limitations: string[];
  historicalBaselines: { period: string; actualRate: number }[];
}

// ---------------------------------------------------------------------------
// 9. Fairness Monitoring System
// ---------------------------------------------------------------------------

export interface DepartmentCoverageFairness {
  department: string;
  totalStudents: number;
  evaluatedStudents: number;
  coveragePercentage: number;
  isSuppressed: boolean;
  averageProbability: number | null;
  missingAssessmentDisparity: number; // % missing assessments
  missingEvidenceDisparity: number; // % missing evidence
}

export interface FairnessAuditReport {
  tenantId: string;
  auditTimestamp: string;
  coverageByDepartment: Record<string, DepartmentCoverageFairness>;
  smallGroupSuppressionThreshold: number; // 5
  suppressedGroupsCount: number;
  disparateImpactRatio: number; // minCoverage / maxCoverage across departments
  zeroSensitiveAttributesVerified: true; // Verified: no gender, caste, religion, demographic ranking
  fairnessStatus: 'HEALTHY' | 'DISPARITY_DETECTED' | 'INSUFFICIENT_AUDIT_DATA';
  identifiedDisparities: string[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// 10. Institutional TPO Interventions & Placement Reports
// ---------------------------------------------------------------------------

export interface TpoInstitutionalIntervention {
  id: string;
  tenantId: string;
  title: string;
  reason: string;
  aggregateEvidence: string;
  targetCohort: {
    department?: string;
    batchYear?: string;
    studentCount: number;
  };
  objective: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: InterventionStatus;
  estimatedImpact: string;
  suggestedActionPlan: string[];
  assignedLead?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementReportSummary {
  id: string;
  tenantId: string;
  title: string;
  academicYear: string;
  generatedAt: string;
  generatedBy: string;
  executiveSummary: string;
  overview: {
    totalStudents: number;
    evaluatedStudents: number;
    readinessDistribution: Record<ReadinessTier, number>;
    highReadinessPercentage: number;
    activeRecruitersCount: number;
    totalJobOffersProjected: number;
  };
  departmentBreakdown: CohortAnalyticsSummary[];
  recruiterEngagement: {
    totalCompanies: number;
    topHiringPartners: string[];
    averageConversionRate: number;
  };
  forecastSummary: PlacementForecastItem;
  fairnessSummary: {
    fairnessStatus: 'HEALTHY' | 'DISPARITY_DETECTED' | 'INSUFFICIENT_AUDIT_DATA';
    suppressedGroupsCount: number;
    zeroSensitiveAttributesVerified: boolean;
  };
  recommendedInterventions: TpoInstitutionalIntervention[];
  markdownContent: string;
}

// ---------------------------------------------------------------------------
// 11. Query Filters
// ---------------------------------------------------------------------------

export interface AnalyticsQueryFilters {
  department?: string;
  batchYear?: string;
  readinessTier?: ReadinessTier;
  supportCategory?: SupportCategory;
  interventionStatus?: InterventionStatus;
  targetRole?: string;
  minCoverage?: number;
}
