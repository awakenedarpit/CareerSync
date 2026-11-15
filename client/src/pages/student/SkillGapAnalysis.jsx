import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  RotateCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  ExternalLink,
  Plus
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import industryService, { STANDARD_ROLES, CANONICAL_CATEGORIES } from '../../services/industryService';

export default function SkillGapAnalysis() {
  const navigate = useNavigate();
  const [selectedRoleId, setSelectedRoleId] = useState('role-fullstack');
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [tierFilter, setTierFilter] = useState('ALL');

  const fetchGapAnalysis = async (roleId) => {
    try {
      setLoading(true);
      const data = await industryService.getStudentSkillGap(roleId);
      setGapData(data);
    } catch (err) {
      console.error('Failed to load student skill gap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGapAnalysis(selectedRoleId);
  }, [selectedRoleId]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      const data = await industryService.recalculateSkillGap(selectedRoleId);
      setGapData(data);
    } catch (err) {
      console.error('Failed to recalculate skill gap:', err);
    } finally {
      setRecalculating(false);
    }
  };

  // 6-tier classification helper
  const getTierBadge = (status) => {
    switch (status) {
      case 'VERIFIED_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Match
          </span>
        );
      case 'EVIDENCE_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Layers className="h-3.5 w-3.5" />
            Evidence Available
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5" />
            Pending Verification
          </span>
        );
      case 'IMPROVEMENT_NEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Improvement Needed
          </span>
        );
      case 'MISSING_EVIDENCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5" />
            Missing Evidence
          </span>
        );
      case 'NOT_ASSESSED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="h-3.5 w-3.5" />
            Not Assessed
          </span>
        );
    }
  };

  const getFitBadge = (fitLevel) => {
    switch (fitLevel) {
      case 'STRONG_MATCH':
        return <Badge variant="emerald" size="lg">Strong Role Fit (80%+)</Badge>;
      case 'GOOD_MATCH':
        return <Badge variant="indigo" size="lg">Good Match (65-79%)</Badge>;
      case 'POTENTIAL_MATCH':
        return <Badge variant="amber" size="lg">Potential Match (50-64%)</Badge>;
      case 'DEVELOPING_MATCH':
      default:
        return <Badge variant="purple" size="lg">Developing Foundation (&lt;50%)</Badge>;
    }
  };

  const skillsList = gapData?.skillsBreakdown || [];

  const filteredSkills = skillsList.filter((item) => {
    if (tierFilter === 'ALL') return true;
    if (tierFilter === 'MATCHES') return item.status === 'VERIFIED_MATCH' || item.status === 'EVIDENCE_AVAILABLE';
    if (tierFilter === 'GAPS') return item.status === 'IMPROVEMENT_NEEDED' || item.status === 'MISSING_EVIDENCE';
    if (tierFilter === 'UNASSESSED') return item.status === 'NOT_ASSESSED' || item.status === 'PENDING_VERIFICATION';
    return item.status === tierFilter;
  });

  const verifiedCount = skillsList.filter((s) => s.status === 'VERIFIED_MATCH').length;
  const evidenceCount = skillsList.filter((s) => s.status === 'EVIDENCE_AVAILABLE' || s.status === 'PENDING_VERIFICATION').length;
  const gapCount = skillsList.filter((s) => s.status === 'IMPROVEMENT_NEEDED' || s.status === 'MISSING_EVIDENCE').length;
  const unassessedCount = skillsList.filter((s) => s.status === 'NOT_ASSESSED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Skill-Gap Diagnostic Engine"
        subtitle="Audited 6-tier calibration comparing your verified repository evidence and assessment scores against current enterprise job requirements."
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'Skill Gap Analysis' }
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculate}
              disabled={recalculating || loading}
            >
              <RotateCw className={`h-4 w-4 mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate Diagnostics
            </Button>
            <Button
              variant="primary"
              size="sm"
              to="/student/learning-path"
            >
              <BookOpen className="h-4 w-4 mr-1.5" />
              Prescribed Learning Path
            </Button>
          </div>
        }
      />

      {/* Target Role Selector & Overall Fit Banner */}
      <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/50 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Evaluating Candidate Against Benchmark Role
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {gapData?.roleTitle || 'Full Stack Engineer'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-64">
              <Select
                label=""
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                options={STANDARD_ROLES.map((r) => ({ value: r.id, label: r.title }))}
              />
            </div>
            {getFitBadge(gapData?.fitLevel || 'GOOD_MATCH')}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            {gapData?.summary ||
              'Evaluation synthesizes verified repository code, validated assessment attempts, and faculty audits against live placement specifications.'}
          </p>

          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Composite Readiness:</span>
            <span className="text-2xl font-black text-indigo-700">{gapData?.overallFitScore || 78}%</span>
          </div>
        </div>
      </div>

      {/* 6-Tier Classification Legend & KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Verified Matches
          </div>
          <div className="text-2xl font-black text-emerald-900">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Faculty / TPO Signed-off</div>
        </div>

        <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50">
          <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider mb-1">
            Evidence In Review
          </div>
          <div className="text-2xl font-black text-sky-900">{evidenceCount}</div>
          <div className="text-[10px] text-sky-700 mt-0.5">Submitted repositories</div>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
            Critical Skill Gaps
          </div>
          <div className="text-2xl font-black text-rose-900">{gapCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">Impacting shortlist eligibility</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Not Assessed
          </div>
          <div className="text-2xl font-black text-slate-800">{unassessedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Required modules pending</div>
        </div>
      </div>

      {/* 6-Tier Detailed Skills Breakdown */}
      <Card className="p-5 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Granular Competency Matrix & Rationale
            </h3>
            <p className="text-xs text-slate-500">
              Each requirement carries an explainable rationale with direct links to learning remediation tasks.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'MATCHES', 'GAPS', 'UNASSESSED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTierFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  tierFilter === filter
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL'
                  ? 'All Competencies'
                  : filter === 'MATCHES'
                  ? 'Matches'
                  : filter === 'GAPS'
                  ? 'Gaps'
                  : 'Pending & Unassessed'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {filteredSkills.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No skills found in this classification filter.
            </div>
          ) : (
            filteredSkills.map((item) => (
              <div key={item.skillName} className="p-4 bg-white hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{item.skillName}</span>
                    <Badge variant="slate" size="sm">
                      {CANONICAL_CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                    </Badge>
                  </div>
                  <div>{getTierBadge(item.status)}</div>
                </div>

                {/* Explainable Rationale */}
                <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  <strong className="text-slate-800">Diagnostic Rationale: </strong>
                  {item.gapRationale}
                </p>

                {/* Score vs Benchmark bar and Handoff Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Demonstrated: <strong>{item.studentLevel}%</strong></span>
                        <span>Role Benchmark: <strong>{item.benchmarkLevel}%</strong></span>
                      </div>
                      <ProgressBar
                        value={item.studentLevel}
                        variant={
                          item.studentLevel >= item.benchmarkLevel
                            ? 'emerald'
                            : item.studentLevel >= 50
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    {item.evidenceRef && (
                      <span className="text-[11px] text-slate-400 truncate max-w-xs" title={item.evidenceRef}>
                        {item.evidenceRef}
                      </span>
                    )}

                    {item.status !== 'VERIFIED_MATCH' && (
                      <Button
                        variant="outline"
                        size="sm"
                        to={`/student/learning-path?skill=${encodeURIComponent(item.skillName)}`}
                      >
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        Practice Task
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* One-Click Handoff: Recommended Learning Tasks (Phase 12 Integration) */}
      <Card className="p-5 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Targeted Remediation Tasks (Handoff to Phase 12 Learning Engine)
            </h3>
            <p className="text-xs text-slate-500">
              Prescribed micro-tasks formulated specifically to close your detected skill gaps for this benchmark role.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            to="/student/learning-path"
          >
            Launch Learning Roadmap
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(gapData?.recommendedLearningTasks || [
            {
              id: 'task-docker-01',
              title: 'Containerize Multi-Tier App with Docker Compose',
              category: 'PRACTICAL_PROJECT',
              skill: 'Docker & Containerization',
              estimatedHours: 4,
              priority: 'HIGH',
              description: 'Create multi-stage Dockerfiles for frontend and backend, with persistent PostgreSQL volumes.'
            },
            {
              id: 'task-test-01',
              title: 'Implement Integration Test Suite with Vitest & Supertest',
              category: 'CODING_EXERCISE',
              skill: 'Automated Testing',
              estimatedHours: 3,
              priority: 'MEDIUM',
              description: 'Author unit tests achieving >= 75% code coverage for auth and order processing routes.'
            }
          ]).map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                  <Badge variant={task.priority === 'HIGH' ? 'rose' : 'amber'} size="sm">
                    {task.priority} Priority
                  </Badge>
                </div>
                <div className="text-xs text-indigo-700 font-semibold mb-2">
                  Target Skill: {task.skill} • {task.estimatedHours} hrs
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {task.category.replace('_', ' ')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  to="/student/learning-path"
                >
                  Start Task
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
