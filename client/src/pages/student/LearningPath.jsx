import React, { useState, useEffect } from 'react';
import {
  Clock,
  ExternalLink,
  FolderGit2,
  RotateCcw,
  CheckCircle2,
  Check,
  ShieldCheck,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import assessmentService from '../../services/assessmentService';

export default function LearningPath() {
  const [learningData, setLearningData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [weaknesses, setWeaknesses] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Evidence Modal State
  const [evidenceModalTask, setEvidenceModalTask] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [evidenceSuccessMsg, setEvidenceSuccessMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [pathData, weaknessData] = await Promise.all([
          assessmentService.getLearningPath(),
          assessmentService.getWeaknessAnalysis()
        ]);
        setLearningData(pathData);
        setTasks(pathData?.tasks || []);
        setWeaknesses(weaknessData);
      } catch (err) {
        console.error('Failed to load learning path:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleToggleStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let nextStatus = 'in_progress';
    if (task.status === 'not_started') nextStatus = 'in_progress';
    else if (task.status === 'in_progress') nextStatus = 'completed';
    else if (task.status === 'completed') nextStatus = 'not_started';

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));

    try {
      await assessmentService.updateTaskStatus(taskId, nextStatus);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleRegeneratePath = async () => {
    try {
      setIsRegenerating(true);
      const updated = await assessmentService.generateLearningPath();
      setLearningData(updated);
      setTasks(updated?.tasks || []);
    } catch (err) {
      console.error('Failed to regenerate path:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const openEvidenceModal = (task) => {
    setEvidenceModalTask(task);
    setRepoUrl(task.evidenceSubmitted?.repoUrl || '');
    setDocUrl(task.evidenceSubmitted?.docUrl || '');
    setNotes(task.evidenceSubmitted?.notes || '');
    setEvidenceSuccessMsg('');
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceModalTask) return;
    try {
      setIsSubmittingEvidence(true);
      await assessmentService.submitTaskEvidence(evidenceModalTask.id, {
        repoUrl,
        docUrl,
        notes
      });

      // Update task in state
      setTasks(prev => prev.map(t => {
        if (t.id === evidenceModalTask.id) {
          return {
            ...t,
            status: 'completed',
            evidenceSubmitted: {
              repoUrl,
              docUrl,
              notes,
              submittedAt: new Date().toISOString()
            }
          };
        }
        return t;
      }));

      setEvidenceSuccessMsg('Evidence submitted successfully! Forwarded for TPO verification.');
      setTimeout(() => {
        setEvidenceModalTask(null);
        setEvidenceSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error('Evidence submission failed:', err);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const categories = ['ALL', ...new Set(tasks.map(t => t.category))];

  const filteredTasks = activeCategory === 'ALL'
    ? tasks
    : tasks.filter(t => t.category === activeCategory);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Curating Personalized Learning Modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Personalized Learning Path & Skill Remediation"
        subtitle="Adaptive micro-tasks curated from your mock drive gap diagnostics to target high-yield interview readiness."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Learning Path' }]}
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRegeneratePath}
              disabled={isRegenerating}
              variant="outline"
              size="sm"
            >
              <RotateCcw className={`h-4 w-4 mr-1.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              {isRegenerating ? 'Refreshing...' : 'Regenerate Path'}
            </Button>
            <Button to="/student/mock-drives/reports" variant="primary" size="sm">
              <BarChart3 className="h-4 w-4 mr-1.5" />
              View Gap Evidence
            </Button>
          </div>
        }
      />

      {/* Diagnosed Weaknesses Alert Bar */}
      {weaknesses && weaknesses.identifiedGaps?.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-amber-950">Active Mock Drive Gap Diagnostics</h4>
                <p className="text-[11px] text-amber-800">
                  {weaknesses.identifiedGaps.length} areas need remediation for <strong>{learningData?.targetRole || 'Full Stack Engineer'}</strong>:
                  {' '}{weaknesses.identifiedGaps.map(g => g.topic).join(' • ')}
                </p>
              </div>
            </div>

            <Badge variant="amber" size="sm">
              Target Readiness: {weaknesses.readinessProjection}%
            </Badge>
          </div>
        </Card>
      )}

      {/* Overall Progress Banner */}
      <Card className="p-6 border-[#02E8A7]/30 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Badge variant="aqua" size="sm">Target: {learningData?.targetRole || 'Full Stack Engineer'}</Badge>
              <span className="text-xs text-slate-500 font-medium">
                {completedCount} of {tasks.length} Modules Verified
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Your Actionable Learning Blueprint</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete each hands-on micro-task and submit your project evidence (GitHub repository or documentation URL) to verify your skills with the Training and Placement Cell.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1.5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Path Completion</span>
              <span className="font-bold text-[#004D36]">{progressPercent}%</span>
            </div>
            <ProgressBar value={progressPercent} color="teal" />
            <div className="text-[10px] text-slate-400 text-right pt-0.5">
              ~{learningData?.estimatedHoursRemaining || 8.5} hours remaining
            </div>
          </div>
        </div>
      </Card>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                activeCategory === cat
                  ? 'bg-[#02E8A7] text-[#002020] font-bold border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'All Modules' : cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">{filteredTasks.length} Tasks Listed</span>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isCompleted = task.status === 'completed';
          const isInProgress = task.status === 'in_progress';
          const hasEvidence = !!task.evidenceSubmitted;

          return (
            <Card
              key={task.id}
              className={`p-5 border transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : isInProgress
                  ? 'border-[#02E8A7]/40 bg-[#BDF9F9]/30/10'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Task Content */}
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={task.priority === 'HIGH' ? 'red' : 'indigo'} size="sm">
                      {task.priority} Priority
                    </Badge>
                    <Badge variant="neutral" size="sm">{task.category}</Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {task.estimatedHours} hrs
                    </span>
                  </div>

                  <h3 className={`text-base font-bold ${isCompleted ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Deliverable: </strong>{task.deliverableDesc}
                  </p>

                  {/* Resource Link */}
                  {task.resourceUrl && (
                    <div className="pt-1">
                      <a
                        href={task.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#009669] hover:text-[#002020] font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {task.resourceTitle}
                      </a>
                    </div>
                  )}

                  {/* Evidence Submitted Badge */}
                  {hasEvidence && (
                    <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>
                        Verified Evidence Linked: <a href={task.evidenceSubmitted.repoUrl} target="_blank" rel="noopener noreferrer" className="underline font-mono">{task.evidenceSubmitted.repoUrl}</a>
                      </span>
                    </div>
                  )}
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    onClick={() => openEvidenceModal(task)}
                    variant={hasEvidence ? 'outline' : 'secondary'}
                    size="sm"
                  >
                    <FolderGit2 className="h-3.5 w-3.5 mr-1" />
                    {hasEvidence ? 'Edit Evidence' : 'Submit Evidence'}
                  </Button>

                  <Button
                    onClick={() => handleToggleStatus(task.id)}
                    variant={isCompleted ? 'outline' : isInProgress ? 'primary' : 'outline'}
                    size="sm"
                  >
                    {isCompleted ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Completed
                      </>
                    ) : isInProgress ? (
                      'In Progress'
                    ) : (
                      'Start Task'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Project Evidence Submission Modal */}
      {evidenceModalTask && (
        <Modal
          isOpen={!!evidenceModalTask}
          onClose={() => setEvidenceModalTask(null)}
          title={`Submit Verification Evidence: ${evidenceModalTask.title}`}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEvidenceModalTask(null)} variant="outline" size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEvidence}
                disabled={isSubmittingEvidence || !repoUrl}
                variant="primary"
                size="sm"
              >
                {isSubmittingEvidence ? 'Submitting...' : 'Confirm Submission'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Provide verifiable links demonstrating completion of this learning task. Evidence will be reviewed by the TPO Cell to update your cohort placement readiness score.
            </p>

            {evidenceSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{evidenceSuccessMsg}</span>
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                GitHub Repository or Pull Request URL <span className="text-red-500">*</span>
              </label>
              <Input
                type="url"
                placeholder="https://github.com/username/project/pull/12"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Architecture Documentation / Live Demo URL (Optional)
              </label>
              <Input
                type="url"
                placeholder="https://username.github.io/project or Notion doc link"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">
                Implementation Notes & Verifiable Commits
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe what was implemented (e.g., added Docker multi-stage build, achieved 82% test coverage)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs text-slate-800 p-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
