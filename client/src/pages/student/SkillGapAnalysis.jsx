import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function SkillGapAnalysis() {
  const [selectedRole, setSelectedRole] = useState('Full Stack Engineer');

  const skillsBreakdown = [
    { skill: 'JavaScript / TS', required: 90, demonstrated: 95, gap: 0, status: 'Surplus', category: 'Language' },
    { skill: 'React Ecosystem', required: 85, demonstrated: 80, gap: 5, status: 'Minor Gap', category: 'Frontend' },
    { skill: 'Node.js & APIs', required: 80, demonstrated: 75, gap: 5, status: 'Minor Gap', category: 'Backend' },
    { skill: 'SQL & Database Design', required: 80, demonstrated: 85, gap: 0, status: 'Met', category: 'Database' },
    { skill: 'Docker & Containers', required: 75, demonstrated: 25, gap: 50, status: 'Critical Gap', category: 'DevOps' },
    { skill: 'System Design Basics', required: 70, demonstrated: 40, gap: 30, status: 'Moderate Gap', category: 'Architecture' },
    { skill: 'Automated Testing', required: 65, demonstrated: 30, gap: 35, status: 'Moderate Gap', category: 'Testing' }
  ];

  const criticalGaps = [
    {
      skill: 'Docker & Containerization',
      severity: 'Critical',
      badgeVariant: 'rose',
      impact: 'Mandatory filter in 84% of Tier-1 Full Stack drives.',
      recommendedAction: 'Complete Docker micro-project: containerize multi-service MERN app and commit docker-compose.yml.',
      estHours: '4 hrs'
    },
    {
      skill: 'System Design & Scalability',
      severity: 'Moderate',
      badgeVariant: 'amber',
      impact: 'Tested in Round 2 technical interviews for Google, Amazon, Microsoft.',
      recommendedAction: 'Study URL shortener and rate-limiter architectural patterns in learning path.',
      estHours: '6 hrs'
    },
    {
      skill: 'Automated Unit & Integration Testing',
      severity: 'Moderate',
      badgeVariant: 'amber',
      impact: 'Differentiates candidates during code quality evaluations.',
      recommendedAction: 'Add Jest or Vitest test suites with >70% branch coverage to event-engine project.',
      estHours: '5 hrs'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill-Gap Analysis Matrix"
        subtitle="Automated market gap diagnostics comparing your verified evidence against target role benchmarks."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Skill Gap Analysis' }]}
        action={
          <Button to="/student/learning-path" variant="primary" size="sm">
            <BookOpen className="h-4 w-4 mr-1.5" />
            View Prescribed Learning Path
          </Button>
        }
      />

      {/* Target Role Context Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-indigo-100 bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Benchmark Role:</span>
              <strong className="text-sm text-slate-900">{selectedRole}</strong>
            </div>
            <p className="text-xs text-slate-500">Industry standard benchmark derived from 420+ active campus drive job descriptions.</p>
          </div>
        </div>

        <Link
          to="/student/goals"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          Change Role <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Visual Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Bar Comparison Chart */}
        <Card className="lg:col-span-2 p-6 border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Required Benchmark vs Demonstrated Skill Index</h3>
              <p className="text-xs text-slate-500">Values normalized out of 100 based on verified code artifacts</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-indigo-600" />
                <span className="text-slate-600">Demonstrated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-slate-300" />
                <span className="text-slate-600">Required</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {skillsBreakdown.map((item) => (
              <div key={item.skill} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Req: {item.required}%</span>
                    <span className={`font-bold ${item.gap > 20 ? 'text-rose-600' : 'text-indigo-600'}`}>
                      Demo: {item.demonstrated}%
                    </span>
                    <Badge variant={item.gap === 0 ? 'emerald' : item.gap > 20 ? 'rose' : 'amber'} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                </div>

                {/* Dual bar representation */}
                <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-slate-300 rounded-full opacity-60"
                    style={{ width: `${item.required}%` }}
                  />
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-full transition-all ${
                      item.gap === 0 ? 'bg-emerald-500' : item.gap > 20 ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${item.demonstrated}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Explainability Side Panel */}
        <div className="space-y-4">
          <Card className="p-5 border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Explainable AI Diagnostic</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Why Docker matters: 7 Tier-1 recruiters visiting campus this semester (including TCS Digital, Google, and Razorpay) mandate Docker containerization in their automated code screening pipeline.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs text-slate-700">
              <div className="flex justify-between py-1">
                <span>Core Full Stack Readiness:</span>
                <strong className="text-indigo-600">78%</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Drives Eligible Right Now:</span>
                <strong className="text-emerald-600">3 of 5</strong>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Next Immediate Step</h4>
            <p className="text-xs text-slate-600">
              Complete the 4-hour Docker containerization module to unlock eligibility for 2 high-package placement drives.
            </p>
            <Button to="/student/learning-path" variant="primary" size="sm" className="w-full justify-center mt-3">
              Start Learning Module
            </Button>
          </Card>
        </div>
      </div>

      {/* Critical Gaps & Interventions List */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-4">Recommended Micro-Interventions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {criticalGaps.map((gap) => (
            <Card key={gap.skill} hover className="p-5 border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{gap.skill}</h4>
                  <Badge variant={gap.badgeVariant} size="sm">{gap.severity}</Badge>
                </div>
                <p className="text-xs text-slate-500 mb-3">{gap.impact}</p>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-1">Prescribed Action:</span>
                  {gap.recommendedAction}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Est. Time: {gap.estHours}</span>
                <Link to="/student/learning-path" className="font-semibold text-indigo-600 hover:underline">
                  Launch Task →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
