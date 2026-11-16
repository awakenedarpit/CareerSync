import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  ExternalLink,
  Edit2,
  CheckCircle2,
  FolderGit2,
  FileText,
  UploadCloud,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  X,
  MapPin,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Globe
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressBar from '../../components/ui/ProgressBar';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import ProfileReviewModal from '../../components/profiling/ProfileReviewModal';
import fileService from '../../services/fileService';
import profilingService from '../../services/profilingService';
import studentProfileService from '../../services/studentProfileService';
import authService from '../../services/authService';
import { calculateProfileCompleteness } from '../../utils/profileCompleteness';
import { PLATFORM_CONFIG } from '../../components/profile/SocialPlatformIcons';
import { useToast } from '../../components/ui/ToastContext';

export default function StudentProfile() {
  const toast = useToast();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Document Vault states
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('resume');

  // AI Profiling states
  const [analyzingDocId, setAnalyzingDocId] = useState(null);
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [activeExtraction, setActiveExtraction] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [profilingMessage, setProfilingMessage] = useState(null);

  // Correction requests state
  const [correctionRequests, setCorrectionRequests] = useState([]);

  // Load real profile data from backend
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const currentUser = authService.getCurrentUser();
      const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu', 'priya.sharma21@college.edu'].includes(currentUser?.email);
      const res = await studentProfileService.getProfile();
      const profile = res?.data || res?.profile || res || {};

      setProfileData({
        name: profile.name || profile.user?.name || profile.user?.fullName || currentUser?.fullName || (isDemoStudent ? 'Aditya Sharma' : 'Student'),
        rollNumber: profile.rollNumber || (isDemoStudent ? 'CS2021-084' : ''),
        department: profile.department || (isDemoStudent ? 'Computer Science and Engineering' : ''),
        degree: profile.degree || (isDemoStudent ? 'B.Tech' : ''),
        batchYear: profile.batchYear ? String(profile.batchYear) : (isDemoStudent ? '2025' : ''),
        cgpa: profile.cgpa ? String(profile.cgpa) : (isDemoStudent ? '8.42' : '0.00'),
        email: profile.user?.email || profile.email || currentUser?.email || '',
        personalEmail: profile.personalEmail || '',
        phoneNumber: profile.phoneNumber || '',
        alternatePhoneNumber: profile.alternatePhoneNumber || '',
        preferredContactMethod: profile.preferredContactMethod || 'email',
        bio: profile.bio || (isDemoStudent ? 'Passionate Full Stack Engineer specializing in TypeScript, React, and scalable backend microservices. Active open-source contributor.' : ''),
        careerObjective: profile.careerObjective || (isDemoStudent ? 'Aspiring Cloud Infrastructure & Systems Architect at high-velocity tech enterprise.' : ''),
        avatarUrl: profile.avatarUrl || '',
        currentCity: profile.currentCity || (isDemoStudent ? 'Bangalore' : ''),
        state: profile.state || (isDemoStudent ? 'Karnataka' : ''),
        country: profile.country || 'India',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        leetcodeUrl: profile.leetcodeUrl || '',
        hackerrankUrl: profile.hackerrankUrl || '',
        codeforcesUrl: profile.codeforcesUrl || '',
        codechefUrl: profile.codechefUrl || '',
        kaggleUrl: profile.kaggleUrl || '',
        geeksforgeeksUrl: profile.geeksforgeeksUrl || '',
        personalWebsiteUrl: profile.personalWebsiteUrl || '',
        customLinks: Array.isArray(profile.customLinks) ? profile.customLinks : [],
        targetJobRoles: Array.isArray(profile.targetJobRoles) ? profile.targetJobRoles : (isDemoStudent ? ['Full Stack Engineer', 'Backend Engineer'] : []),
        preferredIndustries: Array.isArray(profile.preferredIndustries) ? profile.preferredIndustries : (isDemoStudent ? ['FinTech', 'Enterprise SaaS'] : []),
        preferredLocations: Array.isArray(profile.preferredLocations) ? profile.preferredLocations : (isDemoStudent ? ['Bangalore', 'Remote', 'Pune'] : []),
        preferredEmploymentTypes: Array.isArray(profile.preferredEmploymentTypes) ? profile.preferredEmploymentTypes : ['full-time'],
        selfDeclaredSkills: Array.isArray(profile.selfDeclaredSkills) ? profile.selfDeclaredSkills : [],
        profileVisibility: {
          tpoTeam: profile.profileVisibility?.tpoTeam ?? true,
          recruitersOnShare: profile.profileVisibility?.recruitersOnShare ?? false,
          professionalLinksVisible: profile.profileVisibility?.professionalLinksVisible ?? true,
          contactDetailsHidden: profile.profileVisibility?.contactDetailsHidden ?? true,
          portfolioOnShare: profile.profileVisibility?.portfolioOnShare ?? true,
        },
        readinessScore: profile.readinessScore || (isDemoStudent ? '78.50' : '0.00'),
      });

      if (Array.isArray(profile.correctionRequests)) {
        setCorrectionRequests(profile.correctionRequests);
      } else {
        try {
          const reqRes = await studentProfileService.getCorrectionRequests();
          const reqs = reqRes?.data || reqRes?.requests || reqRes || [];
          if (Array.isArray(reqs)) setCorrectionRequests(reqs);
        } catch {
          // keep fallback
        }
      }
    } catch (err) {
      console.warn('Profile fetch note (fallback):', err.message);
      const currentUser = authService.getCurrentUser();
      const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu', 'priya.sharma21@college.edu'].includes(currentUser?.email);
      setProfileData({
        name: currentUser?.fullName || (isDemoStudent ? 'Aditya Sharma' : 'Student'),
        rollNumber: isDemoStudent ? 'CS2021-084' : '',
        department: isDemoStudent ? 'Computer Science and Engineering' : '',
        degree: isDemoStudent ? 'B.Tech' : '',
        batchYear: isDemoStudent ? '2025' : '',
        cgpa: isDemoStudent ? '8.42' : '0.00',
        email: currentUser?.email || '',
        personalEmail: '',
        phoneNumber: '',
        alternatePhoneNumber: '',
        preferredContactMethod: 'email',
        bio: isDemoStudent ? 'Passionate Full Stack Engineer specializing in TypeScript, React, and scalable backend microservices. Active open-source contributor.' : '',
        careerObjective: isDemoStudent ? 'Aspiring Cloud Infrastructure & Systems Architect at high-velocity tech enterprise.' : '',
        avatarUrl: '',
        currentCity: isDemoStudent ? 'Bangalore' : '',
        state: isDemoStudent ? 'Karnataka' : '',
        country: 'India',
        dateOfBirth: '',
        gender: isDemoStudent ? 'Male' : '',
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
        leetcodeUrl: '',
        hackerrankUrl: '',
        codeforcesUrl: '',
        codechefUrl: '',
        kaggleUrl: '',
        geeksforgeeksUrl: '',
        personalWebsiteUrl: '',
        customLinks: [],
        targetJobRoles: isDemoStudent ? ['Full Stack Engineer', 'Backend Engineer'] : [],
        preferredIndustries: isDemoStudent ? ['FinTech', 'Enterprise SaaS'] : [],
        preferredLocations: isDemoStudent ? ['Bangalore', 'Remote', 'Pune'] : [],
        preferredEmploymentTypes: ['full-time'],
        selfDeclaredSkills: [],
        profileVisibility: {
          tpoTeam: true,
          recruitersOnShare: false,
          professionalLinksVisible: true,
          contactDetailsHidden: true,
          portfolioOnShare: true,
        },
        readinessScore: isDemoStudent ? '78.50' : '0.00',
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await fileService.listDocuments();
      if (res && res.documents) {
        setUploadedDocuments(res.documents);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadProfile();
    loadDocuments();
  }, []);

  const handleDownload = async (doc) => {
    try {
      await fileService.downloadFile(doc.id, doc.original_filename);
      toast.success(`Downloading ${doc.original_filename}...`);
    } catch (err) {
      toast.error('Download error: ' + err.message);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await fileService.deleteFile(docId);
      setUploadedDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Document deleted successfully');
    } catch (err) {
      toast.error('Delete error: ' + err.message);
    }
  };

  // AI Profiling Handlers
  const handleAnalyzeDocument = async (doc) => {
    try {
      setAnalyzingDocId(doc.id);
      setAnalysisStatusText('Initiating AI Profiler...');
      setProfilingMessage(null);

      const triggerRes = await profilingService.analyzeDocument(doc.id);
      const jobId = triggerRes.jobId || triggerRes.job?.id || triggerRes.id;

      if (!jobId) {
        const extraction = triggerRes.extraction || triggerRes;
        setActiveExtraction({
          ...extraction,
          originalFilename: doc.original_filename,
        });
        setIsReviewModalOpen(true);
        return;
      }

      setAnalysisStatusText('Processing document...');
      const completedJob = await profilingService.pollJobUntilComplete(
        jobId,
        1500,
        30,
        (job) => {
          if (job.status === 'PROCESSING') {
            setAnalysisStatusText('AI extracting skills & evidence...');
          } else if (job.status === 'QUEUED') {
            setAnalysisStatusText('Queued in processing pipeline...');
          }
        }
      );

      const extractionId = completedJob.extractionId || completedJob.result?.extractionId || completedJob.id;
      let extractionData;
      if (extractionId) {
        setAnalysisStatusText('Retrieving extracted profile...');
        extractionData = await profilingService.getExtraction(extractionId);
      } else {
        extractionData = completedJob.result || completedJob;
      }

      setActiveExtraction({
        ...extractionData,
        originalFilename: doc.original_filename,
      });
      setIsReviewModalOpen(true);
    } catch (err) {
      console.error('AI Profiling Error:', err);
      setProfilingMessage({
        type: 'error',
        text: err.message || 'AI document analysis failed. Please verify document format.'
      });
    } finally {
      setAnalyzingDocId(null);
      setAnalysisStatusText('');
    }
  };

  const handleExtractionApproved = (data) => {
    setProfilingMessage({
      type: 'success',
      text: `AI extraction approved! ${data.approvedSkillNames?.length || 0} skills queued as evidence in your portfolio.`
    });
    loadDocuments();
    loadProfile();
  };

  const handleExtractionRejected = () => {
    setProfilingMessage({
      type: 'info',
      text: 'AI extraction rejected. Audit log and document processing record updated.'
    });
  };

  const breadcrumbs = [
    { label: 'Student', href: '/student' },
    { label: 'My Profile' }
  ];

  const isDemoUser = ['aditya.sharma@apex.edu', 'student@apex.edu', 'priya.sharma21@college.edu'].includes(profileData?.email);

  const demoProjects = [
    {
      title: 'Distributed Event Booking Engine',
      tech: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
      repo: 'https://github.com/carrersync-demo/event-engine',
      verified: true,
      desc: 'High-throughput ticket reservation engine with concurrency locking and Stripe integration.'
    },
    {
      title: 'DevCollab - Realtime Code Workspace',
      tech: ['TypeScript', 'WebSocket', 'Tailwind CSS'],
      repo: 'https://github.com/carrersync-demo/devcollab',
      verified: true,
      desc: 'Collaborative cloud IDE with operational transformation and multi-cursor sync.'
    },
    {
      title: 'AI Resume Keyword Verifier',
      tech: ['Python', 'FastAPI', 'ChromaDB'],
      repo: 'https://github.com/carrersync-demo/resume-verifier',
      verified: false,
      desc: 'Vector-search based qualification matcher checking semantic similarity of resume bullets.'
    }
  ];

  const demoCertificates = [
    { title: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: 'Aug 2024', status: 'verified' },
    { title: 'Meta Front-End Developer Professional', issuer: 'Coursera / Meta', date: 'Jan 2024', status: 'verified' }
  ];

  const projects = isDemoUser ? demoProjects : [];
  const certificates = isDemoUser ? demoCertificates : [];

  const completeness = calculateProfileCompleteness(profileData);

  // Active social links array
  const activeSocialLinks = profileData
    ? Object.entries(PLATFORM_CONFIG)
        .filter(([key]) => profileData[key] && profileData[key].trim().length > 0)
        .map(([key, config]) => ({
          key,
          label: config.label,
          url: profileData[key],
          icon: config.icon,
          color: config.color,
          bg: config.bg,
        }))
    : [];

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#009669] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading student profile & academic records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile & Academic Records"
        subtitle="Manage your personal background, academic credentials, verified evidence repositories, and privacy visibility."
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex items-center gap-2">
            <Button to="/student/profile/edit" variant="primary" size="sm">
              <Edit2 className="h-4 w-4 mr-1.5" />
              Edit Profile
            </Button>
          </div>
        }
      />

      {profilingMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            profilingMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : profilingMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {profilingMessage.type === 'error' ? (
              <X className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{profilingMessage.text}</span>
          </div>
          <button
            onClick={() => setProfilingMessage(null)}
            className="p-1 hover:opacity-70 rounded transition-opacity"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Profile Completeness Card */}
      <Card className="p-5 border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Profile Completeness Index</h3>
              <Badge
                variant={completeness.score >= 80 ? 'mint' : completeness.score >= 50 ? 'aqua' : 'amber'}
                size="sm"
              >
                {completeness.score}% Completed
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Profiles above 80% completeness receive priority visibility in recruiter talent pools.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-full md:w-64">
              <ProgressBar
                value={completeness.score}
                max={100}
                showLabel
                label="Strength"
                color={completeness.score >= 80 ? 'mint' : completeness.score >= 50 ? 'aqua' : 'amber'}
              />
            </div>
            <Button to="/student/profile/edit" variant="outline" size="xs" className="shrink-0">
              Improve Score
            </Button>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 text-xs">
          {Object.entries(completeness.breakdown).map(([k, cat]) => {
            const isFull = cat.score >= cat.max;
            return (
              <div
                key={k}
                className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                  isFull ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-[11px] font-medium text-slate-500 truncate">{cat.label}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`font-bold ${isFull ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {cat.score} / {cat.max}
                  </span>
                  <span className="text-[10px] text-slate-400">pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Missing Item Suggestions */}
        {completeness.suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#009669]" />
              Recommended action:
            </span>
            {completeness.suggestions.map((s, idx) => (
              <Link
                key={idx}
                to="/student/profile/edit"
                className="text-[11px] bg-[#BDF9F9]/40 border border-[#02E8A7]/30 text-[#004D36] hover:bg-[#BDF9F9]/60 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
              >
                <span>{s.text}</span>
                <ArrowRight className="w-3 h-3 text-[#009669]" />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Main Profile Header Card */}
      {profileData && (
        <Card className="p-6 border-slate-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#002020] to-[#004D36] text-white flex items-center justify-center text-2xl font-bold shadow-xs overflow-hidden shrink-0 border border-[#02E8A7]/40">
                {profileData.avatarUrl ? (
                  <img
                    src={profileData.avatarUrl}
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>
                    {profileData.name
                      ? profileData.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'CS'}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{profileData.name}</h2>
                  <Badge variant="aqua" size="sm">Verified Student</Badge>
                  {profileData.currentCity && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {profileData.currentCity}, {profileData.state}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profileData.department} • Class of {profileData.batchYear} • {profileData.degree}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                  <span>
                    <span className="font-semibold text-slate-900">Roll:</span> {profileData.rollNumber}
                  </span>
                  <span>•</span>
                  <span>
                    <span className="font-semibold text-slate-900">CGPA:</span>{' '}
                    <strong className="text-[#009669]">{profileData.cgpa}</strong> / 10.0
                  </span>
                  <span>•</span>
                  <span>
                    <span className="font-semibold text-slate-900">Standing:</span> 7th Semester
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button to="/student/profile/edit" variant="primary" size="sm">
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Connected Professional & Social Links Bar */}
          <div className="py-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-2">Connected Links:</span>
            {activeSocialLinks.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No links added yet.{' '}
                <Link to="/student/profile/edit" className="text-[#009669] underline">
                  Add GitHub, LinkedIn, or LeetCode
                </Link>
              </span>
            ) : (
              activeSocialLinks.map((item) => {
                const IconComp = item.icon;
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <IconComp className="h-3.5 w-3.5 text-slate-600" />
                    <span>{item.label}</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                );
              })
            )}

            {/* Custom Links */}
            {(profileData.customLinks || []).map((cl, i) => (
              <a
                key={i}
                href={cl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-[#004D36] bg-[#BDF9F9]/30 hover:bg-[#BDF9F9]/60 transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>{cl.platform || 'Link'}</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            ))}
          </div>

          {/* Bio, Objective & Contact Grid */}
          <div className="mt-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Career Bio & Professional Summary
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">{profileData.bio}</p>
            </div>

            {profileData.careerObjective && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Career Objective</h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{profileData.careerObjective}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Institutional Email</span>
                <span className="font-semibold text-slate-800 truncate block">{profileData.email}</span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> SSO Verified
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Personal Email</span>
                <span className="font-semibold text-slate-800 truncate block">{profileData.personalEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-800 block">{profileData.phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Preferred Contact</span>
                <span className="font-semibold text-slate-800 capitalize block">
                  {profileData.preferredContactMethod}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Privacy & Visibility Badges Card */}
      {profileData && (
        <Card className="p-5 border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#009669]" />
                Profile Privacy & Visibility Status
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Current data privacy settings active for your candidate account.
              </p>
            </div>
            <Button to="/student/profile/edit" variant="outline" size="xs">
              Configure Privacy
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">College TPO Team</span>
              {profileData.profileVisibility?.tpoTeam ? (
                <Badge variant="emerald" size="xs">Visible</Badge>
              ) : (
                <Badge variant="rose" size="xs">Hidden</Badge>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Recruiter Pool</span>
              {profileData.profileVisibility?.recruitersOnShare ? (
                <Badge variant="aqua" size="xs">On Explicit Share</Badge>
              ) : (
                <Badge variant="slate" size="xs">Private by Default</Badge>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600 font-medium">Contact Details</span>
              {profileData.profileVisibility?.contactDetailsHidden ? (
                <Badge variant="emerald" size="xs">Guarded (Hidden)</Badge>
              ) : (
                <Badge variant="amber" size="xs">Direct Visible</Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Institutional Document & Resume Vault Card (Phase 08) */}
      <Card className="p-6 border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#009669]" />
              <h3 className="text-sm font-bold text-slate-900">Document Vault & Student Resumes</h3>
              <Badge variant="emerald" size="sm">Encrypted & Isolated</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload your official resume, academic degrees, and verified certificates.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setModalInitialType('resume');
                setIsUploadModalOpen(true);
              }}
              variant="primary"
              size="sm"
            >
              <UploadCloud className="h-4 w-4 mr-1.5" />
              Upload Resume
            </Button>
            <Button
              onClick={() => {
                setModalInitialType('academic_certificate');
                setIsUploadModalOpen(true);
              }}
              variant="outline"
              size="sm"
            >
              <Award className="h-4 w-4 mr-1.5" />
              Upload Certificate
            </Button>
          </div>
        </div>

        <div className="mt-4">
          {uploadedDocuments.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No documents uploaded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload your resume in PDF or DOCX format to enable automated skill profiling.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[#BDF9F9]/40 text-[#009669] rounded-lg shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {doc.original_filename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleAnalyzeDocument(doc)}
                      disabled={analyzingDocId === doc.id}
                      className="text-[#009669] border-[#02E8A7]/40 hover:bg-[#BDF9F9]/40 shrink-0"
                      title="Analyze skills and evidence using AI Profiler"
                    >
                      {analyzingDocId === doc.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-[#009669]" />
                          <span className="text-[11px] font-medium">{analysisStatusText || 'Analyzing...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1 text-[#009669]" />
                          <span className="text-[11px] font-medium">Analyze with AI Profiler</span>
                        </>
                      )}
                    </Button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 text-slate-500 hover:text-[#009669] hover:bg-[#BDF9F9]/40 rounded-lg transition-colors"
                      title="Download document"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Projects & Certifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Projects */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-[#009669]" />
              <h3 className="text-sm font-bold text-slate-900">Evidence Projects</h3>
            </div>
            <Badge variant="aqua" size="sm">{projects.length} Repositories</Badge>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <FolderGit2 className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No projects linked yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Link your repositories or complete hands-on learning tasks to build engineering proof-of-work.
                </p>
              </div>
            ) : (
              projects.map((proj) => (
                <div key={proj.title} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <a
                      href={proj.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-900 hover:text-[#009669] flex items-center gap-1"
                    >
                      <span>{proj.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                    <StatusBadge status={proj.verified ? 'verified' : 'evidence_linked'} />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{proj.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {proj.tech.map((t) => (
                      <span key={t} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Certifications & Academics */}
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#009669]" />
              <h3 className="text-sm font-bold text-slate-900">Verified Certifications</h3>
            </div>
            <Badge variant="mint" size="sm">Institutional Proof</Badge>
          </div>

          <div className="space-y-3">
            {certificates.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Award className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No verified certificates</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload official certifications in your Document Vault above for TPO verification.
                </p>
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.title} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{cert.title}</h4>
                    <StatusBadge status={cert.status} />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                    <span>{cert.issuer}</span>
                    <span>Issued: {cert.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Academic Consistency</h4>
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span>Active Backlogs: <strong className="text-emerald-600">0</strong></span>
              <span>Credits Completed: <strong className="text-slate-900">142 / 160</strong></span>
              <span>Semester: <strong className="text-slate-900">7th</strong></span>
            </div>
          </div>
        </Card>
      </div>

      {/* Academic Correction Request History Card */}
      {correctionRequests.length > 0 && (
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#009669]" />
                Submitted Academic Correction Requests
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Status of requests submitted to the college TPO cell for certified academic records.
              </p>
            </div>
            <Button to="/student/profile/edit" variant="outline" size="xs">
              Manage Requests
            </Button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {correctionRequests.map((req) => (
              <div key={req.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 capitalize">
                      {req.fieldName.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <Badge
                      variant={
                        req.status === 'APPROVED'
                          ? 'emerald'
                          : req.status === 'REJECTED'
                          ? 'rose'
                          : 'amber'
                      }
                      size="xs"
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    Requested: {req.requestedValue} • {req.reason}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={loadDocuments}
        initialType={modalInitialType}
      />

      <ProfileReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        extraction={activeExtraction}
        onApproved={handleExtractionApproved}
        onRejected={handleExtractionRejected}
      />
    </div>
  );
}
