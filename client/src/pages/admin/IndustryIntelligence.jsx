import React, { useState } from 'react';
import {
  Globe,
  TrendingUp,
  Target,
  Sparkles,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function IndustryIntelligence() {
  const jobRoles = [
    {
      role: 'Full Stack Engineer',
      marketDemand: 'Very High (+24%)',
      topRequiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
      cohortMatch: 78,
      avgStartingPay: '12 - 24 LPA'
    },
    {
      role: 'Cloud & DevOps Engineer',
      marketDemand: 'Surging (+38%)',
      topRequiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD'],
      cohortMatch: 45,
      avgStartingPay: '14 - 26 LPA'
    },
    {
      role: 'Data & AI Engineer',
      marketDemand: 'High (+18%)',
      topRequiredSkills: ['Python', 'SQL', 'FastAPI', 'PyTorch', 'Vector DBs'],
      cohortMatch: 52,
      avgStartingPay: '15 - 30 LPA'
    },
    {
      role: 'Backend Systems Engineer',
      marketDemand: 'High (+12%)',
      topRequiredSkills: ['Go / Java', 'Distributed DBs', 'Kafka', 'System Design'],
      cohortMatch: 72,
      avgStartingPay: '14 - 28 LPA'
    }
  ];

  const emergingSkills = [
    { name: 'LLM Integration & Prompt Engineering', momentum: '+114%', demand: 'Critical' },
    { name: 'Rust Systems Programming', momentum: '+64%', demand: 'High' },
    { name: 'Kubernetes Cluster Operations', momentum: '+42%', demand: 'Very High' },
    { name: 'FastAPI Microservices', momentum: '+35%', demand: 'High' }
  ];

  const recruiterFeedback = [
    {
      company: 'Google',
      text: 'Candidates demonstrated exceptional algorithmic problem-solving. We recommend more emphasis on concurrency and distributed systems basics.',
      rating: 'Strong Endorsement'
    },
    {
      company: 'Razorpay',
      text: 'Students with verified GitHub project code performed significantly better in technical interviews than those with boilerplate resume claims.',
      rating: 'High Value on Evidence'
    },
    {
      company: 'TCS Digital',
      text: 'Good foundational coding skills. Adding containerization and automated test suites to lab curriculums will increase digital cadre conversion.',
      rating: 'Actionable Guidance'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Demand & Industry Intelligence"
        subtitle="Automated market calibration comparing 420+ company job specifications against student competencies."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Industry Intel' }]}
      />

      {/* Market Job Demand Cards */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Key In-Demand Industry Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobRoles.map((job) => (
            <Card key={job.role} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-base font-bold text-slate-900">{job.role}</h4>
                  <Badge variant="indigo" size="sm">{job.marketDemand}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-3">Starting Compensation: <strong className="text-slate-800">{job.avgStartingPay}</strong></div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Campus Cohort Preparedness</span>
                    <strong className="text-indigo-600">{job.cohortMatch}%</strong>
                  </div>
                  <ProgressBar value={job.cohortMatch} variant={job.cohortMatch > 60 ? 'indigo' : 'amber'} size="sm" />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Mandatory Competencies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {job.topRequiredSkills.map((sk) => (
                      <span key={sk} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Emerging Technologies & Recruiter Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emerging Tech */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Emerging Technology Spikes</h3>
          </div>
          <div className="space-y-3">
            {emergingSkills.map((sk) => (
              <div key={sk.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{sk.name}</div>
                  <span className="text-slate-400">Demand: {sk.demand}</span>
                </div>
                <Badge variant="emerald" size="sm">{sk.momentum}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recruiter Feedback Pattern */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">Recruiter Feedback Patterns</h3>
          </div>
          <div className="space-y-3">
            {recruiterFeedback.map((fb) => (
              <div key={fb.company} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{fb.company}</span>
                  <Badge variant="purple" size="sm">{fb.rating}</Badge>
                </div>
                <p className="text-slate-600 leading-relaxed italic">"{fb.text}"</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
