import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  FileCode,
  BookOpen,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  Share2,
  TrendingUp,
  AlertCircle,
  User,
  Edit2,
  CheckSquare,
  Square,
  AlertTriangle,
  Building,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Flame,
  Layers,
  GraduationCap
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastContext';
import studentProfileService from '../../services/studentProfileService';
import authService from '../../services/authService';
import { calculateProfileCompleteness } from '../../utils/profileCompleteness';

const DEMO_ALL_SKILLS = [
  { name: 'JavaScript (ES6+)', status: 'verified', level: 'Advanced', evidenceCount: 5, category: 'Frontend/Core', endorsedBy: 'Faculty Review' },
  { name: 'PostgreSQL', status: 'verified', level: 'Advanced', evidenceCount: 4, category: 'Database', endorsedBy: 'TPO Verified' },
  { name: 'Node.js & Express', status: 'verified', level: 'Intermediate', evidenceCount: 4, category: 'Backend', endorsedBy: 'Faculty Review' },
  { name: 'Git & GitHub Workflow', status: 'verified', level: 'Advanced', evidenceCount: 6, category: 'DevOps', endorsedBy: 'Automated Sync' },
  { name: 'HTML5 & Modern CSS', status: 'verified', level: 'Advanced', evidenceCount: 5, category: 'Frontend', endorsedBy: 'Coursework' },
  { name: 'Python Fundamentals', status: 'verified', level: 'Intermediate', evidenceCount: 3, category: 'Core', endorsedBy: 'Lab Exam' },
  { name: 'React.js', status: 'evidence_linked', level: 'Intermediate', evidenceCount: 3, category: 'Frontend', endorsedBy: 'Pending TPO Review' },
  { name: 'Tailwind CSS', status: 'evidence_linked', level: 'Advanced', evidenceCount: 3, category: 'Frontend', endorsedBy: 'Portfolio' },
  { name: 'REST API Architecture', status: 'evidence_linked', level: 'Intermediate', evidenceCount: 2, category: 'Backend', endorsedBy: 'GitHub Commit' },
  { name: 'Data Structures & Algorithms', status: 'assessed', level: 'Intermediate', score: '84/100', category: 'Core', endorsedBy: 'Mock Test' },
  { name: 'System Design Basics', status: 'assessed', level: 'Beginner', score: '72/100', category: 'Architecture', endorsedBy: 'Quiz' },
  { name: 'TypeScript', status: 'observed', level: 'Beginner', evidenceCount: 1, category: 'Languages', endorsedBy: 'Repo Sync' },
  { name: 'Docker & Containers', status: 'claimed', level: 'Beginner', evidenceCount: 0, category: 'DevOps', endorsedBy: 'Self Reported' },
];

const DEMO_CAREER_PATHS = [
  {
    role: 'Full Stack Engineer',
    matchScore: 84,
    verifiedCount: 5,
    totalRequired: 6,
    readiness: 'High Alignment',
    missingSkills: ['Docker & Containers'],
    hiringCompanies: ['Google', 'Razorpay', 'TCS Digital', 'Zoho'],
    avgCtc: '14.5 LPA',
  },
  {
    role: 'Frontend Specialist (React)',
    matchScore: 92,
    verifiedCount: 6,
    totalRequired: 6,
    readiness: 'Drive Ready',
    missingSkills: [],
    hiringCompanies: ['Atlassian', 'Swiggy', 'PhonePe'],
    avgCtc: '18.0 LPA',
  },
  {
    role: 'Backend Platform Engineer',
    matchScore: 76,
    verifiedCount: 4,
    totalRequired: 6,
    readiness: 'Remediation Needed',
    missingSkills: ['Docker & Containers', 'Redis Caching'],
    hiringCompanies: ['Amazon', 'Razorpay', 'JPMorgan'],
    avgCtc: '20.0 LPA',
  },
];

