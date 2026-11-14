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
  Clock
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function AdminOverview() {
  const branchCoverage = [
    { branch: 'Computer Science (CS)', total: 240, verifiedPercent: 78, placed: 64 },
    { branch: 'Information Technology (IT)', total: 180, verifiedPercent: 72, placed: 42 },
    { branch: 'Electronics & Comm (ECE)', total: 210, verifiedPercent: 61, placed: 26 },
    { branch: 'Mechanical Engineering (ME)', total: 120, verifiedPercent: 48, placed: 10 },
  ];

  const activeDrives = [
    { company: 'Google', role: 'Software Engineer', date: 'Nov 28, 2024', package: '24.5 LPA', eligibleCount: 84, status: 'Upcoming' },
    { company: 'TCS Digital', role: 'Digital Cadre Engineer', date: 'Nov 15, 2024', package: '9.2 LPA', eligibleCount: 212, status: 'Active' },
    { company: 'Razorpay', role: 'Backend Engineer', date: 'Dec 05, 2024', package: '18.0 LPA', eligibleCount: 68, status: 'Upcoming' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training & Placement Administration Hub"
        subtitle="Institutional placement intelligence, automated eligibility orchestration, and cohort skill analytics."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Overview' }]}
        action={
          <div className="flex gap-2">
            <Button to="/admin/drives" variant="primary" size="sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              Schedule Drive
            </Button>
            <Button to="/admin/reports" variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              Export Reports
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Cohort"
          value="847"
          subtitle="Final year 2025 batch"
          trend="up"
          trendValue="+14% YoY"
          icon={Users}
          color="indigo"
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
          color="violet"
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
      </div>

      {/* Branch Breakdown & Agent Orchestration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Skill Coverage */}
        <Card className="lg:col-span-2 p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch-Wise Verified Competency</h3>
              <p className="text-xs text-slate-500">Percentage of cohort holding verified technical evidence</p>
            </div>
            <Link to="/admin/cohort-analytics" className="text-xs font-semibold text-indigo-600 hover:underline">
              Detailed Analytics →
            </Link>
          </div>

          <div className="space-y-4">
            {branchCoverage.map((b) => (
              <div key={b.branch} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{b.branch}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Total: {b.total}</span>
                    <span className="text-slate-600">Placed: <strong className="text-emerald-600">{b.placed}</strong></span>
                    <strong className="text-indigo-600">{b.verifiedPercent}% Verified</strong>
                  </div>
                </div>
                <ProgressBar value={b.verifiedPercent} variant="indigo" size="sm" />
              </div>
            ))}
          </div>
        </Card>

        {/* AI Agent Status Panel */}
        <Card className="p-5 border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Agent Fleet Health</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">
            Deterministic fallback engine active. All 4 placement agents operating within strict zero-cost quotas.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Student Profiling</span>
                <span className="block text-[10px] text-slate-400">847 Profiles Parsed</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Industry Skill-Gap</span>
                <span className="block text-[10px] text-slate-400">420 JDs Analyzed</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Predictive Analytics</span>
                <span className="block text-[10px] text-slate-400">Explainable Scores</span>
              </div>
              <Badge variant="emerald" size="sm">Active</Badge>
            </div>

            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
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
          <Link to="/admin/drives" className="text-xs font-semibold text-indigo-600 hover:underline">
            Manage All Drives →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeDrives.map((drv) => (
            <Card key={drv.company} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={drv.status === 'Active' ? 'emerald' : 'indigo'} size="sm">{drv.status}</Badge>
                  <span className="text-xs text-slate-400">{drv.package}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{drv.company}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{drv.role}</p>
                <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
                  <span>Eligible Students: <strong>{drv.eligibleCount}</strong></span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">{drv.date}</span>
                <Link to="/admin/drives" className="font-semibold text-indigo-600 hover:underline">
                  Configure Eligibility →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
