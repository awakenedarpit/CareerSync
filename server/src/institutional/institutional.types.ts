/**
 * CarrerSync Phase 17 — Institutional Intelligence, Governance & Accreditation Types
 *
 * Enforces canonical domain types, enums, DTOs, and schemas for:
 * 1. Institutional KPIs & Data Quality Observability
 * 2. Cohort Skill Intelligence & Training Interventions
 * 3. Algorithmic Fairness Governance & EEOC Four-Fifths Benchmarking
 * 4. Accreditation Reporting & Traceability
 * 5. Recruiter Outreach & ₹0 Cardless Campaign Orchestration
 */

export type InterventionStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'CANCELLED';

export type FairnessReviewStatus =
  | 'FLAGGED'
  | 'UNDER_REVIEW'
  | 'EXPLANATION_REQUESTED'
  | 'RESOLVED'
  | 'ESCALATED';

export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export type ReportCategory =
  | 'PLACEMENT_STATISTICS'
  | 'BRANCH_WISE_OUTCOMES'
  | 'COMPANY_PARTICIPATION'
  | 'SALARY_DISTRIBUTION'
  | 'HIGHER_EDUCATION'
  | 'ENTREPRENEURSHIP'
  | 'VERIFIED_SKILL_COVERAGE'
  | 'SKILL_GAP_CLOSURE'
  | 'TRAINING_INTERVENTIONS'
  | 'MOCK_ASSESSMENT_PERFORMANCE'
  | 'INDUSTRY_ENGAGEMENT'
  | 'ALUMNI_MENTORSHIP'
  | 'STUDENT_EMPLOYABILITY_PREPARATION'
  | 'ACADEMIC_YEAR_COMPARISON';

export type OutreachCampaignStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'QUEUED'
  | 'SENT'
  | 'PARTIALLY_SENT'
  | 'FAILED'
  | 'CANCELLED';

export type StudentSupportClassification =
  | 'SUPPORT_RECOMMENDED'
  | 'ADDITIONAL_PRACTICE_SUGGESTED'
  | 'INSUFFICIENT_DATA'
  | 'PROGRESSING'
  | 'NO_ACTION_REQUIRED';

export type DataQualityStatus = 'SUFFICIENT_DATA' | 'INSUFFICIENT_DATA';

