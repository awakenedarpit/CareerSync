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
  Clock
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

export default function RecruiterOverview() {
  const activeRoles = [
    { title: 'Associate Software Engineer (L3)', location: 'Bengaluru / Hyderabad', package: '24.5 LPA', matches: 38, shortlisted: 10 },
    { title: 'Backend Infrastructure Intern', location: 'Bengaluru', package: '18.0 LPA', matches: 26, shortlisted: 6 }
  ];

  const recentShortlists = [
    { name: 'Priya Sharma', roll: 'CS2021-084', role: 'Associate Software Engineer', skills: 'React, Node.js, PostgreSQL', status: 'Round 1 Cleared' },
    { name: 'Aarav Patel', roll: 'CS2021-012', role: 'Associate Software Engineer', skills: 'C++, Distributed Systems', status: 'Technical Interview' },
    { name: 'Ananya Iyer', roll: 'CS2021-028', role: 'Backend Infrastructure Intern', skills: 'Cloud, Go, Kubernetes', status: 'Round 1 Scheduled' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Intelligence & Candidate Discovery"
        subtitle="Source pre-verified campus candidates backed by authentic code repositories and faculty evaluations."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Overview' }]}
        action={
          <div className="flex gap-2">
            <Button to="/recruiter/discovery" variant="primary" size="sm">
              <Search className="h-4 w-4 mr-1.5" />
              Discover Candidates
            </Button>
            <Button to="/recruiter/jobs" variant="outline" size="sm">
              <Briefcase className="h-4 w-4 mr-1.5" />
              Post Job Opening
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Requisitions"
          value="2"
          subtitle="Google Campus Drive 2024"
          trend="neutral"
          trendValue="Open for applications"
          icon={Briefcase}
          color="indigo"
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
          color="violet"
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
      </div>

      {/* Requisitions and Shortlists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Openings */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Campus Openings</h3>
            <Link to="/recruiter/jobs" className="text-xs font-semibold text-indigo-600 hover:underline">
              Manage Roles →
            </Link>
          </div>

          <div className="space-y-4">
            {activeRoles.map((role) => (
              <div key={role.title} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{role.title}</h4>
                  <Badge variant="indigo" size="sm">{role.package}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-3">{role.location}</div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span>Pre-Verified Matches: <strong className="text-emerald-700">{role.matches}</strong></span>
                  <Link to="/recruiter/discovery" className="font-semibold text-indigo-600 hover:underline">
                    View Matches →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Shortlists */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Candidate Pipeline</h3>
            <Link to="/recruiter/shortlists" className="text-xs font-semibold text-indigo-600 hover:underline">
              All Shortlists →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentShortlists.map((cand) => (
              <div key={cand.name} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={cand.name} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{cand.name}</h4>
                    <p className="text-[11px] text-slate-500">{cand.skills}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="emerald" size="sm">{cand.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
