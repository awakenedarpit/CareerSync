import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  TrendingUp,
  ShieldCheck,
  Search,
  Filter,
  RotateCw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import institutionalService, {
  SUPPORTIVE_CLASSIFICATIONS,
  FALLBACK_COHORT_SKILLS,
  FALLBACK_INTERVENTIONS
} from '../../services/institutionalService';

export default function CohortSkillIntelligence() {
  const [data, setData] = useState(FALLBACK_COHORT_SKILLS);
  const [interventions, setInterventions] = useState(FALLBACK_INTERVENTIONS);
  const [refreshing, setRefreshing] = useState(false);

  // Active Heatmap View Tab
  const [activeTab, setActiveTab] = useState('deptVsSkill'); // 'deptVsSkill' | 'batchVsSkill' | 'roleVsSkill' | 'evidenceSplit'
  
  // Student Support Filter
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSupportFilter, setSelectedSupportFilter] = useState('ALL');

  // Intervention Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetSkill, setNewTargetSkill] = useState('Data Structures & Algorithms');
  const [newCohort, setNewCohort] = useState('Batch 2026 (All Departments)');
  const [newDepartment, setNewDepartment] = useState('CSE / IT');
  const [newActionPlan, setNewActionPlan] = useState('');
  const [newCoordinator, setNewCoordinator] = useState('Prof. Anjali Saxena');
  const [submittingIntervention, setSubmittingIntervention] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [cohortRes, intvRes] = await Promise.all([
        institutionalService.getCohortSkillData(),
        institutionalService.getInterventions(),
      ]);
      if (cohortRes) setData(cohortRes);
      if (intvRes) setInterventions(intvRes);
    } catch (err) {
      console.error('Failed to load cohort skill data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setSubmittingIntervention(true);
      const created = await institutionalService.createIntervention({
        title: newTitle,
        targetSkill: newTargetSkill,
        targetCohort: newCohort,
        department: newDepartment,
        actionPlan: newActionPlan || 'Targeted 4-week practice sprint and faculty evidence verification',
        coordinator: newCoordinator,
        studentIds: ['std-01', 'std-02', 'std-03'],
      });
      setInterventions([created, ...interventions]);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewActionPlan('');
    } catch (err) {
      console.error('Failed to create intervention:', err);
    } finally {
      setSubmittingIntervention(false);
    }
  };

  // Filtered Students
  const filteredStudents = (data?.studentSupportClassifications || []).filter((std) => {
    const matchesSearch =
      std.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      std.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      std.department.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesClassification =
      selectedSupportFilter === 'ALL' || std.classification === selectedSupportFilter;
    return matchesSearch && matchesClassification;
  });

  // Heatmap color intensity helper (0 - 100)
  const getCellBg = (val) => {
    if (val >= 85) return 'bg-emerald-600 text-white font-bold';
    if (val >= 70) return 'bg-emerald-500 text-white font-semibold';
    if (val >= 55) return 'bg-emerald-100 text-emerald-900 font-medium';
    if (val >= 40) return 'bg-amber-100 text-amber-900 font-medium';
    return 'bg-rose-100 text-rose-900 font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Cohort Skill Intelligence & Interventions"
        subtitle="Multi-dimensional verified skill heatmaps, continuous training intervention manager, and supportive student coaching classifications."
        breadcrumbs={[
          { label: 'TPO Portal', href: '/tpo' },
          { label: 'Institutional Intelligence', href: '/tpo/institutional-intelligence' },
          { label: 'Cohort Skills' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
              <RotateCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Heatmaps
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Training Intervention
            </Button>
          </div>
        }
      />

      {/* Heatmap Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('deptVsSkill')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'deptVsSkill'
                ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Department vs Skill Matrix
          </button>
          <button
            onClick={() => setActiveTab('batchVsSkill')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'batchVsSkill'
                ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Batch vs Skill Trajectory
          </button>
          <button
            onClick={() => setActiveTab('roleVsSkill')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'roleVsSkill'
                ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Role Readiness vs Industry Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('evidenceSplit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'evidenceSplit'
                ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Verified vs Missing Evidence Breakdown
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <span>Proficiency Index:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">&ge; 85%</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white font-semibold">70-84%</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">55-69%</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">40-54%</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-900">&lt; 40%</span>
        </div>
      </div>

      {/* Interactive Heatmap Surface */}
      <Card
        title={
          activeTab === 'deptVsSkill'
            ? 'Departmental Competency Matrix'
            : activeTab === 'batchVsSkill'
            ? 'Longitudinal Batch Competency Evolution'
            : activeTab === 'roleVsSkill'
            ? 'Corporate Role Alignment & Gap Identification'
            : 'Verified Evidence vs Claimed Gap Distribution'
        }
        subtitle="Calculated strictly from faculty-approved evaluations, GitHub capstone repos, and timed coding sandboxes. Zero self-declared unverifiable claims."
      >
        {activeTab === 'deptVsSkill' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Standardized Competency</th>
                  <th className="py-2.5 px-3 text-center">CSE</th>
                  <th className="py-2.5 px-3 text-center">IT</th>
                  <th className="py-2.5 px-3 text-center">ECE</th>
                  <th className="py-2.5 px-3 text-center">EEE</th>
                  <th className="py-2.5 px-3 text-center">MECH</th>
                  <th className="py-2.5 px-3 text-center">CIVIL</th>
                  <th className="py-2.5 px-3 text-right">Cohort Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.departmentVsSkill?.map((row) => {
                  const avg = Math.round(
                    (row.CSE + row.IT + row.ECE + row.EEE + row.MECH + row.CIVIL) / 6
                  );
                  return (
                    <tr key={row.skill} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.skill}</td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.CSE)}`}>{row.CSE}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.IT)}`}>{row.IT}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.ECE)}`}>{row.ECE}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.EEE)}`}>{row.EEE}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.MECH)}`}>{row.MECH}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.CIVIL)}`}>{row.CIVIL}%</span></td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">{avg}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'batchVsSkill' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Skill Category</th>
                  <th className="py-2.5 px-3 text-center">Batch 2024 (Alumni)</th>
                  <th className="py-2.5 px-3 text-center">Batch 2025 (Graduated)</th>
                  <th className="py-2.5 px-3 text-center">Batch 2026 (Final Year)</th>
                  <th className="py-2.5 px-3 text-center">Batch 2027 (Pre-Final)</th>
                  <th className="py-2.5 px-3 text-right">3-Year Growth Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.batchVsSkill?.map((row) => {
                  const delta = row.batch2026 - row.batch2024;
                  return (
                    <tr key={row.skill} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.skill}</td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.batch2024)}`}>{row.batch2024}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.batch2025)}`}>{row.batch2025}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.batch2026)}`}>{row.batch2026}%</span></td>
                      <td className="py-2.5 px-3 text-center"><span className={`inline-block w-14 py-1 rounded text-[11px] ${getCellBg(row.batch2027)}`}>{row.batch2027}%</span></td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">+{delta}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'roleVsSkill' && (
          <div className="space-y-4">
            {data?.roleVsSkill?.map((r) => (
              <div key={r.role} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{r.role}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'BENCHMARK_MET'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'ON_TRACK'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-500">Target: {r.requiredCoverage}%</span>
                    <span className="font-bold text-[#004D36]">Actual: {r.actualVerifiedCoverage}%</span>
                    <span className={`font-bold ${r.gap >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {r.gap >= 0 ? `+${r.gap}%` : `${r.gap}%`}
                    </span>
                  </div>
                </div>
                <ProgressBar value={r.actualVerifiedCoverage} color={r.gap >= 0 ? 'emerald' : 'indigo'} size="sm" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'evidenceSplit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Skill Category</th>
                  <th className="py-2.5 px-3">Total Tested (N)</th>
                  <th className="py-2.5 px-3 font-semibold text-emerald-700">Verified Evidence</th>
                  <th className="py-2.5 px-3 font-semibold text-amber-700">Missing Evidence</th>
                  <th className="py-2.5 px-3 text-right">Verification Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.verifiedVsMissingEvidence?.map((e) => (
                  <tr key={e.skillCategory} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{e.skillCategory}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{e.totalAttempted}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {e.verifiedCount} <span className="text-[10px] text-slate-400 font-normal">verified</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-amber-700">
                      {e.missingEvidenceCount} <span className="text-[10px] text-slate-400 font-normal">gaps</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-mono font-bold text-slate-800">{e.verifiedPercentage}%</span>
                        <div className="w-16">
                          <ProgressBar value={e.verifiedPercentage} color="emerald" size="xs" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Training Interventions Manager */}
      <Card
        title="Active Training Interventions & Skill Improvements"
        subtitle="Targeted institutional interventions to close diagnosed skill gaps. Mandatory principle: Course attendance alone != skill mastery; students must submit verifiable project code artifacts."
        headerAction={
          <Button variant="outline" size="xs" onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Create Intervention
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Intervention Program</th>
                <th className="py-3 px-3">Target Skill</th>
                <th className="py-3 px-3">Cohort & Dept</th>
                <th className="py-3 px-3">Students</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Baseline &rarr; Current</th>
                <th className="py-3 px-3">Improvement Delta</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interventions.map((intv) => (
                <tr key={intv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                    <div>{intv.title}</div>
                    <p className="text-[10px] text-slate-500 font-normal line-clamp-1">{intv.actionPlan}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#BDF9F9]/30 text-[#004D36] border border-[#02E8A7]/30">
                      {intv.targetSkill}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    <div>{intv.targetCohort}</div>
                    <span className="text-[10px] text-slate-400">{intv.coordinator}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-800">{intv.enrolledStudentsCount}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {intv.startDate} &rarr; {intv.endDate}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <span className="text-slate-500">{intv.baselineProficiency}%</span>
                    <span className="text-slate-400 mx-1">&rarr;</span>
                    <span className="font-bold text-slate-900">{intv.currentProficiency}%</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{intv.improvementDelta}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        intv.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#BDF9F9]/30 text-[#004D36] border border-[#02E8A7]/40'
                      }`}
                    >
                      {intv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Support Overview (Non-Stigmatizing Classifications) */}
      <Card
        title="Student Support & Guided Progression Directory"
        subtitle="Empathetic, non-stigmatizing classification categories designed for targeted academic support and coaching. Strictly zero public rankings and zero automated punitive actions."
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll no, or branch..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSupportFilter}
              onChange={(e) => setSelectedSupportFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Support Categories</option>
              <option value="SUPPORT_RECOMMENDED">Support Recommended</option>
              <option value="ADDITIONAL_PRACTICE_SUGGESTED">Additional Practice Suggested</option>
              <option value="INSUFFICIENT_DATA">Insufficient Data</option>
              <option value="PROGRESSING">Progressing Well</option>
              <option value="NO_ACTION_REQUIRED">No Action Required</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Student Name & Roll No</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Target Career Goal</th>
                <th className="py-2.5 px-3">Verified Skills</th>
                <th className="py-2.5 px-3">Supportive Classification</th>
                <th className="py-2.5 px-3">Recommended Next Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No student records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const classConfig = SUPPORTIVE_CLASSIFICATIONS[std.classification] || SUPPORTIVE_CLASSIFICATIONS.PROGRESSING;
                  return (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <div>{std.studentName}</div>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">{std.rollNo}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{std.department}</td>
                      <td className="py-3 px-3 font-medium text-[#004D36]">{std.targetRole}</td>
                      <td className="py-3 px-3 font-mono">
                        <span className="text-emerald-700 font-bold">{std.verifiedSkillsCount} verified</span>
                        {std.identifiedGapsCount > 0 && (
                          <span className="text-slate-400 ml-1">/ {std.identifiedGapsCount} gaps</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            classConfig.badgeVariant === 'amber'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : classConfig.badgeVariant === 'purple'
                              ? 'bg-[#BDF9F9]/30 text-[#004D36] border border-[#02E8A7]/40'
                              : classConfig.badgeVariant === 'sky'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : classConfig.badgeVariant === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {classConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] max-w-xs">
                        {std.recommendedAction}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Intervention Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Propose Institutional Training Intervention"
        subtitle="Design a structured skill gap closure program with empirical mastery verification."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateIntervention} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Intervention Program Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Cloud & Microservices Practice Intensive"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Skill Area</label>
              <select
                value={newTargetSkill}
                onChange={(e) => setNewTargetSkill(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              >
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Full-Stack Web Development">Full-Stack Web Development</option>
                <option value="Cloud & DevOps (Docker/AWS)">Cloud & DevOps (Docker/AWS)</option>
                <option value="SQL & Relational Databases">SQL & Relational Databases</option>
                <option value="Embedded Systems & RTOS">Embedded Systems & RTOS</option>
                <option value="System Design & Architecture">System Design & Architecture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Cohort</label>
              <input
                type="text"
                value={newCohort}
                onChange={(e) => setNewCohort(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty / Academic Coordinator</label>
            <input
              type="text"
              value={newCoordinator}
              onChange={(e) => setNewCoordinator(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Action Plan & Verification Criteria</label>
            <textarea
              rows={3}
              placeholder="Describe curriculum sprint, mock assessments, and practical capstone evidence requirements..."
              value={newActionPlan}
              onChange={(e) => setNewActionPlan(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#BDF9F9]/30 border border-[#02E8A7]/30 text-[#002020] text-[11px] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#009669] shrink-0 mt-0.5" />
            <span>
              <strong>Mastery Enforcement:</strong> Course attendance alone does not grant verified skill status. 
              Students must submit functional project repositories or pass timed coding sandboxes verified by faculty.
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submittingIntervention}>
              {submittingIntervention ? 'Saving...' : 'Authorize & Launch Intervention'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
