import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  BrainCircuit,
  Target,
  BarChart3,
  Workflow,
  GraduationCap,
  Building,
  Shield,
  Layers,
  Lock,
  EyeOff,
  GitCommit,
  Share2,
  Check,
  FileCheck,
  TrendingUp,
  Award,
  Users,
  Compass,
  Code2
} from 'lucide-react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import BrandLogo from '../../components/ui/BrandLogo';

export default function LandingPage() {
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  const agents = [
    {
      title: 'Student Profiling Agent',
      code: 'Agent 01',
      role: 'Multimodal Evidence Synthesis',
      description: 'Parses multimodal student evidence (GitHub repositories, commits, LeetCode milestones, verified coursework, and hackathon artifacts) into a structured, tamper-proof competency profile.',
      icon: BrainCircuit,
      badge: 'Profile Intelligence',
      capabilities: [
        'Automated GitHub repo and commit frequency parsing',
        'Academic coursework & project artifact normalization',
        'Direct mapping from self-declared claims to code evidence'
      ]
    },
    {
      title: 'Industry Skill-Gap Agent',
      code: 'Agent 02',
      role: 'Real-Time Demand Mapping',
      description: 'Continuously ingests and analyzes active industry job descriptions, diagnosing cohort skill deficiencies against market trends and prescribing micro-learning interventions.',
      icon: Target,
      badge: 'Market Calibration',
      capabilities: [
        'Real-time parsing of market JDs into taxonomy skills',
        'Cohort-level and individual student deficiency scoring',
        'Dynamic curation of bite-sized learning pathways'
      ]
    },
    {
      title: 'Predictive Placement Analytics Agent',
      code: 'Agent 03',
      role: 'Readiness & Risk Scoring',
      description: 'Calculates placement readiness and company alignment indices with transparent, explainable factors — strictly rejecting opaque black-box scoring.',
      icon: BarChart3,
      badge: 'Explainable AI',
      capabilities: [
        'Explainable readiness breakdown with factor weighting',
        'Company fit scoring based on verified evidence',
        'Early warning alerts for students needing targeted prep'
      ]
    },
    {
      title: 'Placement Orchestration Agent',
      code: 'Agent 04',
      role: 'Drive Management & Matching',
      description: 'Automates end-to-end drive scheduling, eligibility enforcement, candidate shortlisting, and notification workflows with mandatory human-in-the-loop oversight.',
      icon: Workflow,
      badge: 'Workflow Automation',
      capabilities: [
        'Strict policy-based eligibility filter execution',
        'Automated interview slot scheduling and notifications',
        'Mandatory TPO human sign-off before publishing actions'
      ]
    }
  ];

  const studentJourneySteps = [
    {
      step: '01',
      title: 'Profile Building',
      desc: 'Link GitHub repos, academic records, and portfolio projects to create an authentic student dossier.',
      icon: Code2
    },
    {
      step: '02',
      title: 'Skill Verification',
      desc: 'Skills transition from self-declared claims to verified competencies via faculty & code test validation.',
      icon: FileCheck
    },
    {
      step: '03',
      title: 'Gap Analysis',
      desc: 'Benchmark your profile against target company requirements and receive instant skill gap diagnosis.',
      icon: Target
    },
    {
      step: '04',
      title: 'Learning Path',
      desc: 'Follow curated, milestone-based learning modules designed to systematically close identified gaps.',
      icon: Compass
    },
    {
      step: '05',
      title: 'Mock Assessments',
      desc: 'Practice adaptive coding rounds, simulated technical assessments, and peer interview sessions.',
      icon: Users
    },
    {
      step: '06',
      title: 'Campus Drives',
      desc: 'Get auto-matched with visiting companies where your verified skills meet strict drive criteria.',
      icon: Building
    },
    {
      step: '07',
      title: 'Offer Acceptance',
      desc: 'Manage multiple offers transparently with automated college governance and accreditation reporting.',
      icon: Award
    }
  ];

  const skillLifecycle = [
    { state: 'claimed', label: 'Claimed', desc: 'Student self-reports a skill without verifiable proof.', badgeVariant: 'claimed' },
    { state: 'observed', label: 'Observed', desc: 'Activity detected in coursework, assignments, or lab submissions.', badgeVariant: 'observed' },
    { state: 'evidence_linked', label: 'Evidence-linked', desc: 'Directly linked to a GitHub repository, project commit, or certificate.', badgeVariant: 'evidence-linked' },
    { state: 'verified', label: 'Verified', desc: 'Faculty, automated test, or institutional assessment validated.', badgeVariant: 'verified' },
    { state: 'expired', label: 'Expired', desc: 'Stale skill without active practice or verification in 18 months.', badgeVariant: 'expired' }
  ];

  return (
    <div className="min-h-screen bg-[#E2FFFE] text-[#002020] selection:bg-[#02E8A7] selection:text-[#002020] font-sans">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-[#BACBC0]/40 bg-gradient-to-b from-white via-[#E2FFFE]/70 to-[#E2FFFE]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#02E8A7]/50 bg-[#C3FFFE]/80 px-4 py-1.5 text-xs font-semibold text-[#004D36] shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-[#02E8A7]" />
              <span className="tracking-wider uppercase font-bold text-[11px]">LEARN • VERIFY • GET HIRED</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-[#002020] sm:text-5xl lg:text-6xl leading-[1.15]">
              From Skills to{' '}
              <span className="bg-gradient-to-r from-[#009669] via-[#00B48A] to-[#004D36] bg-clip-text text-transparent">
                Successful Careers.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#3B4A42] max-w-2xl mx-auto leading-relaxed">
              An intelligent placement ecosystem connecting verified student skills, industry demand, personalized preparation, and campus hiring.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button to="/student" variant="primary" size="lg" className="shadow-md">
                Explore Student Dashboard
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button to="/admin" variant="secondary" size="lg">
                T&P Admin Center
              </Button>
              <Button to="/recruiter" variant="outline" size="lg">
                Recruiter Portal
              </Button>
            </div>

            {/* Platform Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-[#BACBC0]/40 max-w-4xl mx-auto">
              <div className="p-4 bg-white rounded-xl border border-[#BACBC0]/40 shadow-xs text-center">
                <div className="text-2xl font-bold text-[#002020]">6 Roles</div>
                <div className="text-xs text-[#3B4A42] font-medium mt-0.5">Students, TPO, Admins, Recruiters</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#BACBC0]/40 shadow-xs text-center">
                <div className="text-2xl font-bold text-[#009669]">4 Agents</div>
                <div className="text-xs text-[#3B4A42] font-medium mt-0.5">Autonomous Intelligence</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#BACBC0]/40 shadow-xs text-center">
                <div className="text-2xl font-bold text-[#D97706]">5 States</div>
                <div className="text-xs text-[#3B4A42] font-medium mt-0.5">Claimed to Verified</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#BACBC0]/40 shadow-xs text-center">
                <div className="text-2xl font-bold text-[#004D36]">₹0 Budget</div>
                <div className="text-xs text-[#3B4A42] font-medium mt-0.5">Zero-Cost Infrastructure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Multi-Agent Architecture Interactive Showcase */}
      <section id="agents" className="py-20 bg-white border-b border-[#BACBC0]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#009669] mb-2">Autonomous Multi-Agent Core</h2>
            <h3 className="text-3xl font-bold text-[#002020] tracking-tight">Four Specialized AI Placement Agents</h3>
            <p className="mt-3 text-sm text-[#3B4A42]">
              Autonomous micro-agents working in orchestration, with deterministic rule-based fallbacks for guaranteed ₹0-budget reliability.
            </p>
          </div>

          {/* Interactive Agent Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {agents.map((agent, idx) => {
              const Icon = agent.icon;
              const isActive = activeAgentIndex === idx;
              return (
                <button
                  key={agent.title}
                  onClick={() => setActiveAgentIndex(idx)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-[#BDF9F9]/40 border-[#02E8A7] shadow-sm'
                      : 'bg-white border-[#BACBC0]/40 hover:border-[#02E8A7]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-[#3B4A42]">{agent.code}</span>
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#009669]' : 'text-[#3B4A42]'}`} />
                  </div>
                  <h4 className="text-sm font-bold text-[#002020]">{agent.title}</h4>
                  <span className="text-xs text-[#3B4A42] mt-1">{agent.role}</span>
                </button>
              );
            })}
          </div>

          {/* Active Agent Details Spotlight */}
          {(() => {
            const currentAgent = agents[activeAgentIndex];
            const AgentIcon = currentAgent.icon;
            return (
              <div className="p-8 rounded-2xl bg-[#E2FFFE]/50 border border-[#BACBC0]/40 shadow-xs flex flex-col lg:flex-row items-start justify-between gap-8">
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#02E8A7]/40 text-xs font-bold text-[#004D36]">
                    <AgentIcon className="h-4 w-4 text-[#009669]" />
                    <span>{currentAgent.badge}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-[#002020]">{currentAgent.title}</h4>
                  <p className="text-sm text-[#3B4A42] leading-relaxed">{currentAgent.description}</p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#004D36] pt-2">
                    <CheckCircle2 className="h-4 w-4 text-[#009669]" />
                    <span>Deterministic rule-based fallback active</span>
                  </div>
                </div>

                <div className="w-full lg:w-96 bg-white p-5 rounded-xl border border-[#BACBC0]/40 shadow-2xs space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#002020]">Core Capabilities</h5>
                  <ul className="space-y-2.5">
                    {currentAgent.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#3B4A42] leading-normal">
                        <Check className="h-3.5 w-3.5 text-[#009669] shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Student Journey: Visual Timeline */}
      <section id="student-journey" className="py-20 bg-[#E2FFFE] border-b border-[#BACBC0]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#009669] mb-2">Evidence-Driven Progression</h2>
            <h3 className="text-3xl font-bold text-[#002020] tracking-tight">The Complete Student Placement Journey</h3>
            <p className="mt-3 text-sm text-[#3B4A42]">
              A continuous, guided pathway from raw project commits to verified campus placement offers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {studentJourneySteps.slice(0, 4).map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.step} className="p-6 bg-white rounded-xl border border-[#BACBC0]/40 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-[#009669] bg-[#BDF9F9]/50 px-2.5 py-1 rounded-md">
                        Step {step.step}
                      </span>
                      <StepIcon className="h-5 w-5 text-[#3B4A42]" />
                    </div>
                    <h4 className="text-base font-bold text-[#002020] mb-2">{step.title}</h4>
                    <p className="text-xs text-[#3B4A42] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {studentJourneySteps.slice(4).map((step) => {
              const StepIcon = step.icon;
              return (
                <div key={step.step} className="p-6 bg-white rounded-xl border border-[#BACBC0]/40 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-[#009669] bg-[#BDF9F9]/50 px-2.5 py-1 rounded-md">
                        Step {step.step}
                      </span>
                      <StepIcon className="h-5 w-5 text-[#3B4A42]" />
                    </div>
                    <h4 className="text-base font-bold text-[#002020] mb-2">{step.title}</h4>
                    <p className="text-xs text-[#3B4A42] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solution: 5-Stage Lifecycle & Knowledge Graph */}
      <section id="solution" className="py-20 bg-white border-b border-[#BACBC0]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#009669] mb-2">The CarrerSync Standard</h2>
            <h3 className="text-3xl font-bold text-[#002020] tracking-tight">The 5-Stage Skill Verification Lifecycle</h3>
            <p className="mt-3 text-sm text-[#3B4A42]">
              Every student competency undergoes a transparent transition from initial declaration to verified institutional proof.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {skillLifecycle.map((item, idx) => (
              <div key={item.state} className="relative flex flex-col p-5 bg-[#E2FFFE]/30 rounded-xl border border-[#BACBC0]/40 shadow-2xs hover:border-[#02E8A7] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-[#3B4A42]">0{idx + 1}</span>
                  <StatusBadge status={item.state} />
                </div>
                <h4 className="text-base font-bold text-[#002020] mb-1.5">{item.label}</h4>
                <p className="text-xs text-[#3B4A42] leading-relaxed flex-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-[#BDF9F9]/30 border border-[#02E8A7]/40 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white border border-[#02E8A7]/40 flex items-center justify-center text-[#009669] shrink-0">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#002020]">Student Knowledge Graph</h4>
                <p className="text-xs text-[#3B4A42]">Interactive graph visualization linking Students, Verified Skills, Projects, and Target Job Requirements.</p>
              </div>
            </div>
            <Button to="/student/knowledge-graph" variant="primary" size="sm" className="shrink-0">
              Open Graph Visualizer
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* TPO Capabilities & Recruiter Features */}
      <section id="colleges" className="py-20 bg-[#E2FFFE] border-b border-[#BACBC0]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* TPO Capabilities */}
            <div className="bg-white rounded-2xl border border-[#BACBC0]/40 p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BDF9F9]/50 border border-[#02E8A7]/40 text-xs font-bold text-[#004D36] mb-4">
                  <Shield className="h-4 w-4 text-[#009669]" />
                  <span>Placement Governance</span>
                </div>
                <h4 className="text-2xl font-bold text-[#002020] mb-3">TPO & Institutional Intelligence</h4>
                <p className="text-xs text-[#3B4A42] leading-relaxed mb-6">
                  Empower college placement officers and leadership with verified cohort analytics, automated drive eligibility, and instant accreditation readiness.
                </p>
                <ul className="space-y-3 text-xs text-[#002020] mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#009669] shrink-0 mt-0.5" />
                    <span><strong>Cohort Analytics & Distribution:</strong> Real-time skill heatmaps across departments and graduating years.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#009669] shrink-0 mt-0.5" />
                    <span><strong>Automated Drive Scheduling:</strong> Rule-based eligibility filters with mandatory human approval before final shortlist.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#009669] shrink-0 mt-0.5" />
                    <span><strong>Accreditation Compliance:</strong> 1-click exportable reports formatted for NIRF, NAAC Criteria 5.2, and NBA audits.</span>
                  </li>
                </ul>
              </div>
              <Button to="/admin" variant="primary" size="md" className="w-full justify-center">
                Access TPO Control Center
              </Button>
            </div>

            {/* Recruiter Features */}
            <div id="recruiters" className="bg-white rounded-2xl border border-[#BACBC0]/40 p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BDF9F9]/50 border border-[#02E8A7]/40 text-xs font-bold text-[#004D36] mb-4">
                  <Building className="h-4 w-4 text-[#009669]" />
                  <span>Enterprise Recruitment</span>
                </div>
                <h4 className="text-2xl font-bold text-[#002020] mb-3">Precision Recruiter Discovery</h4>
                <p className="text-xs text-[#3B4A42] leading-relaxed mb-6">
                  Eliminate resume inflation. Discover pre-vetted campus talent with direct access to code artifacts, project repositories, and transparent match justifications.
                </p>
                <ul className="space-y-3 text-xs text-[#002020] mb-8">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#009669] shrink-0 mt-0.5" />
                    <span><strong>Pre-Verified Talent Discovery:</strong> Candidate profiles backed by verified test scores and code evidence.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#009669] shrink-0 mt-0.5" />
                    <span><strong>Precision Skill Matching:</strong> Semantic job requirements mapped accurately against verified competencies.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#009669] shrink-0 mt-0.5" />
                    <span><strong>Transparent Shortlisting:</strong> Clear rationales for every match score, facilitating fair recruitment decisions.</span>
                  </li>
                </ul>
              </div>
              <Button to="/recruiter" variant="secondary" size="md" className="w-full justify-center">
                Launch Recruiter Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust, Privacy & Explainability Section */}
      <section id="trust" className="py-20 bg-white border-b border-[#BACBC0]/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#009669] mb-2">Ethics & Compliance</h2>
            <h3 className="text-3xl font-bold text-[#002020] tracking-tight">Trust, Privacy & Governance by Design</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl border border-[#BACBC0]/40 bg-[#E2FFFE]/30">
              <ShieldCheck className="h-6 w-6 text-[#009669] mb-3" />
              <h4 className="text-sm font-bold text-[#002020] mb-1">Human Approval Gate</h4>
              <p className="text-xs text-[#3B4A42] leading-relaxed">
                AI recommends; humans decide. Placement officers and recruiters always retain ultimate authority over verifications and job offers.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#BACBC0]/40 bg-[#E2FFFE]/30">
              <EyeOff className="h-6 w-6 text-[#009669] mb-3" />
              <h4 className="text-sm font-bold text-[#002020] mb-1">Zero Behavioral Tracking</h4>
              <p className="text-xs text-[#3B4A42] leading-relaxed">
                Strictly no keystroke logging, intrusive webcam proctoring, or covert surveillance. Students maintain full ownership of their data.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#BACBC0]/40 bg-[#E2FFFE]/30">
              <Lock className="h-6 w-6 text-[#009669] mb-3" />
              <h4 className="text-sm font-bold text-[#002020] mb-1">Tenant RLS Isolation</h4>
              <p className="text-xs text-[#3B4A42] leading-relaxed">
                Institutional records are strictly segmented with PostgreSQL Row Level Security (RLS) ensuring bulletproof multi-tenant separation.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[#BACBC0]/40 bg-[#E2FFFE]/30">
              <GitCommit className="h-6 w-6 text-[#009669] mb-3" />
              <h4 className="text-sm font-bold text-[#002020] mb-1">Explainable AI Policy</h4>
              <p className="text-xs text-[#3B4A42] leading-relaxed">
                Every readiness score and recommendation is fully deconstructed into traceable factors. No black-box algorithms or AI code penalties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 bg-[#002020] text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <BrandLogo variant="card" size="md" className="mx-auto max-w-[200px]" />
          <h3 className="text-3xl font-extrabold sm:text-4xl">Experience the Future of Campus Placements</h3>
          <p className="text-[#BDF9F9] text-sm max-w-xl mx-auto">
            Explore CarrerSync right now with pre-populated demo data across Student, Admin, and Recruiter portals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button to="/student" variant="primary" size="lg">
              Launch Student Demo
            </Button>
            <Button to="/admin" variant="secondary" size="lg">
              Open Admin Center
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