const DEMO_PLACEMENT_DRIVES = [
  {
    id: 'drv-google',
    company: 'Google',
    role: 'Software Engineer (University Grad)',
    ctc: '24.5 LPA',
    location: 'Bengaluru / Hyderabad',
    date: 'Nov 28, 2024',
    daysLeft: 12,
    eligible: true,
    eligibilityReasons: ['CGPA 8.4 ≥ 8.0 threshold', '5/5 Verified core competencies', '0 Active backlogs'],
    applied: false,
  },
  {
    id: 'drv-tcs',
    company: 'TCS Digital',
    role: 'Digital Cadre Systems Engineer',
    ctc: '9.2 LPA',
    location: 'Pan India',
    date: 'Dec 02, 2024',
    daysLeft: 16,
    eligible: true,
    eligibilityReasons: ['All B.Tech CSE eligible', 'DSA Assessment cleared (>75%)'],
    applied: true,
  },
  {
    id: 'drv-razorpay',
    company: 'Razorpay',
    role: 'Backend Platform Engineer',
    ctc: '18.0 LPA',
    location: 'Bengaluru',
    date: 'Dec 10, 2024',
    daysLeft: 24,
    eligible: false,
    eligibilityReasons: ['Requires verified containerization (Docker)', 'CGPA: 8.4 eligible'],
    applied: false,
  },
];

const DEMO_TASKS = [
  { id: 't1', title: 'Upload Docker Compose Evidence', category: 'Skill Remediation', completed: false, due: 'In 2 days', link: '/student/skills' },
  { id: 't2', title: 'Complete DSA Graph Traversal Mock Test', category: 'Assessment', completed: true, due: 'Completed', link: '/student/mock-drives' },
  { id: 't3', title: 'Set Target Job Preferences & Locations', category: 'Profile Guidance', completed: false, due: 'In 4 days', link: '/student/profile/edit' },
  { id: 't4', title: 'Book Alumni Mock Interview with SDE-2', category: 'Mentorship', completed: false, due: 'This week', link: '/student/mentorship' },
];

const NEW_STUDENT_TASKS = [
  { id: 't1', title: 'Complete Profile Details (Bio, Contact & Links)', category: 'Profile Setup', completed: false, due: 'Priority', link: '/student/profile/edit' },
  { id: 't2', title: 'Upload Official Resume to Document Vault', category: 'Documentation', completed: false, due: 'Recommended', link: '/student/profile' },
  { id: 't3', title: 'Link GitHub Repositories for Evidence Audit', category: 'Proof of Work', completed: false, due: 'This week', link: '/student/skills' },
  { id: 't4', title: 'Attempt Diagnostic Mock Technical Assessment', category: 'Readiness', completed: false, due: 'Open', link: '/student/mock-drives' },
];

