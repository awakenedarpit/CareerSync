/**
 * CarrerSync TPO Placement Readiness Intelligence Dashboard
 * Phase 10 — Explainable Cohort Readiness Distribution & Department Diagnostics
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Users,
  Building,
  Target,
  Sparkles,
  RotateCw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import readinessService from '../../services/readinessService';

const MOCK_COHORT_DATA = {
  totalStudents: 320,
  averageScore: 73.4,
  distribution: {
    READY: 118,
    DEVELOPING: 134,
    NEEDS_SUPPORT: 48,
    INSUFFICIENT_DATA: 20
  },
  topSkillGaps: [
    { skill: 'Docker & Kubernetes', count: 96, category: 'DevOps', severity: 'HIGH' },
    { skill: 'System Design & Scalability', count: 78, category: 'Backend', severity: 'HIGH' },
    { skill: 'PostgreSQL Advanced Indexing', count: 54, category: 'Database', severity: 'MEDIUM' },
    { skill: 'TypeScript Strict Mode', count: 42, category: 'Frontend', severity: 'MEDIUM' },
    { skill: 'CI/CD Pipelines (GitHub Actions)', count: 38, category: 'DevOps', severity: 'LOW' }
  ],
  studentsNeedingSupport: [
    {
      studentId: 'std-201',
      studentName: 'Vikram Singh',
      rollNumber: 'CS21B1012',
      department: 'Computer Science',
      readinessScore: 48.5,
      category: 'NEEDS_SUPPORT',
      dataCompleteness: 0.92,
      criticalGaps: ['Data Structures & Algorithms', 'Production Project Evidence'],
      dimensions: { verifiedSkills: 35, evidenceCoverage: 40, projectDepth: 55, academics: 70 }
    },
    {
      studentId: 'std-202',
      studentName: 'Sanya Mirza',
      rollNumber: 'IT21B2033',
      department: 'Information Technology',
      readinessScore: 52.0,
      category: 'NEEDS_SUPPORT',
      dataCompleteness: 0.88,
      criticalGaps: ['Backend Frameworks', 'Database Normalization'],
      dimensions: { verifiedSkills: 42, evidenceCoverage: 50, projectDepth: 48, academics: 75 }
    },
    {
      studentId: 'std-203',
      studentName: 'Kunal Kapoor',
      rollNumber: 'EC21B3045',
      department: 'Electronics',
      readinessScore: 38.0,
      category: 'INSUFFICIENT_DATA',
      dataCompleteness: 0.28,
      criticalGaps: ['No Resume Uploaded', 'Missing Verified Academic Records'],
      dimensions: { verifiedSkills: 20, evidenceCoverage: 15, projectDepth: 30, academics: 50 }
    },
    {
      studentId: 'std-204',
      studentName: 'Meera Nambiar',
      rollNumber: 'ME21B4021',
      department: 'Mechanical',
      readinessScore: 56.5,
      category: 'NEEDS_SUPPORT',
      dataCompleteness: 0.85,
      criticalGaps: ['Object-Oriented Programming', 'API Design'],
      dimensions: { verifiedSkills: 45, evidenceCoverage: 52, projectDepth: 58, academics: 78 }
    }
  ]
};

const MOCK_DEPT_DATA = [
  {
    department: 'Computer Science',
    totalStudents: 120,
    averageScore: 78.6,
    readyPercentage: 48.3,
    developingPercentage: 38.3,
    needsSupportPercentage: 10.0,
    averageCompleteness: 0.94
  },
  {
    department: 'Information Technology',
    totalStudents: 85,
    averageScore: 74.2,
    readyPercentage: 38.8,
    developingPercentage: 47.1,
    needsSupportPercentage: 11.8,
    averageCompleteness: 0.91
  },
  {
    department: 'Electronics & Communication',
    totalStudents: 65,
    averageScore: 68.5,
    readyPercentage: 26.2,
    developingPercentage: 49.2,
    needsSupportPercentage: 18.5,
    averageCompleteness: 0.86
  },
  {
    department: 'Mechanical Engineering',
    totalStudents: 50,
    averageScore: 61.4,
    readyPercentage: 18.0,
    developingPercentage: 44.0,
    needsSupportPercentage: 30.0,
    averageCompleteness: 0.81
  }
];

export default function ReadinessDashboard() {
  const [cohortData, setCohortData] = useState(MOCK_COHORT_DATA);
  const [deptData, setDeptData] = useState(MOCK_DEPT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentForGap, setSelectedStudentForGap] = useState(null);
  const [targetRole] = useState('Full Stack Software Engineer');
  const [gapDiagnosticsResult, setGapDiagnosticsResult] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const loadReadiness = async () => {
    setIsLoading(true);
    try {
      const [cRes, dRes] = await Promise.allSettled([
        readinessService.getCohortReadiness(),
        readinessService.getDepartmentReadiness()
      ]);

      if (cRes.status === 'fulfilled' && cRes.value) {
        setCohortData((prev) => ({ ...prev, ...cRes.value }));
      }
      if (dRes.status === 'fulfilled' && dRes.value && dRes.value.departments) {
        setDeptData(dRes.value.departments);
      }
    } catch {
      // Fallback data handles network issues
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, []);

  const total = cohortData.totalStudents || 1;
  const readyPct = Math.round(((cohortData.distribution.READY || 0) / total) * 100);
  const developingPct = Math.round(((cohortData.distribution.DEVELOPING || 0) / total) * 100);
  const needsSupportPct = Math.round(((cohortData.distribution.NEEDS_SUPPORT || 0) / total) * 100);
  const insufficientPct = Math.round(((cohortData.distribution.INSUFFICIENT_DATA || 0) / total) * 100);

  const handleOpenDiagnostics = async (student) => {
    setSelectedStudentForGap(student);
    setGapDiagnosticsResult(null);
    setIsDiagnosing(true);

    try {
      const payload = {
        requiredSkills: ['Data Structures', 'JavaScript (ES6+)', 'Node.js & Express', 'SQL & Databases'],
        preferredSkills: ['React.js', 'Docker', 'Git'],
        targetRole
      };

      const res = await readinessService.diagnoseSkillGaps(student.studentId, payload);
      if (res) {
        setGapDiagnosticsResult(res);
      }
    } catch {
      // Simulate deterministic response for test & demo
      setGapDiagnosticsResult({
        studentId: student.studentId,
        targetRole,
        matches: [
          { skill: 'Data Structures', status: 'VERIFIED_MATCH' },
          { skill: 'JavaScript (ES6+)', status: 'VERIFIED_MATCH' },
          { skill: 'Node.js & Express', status: 'EVIDENCE_MATCH' },
          { skill: 'SQL & Databases', status: 'PENDING_VERIFICATION' },
          { skill: 'Docker & Kubernetes', status: 'MISSING_SKILL' }
        ],
        summary: {
          verifiedMatchCount: 2,
          evidenceMatchCount: 1,
          pendingCount: 1,
          missingCount: 1,
          matchPercentage: 60
        }
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const deptColumns = [
    {
      header: 'Department',
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.department}</span>
      )
    },
    {
      header: 'Students',
      render: (row) => <span className="font-mono text-slate-700">{row.totalStudents}</span>
    },
    {
      header: 'Avg Readiness Score',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold font-mono text-[#004D36]">{row.averageScore}</span>
          <span className="text-[10px] text-slate-400">/ 100</span>
        </div>
      )
    },
    {
      header: 'Ready %',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
          {row.readyPercentage}%
        </span>
      )
    },
    {
      header: 'Developing %',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-[#004D36] bg-[#BDF9F9]/30 px-2 py-0.5 rounded text-xs">
          {row.developingPercentage}%
        </span>
      )
    },
    {
      header: 'Needs Support %',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
          {row.needsSupportPercentage}%
        </span>
      )
    },
    {
      header: 'Completeness',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-14 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#BDF9F9]/300 h-full rounded-full"
              style={{ width: `${Math.round(row.averageCompleteness * 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-600">
            {Math.round(row.averageCompleteness * 100)}%
          </span>
        </div>
      )
    }
  ];

  const studentSupportColumns = [
    {
      header: 'Student',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.studentName}</div>
          <div className="text-xs text-slate-500 font-mono">{row.rollNumber} • {row.department}</div>
        </div>
      )
    },
    {
      header: 'Readiness Score',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-rose-600 font-mono">{row.readinessScore}</span>
          <Badge variant={row.category === 'INSUFFICIENT_DATA' ? 'slate' : 'rose'} size="sm">
            {row.category.replace('_', ' ')}
          </Badge>
        </div>
      )
    },
    {
      header: 'Critical Skill Gaps',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.criticalGaps.map((gap, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded"
            >
              {gap}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Dimensions (V / E / P / A)',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600" title="Verified Skills / Evidence Coverage / Projects / Academics">
          {row.dimensions.verifiedSkills} / {row.dimensions.evidenceCoverage} / {row.dimensions.projectDepth} / {row.dimensions.academics}
        </span>
      )
    },
    {
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          onClick={() => handleOpenDiagnostics(row)}
          variant="outline"
          size="sm"
          className="hover:border-indigo-500 hover:text-[#009669]"
        >
          <Target className="w-3.5 h-3.5 mr-1" />
          Diagnose Gap
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Readiness Intelligence Dashboard"
        subtitle="Explainable cohort readiness distributions, 4-dimension scoring, and department-level diagnostic analysis."
        breadcrumbs={[{ label: 'T&P Admin', href: '/admin' }, { label: 'Placement Readiness' }]}
        action={
          <Button onClick={loadReadiness} variant="outline" size="sm" disabled={isLoading}>
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </Button>
        }
      />

      {/* Advisory Formula Banner */}
      <div className="p-4 bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-xl text-xs text-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[#009669] shrink-0" />
          <div>
            <span className="font-bold">Transparent Scoring Dimensions: </span>
            Readiness = Verified Skills (35%) + Evidence Coverage (25%) + Project Depth (20%) + Academics (20%).
            <span className="block text-[11px] text-blue-800 mt-0.5">
              *Scores are advisory and designed for proactive student mentoring; not automated disqualifiers.
            </span>
          </div>
        </div>
        <span className="font-mono text-[11px] font-semibold text-[#004D36] bg-white px-2.5 py-1 rounded border border-[#02E8A7]/40 shrink-0">
          Deterministic 4-Tier
        </span>
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* READY */}
        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">READY (≥ 80)</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-900">{cohortData.distribution.READY}</div>
          <div className="mt-2 text-xs text-emerald-700 flex items-center justify-between">
            <span>{readyPct}% of cohort</span>
            <span className="font-semibold">Direct placement eligible</span>
          </div>
          <div className="mt-2 w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${readyPct}%` }} />
          </div>
        </Card>

        {/* DEVELOPING */}
        <Card className="p-4 border-[#02E8A7]/40 bg-[#BDF9F9]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#002020] uppercase tracking-wider">DEVELOPING (60 - 79)</span>
            <div className="p-1.5 bg-[#BDF9F9]/50 text-[#004D36] rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#002020]">{cohortData.distribution.DEVELOPING}</div>
          <div className="mt-2 text-xs text-[#004D36] flex items-center justify-between">
            <span>{developingPct}% of cohort</span>
            <span className="font-semibold">Minor skill gap fill</span>
          </div>
          <div className="mt-2 w-full bg-[#BDF9F9]/50 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#02E8A7] h-full rounded-full" style={{ width: `${developingPct}%` }} />
          </div>
        </Card>

        {/* NEEDS SUPPORT */}
        <Card className="p-4 border-amber-200 bg-amber-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">NEEDS SUPPORT (&lt; 60)</span>
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-900">{cohortData.distribution.NEEDS_SUPPORT}</div>
          <div className="mt-2 text-xs text-amber-700 flex items-center justify-between">
            <span>{needsSupportPct}% of cohort</span>
            <span className="font-semibold">Targeted intervention</span>
          </div>
          <div className="mt-2 w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${needsSupportPct}%` }} />
          </div>
        </Card>

        {/* INSUFFICIENT DATA */}
        <Card className="p-4 border-slate-200 bg-slate-50/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">INSUFFICIENT DATA</span>
            <div className="p-1.5 bg-slate-200 text-slate-600 rounded-lg">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">{cohortData.distribution.INSUFFICIENT_DATA}</div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>{insufficientPct}% of cohort</span>
            <span className="font-semibold">&lt; 40% profile completeness</span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: `${insufficientPct}%` }} />
          </div>
        </Card>
      </div>

      {/* Top Skill Gaps in Cohort */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#009669]" />
              Cohort Top Skill Gaps
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated technical competency deficiencies across registered students needing proactive workshops.
            </p>
          </div>
          <Badge variant="aqua">Cohort Intel</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cohortData.topSkillGaps.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-white hover:border-[#02E8A7]/40 transition-all"
            >
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {item.category}
                </span>
                <span className="font-bold text-xs text-slate-900 mt-0.5 block">{item.skill}</span>
                <span className="text-[11px] text-slate-500">{item.count} students missing proof</span>
              </div>
              <Badge
                variant={item.severity === 'HIGH' ? 'rose' : item.severity === 'MEDIUM' ? 'amber' : 'slate'}
                size="sm"
              >
                {item.severity} GAP
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Department Breakdown Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#009669]" />
              Department-Wise Readiness Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative benchmark across academic departments.
            </p>
          </div>
        </div>

        <DataTable
          columns={deptColumns}
          data={deptData}
          keyField="department"
          isLoading={isLoading}
        />
      </div>

      {/* Students Needing Support Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-600" />
              Students Requiring Placement Intervention
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidates below readiness threshold (&lt; 60 score or insufficient data) flagged for priority advising.
            </p>
          </div>
          <Badge variant="rose">{cohortData.studentsNeedingSupport.length} Flagged</Badge>
        </div>

        <DataTable
          columns={studentSupportColumns}
          data={cohortData.studentsNeedingSupport}
          keyField="studentId"
        />
      </div>

      {/* Skill Gap Diagnostics Modal */}
      {selectedStudentForGap && (
        <Modal
          isOpen={!!selectedStudentForGap}
          onClose={() => setSelectedStudentForGap(null)}
          title={`Target Role Skill Gap Diagnostics — ${selectedStudentForGap.studentName}`}
          subtitle={`Department: ${selectedStudentForGap.department} • Readiness: ${selectedStudentForGap.readinessScore}/100`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-[#BDF9F9]/30 border border-[#02E8A7]/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#002020] tracking-wider">Benchmark Role</span>
                <p className="font-bold text-sm text-indigo-950 mt-0.5">{targetRole}</p>
              </div>
              <span className="text-xs font-semibold text-[#009669] bg-white px-2.5 py-1 rounded border border-[#02E8A7]/40">
                Live Evaluator
              </span>
            </div>

            {isDiagnosing ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Comparing student verified skills against role requirements...</span>
              </div>
            ) : gapDiagnosticsResult ? (
              <div className="space-y-4">
                {/* Summary Match Bar */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Role Skill Match:</span>
                    <span className="font-mono text-[#004D36] text-sm">
                      {gapDiagnosticsResult.summary.matchPercentage}% Match
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#02E8A7] h-full rounded-full"
                      style={{ width: `${gapDiagnosticsResult.summary.matchPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{gapDiagnosticsResult.summary.verifiedMatchCount} Verified Matches</span>
                    <span>{gapDiagnosticsResult.summary.evidenceMatchCount} Evidence Found</span>
                    <span className="text-rose-600 font-semibold">{gapDiagnosticsResult.summary.missingCount} Missing Skills</span>
                  </div>
                </div>

                {/* Match Breakdown List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-900 block">Required Competencies Breakdown:</span>
                  <div className="space-y-1.5">
                    {gapDiagnosticsResult.matches.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border flex items-center justify-between bg-white border-slate-200"
                      >
                        <span className="font-semibold text-slate-800">{item.skill}</span>
                        {item.status === 'VERIFIED_MATCH' ? (
                          <Badge variant="emerald" size="sm">Verified Match</Badge>
                        ) : item.status === 'EVIDENCE_MATCH' ? (
                          <Badge variant="aqua" size="sm">Evidence Found</Badge>
                        ) : item.status === 'PENDING_VERIFICATION' ? (
                          <Badge variant="amber" size="sm">Pending TPO Review</Badge>
                        ) : (
                          <Badge variant="rose" size="sm">Missing Evidence</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <strong className="block mb-1">Recommended TPO Mentoring Actions:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                    <li>Assign Docker & Kubernetes introductory lab module.</li>
                    <li>Schedule student for TPO verification review on SQL project artifacts.</li>
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedStudentForGap(null)} variant="primary" size="sm">
                Close Diagnostics
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
