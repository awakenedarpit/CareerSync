import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  Calendar,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Send,
  Filter
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function AdminOverview() {
  const branchCoverage = [
    { branch: 'Computer Science (CS)', total: 240, verifiedPercent: 78, placed: 64, atRisk: 12 },
    { branch: 'Information Technology (IT)', total: 180, verifiedPercent: 72, placed: 42, atRisk: 10 },
    { branch: 'Electronics & Comm (ECE)', total: 210, verifiedPercent: 61, placed: 26, atRisk: 14 },
    { branch: 'Mechanical Engineering (ME)', total: 120, verifiedPercent: 48, placed: 10, atRisk: 6 },
  ];

  const activeDrives = [
    { id: 'drv-1', company: 'Google', role: 'Software Engineer', date: 'Nov 28, 2024', package: '24.5 LPA', eligibleCount: 84, status: 'Upcoming', verifiedCutoff: '≥5 Skills' },
    { id: 'drv-2', company: 'TCS Digital', role: 'Digital Cadre Engineer', date: 'Nov 15, 2024', package: '9.2 LPA', eligibleCount: 212, status: 'Active', verifiedCutoff: '≥3 Skills' },
    { id: 'drv-3', company: 'Razorpay', role: 'Backend Engineer', date: 'Dec 05, 2024', package: '18.0 LPA', eligibleCount: 68, status: 'Upcoming', verifiedCutoff: '≥4 Skills' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Placement Administration Hub"
        subtitle="Institutional placement intelligence, automated eligibility orchestration, and human-in-the-loop governance."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Overview' }]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button to="/admin/drives" variant="primary" size="sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              Schedule Drive
            </Button>
            <Button to="/tpo/approvals" variant="outline" size="sm">
              <ShieldAlert className="h-4 w-4 mr-1.5 text-amber-600" />
              Review Approvals (7)
            </Button>
            <Button to="/admin/reports" variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Export Reports
            </Button>
          </div>
        }
      />

      {/* Actionable TPO Priority Alert Bar */}
      <section aria-label="Action Items" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">7 Academic Corrections Pending</h4>
              <p className="text-[11px] text-slate-600">Students requested CGPA/records review</p>
            </div>
          </div>
          <Button to="/tpo/approvals" variant="outline" size="xs" className="shrink-0 bg-white">
            Review →
          </Button>
        </div>

        <div className="p-3.5 bg-[#BDF9F9]/30/80 border border-[#02E8A7]/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#BDF9F9]/50 text-[#002020] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">18 Evidence Verifications</h4>
              <p className="text-[11px] text-slate-600">Pending faculty/TPO endorsement</p>
            </div>
          </div>
          <Button to="/tpo/verification" variant="primary" size="xs" className="shrink-0">
            Verify →
          </Button>
        </div>

        <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">42 At-Risk Cohort Students</h4>
              <p className="text-[11px] text-slate-600">&lt;40% readiness index before drives</p>
            </div>
          </div>
          <Button to="/tpo/readiness" variant="outline" size="xs" className="shrink-0 bg-white">
            Remediate →
          </Button>
        </div>
      </section>

      {/* KPI Cards */}
      <section aria-label="Placement KPIs" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Cohort"
          value="847"
          subtitle="Final year 2025 batch"
          trend="up"
          trendValue="+14% YoY"
          icon={Users}
          color="teal"
        />
        <StatCard
          title="Verified Skill Coverage"
          value="68.4%"
          subtitle="Cohort with ≥3 verified skills"
          trend="up"
          trendValue="+18% YoY"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Offers Extended"
          value="142"
          subtitle="Avg package: 11.2 LPA"
          trend="up"
          trendValue="Target: 400"
          icon={Briefcase}
          color="aqua"
        />
        <StatCard
          title="Active Drives"
          value="5"
          subtitle="2 drives this week"
          trend="neutral"
          trendValue="48 Visiting Co."
          icon={Calendar}
          color="amber"
        />
      </section>

      {/* Branch Breakdown & Agent Orchestration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Skill Coverage */}
        <Card className="lg:col-span-2 p-6 border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch-Wise Placement & Competency Matrix</h3>
              <p className="text-xs text-slate-500">Live cohort stats: verified evidence coverage, placed count, and at-risk tracking</p>
            </div>
            <Link to="/admin/cohort-analytics" className="text-xs font-semibold text-[#009669] hover:underline shrink-0">
              Detailed Analytics →
            </Link>
          </div>

          <div className="space-y-4">
            {branchCoverage.map((b) => (
              <div key={b.branch} className="space-y-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="font-semibold text-slate-900">{b.branch}</span>
                  <div className="flex items-center gap-3 text-slate-600 flex-wrap">
                    <span>Total: <strong>{b.total}</strong></span>
                    <span>Placed: <strong className="text-emerald-700">{b.placed}</strong> ({Math.round((b.placed / b.total) * 100)}%)</span>
                    <span>At-Risk: <strong className="text-rose-700">{b.atRisk}</strong></span>
                    <strong className="text-[#004D36]">{b.verifiedPercent}% Verified</strong>
                  </div>
                </div>
                <ProgressBar value={b.verifiedPercent} variant="aqua" size="sm" />
              </div>
            ))}
          </div>
        </Card>

        {/* AI Agent Status Panel */}
        <Card className="p-5 border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-[#009669]" />
              <h3 className="text-sm font-bold text-slate-900">Agent Fleet Health</h3>
            </div>
            <Link to="/tpo/orchestration" className="text-xs font-semibold text-[#009669] hover:underline">
              Inspect →
            </Link>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Deterministic fallback engine active. All 4 placement agents operating within strict zero-cost quotas.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-semibold text-slate-800">Student Profiling</span>
                <span className="block text-[10px] text-slate-400">847 Profiles Parsed</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-semibold text-slate-800">Industry Skill-Gap</span>
                <span className="block text-[10px] text-slate-400">420 JDs Analyzed</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-semibold text-slate-800">Predictive Analytics</span>
                <span className="block text-[10px] text-slate-400">Explainable Scores</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-semibold text-slate-800">Drive Orchestration</span>
                <span className="block text-[10px] text-slate-400">Human-Gated</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Placement Drives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900">Current & Upcoming Placement Drives</h3>
          <Link to="/admin/drives" className="text-xs font-semibold text-[#009669] hover:underline">
            Manage All Drives →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeDrives.map((drv) => (
            <Card key={drv.company} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={drv.status === 'Active' ? 'emerald' : 'indigo'} size="sm">{drv.status}</Badge>
                  <span className="text-xs font-bold text-slate-700">{drv.package}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{drv.company}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{drv.role}</p>
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 flex justify-between items-center">
                  <span>Eligible: <strong className="text-slate-900">{drv.eligibleCount} Students</strong></span>
                  <Badge variant="slate" size="sm">{drv.verifiedCutoff}</Badge>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">{drv.date}</span>
                <Link to="/tpo/jobs" className="font-semibold text-[#009669] hover:underline">
                  Execute Eligibility →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
