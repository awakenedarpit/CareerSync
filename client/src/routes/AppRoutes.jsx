import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Layouts (loaded eagerly)
import DashboardLayout from '../layouts/DashboardLayout';
import { PageSkeleton } from '../components/ui/Skeleton';

// Public & Auth Pages (Code Split)
const LandingPage = lazy(() => import('../pages/landing/LandingPage'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));

// Student Pages (Code Split)
const StudentOverview = lazy(() => import('../pages/student/Overview'));
const StudentProfile = lazy(() => import('../pages/student/Profile'));
const StudentProfileEdit = lazy(() => import('../pages/student/StudentProfileEdit'));
const SkillsEvidence = lazy(() => import('../pages/student/SkillsEvidence'));
const CareerGoals = lazy(() => import('../pages/student/CareerGoals'));
const StudentSkillGapAnalysis = lazy(() => import('../pages/student/SkillGapAnalysis'));
const LearningPath = lazy(() => import('../pages/student/LearningPath'));
const MockDrives = lazy(() => import('../pages/student/MockDrives'));
const AptitudeAssessment = lazy(() => import('../pages/student/AptitudeAssessment'));
const TechnicalCoding = lazy(() => import('../pages/student/TechnicalCoding'));
const InterviewPractice = lazy(() => import('../pages/student/InterviewPractice'));
const PerformanceReport = lazy(() => import('../pages/student/PerformanceReport'));
const Applications = lazy(() => import('../pages/student/Applications'));
const KnowledgeGraph = lazy(() => import('../pages/student/KnowledgeGraph'));
const PrivacyConsent = lazy(() => import('../pages/student/PrivacyConsent'));
const StudentSettings = lazy(() => import('../pages/student/Settings'));
const StudentOffers = lazy(() => import('../pages/student/StudentOffers'));
const CareerRecommendations = lazy(() => import('../pages/student/CareerRecommendations'));
const CompanyIntelligence = lazy(() => import('../pages/student/CompanyIntelligence'));

// Admin Pages (Code Split)
const AdminOverview = lazy(() => import('../pages/admin/Overview'));
const StudentDirectory = lazy(() => import('../pages/admin/Students'));
const CohortAnalytics = lazy(() => import('../pages/admin/CohortAnalytics'));
const IndustryIntelligence = lazy(() => import('../pages/admin/IndustryIntelligence'));
const AdminSkillGapAnalysis = lazy(() => import('../pages/admin/SkillGapAnalysis'));
const AdminPlacementDrives = lazy(() => import('../pages/admin/PlacementDrives'));
const AdminMockDrives = lazy(() => import('../pages/admin/MockDriveManagement'));
const CompanyManagement = lazy(() => import('../pages/admin/CompanyManagement'));
const EligibilityRules = lazy(() => import('../pages/admin/EligibilityRules'));
const RecruiterManagement = lazy(() => import('../pages/admin/RecruiterManagement'));
const AdminReports = lazy(() => import('../pages/admin/Reports'));
const AdminAuditLogs = lazy(() => import('../pages/admin/AuditLogs'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));

// TPO Portal Pages (Code Split)
const VerificationPortal = lazy(() => import('../pages/tpo/VerificationPortal'));
const ReadinessDashboard = lazy(() => import('../pages/tpo/ReadinessDashboard'));
const JobEligibilityPortal = lazy(() => import('../pages/tpo/JobEligibilityPortal'));
const TpoApprovalsQueue = lazy(() => import('../pages/tpo/TpoApprovalsQueue'));
const TpoMockDrives = lazy(() => import('../pages/tpo/TpoMockDrives'));
const CohortIntelligence = lazy(() => import('../pages/tpo/CohortIntelligence'));
const PredictiveAnalytics = lazy(() => import('../pages/tpo/PredictiveAnalytics'));

// Recruiter Pages (Code Split)
const RecruiterOverview = lazy(() => import('../pages/recruiter/Overview'));
const CompanyProfile = lazy(() => import('../pages/recruiter/CompanyProfile'));
const JobRequirements = lazy(() => import('../pages/recruiter/JobRequirements'));
const CandidateDiscovery = lazy(() => import('../pages/recruiter/CandidateDiscovery'));
const Shortlists = lazy(() => import('../pages/recruiter/Shortlists'));
const RecruiterPlacementDrives = lazy(() => import('../pages/recruiter/PlacementDrives'));
const RecruiterAssessments = lazy(() => import('../pages/recruiter/Assessments'));
const RecruiterInterviews = lazy(() => import('../pages/recruiter/Interviews'));
const RecruiterOffers = lazy(() => import('../pages/recruiter/Offers'));
const RecruiterAnalytics = lazy(() => import('../pages/recruiter/Analytics'));
const CandidateFeedback = lazy(() => import('../pages/recruiter/Feedback'));
const RecruiterSettings = lazy(() => import('../pages/recruiter/Settings'));

