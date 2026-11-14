import React from 'react';
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
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function StudentOverview() {
  const breadcrumbs = [
    { label: 'Student', href: '/student' },
    { label: 'Overview' }
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'GitHub Commit Verified: e-commerce-backend',
      desc: 'Observed 14 PRs in TypeScript & Express. Evidence mapped to Backend Skills.',
      time: '2 hours ago',
      type: 'evidence'
    },
    {
      id: 2,
      title: 'Skill State Updated: React.js',
      desc: 'Progressed from Claimed to Evidence-linked via Portfolio submission.',
      time: 'Yesterday',
      type: 'skill'
    },
    {
      id: 3,
      title: 'Applied for Google Software Engineer Drive',
      desc: 'Eligibility check passed (CGPA: 8.4 ≥ 8.0, 5 Verified skills).',
      time: '3 days ago',
      type: 'drive'
    },
    {
      id: 4,
      title: 'Completed Micro-Task: Docker Compose Setup',
      desc: 'Resolved skill gap for DevOps target role. Verified by automated linting.',
      time: '4 days ago',
      type: 'task'
    }
  ];

  const topSkills = [
    { name: 'JavaScript (ES6+)', status: 'verified', level: 'Advanced', evidenceCount: 5 },
    { name: 'React.js', status: 'evidence_linked', level: 'Intermediate', evidenceCount: 3 },
    { name: 'Node.js & Express', status: 'observed', level: 'Intermediate', evidenceCount: 2 },
    { name: 'PostgreSQL', status: 'verified', level: 'Advanced', evidenceCount: 4 },
    { name: 'Docker', status: 'claimed', level: 'Beginner', evidenceCount: 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back, Priya!"
        subtitle="Your placement intelligence dashboard. Track verified skills, resolve skill gaps, and apply for drives."
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex gap-2">
            <Button to="/student/knowledge-graph" variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1.5 text-indigo-600" />
              Knowledge Graph
            </Button>
            <Button to="/student/skills" variant="primary" size="sm">
              <Award className="h-4 w-4 mr-1.5" />
              Manage Evidence
            </Button>
          </div>
        }
      />

      {/* Profile Readiness Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 via-white to-purple-50/50 p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Placement Readiness Index</span>
              <Badge variant="indigo" size="sm">High Alignment</Badge>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Full Stack Developer Track (78% Ready)</h3>
            <p className="text-xs text-slate-600 max-w-xl">
              You are 2 micro-tasks away from reaching 100% eligibility for upcoming Tier-1 product company drives.
            </p>
          </div>

          <div className="w-full md:w-72 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-700">
              <span>Profile Completion</span>
              <span className="font-bold text-indigo-600">78%</span>
            </div>
            <ProgressBar value={78} variant="indigo" size="md" />
            <div className="flex justify-end">
              <Link to="/student/skill-gap" className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center">
                Analyze Skill Gaps <ArrowRight className="h-3 w-3 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Verified Skills"
          value="8"
          subtitle="Out of 14 total skills"
          trend="up"
          trendValue="+2 this month"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Evidence Artifacts"
          value="23"
          subtitle="Repos, commits, certificates"
          trend="up"
          trendValue="+5 synced"
          icon={FileCode}
          color="indigo"
        />
        <StatCard
          title="Learning Tasks"
          value="5"
          subtitle="2 active, 3 completed"
          trend="neutral"
          trendValue="On schedule"
          icon={BookOpen}
          color="violet"
        />
        <StatCard
          title="Active Drives"
          value="3"
          subtitle="Eligible for all 3"
          trend="up"
          trendValue="Next: Nov 28"
          icon={Calendar}
          color="amber"
        />
      </div>

      {/* Main Grid: Skills Matrix + Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Verified Skills Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Key Competencies</h3>
                <p className="text-xs text-slate-500">Skills categorized by the 5-stage verification lifecycle</p>
              </div>
              <Link to="/student/skills" className="text-xs font-semibold text-indigo-600 hover:underline">
                View All Skills
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {topSkills.map((skill) => (
                <div key={skill.name} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{skill.name}</span>
                      <StatusBadge status={skill.status} />
                    </div>
                    <span className="text-xs text-slate-500">{skill.level} • {skill.evidenceCount} verified artifacts</span>
                  </div>
                  <Link
                    to="/student/skills"
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-md border border-slate-200 hover:border-indigo-300"
                  >
                    View Evidence
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommended AI Interventions */}
          <Card className="p-5 border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Agent Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="amber" size="sm">Skill Gap</Badge>
                  <span className="text-[11px] text-slate-400">High Impact</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Add Docker Proof</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Upload a repository with a Dockerfile and docker-compose.yml to convert Docker from Claimed to Evidence-linked.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="emerald" size="sm">Mock Test</Badge>
                  <span className="text-[11px] text-slate-400">45 Mins</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">Data Structures Mock Test</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Practice graph traversal and dynamic programming algorithms before the TCS Digital screening round.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Activity Feed & Upcoming Drives */}
        <div className="space-y-6">
          <Card className="p-5 border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Recent Audit Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{act.title}</p>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{act.desc}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Links Card */}
          <Card className="p-5 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Navigation</h3>
            <div className="space-y-2">
              <Button to="/student/applications" variant="outline" size="sm" className="w-full justify-between">
                <span>View Drive Applications</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Button>
              <Button to="/student/mock-drives" variant="outline" size="sm" className="w-full justify-between">
                <span>Start Practice Mock Test</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Button>
              <Button to="/student/privacy" variant="outline" size="sm" className="w-full justify-between">
                <span>Privacy & Consent Controls</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
