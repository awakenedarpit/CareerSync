import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  Building,
  ArrowRight,
  Sparkles,
  Award,
  Clock,
  LineChart,
  Filter,
  UserCheck,
  Video
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

export default function RecruiterOverview() {
  const activeRoles = [
    { id: 'req-1', title: 'Associate Software Engineer (L3)', location: 'Bengaluru / Hyderabad', package: '24.5 LPA', matches: 38, shortlisted: 10, deadline: 'Nov 28, 2024' },
    { id: 'req-2', title: 'Backend Infrastructure Intern', location: 'Bengaluru', package: '18.0 LPA', matches: 26, shortlisted: 6, deadline: 'Dec 05, 2024' }
  ];

  const recentShortlists = [
    { name: 'Priya Sharma', roll: 'CS2021-084', role: 'Associate Software Engineer', skills: 'React, Node.js, PostgreSQL', status: 'Round 1 Cleared', score: '94/100', matchPercent: 96 },
    { name: 'Aarav Patel', roll: 'CS2021-012', role: 'Associate Software Engineer', skills: 'C++, Distributed Systems', status: 'Technical Interview', score: '88/100', matchPercent: 91 },
    { name: 'Ananya Iyer', roll: 'CS2021-028', role: 'Backend Infrastructure Intern', skills: 'Cloud, Go, Kubernetes', status: 'Round 1 Scheduled', score: '86/100', matchPercent: 88 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Intelligence & Candidate Discovery"
        subtitle="Source pre-verified campus candidates backed by authentic code repositories, automated evaluations, and verified faculty endorsements."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Overview' }]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button to="/recruiter/discovery" variant="primary" size="sm">
              <Search className="h-4 w-4 mr-1.5" />
              Discover Candidates
            </Button>
            <Button to="/recruiter/jobs" variant="outline" size="sm">
              <Briefcase className="h-4 w-4 mr-1.5 text-[#009669]" />
              Post Job Opening
            </Button>
            <Button to="/recruiter/offers" variant="outline" size="sm">
              <Award className="h-4 w-4 mr-1.5 text-emerald-600" />
              Offers Extended
            </Button>
            <Button to="/recruiter/analytics" variant="outline" size="sm">
              <LineChart className="h-4 w-4 mr-1.5" />
              Hiring Funnel
            </Button>
          </div>
        }
      />

      {/* Quick Talent Filter Pills */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-[#009669]" />
          <span>Quick Match Talent Pools:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['Full Stack (React + Node)', 'DevOps & Docker', 'Core Algorithms (C++/Java)', 'Data Engineering (SQL+Python)'].map(pool => (
            <Link
              key={pool}
              to={`/recruiter/discovery?pool=${encodeURIComponent(pool)}`}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:border-[#02E8A7]/50 hover:bg-[#BDF9F9]/30 hover:text-[#004D36] transition-colors"
            >
              {pool}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <section aria-label="Recruiter Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Requisitions"
          value="2"
          subtitle="Google Campus Drive 2024"
          trend="neutral"
          trendValue="Open for applications"
          icon={Briefcase}
          color="teal"
        />
        <StatCard
          title="Verified Matches"
          value="64"
          subtitle="Meets all code & GPA criteria"
          trend="up"
          trendValue="+12 new profiles"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Shortlisted Pipeline"
          value="16"
          subtitle="Approved for interviews"
          trend="up"
          trendValue="Ready for Round 2"
          icon={Users}
          color="aqua"
        />
        <StatCard
          title="Interviews Scheduled"
          value="8"
          subtitle="Nov 28 - Nov 29"
          trend="neutral"
          trendValue="Panel confirmed"
          icon={Calendar}
          color="amber"
        />
      </section>

      {/* Requisitions and Shortlists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Openings */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Campus Openings</h3>
            <Link to="/recruiter/jobs" className="text-xs font-semibold text-[#009669] hover:underline">
              Manage Roles →
            </Link>
          </div>

          <div className="space-y-4">
            {activeRoles.map((role) => (
              <div key={role.title} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-[#02E8A7]/40 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{role.title}</h4>
                    <span className="text-xs text-slate-500">{role.location}</span>
                  </div>
                  <Badge variant="aqua" size="sm">{role.package}</Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs">
                  <span className="text-slate-600">Pre-Verified Matches: <strong className="text-emerald-700">{role.matches} Candidates</strong></span>
                  <div className="flex gap-2">
                    <Button to={`/recruiter/discovery?role=${role.id}`} variant="outline" size="xs">
                      View Matches
                    </Button>
                    <Button to="/recruiter/shortlists" variant="primary" size="xs">
                      Shortlist ({role.shortlisted})
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Shortlists */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Candidate Pipeline</h3>
            <Link to="/recruiter/shortlists" className="text-xs font-semibold text-[#009669] hover:underline">
              All Shortlists →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentShortlists.map((cand) => (
              <div key={cand.name} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={cand.name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{cand.name}</h4>
                      <Badge variant="emerald" size="sm">{cand.matchPercent}% Match</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{cand.skills}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="aqua" size="sm">{cand.status}</Badge>
                  <Button to="/recruiter/interviews" variant="outline" size="xs">
                    <Video className="w-3 h-3 mr-1" /> Interview
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