export default function StudentOverview() {
  const toast = useToast();
  const currentUser = authService.getCurrentUser();
  const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu', 'priya.sharma21@college.edu'].includes(currentUser?.email);

  const [profile, setProfile] = useState(null);
  const [completeness, setCompleteness] = useState({
    score: isDemoStudent ? 82 : 25,
    breakdown: {
      personal: { label: 'Personal Information', score: isDemoStudent ? 16 : 5, max: 20 },
      contact: { label: 'Contact Details', score: isDemoStudent ? 15 : 5, max: 15 },
      professionalLinks: { label: 'Professional Links', score: isDemoStudent ? 18 : 0, max: 25 },
      academic: { label: 'Academic Records', score: isDemoStudent ? 20 : 15, max: 20 },
      preferences: { label: 'Career Preferences', score: isDemoStudent ? 13 : 0, max: 20 },
    },
    suggestions: isDemoStudent ? [
      { category: 'Links', text: 'Add GitHub evidence repo with Dockerfile to verify DevOps competency' },
      { category: 'Preferences', text: 'Select preferred work locations (e.g. Bengaluru, Pune, Remote)' },
      { category: 'Personal', text: 'Update professional summary with recent hackathon achievements' }
    ] : [
      { category: 'Personal', text: 'Add your professional summary and career objective in your profile' },
      { category: 'Links', text: 'Connect your GitHub or LinkedIn profile to build verified proof-of-work' },
      { category: 'Documents', text: 'Upload your latest resume in Document Vault for AI skill extraction' }
    ]
  });

  // Action checklist for next steps
  const [tasks, setTasks] = useState(() => (isDemoStudent ? DEMO_TASKS : NEW_STUDENT_TASKS));

  // Selected filter for verified skills lifecycle
  const [skillFilter, setSkillFilter] = useState('ALL');

  useEffect(() => {
    let mounted = true;
    async function loadStudentData() {
      try {
        const res = await studentProfileService.getProfile();
        const data = res?.data || res?.profile || res;
        if (mounted && data && typeof data === 'object') {
          setProfile(data);
          const computed = calculateProfileCompleteness(data);
          if (computed && computed.score > 0) {
            setCompleteness(computed);
          }
        }
      } catch (err) {
        // Fallback gracefully to default state
      }
    }
    loadStudentData();
    return () => { mounted = false; };
  }, []);

  const toggleTask = (id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const nextState = !t.completed;
          if (nextState) {
            toast.success(`Completed: ${t.title}`);
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const breadcrumbs = [
    { label: 'Student', href: '/student' },
    { label: 'Overview' }
  ];

  // 5-Stage Verification Lifecycle Distribution
  const lifecycleStats = isDemoStudent ? {
    claimed: 1,
    observed: 2,
    evidence_linked: 3,
    assessed: 2,
    verified: 6,
  } : {
    claimed: 0,
    observed: 0,
    evidence_linked: 0,
    assessed: 0,
    verified: 0,
  };

  const allSkills = isDemoStudent ? DEMO_ALL_SKILLS : [];

  const filteredSkills = skillFilter === 'ALL'
    ? allSkills
    : allSkills.filter(s => s.status === skillFilter);

  // Relevant Career Paths
  const careerPaths = isDemoStudent ? DEMO_CAREER_PATHS : [];

  // Available Upcoming Placement Drives
  const placementDrives = isDemoStudent ? DEMO_PLACEMENT_DRIVES : [];

  const studentDisplayName = profile?.name || profile?.user?.fullName || profile?.user?.name || currentUser?.fullName || (isDemoStudent ? 'Aditya' : 'Student');

  const handleApplyDrive = (drive) => {
    if (!drive.eligible) {
      toast.warning(`Cannot apply: Please resolve the skill gap for ${drive.company} first.`);
      return;
    }
    toast.success(`Application submitted for ${drive.company} — ${drive.role}!`);
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${studentDisplayName.split(' ')[0]}!`}
        subtitle="Your placement intelligence hub. Real-time skill verification, guided gap remediation, and tier-1 drive eligibility."
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex flex-wrap gap-2">
            <Button to="/student/profile/edit" variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-1.5 text-[#009669]" />
              Edit Profile & Links
            </Button>
            <Button to="/student/knowledge-graph" variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1.5 text-[#009669]" />
              Knowledge Graph
            </Button>
            <Button to="/student/skills" variant="primary" size="sm">
              <Award className="h-4 w-4 mr-1.5" />
              Manage Evidence
            </Button>
          </div>
        }
      />

      {/* 1. Profile Readiness & Incomplete Information Guidance */}
      <section aria-labelledby="profile-readiness-heading" className="rounded-2xl border border-[#02E8A7]/40 bg-gradient-to-r from-[#BDF9F9]/40 via-white to-[#E2FFFE]/50 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span id="profile-readiness-heading" className="text-xs font-bold uppercase tracking-wider text-[#004D36]">Placement Readiness Index</span>
              <Badge variant="aqua" size="sm">High Alignment</Badge>
            </div>
            <h2 className="text-lg font-bold text-[#002020]">
              Profile Completeness: <span className="text-[#009669]">{completeness.score}%</span> Complete
            </h2>
            <p className="text-xs text-[#3B4A42] max-w-2xl leading-relaxed">
              Recruiters prioritize candidate profiles with &gt;90% completeness and verified evidence. Your profile is in the top 15% of your batch.
            </p>

            {/* Incomplete items guidance box */}
            {completeness.suggestions && completeness.suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-white/95 border border-amber-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Action Needed: Complete these fields to reach 100%</span>
                </div>
                <div className="space-y-1.5">
                  {completeness.suggestions.map((sug, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-[#3B4A42] pl-5 relative">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute left-1.5 top-1.5" />
                      <span>{sug.text}</span>
                      <Link
                        to="/student/profile/edit"
                        className="text-[11px] font-bold text-[#009669] hover:text-[#004D36] shrink-0 ml-3 hover:underline"
                      >
                        Fix Now →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Completeness Breakdown Meters */}
          <div className="w-full lg:w-96 space-y-3 bg-white p-4 rounded-xl border border-[#BACBC0]/40 shadow-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#002020]">Overall Completeness</span>
              <span className="font-bold text-[#009669] text-sm">{completeness.score}%</span>
            </div>
            <ProgressBar value={completeness.score} variant="mint" size="md" />

            <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] border-t border-[#BACBC0]/30">
              {Object.entries(completeness.breakdown || {}).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[#3B4A42]">
                    <span className="truncate pr-1">{val.label}</span>
                    <span className="font-medium text-[#002020]">{val.score}/{val.max}</span>
                  </div>
                  <div className="w-full bg-[#BDF9F9]/30 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#02E8A7] h-full rounded-full"
                      style={{ width: `${(val.score / val.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-[11px] text-[#3B4A42] border-t border-[#BACBC0]/30">
              <Link to="/student/profile/edit" className="font-bold text-[#009669] hover:text-[#004D36] flex items-center">
                <Edit2 className="h-3 w-3 mr-1" /> Edit Profile & Links
              </Link>
              <Link to="/student/skill-gap" className="font-medium text-[#3B4A42] hover:text-[#002020] hover:underline flex items-center">
                Gap Analysis <ArrowRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Stat Cards */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Skills"
          value={String(lifecycleStats.verified)}
          subtitle={isDemoStudent ? "Out of 13 recorded skills" : "Awaiting TPO validation"}
          trend={isDemoStudent ? "up" : "neutral"}
          trendValue={isDemoStudent ? "+2 this month" : "0 pending"}
          icon={Award}
          color="mint"
        />
        <StatCard
          title="Evidence Artifacts"
          value={isDemoStudent ? "23" : "0"}
          subtitle={isDemoStudent ? "Repos, commits, lab proofs" : "Upload documents to Vault"}
          trend={isDemoStudent ? "up" : "neutral"}
          trendValue={isDemoStudent ? "+5 synced" : "0 synced"}
          icon={FileCode}
          color="aqua"
        />
        <StatCard
          title="Actionable Next Steps"
          value={`${completedCount}/${tasks.length}`}
          subtitle={`${tasks.length - completedCount} pending`}
          trend="neutral"
          trendValue="On schedule"
          icon={CheckSquare}
          color="teal"
        />
        <StatCard
          title="Eligible Drives"
          value={isDemoStudent ? "2 Active" : "0 Active"}
          subtitle={isDemoStudent ? "1 pending Docker gap" : "Awaiting drive schedules"}
          trend="neutral"
          trendValue={isDemoStudent ? "Next: Nov 28" : "Open"}
          icon={Calendar}
          color="amber"
        />
      </section>

      {/* 2. Main Grid: Which Skills Verified (5 Stages) + Relevant Career Paths */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 5-Stage Verification Matrix */}
        <section aria-labelledby="skills-matrix-heading" className="lg:col-span-2 space-y-6">
          <Card className="p-5 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 id="skills-matrix-heading" className="text-base font-bold text-slate-900">
                  Evidence-Based Skill Lifecycle
                </h2>
                <p className="text-xs text-slate-500">
                  Skills progress through 5 rigorous validation stages from Claimed to Faculty Verified
                </p>
              </div>
              <Link
                to="/student/skills"
                className="text-xs font-bold text-[#009669] hover:underline shrink-0"
              >
                Manage All Evidence →
              </Link>
            </div>

            {/* 5-Stage Lifecycle Tabs / Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2 bg-[#BDF9F9]/20 rounded-xl border border-[#BACBC0]/40 mb-4 text-center">
              {[
                { key: 'claimed', label: '1. Claimed', count: lifecycleStats.claimed, color: 'text-[#3B4A42]' },
                { key: 'observed', label: '2. Observed', count: lifecycleStats.observed, color: 'text-sky-700' },
                { key: 'evidence_linked', label: '3. Evidence', count: lifecycleStats.evidence_linked, color: 'text-amber-700' },
                { key: 'assessed', label: '4. Assessed', count: lifecycleStats.assessed, color: 'text-teal-700' },
                { key: 'verified', label: '5. Verified', count: lifecycleStats.verified, color: 'text-[#009669]' },
              ].map(stage => (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => setSkillFilter(skillFilter === stage.key ? 'ALL' : stage.key)}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    skillFilter === stage.key
                      ? 'bg-white shadow-xs font-bold ring-1 ring-[#02E8A7]'
                      : 'hover:bg-white/60 text-[#3B4A42]'
                  }`}
                >
                  <span className="block text-[11px] text-[#3B4A42]">{stage.label}</span>
                  <span className={`text-sm font-bold ${stage.color}`}>{stage.count} skills</span>
                </button>
              ))}
            </div>

            {skillFilter !== 'ALL' && (
              <div className="flex items-center justify-between text-xs pb-2 text-[#3B4A42]">
                <span>Filtering by stage: <strong className="text-[#002020] capitalize">{skillFilter.replace('_', ' ')}</strong></span>
                <button
                  type="button"
                  onClick={() => setSkillFilter('ALL')}
                  className="text-[#009669] hover:underline font-bold"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Skills Table List or Empty State */}
            {filteredSkills.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                <Award className="h-8 w-8 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 text-xs">No Skills at this Stage</p>
                <p className="text-[11px]">Upload documents in your Document Vault or complete coding modules to progress competencies.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {filteredSkills.map((skill) => (
                  <div key={skill.name} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#002020]">{skill.name}</span>
                        <StatusBadge status={skill.status} />
                        <Badge variant="slate" size="sm">{skill.category}</Badge>
                      </div>
                      <p className="text-xs text-[#3B4A42] flex items-center gap-2">
                        <span>{skill.level}</span>
                        <span>•</span>
                        {skill.evidenceCount !== undefined && <span>{skill.evidenceCount} verified artifacts</span>}
                        {skill.score && <span>Assessment score: {skill.score}</span>}
                        <span>•</span>
                        <span className="text-[#3B4A42]/70">Validated via: {skill.endorsedBy}</span>
                      </p>
                    </div>
                    <Link
                      to="/student/skills"
                      className="text-xs font-semibold text-[#002020] hover:text-[#009669] px-3 py-1.5 rounded-lg border border-[#BACBC0]/40 hover:border-[#02E8A7] bg-white shadow-2xs self-start sm:self-auto"
                    >
                      View Evidence
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 3. What Needs Improvement (Actionable Skill Gap Remediation) */}
          <Card className="p-5 border-[#BACBC0]/40 bg-gradient-to-b from-white to-[#E2FFFE]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#009669]" />
                <h3 className="text-sm font-bold text-[#002020]">What Needs Improvement (Priority Remediation)</h3>
              </div>
              <Link to="/student/skill-gap" className="text-xs font-bold text-[#009669] hover:underline">
                View Full Matrix →
              </Link>
            </div>

            {isDemoStudent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="rose" size="sm">Critical Placement Blocker</Badge>
                      <span className="text-[11px] text-slate-400">~45 Mins</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Docker Containerization</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Razorpay and Tier-1 DevOps profiles require verified containers. Currently <strong>Claimed</strong>. Submit repository with Dockerfile to graduate to Evidence-Linked.
                    </p>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Target: Backend / DevOps</span>
                    <Button to="/student/skills" variant="outline" size="xs">
                      Upload Proof →
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-amber-100 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="amber" size="sm">Assessment Recommended</Badge>
                      <span className="text-[11px] text-slate-400">~30 Mins</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">System Design Fundamentals</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Score is 72/100 (threshold for Tier-1 is &gt;80%). Complete the caching & database sharding module before Google drive.
                    </p>
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Target: SDE-1</span>
                    <Button to="/student/mock-drives" variant="outline" size="xs">
                      Take Test →
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                <Sparkles className="h-7 w-7 text-slate-300 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 text-xs">No Diagnostic Gaps Identified</p>
                <p className="text-[11px]">Take an initial mock drive assessment to identify exact strengths and automated skill gap remediation plans.</p>
              </div>
            )}
          </Card>

          {/* 4. Relevant Career Paths */}
          <Card className="p-5 border-[#BACBC0]/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#009669]" />
                <h3 className="text-base font-bold text-[#002020]">Target Career Paths & Match Index</h3>
              </div>
              <Link to="/student/career-recommendations" className="text-xs font-bold text-[#009669] hover:underline">
                Explore More Roles →
              </Link>
            </div>

            <div className="space-y-3">
              {careerPaths.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                  <Target className="h-7 w-7 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700 text-xs">No Career Paths Modeled Yet</p>
                  <p className="text-[11px]">Declare your target job roles in your profile to view automated competency matching and company hiring pipelines.</p>
                </div>
              ) : (
                careerPaths.map((path) => (
                  <div key={path.role} className="p-3.5 rounded-xl border border-[#BACBC0]/40 bg-white hover:border-[#02E8A7] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#002020]">{path.role}</h4>
                        <Badge
                          variant={path.matchScore >= 90 ? 'emerald' : path.matchScore >= 80 ? 'aqua' : 'amber'}
                          size="sm"
                        >
                          {path.matchScore}% Match
                        </Badge>
                      </div>
                      <span className="text-xs font-bold text-[#002020]">Average CTC: {path.avgCtc}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#3B4A42] pt-1">
                      <div>
                        <span className="text-[#3B4A42]/70">Target Companies: </span>
                        <span className="font-medium text-[#002020]">{path.hiringCompanies.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[#3B4A42]/70">Missing Competencies: </span>
                        {path.missingSkills.length === 0 ? (
                          <span className="font-semibold text-[#009669]">None — All verified!</span>
                        ) : (
                          <span className="font-semibold text-rose-600">{path.missingSkills.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        {/* Right Column: Next Steps & Available Placement Drives */}
        <div className="space-y-6">
          {/* 5. Guided Next Steps Checklist */}
          <Card className="p-5 border-[#BACBC0]/40 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#009669]" />
                <h3 className="text-sm font-bold text-[#002020]">Your Action Plan for This Week</h3>
              </div>
              <span className="text-xs font-bold text-[#009669]">{completedCount}/{tasks.length} Done</span>
            </div>
            <p className="text-xs text-[#3B4A42] mb-4">
              Complete these tasks to increase your recruiter matching score before the upcoming drives.
            </p>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    task.completed
                      ? 'bg-slate-50 border-[#BACBC0]/30 text-[#3B4A42]/60'
                      : 'bg-white border-[#BACBC0]/40 hover:border-[#02E8A7] shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                    className="mt-0.5 text-[#3B4A42] hover:text-[#009669] shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#009669]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#BACBC0]" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${task.completed ? 'line-through text-[#3B4A42]/70' : 'text-[#002020]'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-[#3B4A42]">{task.category}</span>
                      <span className={task.completed ? 'text-[#009669] font-medium' : 'text-amber-700 font-medium'}>
                        {task.due}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 6. Available Campus Placement Drives */}
          <Card className="p-5 border-[#BACBC0]/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#009669]" />
                <h3 className="text-sm font-bold text-[#002020]">Upcoming Placement Drives</h3>
              </div>
              <Link to="/student/applications" className="text-xs font-bold text-[#009669] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {placementDrives.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                  <Calendar className="h-7 w-7 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700 text-xs">No Upcoming Drives</p>
                  <p className="text-[11px]">Your college Training & Placement cell will publish verified drive notices here as schedules are confirmed.</p>
                </div>
              ) : (
                placementDrives.map((drv) => (
                  <div key={drv.id} className="p-3.5 rounded-xl border border-[#BACBC0]/40 bg-[#E2FFFE]/20 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-[#002020]">{drv.company}</h4>
                        <p className="text-[11px] text-[#3B4A42]">{drv.role}</p>
                      </div>
                      <Badge variant={drv.eligible ? 'emerald' : 'amber'} size="sm">
                        {drv.eligible ? 'Eligible' : 'Skill Gap'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#3B4A42] pt-1 border-t border-[#BACBC0]/30">
                      <span className="font-semibold text-[#004D36]">{drv.ctc}</span>
                      <span className="text-[#3B4A42]">Starts in {drv.daysLeft} days</span>
                    </div>

                    <div className="pt-1">
                      {drv.applied ? (
                        <Button variant="secondary" size="xs" disabled className="w-full">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#009669]" />
                          Application Submitted
                        </Button>
                      ) : (
                        <Button
                          variant={drv.eligible ? 'primary' : 'outline'}
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyDrive(drv);
                          }}
                          className="w-full"
                        >
                          {drv.eligible ? 'Apply Now' : 'Check Missing Criteria'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Mentorship & Peer Interview Card */}
          <Card className="p-5 border-[#BACBC0]/40 bg-gradient-to-tr from-[#BDF9F9]/30 to-white">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-[#009669]" />
              <h3 className="text-xs font-bold text-[#002020]">Alumni Network & Practice</h3>
            </div>
            <p className="text-xs text-[#3B4A42] mb-3 leading-relaxed">
              Connect with senior alumni working at Google, Amazon & Microsoft for 1-on-1 resume reviews and mock interviews.
            </p>
            <div className="flex gap-2">
              <Button to="/student/mentorship" variant="outline" size="xs" className="flex-1">
                Book Mentor
              </Button>
              <Button to="/student/peer-interviews" variant="primary" size="xs" className="flex-1">
                Peer Mock
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
