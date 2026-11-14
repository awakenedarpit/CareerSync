import React, { useState } from 'react';
import {
  LineChart,
  BarChart2,
  PieChart,
  Download,
  Calendar,
  Layers,
  Award,
  AlertTriangle,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';

export default function CohortAnalytics() {
  const [selectedBatch, setSelectedBatch] = useState('2025');

  const branchMetrics = [
    { branch: 'Computer Science (CS)', students: 240, verifiedRate: 78, placedRate: 64, avgPackage: '14.2 LPA' },
    { branch: 'Information Technology (IT)', students: 180, verifiedRate: 72, placedRate: 58, avgPackage: '11.8 LPA' },
    { branch: 'Electronics & Comm (ECE)', students: 210, verifiedRate: 61, placedRate: 46, avgPackage: '9.4 LPA' },
    { branch: 'Mechanical Engineering (ME)', students: 120, verifiedRate: 48, placedRate: 35, avgPackage: '7.6 LPA' },
    { branch: 'Civil Engineering (CE)', students: 97, verifiedRate: 42, placedRate: 28, avgPackage: '6.8 LPA' },
  ];

  const skillGaps = [
    { domain: 'DevOps & Containerization (Docker, K8s)', gapRate: 58, severity: 'High', impactedStudents: 490 },
    { domain: 'Automated Testing (Jest, PyTest)', gapRate: 52, severity: 'High', impactedStudents: 440 },
    { domain: 'System Design & Scalability', gapRate: 44, severity: 'Medium', impactedStudents: 372 },
    { domain: 'Cloud Fundamentals (AWS/GCP)', gapRate: 38, severity: 'Medium', impactedStudents: 320 },
    { domain: 'Relational Database Optimization', gapRate: 22, severity: 'Low', impactedStudents: 186 },
  ];

  const topSkills = ['JavaScript & TypeScript', 'SQL & Relational Models', 'Data Structures & Algorithms', 'React.js', 'Python Programming'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Competency & Placement Analytics"
        subtitle="Aggregate skill verification rates, branch trends, and curriculum gap diagnostics."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Cohort Analytics' }]}
        action={
          <div className="flex gap-2">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700"
            >
              <option value="2025">Class of 2025 (Final Year)</option>
              <option value="2026">Class of 2026 (Pre-Final)</option>
            </select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export Analytics
            </Button>
          </div>
        }
      />

      {/* Branch Breakdown Table */}
      <Card className="p-6 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">Branch Performance & Verified Competency Index</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Total Cohort</th>
                <th className="py-3 px-4">Verified Skill Rate</th>
                <th className="py-3 px-4">Placed %</th>
                <th className="py-3 px-4">Average Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchMetrics.map((b) => (
                <tr key={b.branch} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">{b.branch}</td>
                  <td className="py-3 px-4 text-slate-600">{b.students}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${b.verifiedRate}%` }} />
                      </div>
                      <span className="font-semibold text-slate-800">{b.verifiedRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-emerald-600">{b.placedRate}%</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{b.avgPackage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cohort Skill Gaps & Top Verified Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Cohort Skill Gaps */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Highest Curriculum Gaps</h3>
            </div>
            <Badge variant="amber" size="sm">Requires Intervention</Badge>
          </div>

          <div className="space-y-4">
            {skillGaps.map((gap) => (
              <div key={gap.domain} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-800">{gap.domain}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{gap.impactedStudents} students</span>
                    <Badge variant={gap.severity === 'High' ? 'rose' : 'amber'} size="sm">
                      {gap.gapRate}% Deficient
                    </Badge>
                  </div>
                </div>
                <ProgressBar
                  value={gap.gapRate}
                  variant={gap.severity === 'High' ? 'rose' : 'amber'}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Top Verified Competencies */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Top Verified Competencies</h3>
            </div>
            <Badge variant="emerald" size="sm">High Strength</Badge>
          </div>

          <div className="space-y-3">
            {topSkills.map((skill, index) => (
              <div key={skill} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-indigo-600">0{index + 1}</span>
                  <span className="text-xs font-bold text-slate-900">{skill}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs text-slate-500">&gt;75% Cohort Verified</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Analytics are updated nightly through asynchronous database rollup jobs.
          </div>
        </Card>
      </div>
    </div>
  );
}