// Super Admin Pages (Code Split)
const SuperAdminOverview = lazy(() => import('../pages/superadmin/Overview'));
const CollegeManagement = lazy(() => import('../pages/superadmin/CollegeManagement'));
const CreateCollege = lazy(() => import('../pages/superadmin/CreateCollege'));
const UserManagement = lazy(() => import('../pages/superadmin/UserManagement'));
const CreateUser = lazy(() => import('../pages/superadmin/CreateUser'));
const InvitationManagement = lazy(() => import('../pages/superadmin/InvitationManagement'));
const AuditLogs = lazy(() => import('../pages/superadmin/AuditLogs'));
const PlatformSettings = lazy(() => import('../pages/superadmin/Settings'));
const PlatformObservability = lazy(() => import('../pages/superadmin/PlatformObservability'));

// Phase 15 Cross-Agent Orchestration
const AgentOrchestration = lazy(() => import('../pages/tpo/AgentOrchestration'));

// Phase 16 Alumni Engagement, Peer Mock Interviews & Real-Time Collaboration
const MentorshipHub = lazy(() => import('../pages/student/MentorshipHub'));
const MentorshipRequests = lazy(() => import('../pages/student/MentorshipRequests'));
const PeerInterviews = lazy(() => import('../pages/student/PeerInterviews'));
const PeerInterviewRoom = lazy(() => import('../pages/student/PeerInterviewRoom'));
const CollaborationHub = lazy(() => import('../pages/student/CollaborationHub'));
const AlumniDashboard = lazy(() => import('../pages/alumni/AlumniDashboard'));
const AlumniProfile = lazy(() => import('../pages/alumni/AlumniProfile'));
const TpoAlumniNetwork = lazy(() => import('../pages/tpo/TpoAlumniNetwork'));

// Phase 17 Institutional Intelligence, Fairness, Accreditation & Outreach
const InstitutionalIntelligence = lazy(() => import('../pages/tpo/InstitutionalIntelligence'));
const CohortSkillIntelligence = lazy(() => import('../pages/tpo/CohortSkillIntelligence'));
const FairnessGovernance = lazy(() => import('../pages/tpo/FairnessGovernance'));
const AccreditationReports = lazy(() => import('../pages/tpo/AccreditationReports'));
const RecruiterOutreach = lazy(() => import('../pages/tpo/RecruiterOutreach'));

