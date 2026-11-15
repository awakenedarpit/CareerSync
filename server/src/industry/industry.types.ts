/**
 * CarrerSync Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine Types
 *
 * Domain types covering:
 * 1. Standardized 8-Category Skill Taxonomy with ESCO / O*NET / NSQF Metadata
 * 2. 14 Standard Target Roles & Curriculum Skill Templates
 * 3. Job Description Ingestion, Content Deduplication, & Provenance
 * 4. AI-Assisted JD Extraction Pipeline, Confidence Scoring, & Human Review
 * 5. Industry Skill Demand Aggregation & Emerging Trend Analytics
 * 6. 6-Tier Student Skill-Gap Diagnostics & Phase 12 Learning Task Integration
 * 7. Explainable Career Role Recommendation Engine with INSUFFICIENT_DATA Safeguards
 * 8. Company-Specific Skill Intelligence
 * 9. Institutional Cohort Skill-Gap Snapshots & Training Interventions
 */

// ---------------------------------------------------------------------------
// 1. Skill Taxonomy & Canonical Standards
// ---------------------------------------------------------------------------

export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Database',
  'Cloud & DevOps',
  'Data & AI',
  'Core Computer Science',
  'Professional Skills'
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export interface ExternalSkillStandardMapping {
  escoUri?: string;
  escoTitle?: string;
  onetCode?: string;
  onetTitle?: string;
  nsqfLevel?: number; // National Skills Qualification Framework (India) level 4-8
  carrersyncCategory: SkillCategory;
}

export interface TaxonomySkill {
  id: string;
  canonicalName: string;
  category: SkillCategory;
  aliases: string[];
  description: string;
  externalMappings: ExternalSkillStandardMapping;
  isPopularDemand: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 2. 14 Standard Target Roles & Templates
// ---------------------------------------------------------------------------

export const STANDARD_TARGET_ROLES_14 = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cybersecurity Analyst',
  'QA / Test Automation Engineer',
  'Mobile App Developer',
  'Java Software Engineer',
  'Python / Data Engineer'
] as const;

export type StandardTargetRole14 = (typeof STANDARD_TARGET_ROLES_14)[number];

export interface RoleSkillRequirementTemplate {
  id: string;
  roleName: StandardTargetRole14;
  displayName: string;
  category: 'Software Engineering' | 'Data & Analytics' | 'Infrastructure & Security' | 'Quality & Testing';
  description: string;
  coreSkills: string[]; // Essential mandatory skills for placement readiness
  foundationalSkills: string[]; // Computer science / theoretical foundations
  preferredSkills: string[]; // Nice-to-have differentiating skills
  minimumPassReadinessScore: number; // 0 - 100 threshold for placement eligibility
  sampleJDsCount: number;
}

// ---------------------------------------------------------------------------
// 3. Job Description Ingestion & Provenance
// ---------------------------------------------------------------------------

export type JDProvenance =
  | 'TPO_UPLOAD'
  | 'RECRUITER_SUBMISSION'
  | 'CAMPUS_DRIVE'
  | 'INDUSTRY_FEED';

export type JDProcessingStatus =
  | 'RAW'
  | 'ANALYZED'
  | 'REVIEWED'
  | 'ARCHIVED';

export interface ExtractedSkill {
  skillName: string;
  canonicalName: string;
  category: SkillCategory;
  importance: 'REQUIRED' | 'PREFERRED';
  confidence: number; // 0 - 100
  rawMention?: string;
}

export interface HumanReviewAudit {
  isReviewed: boolean;
  reviewedBy: string; // TPO or Admin user ID
  reviewerName?: string;
  reviewedAt: string;
  notes?: string;
  originalRole?: string;
  correctedRole?: string;
  addedSkills?: string[];
  removedSkills?: string[];
}

export interface JobDescriptionAnalysis {
  roleClassification: string;
  roleConfidence: number; // 0 - 100
  requiredSkills: ExtractedSkill[];
  preferredSkills: ExtractedSkill[];
  experienceYearsMin: number;
  experienceYearsMax?: number;
  educationRequirements: string[];
  confidenceScore: number; // Overall analysis confidence (0 - 100)
  analysisProvider: 'gemini' | 'rule-based';
  analyzedAt: string;
  humanReview?: HumanReviewAudit;
}