export interface ReportingPeriodFilter {
  academicYear?: string; // e.g. "2024-2025"
  batchYear?: number;    // e.g. 2025
  department?: string;   // e.g. "Computer Science & Engineering"
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// 1. Institutional KPI Service Types
// ---------------------------------------------------------------------------

export interface MetricWithDenominator {
  numerator: number;
  denominator: number;
  value: number | null; // percentage or ratio, null if denominator == 0
  status: DataQualityStatus;
  explanation: string;
}

export interface RecruiterEngagementComponent {
  score: number;
  maxScore: number;
  weight: number;
  details: string;
}

export interface RecruiterEngagementMetric {
  overallScore: number; // 0 - 100
  formulaExplanation: string;
  components: {
    activeRecruiters: RecruiterEngagementComponent;
    drivesConducted: RecruiterEngagementComponent;
    studentParticipation: RecruiterEngagementComponent;
    feedbackCompletion: RecruiterEngagementComponent;
    offersPerDrive: RecruiterEngagementComponent;
  };
}

export interface InstitutionalDataQualityIndicator {
  reportingPeriod: ReportingPeriodFilter;
  lastUpdated: string;
  observationCount: number;
  completenessScore: number; // 0 - 100%
  status: DataQualityStatus;
  warnings: string[];
  sourceRecords: {
    students: number;
    offers: number;
    drives: number;
    shortlists: number;
    skills: number;
    interventions: number;
  };
  zeroFabricatedDataGuaranteed: boolean;
}

export interface InstitutionalKpiOverview {
  tenantId: string;
  reportingPeriod: ReportingPeriodFilter;
  dataQuality: InstitutionalDataQualityIndicator;
  placementRate: MetricWithDenominator;
  verifiedSkillCoverage: MetricWithDenominator & {
    averageVerifiedSkillsPerStudent: number;
  };
  skillGapClosureRate: MetricWithDenominator;
  shortlistToOfferRatio: MetricWithDenominator;
  timeToShortlist: {
    averageDays: number | null;
    medianDays: number | null;
    minDays: number | null;
    maxDays: number | null;
    evaluatedDrivesCount: number;
    status: DataQualityStatus;
  };
  recruiterEngagement: RecruiterEngagementMetric;
  departmentBreakdown: Array<{
    department: string;
    eligibleStudents: number;
    placedStudents: number;
    placementRate: number | null;
    verifiedSkillCoverageRate: number | null;
    status: DataQualityStatus;
  }>;
}

// ---------------------------------------------------------------------------
// 2. Cohort Skill Intelligence & Training Interventions Types
// ---------------------------------------------------------------------------

export type HeatmapType =
  | 'department_vs_skill'
  | 'batch_vs_skill'
  | 'target_role_vs_skill'
  | 'verified_vs_missing'
  | 'gap_vs_intervention';

export interface HeatmapCell {
  row: string; // e.g. Department name, batch year, role
  col: string; // e.g. Skill name
  verifiedCount: number;
  totalCount: number;
  percentage: number | null;
  avgProficiency?: number;
  status: DataQualityStatus;
}

export interface CohortSkillHeatmapResponse {
  heatmapType: HeatmapType;
  dimensions: {
    rows: string[];
    cols: string[];
  };
  cells: HeatmapCell[];
  summary: {
    totalEvaluated: number;
    topIdentifiedGaps: Array<{ skill: string; gapCount: number }>;
    topVerifiedStrengths: Array<{ skill: string; verifiedCount: number }>;
  };
}

export interface TrainingInterventionParticipant {
  studentId: string;
  rollNumber: string;
  studentName?: string;
  department: string;
  attendanceVerified: boolean;
  projectEvidenceSubmitted: boolean;
  projectEvidenceUrl?: string;
  projectEvidenceDescription?: string;
  tpoVerified: boolean;
  tpoVerifiedBy?: string;
  tpoVerifiedAt?: string;
  verifiedSkillGainRecorded: boolean;
}

export interface TrainingIntervention {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  targetSkill: string;
  targetDepartment: string;
  targetBatch: number;
  startDate: string;
  endDate: string;
  actionPlan: string;
  status: InterventionStatus;
  participants: TrainingInterventionParticipant[];
  participantCount: number;
  verifiedImprovementRate: number | null;
  attendanceOnlyDoesNotEqualMasteryRuleEnforced: boolean;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  auditTrail: Array<{
    timestamp: string;
    action: string;
    actorId: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterventionDto {
  title: string;
  description: string;
  targetSkill: string;
  targetDepartment: string;
  targetBatch: number;
  startDate: string;
  endDate: string;
  actionPlan: string;
}

export interface UpdateInterventionDto {
  title?: string;
  description?: string;
  status?: InterventionStatus;
  actionPlan?: string;
  endDate?: string;
  notes?: string;
}

export interface StudentSupportProfile {
  studentId: string;
  rollNumber: string;
  department: string;
  batchYear: number;
  classification: StudentSupportClassification;
  reason: string;
  verifiedSkillsCount: number;
  openGapsCount: number;
  mockInterviewsAttempted: number;
  isStigmatizingRankingPrevented: boolean;
}

// ---------------------------------------------------------------------------
// 3. Fairness Governance & Four-Fifths Benchmarking Types
// ---------------------------------------------------------------------------

export interface FunnelStageMetrics {
  stage: string;
  count: number;
  stageConversionRate: number | null; // relative to previous stage
  cumulativeConversionRate: number | null; // relative to initial eligible pool
}

export interface SelectionFunnelAnalysis {
  tenantId: string;
  reportingPeriod: ReportingPeriodFilter;
  stages: {
    eligible: number;
    applications: number;
    shortlisted: number;
    assessmentsPassed: number;
    interviewsPassed: number;
    offers: number;
    confirmed: number;
  };
  conversionRates: {
    applicationRate: number | null;
    shortlistRate: number | null;
    assessmentPassRate: number | null;
    interviewPassRate: number | null;
    offerRate: number | null;
    confirmationRate: number | null;
  };
}

export interface StageDisparityEvaluation {
  groupCategory: string; // e.g. "Department", "Gender (Self-Reported)"
  groupName: string;
  stage: string;
  sampleSize: number;
  isSuppressed: boolean; // N < 5 suppression guard
  groupSelectionRate: number | null;
  referenceGroupName: string;
  referenceGroupSelectionRate: number | null;
  disparityRatio: number | null; // Group Rate / Reference Group Rate
  fourFifthsThresholdMet: boolean; // disparityRatio >= 0.8
  requiresHumanReview: boolean; // disparityRatio < 0.8 && !isSuppressed
  reviewFlagReason?: string;
}

export interface FairnessReviewCase {
  id: string;
  tenantId: string;
  driveId?: string;
  cohortId?: string;
  metricName: string;
  affectedGroup: string;
  referenceGroup: string;
  groupSelectionRate: number;
  referenceGroupSelectionRate: number;
  disparityRatio: number;
  status: FairnessReviewStatus;
  assignedReviewerId?: string;
  reviewerNotes?: string;
  explanationRequestedAt?: string;
  explanationProvided?: string;
  explanation?: string;
  resolutionReason?: string;
  auditTrail: Array<{
    timestamp: string;
    action: string;
    actorId: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFairnessReviewDto {
  driveId?: string;
  cohortId?: string;
  metricName: string;
  affectedGroup: string;
  referenceGroup: string;
  groupSelectionRate: number;
  referenceGroupSelectionRate: number;
  disparityRatio: number;
  reviewerNotes?: string;
}

export interface UpdateFairnessReviewDto {
  status?: FairnessReviewStatus;
  assignedReviewerId?: string;
  reviewerNotes?: string;
  explanation?: string;
  resolutionReason?: string;
}

// ---------------------------------------------------------------------------
// 4. Accreditation Reporting & Traceability Types
// ---------------------------------------------------------------------------

export interface AccreditationTemplateConfig {
  id: string;
  code: string;
  name: string;
  description: string;
  category: ReportCategory;
  framework: 'NAAC' | 'NIRF' | 'NBA' | 'INTERNAL';
  supportedFormats: ReportFormat[];
  requiredFields: string[];
  disclaimer: string;
}

export interface TraceableMetricItem {
  metricKey: string;
  metricLabel: string;
  value: any;
  sourceTable: string;
  recordCount: number;
  sampleRecordIds: string[];
}

export interface ReportPreviewRequestDto {
  templateCode: string;
  filters: ReportingPeriodFilter;
}

export interface ReportPreviewResponse {
  templateCode: string;
  templateName: string;
  framework: string;
  category: ReportCategory;
  filters: ReportingPeriodFilter;
  completenessScore: number; // 0 - 100%
  missingFields: string[];
  warnings: string[];
  summaryMetrics: Record<string, any>;
  evidenceTraceability: TraceableMetricItem[];
  generatedAt: string;
  regulatoryDisclaimer: string;
}

export interface ReportExportRequestDto {
  templateCode: string;
  filters: ReportingPeriodFilter;
  format: ReportFormat;
}

export interface ReportExportResponse {
  reportId: string;
  tenantId: string;
  templateCode: string;
  title: string;
  format: ReportFormat;
  filename: string;
  contentType: string;
  content: string; // Base64 or string representation
  completenessScore: number;
  evidenceTraceability: TraceableMetricItem[];
  generatedAt: string;
  generatedBy: string;
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// 5. Recruiter Outreach & ₹0 Cardless Campaign Types
// ---------------------------------------------------------------------------

export interface RecruiterContact {
  id: string;
  tenantId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  designation: string;
  industry: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'BOUNCED';
  isUnsubscribed: boolean;
  pastDriveCount: number;
  lastContactedAt?: string;
  createdAt: string;
}

export interface OutreachCampaignRecipient {
  id: string;
  campaignId: string;
  contactId: string;
  companyName: string;
  contactName: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED_SUPPRESSED' | 'SKIPPED_DUPLICATE';
  failureReason?: string;
  sentAt?: string;
}

export interface RecruiterOutreachCampaign {
  id: string;
  tenantId: string;
  title: string;
  subject: string;
  bodyTemplate: string;
  targetAudience: {
    industries?: string[];
    minPastDrives?: number;
    departmentsRequested?: string[];
  };
  status: OutreachCampaignStatus;
  requiresHumanApproval: boolean; // Always true
  approvedBy?: string;
  approvedAt?: string;
  recipients: OutreachCampaignRecipient[];
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  createdBy: string;
  auditTrail: Array<{
    timestamp: string;
    action: string;
    actorId: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutreachCampaignDto {
  title: string;
  subject: string;
  bodyTemplate: string;
  targetAudience?: {
    industries?: string[];
    minPastDrives?: number;
    departmentsRequested?: string[];
  };
  contactIds?: string[]; // Specific selected contacts or auto-target
}

export interface CampaignPreviewResponse {
  campaignId: string;
  title: string;
  subject: string;
  sampleRenderedBody: string;
  totalEligibleContacts: number;
  suppressedContactsCount: number;
  duplicateContactsCount: number;
  eligibleRecipients: Array<{
    contactId: string;
    companyName: string;
    contactName: string;
    email: string;
  }>;
  warnings: string[];
}