// Fallback 404 Component
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 font-sans">
      <div className="h-16 w-16 rounded-2xl bg-[#BDF9F9]/50 text-[#004D36] border border-[#02E8A7]/40 flex items-center justify-center font-bold text-2xl shadow-xs">
        404
      </div>
      <h2 className="text-xl font-bold text-[#002020]">Page Not Found</h2>
      <p className="text-xs text-[#3B4A42] max-w-sm">
        The page you are looking for does not exist or has been relocated within the CarrerSync platform.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-[#002020] bg-[#02E8A7] rounded-lg hover:bg-[#11F1CF] transition-colors shadow-xs"
      >
        Return to Home
      </Link>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public & Landing */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        {/* Student Portal Routes */}
        <Route path="/student" element={<DashboardLayout role="student" />}>
          <Route index element={<StudentOverview />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="profile/edit" element={<StudentProfileEdit />} />
          <Route path="mentorship" element={<MentorshipHub />} />
          <Route path="mentorship/requests" element={<MentorshipRequests />} />
          <Route path="peer-interviews" element={<PeerInterviews />} />
          <Route path="peer-interviews/:sessionId" element={<PeerInterviewRoom />} />
          <Route path="collaboration" element={<CollaborationHub />} />
          <Route path="skills" element={<SkillsEvidence />} />
          <Route path="goals" element={<CareerGoals />} />
          <Route path="career-recommendations" element={<CareerRecommendations />} />
          <Route path="skill-gap" element={<StudentSkillGapAnalysis />} />
          <Route path="company-intelligence" element={<CompanyIntelligence />} />
          <Route path="learning-path" element={<LearningPath />} />
          <Route path="mock-drives" element={<MockDrives />} />
          <Route path="assessment/aptitude" element={<AptitudeAssessment />} />
          <Route path="assessment/coding" element={<TechnicalCoding />} />
          <Route path="assessment/interview" element={<InterviewPractice />} />
          <Route path="assessment/report" element={<PerformanceReport />} />
          <Route path="applications" element={<Applications />} />
          <Route path="offers" element={<StudentOffers />} />
          <Route path="knowledge-graph" element={<KnowledgeGraph />} />
          <Route path="privacy" element={<PrivacyConsent />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Admin / TPO Portal Routes */}
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<AdminOverview />} />
          <Route path="students" element={<StudentDirectory />} />
          <Route path="cohort-analytics" element={<CohortAnalytics />} />
          <Route path="industry-intel" element={<IndustryIntelligence />} />
          <Route path="skill-gap" element={<AdminSkillGapAnalysis />} />
          <Route path="drives" element={<AdminPlacementDrives />} />
          <Route path="mock-drives" element={<AdminMockDrives />} />
          <Route path="companies" element={<CompanyManagement />} />
          <Route path="eligibility" element={<EligibilityRules />} />
          <Route path="verification" element={<VerificationPortal />} />
          <Route path="readiness" element={<ReadinessDashboard />} />
          <Route path="jobs" element={<JobEligibilityPortal />} />
          <Route path="approvals" element={<TpoApprovalsQueue />} />
          <Route path="recruiters" element={<RecruiterManagement />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit" element={<AdminAuditLogs />} />
          <Route path="orchestration" element={<AgentOrchestration />} />
          <Route path="observability" element={<PlatformObservability />} />
          <Route path="institutional-intelligence" element={<InstitutionalIntelligence />} />
          <Route path="accreditation" element={<AccreditationReports />} />
          <Route path="recruiter-outreach" element={<RecruiterOutreach />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* TPO Portal Routes */}
        <Route path="/tpo" element={<DashboardLayout role="admin" />}>
          <Route path="alumni-network" element={<TpoAlumniNetwork />} />
          <Route path="verification" element={<VerificationPortal />} />
          <Route path="readiness" element={<ReadinessDashboard />} />
          <Route path="jobs" element={<JobEligibilityPortal />} />
          <Route path="approvals" element={<TpoApprovalsQueue />} />
          <Route path="mock-drives" element={<TpoMockDrives />} />
          <Route path="industry-intelligence" element={<IndustryIntelligence />} />
          <Route path="cohort-intelligence" element={<CohortIntelligence />} />
          <Route path="predictive-analytics" element={<PredictiveAnalytics />} />
          <Route path="orchestration" element={<AgentOrchestration />} />
          <Route path="institutional-intelligence" element={<InstitutionalIntelligence />} />
          <Route path="institutional-intelligence/cohort" element={<CohortSkillIntelligence />} />
          <Route path="institutional-intelligence/fairness" element={<FairnessGovernance />} />
          <Route path="accreditation" element={<AccreditationReports />} />
          <Route path="recruiter-outreach" element={<RecruiterOutreach />} />
        </Route>

        {/* College Admin Portal Routes */}
        <Route path="/college-admin" element={<DashboardLayout role="college_admin" />}>
          <Route index element={<InstitutionalIntelligence />} />
          <Route path="institutional-intelligence" element={<InstitutionalIntelligence />} />
          <Route path="accreditation" element={<AccreditationReports />} />
        </Route>

        {/* Alumni Portal Routes */}
        <Route path="/alumni" element={<DashboardLayout role="alumni" />}>
          <Route index element={<AlumniDashboard />} />
          <Route path="dashboard" element={<AlumniDashboard />} />
          <Route path="profile" element={<AlumniProfile />} />
        </Route>

        {/* Recruiter Portal Routes */}
        <Route path="/recruiter" element={<DashboardLayout role="recruiter" />}>
          <Route index element={<RecruiterOverview />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="jobs" element={<JobRequirements />} />
          <Route path="discovery" element={<CandidateDiscovery />} />
          <Route path="candidates" element={<CandidateDiscovery />} />
          <Route path="shortlists" element={<Shortlists />} />
          <Route path="drives" element={<RecruiterPlacementDrives />} />
          <Route path="assessments" element={<RecruiterAssessments />} />
          <Route path="interviews" element={<RecruiterInterviews />} />
          <Route path="offers" element={<RecruiterOffers />} />
          <Route path="analytics" element={<RecruiterAnalytics />} />
          <Route path="feedback" element={<CandidateFeedback />} />
          <Route path="settings" element={<RecruiterSettings />} />
        </Route>

        {/* Super Admin Portal Routes */}
        <Route path="/super-admin" element={<DashboardLayout role="superadmin" />}>
          <Route index element={<SuperAdminOverview />} />
          <Route path="colleges" element={<CollegeManagement />} />
          <Route path="colleges/new" element={<CreateCollege />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/new" element={<CreateUser />} />
          <Route path="invitations" element={<InvitationManagement />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="observability" element={<PlatformObservability />} />
          <Route path="settings" element={<PlatformSettings />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
