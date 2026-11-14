import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  Target,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Users,
  GraduationCap,
  Building2,
  FileCheck2,
  Code2,
  Zap,
  TrendingUp,
} from 'lucide-react';

import Button from '../../components/common/Button';
import SectionHeading from '../../components/common/SectionHeading';
import FeatureCard from '../../components/common/FeatureCard';
import AgentCard from '../../components/common/AgentCard';

export default function LandingPage() {
  const [activeAudience, setActiveAudience] = useState('student');

  const agents = [
    {
      agentNumber: 1,
      name: 'Student Profiling Agent',
      role: 'Evidence Verification & Skill Extraction',
      description:
        'Analyzes authentic repositories, code artifacts, and project submissions to extract verified competencies with calibrated confidence scoring.',
      capabilities: [
        'Automated GitHub repo & commit inspection',
        'Framework, database, and language fingerprinting',
        'Proof-of-work verification to eliminate resume inflation',
      ],
      icon: Code2,
      fallbackEngine: 'Taxonomy Regex Parser',
    },
    {
      agentNumber: 2,
      name: 'Industry Skill-Gap Agent',
      role: 'Demand Benchmarking & Learning Paths',
      description:
        'Evaluates evolving job descriptions against student skill graphs, uncovering missing proficiencies and generating structured, step-by-step learning roadmaps.',
      capabilities: [
        'Real-time job specification semantic decomposition',
        'Set-difference gap calculation across cohorts',
        'Targeted project-based learning recommendations',
      ],
      icon: Target,
      fallbackEngine: 'Set-Theoretic Gap Engine',
    },
    {
      agentNumber: 3,
      name: 'Predictive Analytics Agent',
      role: 'Placement Readiness & Risk Detection',
      description:
        'Calculates multi-dimensional placement readiness scores and predicts drive conversion rates, highlighting at-risk students for early intervention.',
      capabilities: [
        'Composite scoring (CGPA + verified skills + project depth)',
        'Cohort-wide placement readiness distribution',
        'Early warning alerts for unplaced or struggling students',
      ],
      icon: BarChart3,
      fallbackEngine: 'Weighted Heuristic Scorer',
    },
    {
      agentNumber: 4,
      name: 'Placement Orchestration Agent',
      role: 'Recruitment Workflow Automation',
      description:
        'Coordinates campus hiring drives end-to-end: automates eligibility rule validation, schedules interviews, and manages candidate shortlist progression.',
      capabilities: [
        'Deterministic multi-criteria eligibility filtering',
        'Multi-stage recruitment pipeline tracking',
        'Tenant-isolated audit trail for placement integrity',
      ],
      icon: Calendar,
      fallbackEngine: 'State Machine Engine',
    },
  ];

  const problemPoints = [
    {
      icon: AlertTriangle,
      title: 'Resume Inflation & Unverified Claims',
      description:
        'Traditional resumes are filled with buzzwords and copy-pasted skills. Recruiters spend countless hours interviewing candidates who cannot demonstrate basic competency.',
      tag: 'Integrity Gap',
      accentColor: 'amber',
    },
    {
      icon: Layers,
      title: 'CGPA as a Flawed Skill Proxy',
      description:
        'Colleges rely almost solely on academic GPA to shortlist students, arbitrarily filtering out capable software engineers and problem solvers who excel outside traditional exams.',
      tag: 'Filter Failure',
      accentColor: 'indigo',
    },
    {
      icon: Zap,
      title: 'Spreadsheet-Driven Placement Chaos',
      description:
        'T&P cells manage drives across thousands of students through scattered Google Sheets, missed emails, and manual eligibility checks prone to clerical mistakes.',
      tag: 'Operational Bottleneck',
      accentColor: 'cyan',
    },
    {
      icon: TrendingUp,
      title: 'Lack of Actionable Skill-Gap Guidance',
      description:
        'Students discover why they were rejected only after failing multiple drives, with no systematic mechanism to diagnose deficiencies or follow a verified remediation path.',
      tag: 'Student Disadvantage',
      accentColor: 'emerald',
    },
  ];

  const solutionPoints = [
    {
      icon: ShieldCheck,
      title: 'Evidence-Based Skill Verification',
      description:
        'Skills are certified through inspectable proofs of work: GitHub commits, pull requests, deployed web apps, and code submissions.',
      tag: 'Verifiable',
      accentColor: 'emerald',
    },
    {
      icon: GitBranch,
      title: 'Graph-Powered Relational Memory',
      description:
        'An ontological graph connects Student → Skills → Evidence → Career Goals → Job Roles, enabling multi-hop contextual reasoning.',
      tag: 'FalkorDB Design',
      accentColor: 'indigo',
    },
    {
      icon: Sparkles,
      title: 'Hybrid AI with Offline Fallbacks',
      description:
        'Gemini Free Tier delivers advanced semantic profiling, while deterministic rule-based algorithms guarantee zero downtime at ₹0 cost.',
      tag: 'Zero-Cost Core',
      accentColor: 'cyan',
    },
    {
      icon: Building2,
      title: 'Strict Multi-Tenant Isolation',
      description:
        'Every college institution operates within a fortified tenant boundary, ensuring absolute privacy of student records and placement audit logs.',
      tag: 'Enterprise Grade',
      accentColor: 'amber',
    },
  ];

  const audiences = {
    student: {
      title: 'For Students',
      role: 'Career Acceleration & Proof-of-Skill',
      subtitle: 'Build a verifiable digital engineering profile and let your genuine skills open top-tier hiring opportunities.',
      highlights: [
        'Eliminate resume bluffing with authenticated code evidence and project milestones',
        'Receive instant, personalized skill-gap diagnostics for your target company or job role',
        'Follow tailored step-by-step learning paths that directly improve your placement readiness score',
        'Track eligibility status across all upcoming campus drives in real-time',
      ],
      ctaText: 'Enter Student Portal Preview',
      ctaLink: '/student',
      badgeColor: 'text-indigo-400 bg-indigo-950/80 border-indigo-800',
    },
    admin: {
      title: 'For T&P Admins',
      role: 'Placement Intelligence & Drive Automation',
      subtitle: 'Transform chaotic campus recruitment into an automated, transparent, and data-driven command center.',
      highlights: [
        'Replace manual spreadsheets with instant, rule-based student eligibility shortlists',
        'Monitor whole-cohort placement readiness, identifying at-risk students weeks before drives start',
        'Generate institutional analytics reports on skill trends, hiring conversion rates, and company demand',
        'Maintain complete compliance and fairness through tamper-proof placement audit trails',
      ],
      ctaText: 'Enter T&P Admin Portal Preview',
      ctaLink: '/admin',
      badgeColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-800',
    },
    recruiter: {
      title: 'For Recruiters',
      role: 'Pre-Verified Talent & Frictionless Hiring',
      subtitle: 'Hire talent with guaranteed competencies backed by inspectable evidence, not embellished paper resumes.',
      highlights: [
        'Access pre-verified candidate shortlists tailored specifically to your tech stack requirements',
        'Directly inspect authenticated code artifacts and project repositories without leaving the platform',
        'Drastically reduce interview drop-off and first-round technical assessment failures',
        'Streamline campus communication and schedule selection rounds with zero administrative friction',
      ],
      ctaText: 'Enter Recruiter Portal Preview',
      ctaLink: '/recruiter',
      badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        {/* Background Decorative Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Generation Agentic Placement Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-6">
              From Student Skills to{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Successful Placements.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mb-10">
              An evidence-driven placement intelligence platform connecting verified skills, industry demand, and smarter campus hiring.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
              <Button to="/auth/register" variant="primary" size="lg" icon={ArrowRight} className="w-full sm:w-auto">
                Get Started
              </Button>
              <Button href="#workflow" variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Platform
              </Button>
            </div>

            {/* Pipeline Visual Card */}
            <div className="w-full max-w-4xl p-5 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-sm text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Active Placement Intelligence Pipeline
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono bg-indigo-950/60 px-3 py-1 rounded-md border border-indigo-900/60">
                  <span>Tenant Isolation: Active</span>
                </div>
              </div>

              {/* 4 Pipeline Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-indigo-400">01. INGESTION</span>
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">GitHub Evidence</div>
                  <div className="text-xs text-slate-400 mt-1">Commits & PRs analyzed</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-purple-400">02. PROFILING</span>
                    <Code2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">Verified Skill Graph</div>
                  <div className="text-xs text-slate-400 mt-1">Authentic competency tag</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-cyan-400">03. BENCHMARK</span>
                    <Target className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">Industry Gap Analysis</div>
                  <div className="text-xs text-slate-400 mt-1">Target role reconciliation</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-emerald-400">04. MATCHING</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">Orchestrated Drive</div>
                  <div className="text-xs text-slate-400 mt-1">Verified candidate shortlist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== THE PROBLEM SECTION ===================== */}
      <section id="problem" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            badge="The Campus Hiring Bottleneck"
            title="Why Traditional College Placements Are"
            highlight="Fundamentally Broken"
            subtitle="Campus recruitment has historically relied on inflated resumes, arbitrary GPA cutoffs, and chaotic administrative spreadsheets — failing students, colleges, and recruiters alike."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {problemPoints.map((point, idx) => (
              <FeatureCard
                key={idx}
                icon={point.icon}
                title={point.title}
                description={point.description}
                tag={point.tag}
                accentColor={point.accentColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== THE SOLUTION SECTION ===================== */}
      <section id="solution" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            badge="The CarrerSync Solution"
            title="An Evidence-Driven Ecosystem For"
            highlight="Transparent Placement Intelligence"
            subtitle="CarrerSync bridges the chasm between raw student effort and hiring decisions by anchoring every skill assertion to verifiable, inspectable evidence."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutionPoints.map((point, idx) => (
              <FeatureCard
                key={idx}
                icon={point.icon}
                title={point.title}
                description={point.description}
                tag={point.tag}
                accentColor={point.accentColor}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FOUR AGENTS SECTION ===================== */}
      <section id="agents" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            badge="Agentic AI Architecture"
            title="Four Specialized Agents Powering"
            highlight="Every Step of the Workflow"
            subtitle="Built on a hybrid zero-cost architecture: leveraging Google Gemini Free Tier when available, backed by robust deterministic rule engines for uninterrupted operational reliability."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent) => (
              <AgentCard
                key={agent.agentNumber}
                agentNumber={agent.agentNumber}
                name={agent.name}
                role={agent.role}
                description={agent.description}
                capabilities={agent.capabilities}
                icon={agent.icon}
                fallbackEngine={agent.fallbackEngine}
              />
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">Zero-Cost Policy & High Availability</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Core operations like authentication, profile viewing, and eligibility rules never depend on external AI quotas.
                </p>
              </div>
            </div>
            <Button to="/auth/register" variant="primary" size="sm" icon={ArrowRight}>
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS SECTION ===================== */}
      <section id="workflow" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            badge="The End-to-End Pipeline"
            title="How CarrerSync Delivers"
            highlight="Placement Intelligence"
            subtitle="From the moment a student connects their work to the final drive offer letter, every milestone is structured, verified, and transparent."
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="relative p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-mono text-sm font-bold flex items-center justify-center mb-4 border border-indigo-500/30">
                  01
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Evidence Ingestion</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Students securely connect read-only GitHub repositories, code submissions, and technical project artifacts.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Read-only • Explicit consent
              </div>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 font-mono text-sm font-bold flex items-center justify-center mb-4 border border-purple-500/30">
                  02
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Skill Graph Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Profiling Agent maps code patterns to verified skills, constructing a reliable profile indexed in FalkorDB graph memory.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Confidence-scored • Derived
              </div>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 font-mono text-sm font-bold flex items-center justify-center mb-4 border border-cyan-500/30">
                  03
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Demand & Gap Analysis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Student profiles are benchmarked against live recruiter job specs, generating personalized remediation roadmaps.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Actionable tasks • Milestones
              </div>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 font-mono text-sm font-bold flex items-center justify-center mb-4 border border-emerald-500/30">
                  04
                </span>
                <h3 className="text-lg font-bold text-white mb-2">Drive Orchestration</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Orchestration Agent handles eligibility enforcement, shortlists candidate pools, and updates interview rounds seamlessly.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                Automated • Audited
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== AUDIENCES SECTION ===================== */}
      <section id="audiences" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900 bg-slate-950/60">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            badge="Tailored For Every Stakeholder"
            title="One Unified Platform Built For"
            highlight="Students, Admins & Recruiters"
            subtitle="Whether you are an aspiring engineer proving your capabilities, a T&P head running campus hiring, or a recruiter seeking reliable talent."
          />

          {/* Audience Selector Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveAudience('student')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeAudience === 'student'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>
              <button
                onClick={() => setActiveAudience('admin')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeAudience === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>T&P Admin</span>
              </button>
              <button
                onClick={() => setActiveAudience('recruiter')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeAudience === 'recruiter'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Recruiter</span>
              </button>
            </div>
          </div>

          {/* Active Audience Card */}
          <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border mb-2 ${audiences[activeAudience].badgeColor}`}>
                  {audiences[activeAudience].role}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {audiences[activeAudience].title}
                </h3>
              </div>
            </div>

            <p className="text-base text-slate-300 mb-8 leading-relaxed">
              {audiences[activeAudience].subtitle}
            </p>

            <div className="space-y-4 mb-8">
              {audiences[activeAudience].highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-200">{highlight}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Ready to experience the next evolution in college placements?
              </span>
              <Button to={audiences[activeAudience].ctaLink} variant="primary" size="md" icon={ArrowRight}>
                {audiences[activeAudience].ctaText}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CALL TO ACTION ===================== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-indigo-950/30">
        <div className="max-w-5xl mx-auto text-center p-10 sm:p-14 rounded-3xl bg-slate-900/80 border border-indigo-900/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Ready to Modernize Your Campus Placement Operations?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Join the evidence-based revolution. Experience verified skill discovery, zero spreadsheet chaos, and agentic placement workflows today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button to="/auth/register" variant="primary" size="lg" icon={ArrowRight}>
              Get Started Now
            </Button>
            <Button to="/student" variant="secondary" size="lg">
              View Student Portal Preview
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
