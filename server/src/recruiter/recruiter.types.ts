/**
 * CarrerSync Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Types
 * Defines comprehensive TypeScript models for the 10 recruiter modules and TPO governance.
 */

// ============================================================================
// 1. Company Management Types
// ============================================================================

export type CompanyVerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface CompanyProfile {
  id: string;
  name: string;
  industryDomain?: string | null;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  headquarters?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  verificationStatus: CompanyVerificationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyInput {
  name: string;
  industryDomain?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  headquarters?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  industryDomain?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  headquarters?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CompanyReviewInput {
  decision: 'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW';
  reviewNotes: string;
}

export interface RecruiterMembership {
  id: string;
  userId: string;
  companyId: string;
  role: string;
  isPrimaryContact: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 2. Job Requirement Management Types
// ============================================================================

export type JobLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'REJECTED'
  | 'PAUSED'
  | 'ARCHIVED';

export interface RecruiterJobRequirement {
  id: string;
  tenantId: string;
  companyId?: string | null;
  companyName: string;
  jobTitle: string;
  jobRole?: string | null;
  jobCategory?: string | null;
  employmentType: string;
  workLocation?: string | null;
  salaryMinLpa?: number | null;
  salaryMaxLpa?: number | null;
  maxBacklogsAllowed: number;
  experienceLevel?: string | null;
  vacancies: number;
  jobDescription: string;
  eligibleDepartments: string[];
  graduationYear?: number | null;
  minimumCgpa?: number | null;
  requiredSkills: string[];
  preferredSkills: string[];
  assessmentRequirements: string[];
  deadline?: string | null;
  status: JobLifecycleStatus;
  tpoApprovalStatus: string;
  tpoApprovedBy?: string | null;
  tpoApprovalReason?: string | null;
  rejectionReason?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequirementInput {
  companyName: string;
  companyId?: string;
  jobTitle: string;
  jobRole?: string;
  jobCategory?: string;
  employmentType?: string;
  workLocation?: string;
  salaryMinLpa?: number;
  salaryMaxLpa?: number;
  maxBacklogsAllowed?: number;
  experienceLevel?: string;
  vacancies?: number;
  jobDescription: string;
  eligibleDepartments: string[];
  graduationYear?: number;
  minimumCgpa?: number;
  requiredSkills: string[];
  preferredSkills?: string[];
  assessmentRequirements?: string[];
  deadline?: string;
}

export interface UpdateJobRequirementInput {
  companyName?: string;
  companyId?: string;
  jobTitle?: string;
  jobRole?: string;
  jobCategory?: string;
  employmentType?: string;
  workLocation?: string;
  salaryMinLpa?: number;
  salaryMaxLpa?: number;
  maxBacklogsAllowed?: number;
  experienceLevel?: string;
  vacancies?: number;
  jobDescription?: string;
  eligibleDepartments?: string[];
  graduationYear?: number;
  minimumCgpa?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  assessmentRequirements?: string[];
  deadline?: string;
  status?: JobLifecycleStatus;
}

// ============================================================================
// 3. Placement Drive Management Types
// ============================================================================

export type DriveStageStatus =
  | 'DRAFT'
  | 'PENDING_TPO_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'REGISTRATION_OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export interface PlacementDrive {
  id: string;
  tenantId: string;
  companyId?: string | null;
  companyName?: string | null;
  jobId?: string | null;
  jobRoleId?: string | null;
  jobTitle?: string | null;
  title: string;
  description?: string | null;
  venue?: string | null;
  availablePositions: number;
  batchYear: number;
  minCgpa: number;
  maxBacklogsAllowed: number;
  eligibleDepartments: string[];
  registrationStart: string;
  registrationEnd: string;
  driveDate?: string | null;
  status: string;
  stageStatus: DriveStageStatus;
  recruiterId?: string | null;
  tpoApprovedBy?: string | null;
  tpoApprovalReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlacementDriveInput {
  companyId?: string;
  companyName?: string;
  jobId?: string;
  title: string;
  description?: string;
  venue?: string;
  availablePositions?: number;
  batchYear: number;
  minCgpa?: number;
  maxBacklogsAllowed?: number;
  eligibleDepartments: string[];
  registrationStart: string;
  registrationEnd: string;
  driveDate?: string;
}

export interface DriveScheduleSlot {
  id: string;
  tenantId: string;
  driveId: string;
  eventTitle: string;
  eventType: 'ASSESSMENT' | 'INTERVIEW_ROUND' | 'PRE_PLACEMENT_TALK' | 'RESULTS_ANNOUNCEMENT';
  startTime: string;
  endTime: string;
  venueOrLink?: string | null;
  conflictFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleConflictCheckResult {
  hasConflict: boolean;
  conflictDetails?: string | null;
  conflictingSlots: DriveScheduleSlot[];
}

// ============================================================================
// 4. Candidate Discovery Types
// ============================================================================

export interface CandidateDiscoveryCard {
  studentId: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  graduationYear: number;
  cgpa: number;
  backlogs: number;
  administrativeEligibility: 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW';
  administrativeReason?: string;
  verifiedSkills: string[];
  evidenceLinkedSkills: string[];
  missingSkills: string[];
  skillsCount: number;
  projectsCount: number;
  certificationsCount: number;
  readinessScore: number;
  readinessCategory: string;
  matchScore: number;
  matchExplanation: string;
  isSharedWithDrive: boolean;
  placementStatus: string;
}

// ============================================================================
// 5. Candidate Shortlisting Types
// ============================================================================

export type CandidateShortlistStatus =
  | 'RECOMMENDED'
  | 'SUBMITTED_FOR_TPO_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface CandidateShortlist {
  id: string;
  tenantId: string;
  driveId: string;
  driveTitle?: string;
  jobId: string;
  jobTitle?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  department?: string;
  recruiterId: string;
  status: CandidateShortlistStatus;
  recruiterNotes?: string | null;
  tpoReviewerId?: string | null;
  tpoDecisionReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShortlistRecommendationInput {
  driveId: string;
  jobId: string;
  studentId: string;
  recruiterNotes?: string;
}

export interface TpoShortlistReviewInput {
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
}

// ============================================================================
// 6. Assessment Coordination Types
// ============================================================================

export type AssessmentType = 'APTITUDE' | 'TECHNICAL' | 'CODING' | 'INTERVIEW';
export type AssessmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface DriveAssessment {
  id: string;
  tenantId: string;
  driveId: string;
  driveTitle?: string;
  assessmentType: AssessmentType;
  title: string;
  scheduledAt?: string | null;
  durationMinutes: number;
  meetingDetails?: string | null;
  status: AssessmentStatus;
  candidateCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentInput {
  driveId: string;
  assessmentType: AssessmentType;
  title: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetingDetails?: string;
}

export interface CandidateAssessmentResult {
  id: string;
  tenantId: string;
  assessmentId: string;
  studentId: string;
  studentName?: string;
  score?: number | null;
  maxScore: number;
  status: string;
  feedback?: string | null;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAssessmentScoreInput {
  studentId: string;
  score: number;
  maxScore?: number;
  feedback?: string;
}

// ============================================================================
// 7. Interview Coordination Types
// ============================================================================

export type InterviewStage =
  | 'TECHNICAL_1'
  | 'TECHNICAL_2'
  | 'CODING'
  | 'MANAGERIAL'
  | 'HR'
  | 'FINAL';

export interface DriveInterviewRound {
  id: string;
  tenantId: string;
  driveId: string;
  driveTitle?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  department?: string;
  roundNumber: number;
  roundStage: InterviewStage;
  scheduledAt: string;
  interviewerName?: string | null;
  interviewerId?: string | null;
  meetingDetails?: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  feedback?: string | null;
  rating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInterviewInput {
  driveId: string;
  studentId: string;
  roundNumber?: number;
  roundStage: InterviewStage;
  scheduledAt: string;
  interviewerName?: string;
  meetingDetails?: string;
}

export interface RecordInterviewFeedbackInput {
  status: 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';
  feedback: string;
  rating?: number;
}

// ============================================================================
// 8. Offer Lifecycle Management Types
// ============================================================================

export type OfferLifecycleStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RELEASED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'WITHDRAWN';

export interface PlacementOffer {
  id: string;
  tenantId: string;
  driveId: string;
  driveTitle?: string;
  jobId: string;
  jobTitle?: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  department?: string;
  companyId: string;
  companyName: string;
  recruiterId: string;
  roleTitle: string;
  ctcLpa?: number | null;
  joiningDate?: string | null;
  offerDate: string;
  expiryDate?: string | null;
  status: OfferLifecycleStatus;
  tpoReviewerId?: string | null;
  tpoApprovalReason?: string | null;
  studentRespondedAt?: string | null;
  studentResponseNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DraftOfferInput {
  driveId: string;
  jobId: string;
  studentId: string;
  companyId?: string;
  companyName?: string;
  roleTitle: string;
  ctcLpa?: number;
  joiningDate?: string;
  expiryDate?: string;
}

export interface TpoOfferReviewInput {
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
}

export interface StudentOfferResponseInput {
  decision: 'ACCEPTED' | 'DECLINED';
  notes?: string;
}

export interface OfferStatusHistoryItem {
  id: string;
  offerId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  changedByName?: string;
  reason?: string | null;
  createdAt: string;
}

// ============================================================================
// 9. Recruiter Analytics Types
// ============================================================================

export interface RecruiterAnalyticsOverview {
  jobsCreated: number;
  jobsApproved: number;
  activeDrives: number;
  candidatesConsidered: number;
  candidatesShortlisted: number;
  interviewsCompleted: number;
  offersReleased: number;
  offersAccepted: number;
  shortlistToOfferRatio: number;
  offerAcceptanceRatio: number;
  averageTimeToShortlistDays: number;
  candidateFunnel: Array<{ stage: string; count: number; percentage: number }>;
  skillDemand: Array<{ skill: string; demandCount: number }>;
  departmentParticipation: Array<{ department: string; candidateCount: number; shortlistedCount: number }>;
}

// ============================================================================
// 10. TPO Governance Unified Approvals Types
// ============================================================================

export type TpoApprovalCategory = 'company' | 'job' | 'drive' | 'shortlist' | 'offer';

export interface TpoApprovalItem {
  id: string;
  category: TpoApprovalCategory;
  requestType: string;
  title: string;
  companyName: string;
  requestingUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  details: Record<string, unknown>;
  status: string;
  createdAt: string;
}
