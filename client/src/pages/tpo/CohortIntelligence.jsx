import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  LineChart,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Layers,
  Building,
  Target,
  ArrowRight,
  RotateCw,
  Filter,
  Download,
  BookOpen,
  Award
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import StatCard from '../../components/ui/StatCard';
import Select from '../../components/ui/Select';
import industryService from '../../services/industryService';

export default function CohortIntelligence() {
  const [overview, setOverview] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [gapsData, setGapsData] = useState({ gaps: [], interventions: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('2026');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewData, matrixData, gapsResult] = await Promise.all([
        industryService.getCohortOverview({ department: selectedDepartment, batch: selectedBatch }),
        industryService.getCohortSkills({ department: selectedDepartment, batch: selectedBatch }),
        industryService.getCohortGaps({ department: selectedDepartment, batch: selectedBatch })
      ]);

      setOverview(overviewData);
      setMatrix(matrixData);
      setGapsData(gapsResult || { gaps: [], interventions: [] });
    } catch (err) {
      console.error('Failed to load cohort intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDepartment, selectedBatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredMatrix = useMemo(() => {
    if (selectedDepartment === 'ALL') return matrix;
    return matrix.filter((m) =>
      m.department.toLowerCase().includes(selectedDepartment.toLowerCase())
    );
  }, [matrix, selectedDepartment]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Skill-Gap Analytics & Training Interventions"
        subtitle="Institutional macro-diagnostics identifying systemic skill deficits across departments to prescribe targeted curriculum and workshop interventions."
        breadcrumbs={[
          { label: 'TPO Portal', href: '/tpo' },
          { label: 'Cohort Intelligence' }
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RotateCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="h-4 w-4 text-[#009669]" />
          <span>Cohort Filter Controls:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <Select
              label=""
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Departments Combined' },
                { value: 'CSE', label: 'Computer Science (CSE)' },
                { value: 'IT', label: 'Information Technology (IT)' },
                { value: 'ECE', label: 'Electronics & Comm. (ECE)' }
              ]}
            />
          </div>
          <div className="w-full sm:w-36">
            <Select
              label=""
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              options={[
                { value: '2026', label: 'Batch of 2026' },
                { value: '2027', label: 'Batch of 2027' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students Evaluated"
          value={overview?.studentsAnalyzed || 442}
          subtitle={`Out of ${overview?.totalStudents || 480} registered cohort`}
          icon={Users}
          accentColor="indigo"
        />
        <StatCard
          title="Overall Readiness Index"
          value={`${overview?.overallInstitutionalReadiness || 71.4}%`}
          subtitle="Tier-1 placement benchmark"
          icon={Award}
          accentColor="emerald"
          trend="+4.2%"
          trendType="up"
        />
        <StatCard
          title="Systemic Gaps Detected"
          value={(gapsData.gaps || []).length || 4}
          subtitle="Affecting >40% of cohort"
          icon={AlertTriangle}
          accentColor="amber"
        />
        <StatCard
          title="Active Interventions"
          value={(gapsData.interventions || []).length || 2}
          subtitle="Workshops & Lab bootcamps"
          icon={Lightbulb}
          accentColor="violet"
        />
      </div>

      {/* Capability vs Market Demand Section */}
      <Card className="p-5 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-[#009669]" />
              Target Role Distribution & Institutional Preparedness
            </h3>
            <p className="text-xs text-slate-500">
              Breakdown of student career preferences against measured competency fit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(overview?.primaryTargetRoles || [
            { role: 'Full Stack Engineer', studentCount: 198, avgFit: 74.2 },
            { role: 'Backend Systems Engineer', studentCount: 112, avgFit: 69.8 },
            { role: 'Cloud & DevOps Engineer', studentCount: 68, avgFit: 54.1 },
            { role: 'Data & AI Engineer', studentCount: 64, avgFit: 66.5 }
          ]).map((item) => (
            <div
              key={item.role}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{item.role}</h4>
                <div className="text-xs text-slate-500 mb-3">
                  Aspirants: <strong className="text-slate-800">{item.studentCount} students</strong>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Average Role Fit:</span>
                  <span className="font-bold text-[#009669]">{item.avgFit}%</span>
                </div>
                <ProgressBar
                  value={item.avgFit}
                  variant={item.avgFit >= 70 ? 'emerald' : item.avgFit >= 55 ? 'indigo' : 'amber'}
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Institutional Common Gaps & Market Disconnect */}
      <Card className="p-5 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Institutional Common Gaps & Deficit Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Skills with significant deficit across students relative to corporate hiring demand.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(gapsData.gaps || []).map((gap) => (
            <div
              key={gap.skill}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{gap.skill}</span>
                  <Badge variant="rose" size="sm">
                    {gap.percentage}% Cohort Deficit
                  </Badge>
                  <Badge variant="slate" size="sm">
                    Demand: {gap.marketDemand}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Affected Candidates:</span> {gap.affectedStudents} students lack verified evidence or passed benchmarks.
                </p>
                <p className="text-xs text-[#004D36] font-medium">
                  <span className="text-slate-500">Remediation:</span> {gap.recommendedIntervention}
                </p>
              </div>

              <div className="w-full md:w-48 shrink-0">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Deficit Rate</span>
                  <span className="font-bold text-rose-600">{gap.percentage}%</span>
                </div>
                <ProgressBar value={gap.percentage} variant="rose" size="sm" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Department-Wise Proficiency & Gap Matrix */}
      <Card className="p-5 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#009669]" />
              Department-Wise Capability Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Cross-departmental comparison of placement preparedness and primary deficit areas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Cohort Size</th>
                <th className="py-2.5 px-3">Avg Readiness Index</th>
                <th className="py-2.5 px-3">Primary Cohort Strength</th>
                <th className="py-2.5 px-3">Critical Skill Deficit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.map((dept) => (
                <tr key={dept.department} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-bold text-slate-900">{dept.department}</td>
                  <td className="py-3 px-3 text-slate-700">{dept.studentCount} students</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{dept.avgReadiness}%</span>
                      <div className="w-20 hidden sm:block">
                        <ProgressBar
                          value={dept.avgReadiness}
                          variant={dept.avgReadiness >= 75 ? 'emerald' : 'indigo'}
                          size="sm"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {dept.topStrength}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                      {dept.criticalGap}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommended Institutional Training Interventions */}
      <Card className="p-5 border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Prescribed Training Interventions & Workshops
            </h3>
            <p className="text-xs text-slate-500">
              Data-backed intervention initiatives formulated to close verified institutional skill gaps before placement season.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(gapsData.interventions || []).map((interv) => (
            <div
              key={interv.id}
              className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/50 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-slate-900">{interv.title}</h4>
                  <Badge variant="aqua" size="sm">
                    {interv.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{interv.duration}</span>
                  <span>•</span>
                  <span>Target: {interv.targetDepartments.join(', ')}</span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Focus Competencies
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {interv.focusSkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs">
                <span className="text-slate-500">Projected Institutional Impact: </span>
                <strong className="text-emerald-700 font-semibold">{interv.estimatedImpact}</strong>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
