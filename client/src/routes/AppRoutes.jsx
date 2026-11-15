import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';

// Public & Auth Pages
import LandingPage from '../pages/landing/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Student Pages
import StudentOverview from '../pages/student/Overview';
import StudentProfile from '../pages/student/Profile';
import SkillsEvidence from '../pages/student/SkillsEvidence';
import CareerGoals from '../pages/student/CareerGoals';
import StudentSkillGapAnalysis from '../pages/student/SkillGapAnalysis';
import LearningPath from '../pages/student/LearningPath';
import MockDrives from '../pages/student/MockDrives';
import AptitudeAssessment from '../pages/student/AptitudeAssessment';
import TechnicalCoding from '../pages/student/TechnicalCoding';
import InterviewPractice from '../pages/student/InterviewPractice';
import PerformanceReport from '../pages/student/PerformanceReport';
import Applications from '../pages/student/Applications';
import KnowledgeGraph from '../pages/student/KnowledgeGraph';
import PrivacyConsent from '../pages/student/PrivacyConsent';
import StudentSettings from '../pages/student/Settings';
import StudentOffers from '../pages/student/StudentOffers';
import CareerRecommendations from '../pages/student/CareerRecommendations';
import CompanyIntelligence from '../pages/student/CompanyIntelligence';

// Admin Pages
import AdminOverview from '../pages/admin/Overview';
import StudentDirectory from '../pages/admin/Students';
import CohortAnalytics from '../pages/admin/CohortAnalytics';
import IndustryIntelligence from '../pages/admin/IndustryIntelligence';
import AdminSkillGapAnalysis from '../pages/admin/SkillGapAnalysis';
import AdminPlacementDrives from '../pages/admin/PlacementDrives';
import AdminMockDrives from '../pages/admin/MockDriveManagement';
import CompanyManagement from '../pages/admin/CompanyManagement';
import EligibilityRules from '../pages/admin/EligibilityRules';
import RecruiterManagement from '../pages/admin/RecruiterManagement';
import AdminReports from '../pages/admin/Reports';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import AdminSettings from '../pages/admin/Settings';

// TPO Portal Pages (Phase 10, 11, 12 & 13)
import VerificationPortal from '../pages/tpo/VerificationPortal';
import ReadinessDashboard from '../pages/tpo/ReadinessDashboard';
import JobEligibilityPortal from '../pages/tpo/JobEligibilityPortal';
import TpoApprovalsQueue from '../pages/tpo/TpoApprovalsQueue';
import TpoMockDrives from '../pages/tpo/TpoMockDrives';
import CohortIntelligence from '../pages/tpo/CohortIntelligence';

// Recruiter Pages (Phase 11)
import RecruiterOverview from '../pages/recruiter/Overview';
import CompanyProfile from '../pages/recruiter/CompanyProfile';
import JobRequirements from '../pages/recruiter/JobRequirements';
import CandidateDiscovery from '../pages/recruiter/CandidateDiscovery';
import Shortlists from '../pages/recruiter/Shortlists';
import RecruiterPlacementDrives from '../pages/recruiter/PlacementDrives';
import RecruiterAssessments from '../pages/recruiter/Assessments';
import RecruiterInterviews from '../pages/recruiter/Interviews';
import RecruiterOffers from '../pages/recruiter/Offers';
import RecruiterAnalytics from '../pages/recruiter/Analytics';
import CandidateFeedback from '../pages/recruiter/Feedback';
import RecruiterSettings from '../pages/recruiter/Settings';

// Super Admin Pages
import SuperAdminOverview from '../pages/superadmin/Overview';
import CollegeManagement from '../pages/superadmin/CollegeManagement';
import CreateCollege from '../pages/superadmin/CreateCollege';
import UserManagement from '../pages/superadmin/UserManagement';
import CreateUser from '../pages/superadmin/CreateUser';
import InvitationManagement from '../pages/superadmin/InvitationManagement';
import AuditLogs from '../pages/superadmin/AuditLogs';
import PlatformSettings from '../pages/superadmin/Settings';

import Button from '../components/ui/Button';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 py-20">
      <div className="text-7xl font-black text-indigo-600 mb-4">404</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 text-sm max-w-md mb-6">
        The requested URL was not found in the CarrerSync placement platform.
      </p>
      <Button to="/" variant="primary" size="md">
        Return to Landing Page
      </Button>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* Student Portal Routes */}
      <Route path="/student" element={<DashboardLayout role="student" />}>
        <Route index element={<StudentOverview />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="skills" element={<SkillsEvidence />} />
        <Route path="goals" element={<CareerGoals />} />
        <Route path="skill-gap" element={<StudentSkillGapAnalysis />} />
        <Route path="career-recommendations" element={<CareerRecommendations />} />
        <Route path="company-intelligence" element={<CompanyIntelligence />} />
        <Route path="learning-path" element={<LearningPath />} />
        <Route path="mock-drives" element={<MockDrives />} />
        <Route path="mock-drives/aptitude" element={<AptitudeAssessment />} />
        <Route path="mock-drives/technical" element={<TechnicalCoding />} />
        <Route path="mock-drives/interview" element={<InterviewPractice />} />
        <Route path="mock-drives/reports" element={<PerformanceReport />} />
        <Route path="mock-drives/reports/:reportId" element={<PerformanceReport />} />
        <Route path="applications" element={<Applications />} />
        <Route path="knowledge-graph" element={<KnowledgeGraph />} />
        <Route path="privacy" element={<PrivacyConsent />} />
        <Route path="offers" element={<StudentOffers />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      {/* T&P Admin Portal Routes */}
      <Route path="/admin" element={<DashboardLayout role="admin" />}>
        <Route index element={<AdminOverview />} />
        <Route path="students" element={<StudentDirectory />} />
        <Route path="cohort-analytics" element={<CohortAnalytics />} />
        <Route path="industry-intel" element={<IndustryIntelligence />} />
        <Route path="cohort-intelligence" element={<CohortIntelligence />} />
        <Route path="skill-gap" element={<AdminSkillGapAnalysis />} />
        <Route path="drives" element={<AdminPlacementDrives />} />
        <Route path="mock-drives" element={<TpoMockDrives />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="eligibility" element={<EligibilityRules />} />
        <Route path="verification" element={<VerificationPortal />} />
        <Route path="readiness" element={<ReadinessDashboard />} />
        <Route path="jobs" element={<JobEligibilityPortal />} />
        <Route path="approvals" element={<TpoApprovalsQueue />} />
        <Route path="recruiters" element={<RecruiterManagement />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit" element={<AdminAuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* TPO Portal Routes (Phase 10, 11, 12 & 13) */}
      <Route path="/tpo" element={<DashboardLayout role="admin" />}>
        <Route path="verification" element={<VerificationPortal />} />
        <Route path="readiness" element={<ReadinessDashboard />} />
        <Route path="jobs" element={<JobEligibilityPortal />} />
        <Route path="approvals" element={<TpoApprovalsQueue />} />
        <Route path="mock-drives" element={<TpoMockDrives />} />
        <Route path="industry-intelligence" element={<IndustryIntelligence />} />
        <Route path="cohort-intelligence" element={<CohortIntelligence />} />
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
        <Route path="settings" element={<PlatformSettings />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
