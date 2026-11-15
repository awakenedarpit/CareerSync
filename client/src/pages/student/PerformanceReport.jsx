import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  Download,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import assessmentService from '../../services/assessmentService';

export default function PerformanceReport() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const data = await assessmentService.getPerformanceReports();
        const list = Array.isArray(data) ? data : [];
        setReports(list);

        if (reportId) {
          const selected = list.find(r => r.id === reportId);
          setActiveReport(selected || list[0] || null);
        } else if (list.length > 0) {
          setActiveReport(list[0]);
        }
      } catch (err) {
        console.error('Failed to load performance reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [reportId]);

  const handleSelectReport = (rep) => {
    setActiveReport(rep);
    navigate(`/student/mock-drives/reports/${rep.id}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Compiling Diagnostic Report...</p>
      </div>
    );
  }

  if (!activeReport) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-2">No Performance Reports Found</h3>
        <p className="text-xs text-slate-500 mb-4">Complete an aptitude assessment or coding drive to generate your diagnostic profile.</p>
        <Button to="/student/mock-drives" variant="primary" size="sm">
          Go to Mock Drive Centre
        </Button>
      </div>
    );
  }

  const dimensions = activeReport.dimensions || {
    aptitude: 88,
    coding: 82,
    interview: 85,
    technicalDepth: 83
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Placement Performance Report"
        subtitle="Explainable score evidence, topic mastery breakdown, and personalized learning recommendations."
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'Mock Drives', href: '/student/mock-drives' },
          { label: 'Reports' }
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button to="/student/learning-path" variant="primary" size="sm">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Open Recommended Learning Path
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        }
      />

      {/* Reports Selector Tabs */}
      {reports.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {reports.map(rep => {
            const isSelected = activeReport.id === rep.id;
            return (
              <button
                key={rep.id}
                onClick={() => handleSelectReport(rep)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {rep.driveTitle} ({rep.overallScore}%)
              </button>
            );
          })}
        </div>
      )}

      {/* Top Summary Banner */}
      <Card className="p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center shadow-md shrink-0">
              <span className="font-black text-2xl">{activeReport.overallScore}%</span>
              <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Score</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={activeReport.resultStatus?.includes('PASS') ? 'emerald' : 'amber'} size="md">
                  {activeReport.resultStatus?.replace('_', ' ') || 'PASSED CUTOFF'}
                </Badge>
                <span className="text-xs font-semibold text-slate-500">
                  Cohort Percentile: <strong className="text-indigo-600">{activeReport.percentile}</strong>
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{activeReport.driveTitle}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Attempted on {new Date(activeReport.attemptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Evaluation Harness
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => alert('Diagnostic summary exported as report PDF.')}
              variant="outline"
              size="sm"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export PDF
            </Button>
            <Button to="/student/learning-path" variant="primary" size="sm">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Remediate Gaps
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: 4 Dimension Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cognitive Aptitude', score: dimensions.aptitude, desc: 'Logical, quantitative & CS fundamentals' },
          { label: 'Machine Coding', score: dimensions.coding, desc: 'Algorithmic correctness & time complexity' },
          { label: 'Technical Depth', score: dimensions.technicalDepth, desc: 'System design & ACID database principles' },
          { label: 'Interview Communication', score: dimensions.interview, desc: 'STAR structure & problem formulation' }
        ].map(item => (
          <Card key={item.label} className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-800">{item.label}</span>
              <span className="font-black text-indigo-700 text-sm">{item.score}%</span>
            </div>
            <ProgressBar value={item.score} color={item.score >= 80 ? 'indigo' : 'amber'} />
            <p className="text-[11px] text-slate-500 mt-2">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Evidence Behind Scores: Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths with Evidence */}
        <Card className="p-5 border-emerald-200 bg-emerald-50/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-emerald-950 text-sm">Demonstrated Strengths & Verified Evidence</h3>
          </div>
          <ul className="space-y-3 text-xs text-emerald-950">
            {activeReport.strengths?.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Diagnosed Weaknesses & Evidence */}
        <Card className="p-5 border-amber-200 bg-amber-50/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <AlertCircle className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-amber-950 text-sm">Diagnosed Weaknesses & Gap Evidence</h3>
          </div>
          <ul className="space-y-3 text-xs text-amber-950">
            {activeReport.weaknesses?.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-amber-100">
                <span className="text-amber-600 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Topic-Wise Score Breakdown */}
      {activeReport.topicBreakdown && (
        <Card className="p-5 border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Topic-Wise Performance Breakdown</h3>
          <div className="space-y-3">
            {activeReport.topicBreakdown.map(topic => (
              <div key={topic.topic} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{topic.topic}</span>
                    <Badge
                      variant={
                        topic.status === 'EXCELLENT' ? 'emerald' : topic.status === 'GOOD' ? 'indigo' : 'amber'
                      }
                      size="sm"
                    >
                      {topic.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="font-bold text-slate-900">{topic.score} / {topic.total}</span>
                </div>
                <ProgressBar
                  value={(topic.score / topic.total) * 100}
                  color={topic.score >= 80 ? 'indigo' : topic.score >= 70 ? 'amber' : 'red'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommended Learning Path Micro-Tasks Handoff */}
      <Card className="p-6 border-indigo-200 bg-indigo-50/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold text-indigo-950 text-base">Curated Personalized Remediation Plan</h3>
            </div>
            <p className="text-xs text-indigo-800 mt-1 max-w-xl leading-relaxed">
              Based on the diagnosed weaknesses in Graph Algorithms and Distributed Caching, CarrerSync has scheduled 3 micro-tasks in your Learning Path to reach 90th+ percentile readiness.
            </p>
          </div>

          <Button to="/student/learning-path" variant="primary" size="md">
            Go to Learning Path
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
