import React, { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  BookOpen
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function AdminSkillGapAnalysis() {
  const [selectedBranch, setSelectedBranch] = useState('All');

  const gaps = [
    { skill: 'Docker Containerization', domain: 'DevOps', requiredScore: 80, cohortScore: 32, gap: 48, severity: 'Critical', affected: 490 },
    { skill: 'Automated Testing (Unit/Integration)', domain: 'Software Quality', requiredScore: 75, cohortScore: 38, gap: 37, severity: 'Critical', affected: 440 },
    { skill: 'System Design Patterns', domain: 'Architecture', requiredScore: 70, cohortScore: 45, gap: 25, severity: 'Moderate', affected: 372 },
    { skill: 'Cloud Deployment (AWS/GCP)', domain: 'Infrastructure', requiredScore: 65, cohortScore: 48, gap: 17, severity: 'Moderate', affected: 320 },
    { skill: 'NoSQL Database Modeling', domain: 'Databases', requiredScore: 70, cohortScore: 62, gap: 8, severity: 'Low', affected: 140 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Skill-Gap Matrix & Curriculum Diagnostic"
        subtitle="Institution-wide gap analysis highlighting where student technical evidence diverges from corporate recruiter criteria."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Skill Gap Matrix' }]}
        action={
          <div className="flex gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700"
            >
              <option value="All">All Departments</option>
              <option value="CS">Computer Science</option>
              <option value="IT">Information Technology</option>
              <option value="ECE">Electronics</option>
            </select>
          </div>
        }
      />

      {/* Overview Stat Card */}
      <Card className="p-6 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Curriculum Skill Deficiency Deficit</h3>
            <p className="text-xs text-slate-500">Benchmark calculated from 420 active recruiter specifications</p>
          </div>
          <Badge variant="amber" size="sm">2 Critical Areas Identified</Badge>
        </div>

        <div className="space-y-4">
          {gaps.map((item) => (
            <div key={item.skill} className="space-y-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900">{item.skill}</span>
                  <span className="text-slate-400 ml-2">({item.domain})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Impacted: <strong>{item.affected} students</strong></span>
                  <Badge variant={item.severity === 'Critical' ? 'rose' : 'amber'} size="sm">
                    {item.gap}% Gap
                  </Badge>
                </div>
              </div>

              <div className="relative h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.severity === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`}
                  style={{ width: `${item.cohortScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Cohort Avg: {item.cohortScore}%</span>
                <span>Recruiter Baseline: {item.requiredScore}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Prescribed Curriculum Interventions */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Recommended Institutional Interventions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-rose-600">
              <AlertTriangle className="h-4.5 w-4.5" />
              <h4 className="text-sm font-bold text-slate-900">Launch 3-Day Docker Lab Sprint</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Deploy automated micro-lab through CarrerSync Learning Paths to all 490 impacted students before Tier-1 placement rounds begin.
            </p>
            <Button variant="outline" size="sm">
              Deploy Micro-Task to Cohort
            </Button>
          </Card>

          <Card className="p-5 border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
              <BookOpen className="h-4.5 w-4.5" />
              <h4 className="text-sm font-bold text-slate-900">Vitest Automated Testing Workshop</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Incorporate test coverage requirements into 7th semester capstone project evaluation rubric to verify integration testing competency.
            </p>
            <Button variant="outline" size="sm">
              Schedule Department Workshop
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
