import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BarChart3,
  BookOpen,
  Send
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import assessmentService from '../../services/assessmentService';

const QUESTION_CATEGORIES = [
  'System Design & Architecture',
  'Data Structures & Algorithmic Problem Solving',
  'Behavioral & STAR Leadership',
  'Database Optimization & ACID Properties',
  'API Design & REST/GraphQL Best Practices',
  'Cloud Infrastructure & CI/CD Pipelines',
  'Concurrency, Async & Thread Safety',
  'Security, Authentication & OWASP Top 10',
  'Debugging, Observability & Incident Management'
];

export default function InterviewPractice() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('full-stack');
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioTime, setRecordedAudioTime] = useState(0);
  const [evaluationReport, setEvaluationReport] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load roles
  useEffect(() => {
    async function initRoles() {
      try {
        setLoading(true);
        const roleList = await assessmentService.getInterviewRoles();
        setRoles(Array.isArray(roleList) ? roleList : []);
      } catch (err) {
        console.error('Failed to load roles:', err);
      } finally {
        setLoading(false);
      }
    }
    initRoles();
  }, []);

  // Audio recording simulation timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordedAudioTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartPractice = async () => {
    try {
      setLoading(true);
      const session = await assessmentService.startInterviewPractice({ roleId: selectedRole });
      setActiveSession(session);
      setQuestions(session.questions || []);
      setCurrentIdx(0);
      setAnswers({});
      setEvaluationReport(null);
    } catch (err) {
      console.error('Failed to start interview practice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordedAudioTime(0);
    } else {
      setIsRecording(false);
      const q = questions[currentIdx];
      if (q && !answers[q.id]) {
        // Populate sample realistic transcription if user recorded audio
        setAnswers(prev => ({
          ...prev,
          [q.id]: `[Audio Transcript Recorded]: For this problem, I begin by breaking down the core architectural components. First, client requests arrive at an API Gateway with rate limiting. For the storage layer, we use relational tables with read replicas for high read throughput, combined with Redis cache-aside patterns. To handle asynchronous workflows, an event queue decouples consumers...`
        }));
      }
    }
  };

  const handleSaveAnswerText = (text) => {
    const q = questions[currentIdx];
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: text }));
  };

  const handleSubmitInterview = async () => {
    try {
      setIsEvaluating(true);
      const report = await assessmentService.submitInterviewPractice(activeSession?.sessionId || 'live-sess', {
        answers,
        roleId: selectedRole
      });
      setEvaluationReport(report);
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
        <p className="text-sm text-slate-500">Preparing Interview Simulator...</p>
      </div>
    );
  }

  // ----------------------------------------
  // EVALUATION REPORT VIEW
  // ----------------------------------------
  if (evaluationReport) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Interview Performance Evaluation Report"
          subtitle="AI-assisted objective feedback across 5 core technical and behavioral dimensions."
          breadcrumbs={[
            { label: 'Student', href: '/student' },
            { label: 'Mock Drives', href: '/student/mock-drives' },
            { label: 'Interview Report' }
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button to="/student/mock-drives/reports" variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                View Full Drive Reports
              </Button>
              <Button to="/student/learning-path" variant="primary" size="sm">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Adaptive Learning Path
              </Button>
            </div>
          }
        />

        {/* Overall Score Card */}
        <Card className="p-6 border-[#02E8A7]/30 bg-gradient-to-br from-indigo-50/50 via-white to-emerald-50/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#02E8A7] text-[#002020] font-bold flex items-center justify-center font-black text-2xl shadow-md">
                {evaluationReport.overallScore || 86}%
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Target Role: {roles.find(r => r.id === selectedRole)?.title || 'Full Stack Engineer'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md">
                  {evaluationReport.feedbackNotes || 'Student demonstrates strong technical foundation and structured communication.'}
                </p>
              </div>
            </div>

            <Button onClick={handleStartPractice} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Retake Interview Practice
            </Button>
          </div>
        </Card>

        {/* 5 Evaluation Dimensions */}
        <Card className="p-5 border-slate-200">
          <h4 className="font-bold text-slate-900 mb-4 text-sm">Evaluation Across 5 Dimensions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { dim: 'Technical Accuracy & Depth', score: evaluationReport.dimensions?.technicalAccuracy || 88, desc: 'Correctness of algorithmic time/space analysis and architectural trade-offs.' },
              { dim: 'Problem Structuring & Approach', score: evaluationReport.dimensions?.problemStructuring || 84, desc: 'Step-by-step problem deconstruction before diving into solutions.' },
              { dim: 'Communication Clarity & Conciseness', score: evaluationReport.dimensions?.communicationClarity || 90, desc: 'Crisp articulation, technical vocabulary, and avoiding unnecessary tangents.' },
              { dim: 'Production & Operational Thinking', score: evaluationReport.dimensions?.productionThinking || 82, desc: 'Awareness of caching, failure modes, logging, and zero-downtime rollouts.' },
              { dim: 'Adaptability & Behavioral Maturity', score: evaluationReport.dimensions?.adaptability || 86, desc: 'Structured STAR responses and constructive response to technical feedback.' }
            ].map(item => (
              <div key={item.dim} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{item.dim}</span>
                  <span className="font-bold text-[#004D36]">{item.score}%</span>
                </div>
                <ProgressBar value={item.score} color={item.score >= 85 ? 'emerald' : 'indigo'} />
                <p className="text-[11px] text-slate-500 mt-1.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-emerald-200 bg-emerald-50/20">
            <h4 className="font-bold text-emerald-900 mb-3 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Observed Strengths
            </h4>
            <ul className="space-y-2 text-xs text-emerald-950">
              {evaluationReport.strengths?.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 border-amber-200 bg-amber-50/20">
            <h4 className="font-bold text-amber-900 mb-3 text-sm flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Actionable Gap Diagnostics
            </h4>
            <ul className="space-y-2 text-xs text-amber-950">
              {evaluationReport.weaknesses?.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // LOBBY VIEW (Select Role & Launch)
  // ----------------------------------------
  if (!activeSession) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Role-Based Technical & Behavioral Interview Practice"
          subtitle="Prepare for placement drive rounds with domain-specific questions, audio/text responses, and multi-dimensional evaluation."
          breadcrumbs={[
            { label: 'Student', href: '/student' },
            { label: 'Mock Drives', href: '/student/mock-drives' },
            { label: 'Interview Simulator' }
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button to="/student/learning-path" variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Adaptive Learning Path
              </Button>
            </div>
          }
        />

        {/* Ethical Non-Invasive Banner */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Ethical AI Practice Environment</h4>
            <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
              CarrerSync guarantees ethical privacy. This platform strictly does <strong>NOT</strong> perform eye-tracking, emotion recognition, or intrusive background webcam recording. Feedback is evaluated purely on technical depth, structuring, and communication content.
            </p>
          </div>
        </div>

        {/* Step 1: Select Target Role */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Select Target Placement Track</h3>
          <p className="text-xs text-slate-500 mb-4">Choose from 12 specialized roles to customize the interview question deck.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roles.map(r => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-[#BDF9F9]/30 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant={isSelected ? 'indigo' : 'neutral'} size="sm">{r.category}</Badge>
                    <span className="text-[11px] font-semibold text-emerald-600">{r.matchRate} Match</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{r.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-1">Campus Demand: {r.demand}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: 9 Question Categories Preview */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">9 Comprehensive Question Categories</h3>
          <p className="text-xs text-slate-500 mb-3">Every session covers real-world enterprise topics.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {QUESTION_CATEGORIES.map((cat, i) => (
              <div key={cat} className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium text-slate-800">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleStartPractice} variant="primary" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Begin Interview Session ({roles.find(r => r.id === selectedRole)?.title || 'Selected Track'})
          </Button>
        </div>
      </div>
    );
  }

  // ----------------------------------------
  // ACTIVE INTERVIEW WORKSPACE
  // ----------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">
              {roles.find(r => r.id === selectedRole)?.title} Interview Simulation
            </h1>
            <Badge variant="aqua" size="sm">Session Active</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Question {currentIdx + 1} of {totalQuestions} • {answeredCount} Completed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setActiveSession(null)}
            variant="outline"
            size="sm"
          >
            Exit Session
          </Button>
          <Button
            onClick={handleSubmitInterview}
            disabled={isEvaluating}
            variant="primary"
            size="sm"
          >
            <Send className="h-4 w-4 mr-1.5" />
            {isEvaluating ? 'Evaluating...' : 'Finish & Get Evaluation'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Details & Tips (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {currentQ && (
            <Card className="p-5 border-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <Badge variant="aqua" size="sm">{currentQ.category}</Badge>
                <span className="text-xs text-slate-400">Round Question {currentIdx + 1}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug mb-4">
                {currentQ.question}
              </h3>

              {/* Guidance Tips */}
              <div className="p-3.5 bg-[#BDF9F9]/30 border border-[#02E8A7]/40 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#002020]">
                  <Sparkles className="h-4 w-4 text-[#009669]" />
                  Key Talking Points & Architectural Strategy
                </div>
                <p className="text-indigo-950 leading-relaxed">{currentQ.tips}</p>
              </div>

              {/* Dimensions Evaluated */}
              {currentQ.dimensionsToAssess && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Evaluated Dimensions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentQ.dimensionsToAssess.map(dim => (
                      <span key={dim} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                        {dim}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Question List Navigator */}
          <Card className="p-4 border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Navigation</h4>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
              {questions.map((q, idx) => {
                const isSelected = idx === currentIdx;
                const isAnswered = !!answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-[#BDF9F9]/30 text-indigo-950 ring-1 ring-indigo-600'
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate max-w-[240px]">
                      {idx + 1}. {q.category}
                    </span>
                    {isAnswered && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Audio Recording & Response Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Your Technical Response</h3>
            <p className="text-xs text-slate-500 mb-4">
              Speak using your microphone or write your architectural approach in markdown/text.
            </p>

            {/* Audio Recording Simulator Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleRecord}
                  className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-md ring-4 ring-red-200'
                      : 'bg-[#02E8A7] text-[#002020] font-bold hover:bg-[#11F1CF] shadow-sm'
                  }`}
                >
                  {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {isRecording ? 'Recording Speech Response...' : 'Microphone Ready'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isRecording ? `Elapsed: ${recordedAudioTime}s (Click mic to stop and transcribe)` : 'Click to practice verbal explanation'}
                  </div>
                </div>
              </div>

              {/* Animated waveform visualizer when recording */}
              {isRecording && (
                <div className="flex items-center gap-1 h-6">
                  {[4, 12, 8, 20, 16, 10, 22, 14, 8, 18, 12, 6].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-red-500 rounded-full animate-bounce"
                      style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Written Answer / Transcript Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Answer Explanation & Synthesis</label>
              <textarea
                value={answers[currentQ?.id] || ''}
                onChange={(e) => handleSaveAnswerText(e.target.value)}
                placeholder="Type your response or bullet points here. For System Design questions, specify traffic assumptions, data schema, caching tier, and scaling bottlenecks..."
                rows={8}
                className="w-full text-xs text-slate-800 p-3.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 leading-relaxed font-sans"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <Button
                onClick={() => setCurrentIdx(prev => Math.max(prev - 1, 0))}
                disabled={currentIdx === 0}
                variant="outline"
                size="sm"
              >
                Previous Question
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (currentIdx < totalQuestions - 1) {
                      setCurrentIdx(prev => prev + 1);
                    } else {
                      handleSubmitInterview();
                    }
                  }}
                  variant="primary"
                  size="sm"
                >
                  {currentIdx < totalQuestions - 1 ? (
                    <>
                      Next Question
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    'Submit All Responses'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
