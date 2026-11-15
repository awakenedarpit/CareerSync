import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  FolderGit2,
  Target,
  Star,
  XCircle,
  BookOpen,
  Info,
  ShieldAlert,
  ChevronRight,
  Award
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import StatCard from '../../components/ui/StatCard';
import industryService from '../../services/industryService';

export default function CareerRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await industryService.getCareerRecommendations();
      setRecommendations(data || []);
    } catch (err) {
      console.error('Failed to load career recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const data = await industryService.generateCareerRecommendations();
      setRecommendations(data || []);
      setActionMessage('Career recommendations recalculated successfully.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to generate career recommendations:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSetPrimary = async (recId) => {
    try {
      await industryService.updateCareerRecommendation(recId, { isPrimary: true });
      setRecommendations((prev) =>
        prev.map((r) => ({
          ...r,
          isPrimary: r.id === recId
        }))
      );
      setActionMessage('Primary target role updated successfully.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to set primary role:', err);
    }
  };

  const handleDismiss = async (recId) => {
    try {
      await industryService.updateCareerRecommendation(recId, { status: 'DISMISSED' });
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
      setActionMessage('Recommendation dismissed.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  const getFitBadge = (fitLevel) => {
    switch (fitLevel) {
      case 'STRONG_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Strong Match (80%+)
          </span>
        );
      case 'GOOD_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <Award className="h-3.5 w-3.5" />
            Good Match (65-79%)
          </span>
        );
      case 'POTENTIAL_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Target className="h-3.5 w-3.5" />
            Potential Match (50-64%)
          </span>
        );
      case 'DEVELOPING_MATCH':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Developing (&lt;50%)
          </span>
        );
    }
  };

  const hasInsufficientData = recommendations.length === 0 && !loading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career Role Recommendations & Trajectory Mapping"
        subtitle="Explainable algorithmic career matchmaking synthesizing your verified capabilities, mock assessment evaluations, and live campus hiring demands."
        breadcrumbs={[
          { label: 'Student', href: '/student' },
          { label: 'Career Recommendations' }
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={generating || loading}
            >
              <RotateCw className={`h-4 w-4 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
              Recalculate Career Fit
            </Button>
          </div>
        }
      />

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      {/* Insufficient Data Guard / Empty State */}
      {hasInsufficientData ? (
        <Card className="p-8 text-center border-amber-200 bg-amber-50/30">
          <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Insufficient Evidence for Confident Career Recommendation
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mb-5 leading-relaxed">
            The career engine requires at least one verified project evidence submission or completed Phase 12 mock assessment attempt to synthesize explainable recommendations without fabricating claims.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button to="/student/skills" variant="outline" size="sm">
              Submit Skills Evidence
            </Button>
            <Button to="/student/mock-drives" variant="primary" size="sm">
              Take Mock Drive Assessment
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className={`p-6 border transition-all ${
                rec.isPrimary
                  ? 'border-indigo-300 ring-2 ring-indigo-500/10 bg-gradient-to-r from-indigo-50/30 via-white to-white'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-lg font-black text-slate-900">{rec.roleTitle}</h3>
                    {rec.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                        <Star className="h-3 w-3 fill-current" />
                        Primary Target Role
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    <strong className="text-slate-800">Match Rationale: </strong>
                    {rec.rationale}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {getFitBadge(rec.fitLevel)}
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">{rec.fitScore}%</span>
                    <span className="text-xs text-slate-400 block">Match Score</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <ProgressBar
                  value={rec.fitScore}
                  variant={rec.fitScore >= 80 ? 'emerald' : rec.fitScore >= 65 ? 'indigo' : 'amber'}
                  size="md"
                />
              </div>

              {/* Strengths & Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                {/* Strengths */}
                <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verified Strengths Alignment
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(rec.strengths || []).map((str) => (
                      <span
                        key={str}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-emerald-800 border border-emerald-200"
                      >
                        {str}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gaps to close */}
                <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Key Competencies to Acquire
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(rec.gapsToClose || []).map((gap) => (
                      <span
                        key={gap}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-white text-amber-800 border border-amber-200"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggested Portfolio Projects */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 mb-5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  <FolderGit2 className="h-4 w-4 text-indigo-600" />
                  Prescribed Portfolio Projects to Unlock Tier-1 Placement
                </div>
                <ul className="space-y-1.5">
                  {(rec.suggestedProjects || []).map((proj, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <ChevronRight className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      <span>{proj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  {!rec.isPrimary ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(rec.id)}
                    >
                      <Star className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      Set as Primary Target Role
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Active Goal Selection
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(rec.id)}
                    className="text-slate-500 hover:text-rose-600"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Dismiss
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    to={`/student/skill-gap?role=${encodeURIComponent(rec.roleId || 'role-fullstack')}`}
                  >
                    View Role Skill-Gap
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    to="/student/learning-path"
                  >
                    Launch Roadmap
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
