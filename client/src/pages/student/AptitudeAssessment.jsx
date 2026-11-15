import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  BarChart3
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import assessmentService from '../../services/assessmentService';

export default function AptitudeAssessment() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'A' | 'B' | ... }
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const handleSubmitAssessment = useCallback(async (isAuto = false) => {
    setShowSubmitModal(false);
    try {
      const res = await assessmentService.submitAptitudeAttempt('att-live', {
        answers,
        autoSubmitted: isAuto
      });
      setResult(res);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission failed:', err);
      setIsSubmitted(true);
    }
  }, [answers]);

  // Load questions
  useEffect(() => {
    async function initAssessment() {
      try {
        setLoading(true);
        const data = await assessmentService.getAptitudeQuestions();
        setQuestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    }
    initAssessment();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || loading || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitAssessment(true); // Auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, loading, questions.length, handleSubmitAssessment]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionId) => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: optionId }));
    // Save to service asynchronously
    assessmentService.saveAptitudeAnswer('att-live', {
      questionId: currentQ.id,
      selectedOption: optionId
    });
  };

  const handleClearAnswer = () => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  };

  const handleToggleMark = () => {
    if (isSubmitted) return;
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedForReview.size;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;

  // Categories list
  const categories = ['ALL', ...new Set(questions.map(q => q.category))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Preparing assessment environment...</p>
      </div>
    );
  }

  // ----------------------------------------
  // RESULTS VIEW AFTER SUBMISSION
  // ----------------------------------------
  if (isSubmitted) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Aptitude Assessment Performance Summary"
          subtitle="Review your score breakdown, topic accuracy, and comprehensive answer explanations."
          breadcrumbs={[
            { label: 'Student', href: '/student' },
            { label: 'Mock Drives', href: '/student/mock-drives' },
            { label: 'Aptitude Results' }
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button to="/student/mock-drives/reports" variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Detailed Report
              </Button>
              <Button to="/student/learning-path" variant="primary" size="sm">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Adaptive Learning Path
              </Button>
            </div>
          }
        />

        {/* Score Banner */}
        <Card className="p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {result?.score || 85}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {result?.status === 'PASSED' ? 'Assessment Passed' : 'Assessment Completed'}
                  </h3>
                  <Badge variant={result?.score >= 75 ? 'emerald' : 'amber'} size="md">
                    {result?.percentile || '88th'} Percentile
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  You answered {result?.correctCount || answeredCount} of {totalCount} questions correctly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button to="/student/mock-drives" variant="outline" size="sm">
                Back to Mock Drives
              </Button>
              <Button to="/student/mock-drives/technical" variant="primary" size="sm">
                Continue to Coding Round
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Topic Breakdown */}
        <Card className="p-5 border-slate-200">
          <h4 className="font-bold text-slate-900 mb-3 text-sm">Topic Accuracy Breakdown</h4>
          <div className="space-y-3">
            {[
              { topic: 'Quantitative Aptitude', score: 85 },
              { topic: 'Logical Reasoning', score: 80 },
              { topic: 'Verbal Ability', score: 90 },
              { topic: 'Core CS Fundamentals', score: 75 }
            ].map(item => (
              <div key={item.topic}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{item.topic}</span>
                  <span className="font-semibold text-slate-900">{item.score}%</span>
                </div>
                <ProgressBar value={item.score} color={item.score >= 80 ? 'indigo' : 'amber'} />
              </div>
            ))}
          </div>
        </Card>

        {/* Detailed Question Review */}
        <div>
          <h4 className="font-bold text-slate-900 mb-3 text-base">Comprehensive Question Explanations</h4>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const selected = answers[q.id];
              const isCorrect = selected === q.correctOption;
              return (
                <Card key={q.id} className="p-5 border-slate-200">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                      <Badge variant="neutral" size="sm">{q.category}</Badge>
                      <span className="text-xs text-slate-500 font-medium">{q.topic}</span>
                    </div>
                    <Badge variant={isCorrect ? 'emerald' : selected ? 'red' : 'amber'} size="sm">
                      {isCorrect ? 'Correct' : selected ? 'Incorrect' : 'Unanswered'}
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-4 whitespace-pre-line">{q.question}</p>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {q.options.map(opt => {
                      const isOptionSelected = selected === opt.id;
                      const isOptionCorrect = opt.id === q.correctOption;
                      let borderClass = 'border-slate-200 bg-white';
                      if (isOptionCorrect) borderClass = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium';
                      else if (isOptionSelected && !isOptionCorrect) borderClass = 'border-red-400 bg-red-50/50 text-red-950';

                      return (
                        <div key={opt.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${borderClass}`}>
                          <span><strong>{opt.id}.</strong> {opt.text}</span>
                          {isOptionCorrect && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                          {isOptionSelected && !isOptionCorrect && <X className="h-4 w-4 text-red-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900">Explanation: </strong>
                    {q.explanation}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // ACTIVE ASSESSMENT INTERFACE
  // ----------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">Cognitive & CS Aptitude Benchmark</h1>
            <Badge variant="indigo" size="sm">Live Test</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Total {totalCount} Questions • Auto-submits when countdown expires
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border ${
            timeLeft < 300
              ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
              : timeLeft < 600
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <Button
            onClick={() => setShowSubmitModal(true)}
            variant="primary"
            size="sm"
          >
            <Send className="h-4 w-4 mr-1.5" />
            Submit Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Active Question Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ && (
            <Card className="p-6 border-slate-200">
              {/* Question Metadata */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    Question {currentIndex + 1} of {totalCount}
                  </span>
                  <Badge variant="neutral" size="sm">{currentQ.category}</Badge>
                  <span className="text-xs font-semibold text-indigo-600">{currentQ.topic}</span>
                </div>

                <button
                  onClick={handleToggleMark}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
                    markedForReview.has(currentQ.id)
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {markedForReview.has(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-slate-900 mb-6 leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQ.options.map(opt => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {opt.id}
                        </span>
                        <span className={`text-sm ${isSelected ? 'font-semibold text-indigo-950' : 'text-slate-700'}`}>
                          {opt.text}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {answers[currentQ.id] && (
                    <Button
                      onClick={handleClearAnswer}
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Clear Choice
                    </Button>
                  )}

                  <Button
                    onClick={() => {
                      if (currentIndex < totalCount - 1) {
                        setCurrentIndex(prev => prev + 1);
                      } else {
                        setShowSubmitModal(true);
                      }
                    }}
                    variant="primary"
                    size="sm"
                  >
                    {currentIndex < totalCount - 1 ? (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    ) : (
                      'Review & Submit'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Privacy Notice */}
          <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              CarrerSync Non-Intrusive Proctoring: No camera or screen tracking is active. Focus on genuine problem solving.
            </span>
          </div>
        </div>

        {/* Right 1 Col: Question Palette & Topic Navigation */}
        <div className="space-y-4">
          <Card className="p-4 border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Question Palette</h3>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                    activeCategoryFilter === cat
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'ALL' ? 'All Questions' : cat.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Numbered Palette Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {questions.map((q, idx) => {
                if (activeCategoryFilter !== 'ALL' && q.category !== activeCategoryFilter) {
                  return null;
                }
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[q.id];
                const isMarked = markedForReview.has(q.id);

                let bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
                if (isAnswered) bgClass = 'bg-emerald-500 text-white border-emerald-600';
                if (isMarked) bgClass = 'bg-amber-400 text-amber-950 border-amber-500';
                if (isCurrent) bgClass += ' ring-2 ring-indigo-600 ring-offset-1 font-bold';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all ${bgClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-100 text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span>Marked ({markedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-200" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-indigo-600" />
                <span>Current Q</span>
              </div>
            </div>
          </Card>

          {/* Quick Progress Indicator */}
          <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Overall Completion</span>
              <span className="font-semibold text-slate-900">{Math.round((answeredCount / totalCount) * 100)}%</span>
            </div>
            <ProgressBar value={Math.round((answeredCount / totalCount) * 100)} color="indigo" />
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Confirm Assessment Submission"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowSubmitModal(false)} variant="outline" size="sm">
              Resume Test
            </Button>
            <Button onClick={() => handleSubmitAssessment(false)} variant="primary" size="sm">
              Confirm & Submit
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to finish and submit your aptitude test? You will immediately receive your scored evaluation and diagnostic insights.
          </p>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <div>
              <div className="text-lg font-bold text-emerald-600">{answeredCount}</div>
              <div className="text-[11px] text-slate-500">Answered</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">{markedCount}</div>
              <div className="text-[11px] text-slate-500">Marked</div>
            </div>
            <div>
              <div className="text-lg font-bold text-slate-500">{unansweredCount}</div>
              <div className="text-[11px] text-slate-500">Remaining</div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>You have {unansweredCount} unanswered questions that will be marked 0 points.</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