export interface JobDescriptionRecord {
  id: string;
  tenantId: string;
  title: string;
  companyName: string;
  industryDomain: string;
  sourceProvenance: JDProvenance;
  rawText: string;
  normalizedText: string;
  contentHash: string; // SHA-256 for deduplication
  status: JDProcessingStatus;
  analysis?: JobDescriptionAnalysis;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 4. Industry Demand & Emerging Trends Analytics
// ---------------------------------------------------------------------------

export type TrendMomentum = 'EMERGING' | 'GROWING' | 'STABLE' | 'DECLINING';

export interface SkillDemandMetric {
  skillName: string;
  canonicalName: string;
  category: SkillCategory;
  frequencyCount: number;
  percentageOfTotalJDs: number;
  requiredCount: number;
  preferredCount: number;
  topRoles: { roleName: string; count: number }[];
  topCompanies: { companyName: string; count: number }[];
  sampleSize: number;
  confidenceScore: number;
}

export interface SkillTrendMetric {
  skillName: string;
  canonicalName: string;
  category: SkillCategory;
  currentPeriodCount: number;
  previousPeriodCount: number;
  currentPercentage: number;
  previousPercentage: number;
  growthPercentage: number; // +X% or -X%
  momentum: TrendMomentum;
  sampleSizeCurrent: number;
  sampleSizePrevious: number;
  isStatisticallySignificant: boolean; // guarded against low sample size distortion
}

export interface IndustryOverviewAnalytics {
  totalAnalyzedJDs: number;
  totalUniqueSkills: number;
  dataFreshnessLabel: {
    totalAnalyzedJDs: number;
    collectionPeriod: string;
    lastUpdated: string;
    dataAttribution: string;
    zeroFabricatedDisclaimer: string;
  };
  topInDemandSkills: SkillDemandMetric[];
  emergingTrends: SkillTrendMetric[];
  roleDistribution: { roleName: string; jdCount: number; percentage: number }[];
  categoryBreakdown: { category: SkillCategory; skillCount: number; averageDemandPct: number }[];
}

// ---------------------------------------------------------------------------
// 5. 6-Tier Student Skill-Gap Diagnosis
// ---------------------------------------------------------------------------

export const SKILL_GAP_TIERS = [
  'VERIFIED_MATCH',
  'EVIDENCE_AVAILABLE',
  'PENDING_VERIFICATION',
  'IMPROVEMENT_NEEDED',
  'MISSING_EVIDENCE',
  'NOT_ASSESSED'
] as const;

export type SkillGapTier = (typeof SKILL_GAP_TIERS)[number];

export interface StudentSkillGapItem {
  skillName: string;
  canonicalName: string;
  category: SkillCategory;
  tier: SkillGapTier;
  importance: 'REQUIRED' | 'PREFERRED';
  studentProficiencyScore?: number; // 0 - 100 if assessed
  evidenceDetails?: {
    evidenceId?: string;
    title?: string;
    type?: string; // REPOSITORY, PROJECT, CERTIFICATION
    url?: string;
  };
  actionableExplanation: string;
  recommendedLearningTaskId?: string;
  recommendedRemediationAction: string;
}

export interface StudentSkillGapReport {
  studentId: string;
  tenantId: string;
  targetRole: string;
  targetRoleId: string;
  overallMatchPercentage: number;
  verifiedMatchPercentage: number;
  tierBreakdown: Record<SkillGapTier, number>;
  skillItems: StudentSkillGapItem[];
  criticalGaps: string[];
  strengths: string[];
  assessedAt: string;
}

// ---------------------------------------------------------------------------
// 6. Career Role Recommendation Engine
// ---------------------------------------------------------------------------

export type CareerFitLevel =
  | 'STRONG_MATCH' // >= 80%
  | 'GOOD_MATCH' // 65% - 79%
  | 'MODERATE_MATCH' // 50% - 64%
  | 'DEVELOPING'; // < 50%

export type RecommendationStatus =
  | 'ACTIVE'
  | 'SAVED'
  | 'DISMISSED'
  | 'PRIMARY_GOAL';

export interface SuggestedProject {
  title: string;
  description: string;
  skillsTargeted: string[];
  estimatedWeeks: number;
}

export interface CareerRecommendation {
  id: string;
  studentId: string;
  tenantId: string;
  roleName: StandardTargetRole14 | string;
  targetRoleId: string;
  matchScore: number; // 0 - 100
  fitLevel: CareerFitLevel;
  strengths: string[];
  gapsToClose: string[];
  suggestedProjects: SuggestedProject[];
  isInsufficientData: boolean; // Safeguard if profile is sparse (<2 skills/evidence)
  status: RecommendationStatus;
  rationale: string;
  advisoryDisclaimer: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 7. Company-Specific Skill Intelligence
// ---------------------------------------------------------------------------

export interface CompanySkillIntelligence {
  companyId: string;
  companyName: string;
  industryDomain: string;
  activeJDsCount: number;
  historicalJDsCount: number;
  topRequiredSkills: {
    skillName: string;
    canonicalName: string;
    demandPercentage: number;
    count: number;
  }[];
  topPreferredSkills: {
    skillName: string;
    canonicalName: string;
    demandPercentage: number;
    count: number;
  }[];
  commonRoles: { roleName: string; count: number }[];
  studentMatch?: {
    studentId: string;
    verifiedSkillsMatched: string[];
    missingSkills: string[];
    matchPercentage: number;
    recommendedPreparationTasks: string[];
  };
}

// ---------------------------------------------------------------------------
// 8. Cohort Skill-Gap Snapshots & Institutional Interventions
// ---------------------------------------------------------------------------

export type InterventionType =
  | 'WORKSHOP'
  | 'BOOTCAMP'
  | 'HACKATHON'
  | 'STRUCTURED_PRACTICE'
  | 'GUEST_LECTURE';

export type InterventionStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface TrainingIntervention {
  id: string;
  title: string;
  targetSkill: string;
  canonicalSkill: string;
  category: SkillCategory;
  type: InterventionType;
  affectedStudentsCount: number;
  estimatedHours: number;
  suggestedCurriculumTopics: string[];
  actionPlan: string;
  status: InterventionStatus;
  createdAt: string;
}

export interface CohortInstitutionalGap {
  skillName: string;
  canonicalName: string;
  category: SkillCategory;
  studentCountNeedingImprovement: number;
  gapPercentage: number; // % of students in cohort lacking or needing improvement
  marketDemandPercentage: number; // from industry intelligence
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface CohortSkillCoverage {
  skillName: string;
  canonicalName: string;
  category: SkillCategory;
  verifiedPercentage: number;
  evidencePercentage: number;
  unassessedPercentage: number;
}

export interface CohortSkillGapSnapshot {
  id: string;
  tenantId: string;
  department?: string;
  batchYear?: string;
  totalStudents: number;
  studentsWithVerifiedSkills: number;
  topInstitutionalGaps: CohortInstitutionalGap[];
  skillCoverageMatrix: CohortSkillCoverage[];
  recommendedInterventions: TrainingIntervention[];
  generatedAt: string;
}
