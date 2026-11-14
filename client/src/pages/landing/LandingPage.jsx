import React from 'react';
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
  Check
} from 'lucide-react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';

export default function LandingPage() {
  const agents = [
    {
      title: 'Student Profiling Agent',
      code: 'Agent 01',
      description: 'Parses multimodal student evidence (GitHub repos, LeetCode commits, coursework, hackathon submissions) into a verified, normalized skill profile.',
      icon: BrainCircuit,
      badge: 'Profile Intelligence',
      color: 'indigo'
    },
    {
      title: 'Industry Skill-Gap Agent',
      code: 'Agent 02',
      description: 'Continuously maps market job descriptions against verified student cohorts, diagnosing real-time skill deficiencies and prescribing micro-learning interventions.',
      icon: Target,
      badge: 'Market Calibration',
      color: 'violet'
    },
    {
      title: 'Predictive Placement Analytics Agent',
      code: 'Agent 03',
      description: 'Calculates placement readiness and company alignment indices with transparent, explainable factors — never opaque black-box scores.',
      icon: BarChart3,
      badge: 'Explainable AI',
      color: 'emerald'
    },
    {
      title: 'Placement Orchestration Agent',
      code: 'Agent 04',
      description: 'Automates end-to-end drive scheduling, eligibility enforcement, shortlist generation, and student notification workflows with mandatory human-in-the-loop oversight.',
      icon: Workflow,
      badge: 'Workflow Automation',
      color: 'sky'
    }
  ];

  const skillLifecycle = [
    { state: 'claimed', label: 'Claimed', desc: 'Student self-reports a skill without verifiable proof.', badgeVariant: 'claimed' },
    { state: 'observed', label: 'Observed', desc: 'Activity detected in coursework or lab submissions.', badgeVariant: 'observed' },
    { state: 'evidence_linked', label: 'Evidence-linked', desc: 'Directly linked to a GitHub repository, project, or certificate URL.', badgeVariant: 'evidence-linked' },
    { state: 'verified', label: 'Verified', desc: 'Faculty, automated test, or technical assessment validated.', badgeVariant: 'verified' },
    { state: 'expired', label: 'Expired', desc: 'Stale skill without active practice in the last 18 months.', badgeVariant: 'expired' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/60 bg-linear-to-b from-white via-indigo-50/20 to-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
              <span>Next-Gen Placement Intelligence Platform</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.15]">
              Connecting Student Evidence to <span className="bg-linear-to-r from-indigo-600 via-indigo-700 to-violet-600 bg-clip-text text-transparent">Verified Placements</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Transform campus recruiting from arbitrary keyword matching into an evidence-driven, explainable, and multi-agent powered placement ecosystem.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button to="/student" variant="primary" size="lg" className="shadow-md shadow-indigo-500/20">
                Explore Student Dashboard
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button to="/admin" variant="outline" size="lg">
                T&P Admin Center
              </Button>
              <Button to="/recruiter" variant="ghost" size="lg">
                Recruiter Portal
              </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-200/80 max-w-4xl mx-auto">
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="text-2xl font-bold text-slate-900">3 Roles</div>
                <div className="text-xs text-slate-500 font-medium">Student • Admin • Recruiter</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="text-2xl font-bold text-indigo-600">4 Agents</div>
                <div className="text-xs text-slate-500 font-medium">Autonomous Intelligence</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="text-2xl font-bold text-violet-600">5 States</div>
                <div className="text-xs text-slate-500 font-medium">Claimed to Verified</div>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200/60 shadow-2xs">
                <div className="text-2xl font-bold text-emerald-600">₹0 Budget</div>
                <div className="text-xs text-slate-500 font-medium">Zero-Cost Infrastructure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">The Campus Placement Crisis</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Why Traditional Placements Are Broken</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hover className="p-6 border-slate-200">
              <div className="h-10 w-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Unverified Resume Inflation</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Students copy keywords from online templates without tangible proof. Recruiters spend thousands of hours filtering unverified claims, causing screening fatigue.
              </p>
            </Card>

            <Card hover className="p-6 border-slate-200">
              <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">T&P Officer Blind Spots</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Colleges rely on static spreadsheets with no visibility into actual cohort competency, market skill trends, or why high-CGPA candidates fail technical interviews.
              </p>
            </Card>

            <Card hover className="p-6 border-slate-200">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Unguided Student Preparation</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Students prepare without knowing company-specific gaps or what technical proof is missing, leading to last-minute panic and mismatched placement outcomes.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution: 5-Stage Lifecycle */}
      <section id="solution" className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">The CarrerSync Solution</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">The 5-Stage Skill Verification Lifecycle</h3>
            <p className="mt-3 text-sm text-slate-600">
              Every student competency undergoes a transparent transition from initial declaration to verified institutional proof.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {skillLifecycle.map((item, idx) => (
              <div key={item.state} className="relative flex flex-col p-5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                  <StatusBadge status={item.state} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1.5">{item.label}</h4>
                <p className="text-xs text-slate-600 leading-relaxed flex-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-white border border-indigo-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Student Knowledge Graph</h4>
                <p className="text-xs text-slate-600">Interactive graph visualization linking Students, Verified Skills, Projects, and Target Job Requirements.</p>
              </div>
            </div>
            <Button to="/student/knowledge-graph" variant="primary" size="sm" className="shrink-0">
              Open Graph Visualizer
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* 4 Multi-Agent Architecture */}
      <section id="agents" className="py-20 bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-2">Autonomous Multi-Agent Core</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Four Specialized AI Placement Agents</h3>
            <p className="mt-3 text-sm text-slate-600">
              Autonomous micro-agents working in orchestration, with deterministic rule-based fallbacks for guaranteed ₹0-budget reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <Card key={agent.title} hover className="p-7 border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="indigo" size="sm">{agent.badge}</Badge>
                  </div>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">{agent.code}</span>
                  <h4 className="text-xl font-bold text-slate-900 mt-1 mb-2.5">{agent.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{agent.description}</p>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-3 border-t border-slate-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Deterministic fallback supported</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Three Audiences */}
      <section id="audiences" className="py-20 bg-slate-50 border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Tailored Experiences</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Three Integrated Portals</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all">
              <div>
                <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">For Students</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Connect GitHub and coding accounts, visualize real-time skill gaps for dream companies, and follow custom micro-learning paths.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Evidence-linked skill portfolio</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Interactive knowledge graph</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-indigo-600" /> Complete privacy consent controls</li>
                </ul>
              </div>
              <Button to="/student" variant="outline" size="sm" className="w-full justify-center">
                Launch Student Portal
              </Button>
            </div>

            {/* T&P Admin */}
            <div id="colleges" className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all">
              <div>
                <div className="h-10 w-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">For T&P Administrators</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Gain instant cohort intelligence, automate complex placement drive eligibility rules, and view immutable audit trails.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Real-time cohort skill matrix</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Automated drive orchestration</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-purple-600" /> Immutable audit logging</li>
                </ul>
              </div>
              <Button to="/admin" variant="outline" size="sm" className="w-full justify-center">
                Launch Admin Center
              </Button>
            </div>

            {/* Recruiter */}
            <div id="recruiters" className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all">
              <div>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                  <Building className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">For Recruiters</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Discover pre-verified candidates with tangible code evidence. Zero resume fluff. Transparent match rationale for every candidate.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 mb-6">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Pre-verified candidate discovery</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Direct GitHub & project evidence inspect</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" /> Transparent match explanations</li>
                </ul>
              </div>
              <Button to="/recruiter" variant="outline" size="sm" className="w-full justify-center">
                Launch Recruiter Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Governance Section */}
      <section id="trust" className="py-20 bg-white border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Ethics & Compliance</h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">Trust, Privacy & Governance by Design</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <ShieldCheck className="h-6 w-6 text-indigo-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Human Approval Gate</h4>
              <p className="text-xs text-slate-600">AI never independently verifies a skill or makes final candidacy decisions. T&P staff and recruiters always hold final sign-off.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <EyeOff className="h-6 w-6 text-violet-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Zero Behavioral Tracking</h4>
              <p className="text-xs text-slate-600">Strictly no keystroke logging, webcam monitoring, or intrusive behavioral tracking for student accounts.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <Lock className="h-6 w-6 text-emerald-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">Tenant RLS Isolation</h4>
              <p className="text-xs text-slate-600">Institutional data is strictly isolated with row-level security and transaction-scoped database context.</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <GitCommit className="h-6 w-6 text-sky-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">No AI Code Detection</h4>
              <p className="text-xs text-slate-600">Unreliable AI detectors are never used to penalize students. We verify working software and functional tests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <h3 className="text-3xl font-extrabold sm:text-4xl">Experience the Future of Campus Placements</h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Explore CarrerSync right now with pre-populated demo data across Student, Admin, and Recruiter portals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button to="/student" variant="primary" size="lg">
              Launch Student Demo
            </Button>
            <Button to="/admin" variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10">
              Open Admin Center
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
