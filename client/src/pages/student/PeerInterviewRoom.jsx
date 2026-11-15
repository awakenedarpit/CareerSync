import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  Code,
  FileText,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Flag,
  ChevronRight,
  ShieldAlert,
  Send,
  Star,
  Sparkles,
  BookOpen,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { peerInterviewService } from '../../services/peerInterviewService';
import { moderationService, MODERATION_REASONS } from '../../services/moderationService';
import { realtimeClient } from '../../services/realtimeClient';

export default function PeerInterviewRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Room State
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('INTERVIEWER'); // 'INTERVIEWER' or 'CANDIDATE'
  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [revealGuide, setRevealGuide] = useState(true);

  // Timer (seconds)
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isTimerRunning] = useState(true);

  // Shared Workspace
  const [sharedNotes, setSharedNotes] = useState('');
  const [notesVersion, setNotesVersion] = useState(1);
  const [activeTab, setActiveTab] = useState('WORKSPACE'); // WORKSPACE, CHAT

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Media (Audio / Video) - Consent Gated
  const [mediaConsentGranted, setMediaConsentGranted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // End / Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [rubricScores, setRubricScores] = useState({
    clarity: 5,
    problemSolving: 5,
    technicalExplanation: 5,
    conceptualUnderstanding: 5,
    answerStructure: 5,
  });
  const [qualitativeStrengths, setQualitativeStrengths] = useState('');
  const [qualitativeImprovements, setQualitativeImprovements] = useState('');
  const [submittingRubric, setSubmittingRubric] = useState(false);
  const [rubricSubmitted, setRubricSubmitted] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState(MODERATION_REASONS[0].id);
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const localVideoRef = useRef(null);

  useEffect(() => {
    loadRoomDetails();

    // Connect to realtime WebSocket
    realtimeClient.joinRoom(roomId, 'PEER_INTERVIEW', {
      id: 'current-user',
      name: 'Priya Sharma (You)',
      role: myRole,
    });

    // Subscriptions
    const unsubChat = realtimeClient.on('chat:message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    const unsubNotes = realtimeClient.on('notes:update', (data) => {
      setSharedNotes(data.content);
      setNotesVersion(data.version);
    });

    const unsubRoleSwitch = realtimeClient.on('interview:role-switch', () => {
      setMyRole((prev) => (prev === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER'));
    });

    return () => {
      unsubChat();
      unsubNotes();
      unsubRoleSwitch();
      realtimeClient.leaveRoom();
    };
  }, [roomId]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  async function loadRoomDetails() {
    try {
      setLoading(true);
      const [roomData, questionsData] = await Promise.all([
        peerInterviewService.getRoom(roomId),
        peerInterviewService.getQuestions(),
      ]);
      setRoom(roomData);
      setQuestions(questionsData);
      if (questionsData && questionsData.length > 0) {
        setActiveQuestion(questionsData[0]);
      }
      setSharedNotes(`// ${roomData?.title || 'Peer Interview Workspace'}\n// Role: ${roomData?.targetRole || 'SDE'}\n\nfunction solveProblem() {\n  // Write candidate code or notes here\n}\n`);
      setTimeLeft((roomData?.durationMinutes || 45) * 60);
    } catch (err) {
      console.error('Failed to load room:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleRoleSwitch() {
    const nextRole = myRole === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER';
    setMyRole(nextRole);
    realtimeClient.switchInterviewRole(nextRole);
  }

  function handleNotesChange(newContent) {
    setSharedNotes(newContent);
    // Debounced sync or send
    realtimeClient.syncNotes(newContent, notesVersion);
  }

  function handleSendChat(e) {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const msg = {
      id: 'msg-' + Date.now(),
      senderName: 'You',
      text: newChatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, msg]);
    realtimeClient.sendChatMessage(newChatMessage);
    setNewChatMessage('');
  }

  async function handleEnableMedia() {
    setShowConsentModal(false);
    setMediaConsentGranted(true);
    const stream = await realtimeClient.enableUserMedia(true, true);
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      setIsMicOn(true);
      setIsCamOn(true);
    }
  }

  function toggleMic() {
    const next = !isMicOn;
    setIsMicOn(next);
    realtimeClient.toggleAudio(next);
  }

  function toggleCam() {
    const next = !isCamOn;
    setIsCamOn(next);
    realtimeClient.toggleVideo(next);
  }

  async function handleSubmitRubric(e) {
    e.preventDefault();
    try {
      setSubmittingRubric(true);
      await peerInterviewService.submitRubricFeedback(roomId, {
        rubricScores,
        qualitativeStrengths,
        qualitativeImprovements,
        evaluatedRole: myRole === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER',
      });
      setRubricSubmitted(true);
      setTimeout(() => {
        navigate('/student/peer-interviews');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit rubric:', err);
    } finally {
      setSubmittingRubric(false);
    }
  }

  async function handleReportParticipant(e) {
    e.preventDefault();
    try {
      setReportSubmitting(true);
      await moderationService.reportParticipant({
        targetUserId: 'peer-user',
        sessionId: roomId,
        sessionType: 'PEER_INTERVIEW',
        reason: reportReason,
        description: reportDescription,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportDescription('');
      }, 1500);
    } catch (err) {
      console.error('Error reporting participant:', err);
    } finally {
      setReportSubmitting(false);
    }
  }

  // Timer format: mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeCritical = timeLeft < 300; // less than 5 min

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-800 -mt-2">
      {/* Room Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
              {room?.title || 'Peer Mock Interview Room'}
            </h1>
          </div>
          <Badge variant={myRole === 'INTERVIEWER' ? 'indigo' : 'purple'} size="xs">
            {myRole === 'INTERVIEWER' ? 'Role: Interviewer' : 'Role: Candidate'}
          </Badge>
          <Badge variant="slate" size="xs">
            {room?.mode === 'STRUCTURED_INTERVIEW' ? 'Mode A: Dual Role' : 'Mode B: Collab'}
          </Badge>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest border ${
              isTimeCritical
                ? 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse'
                : 'bg-slate-800/80 text-emerald-400 border-slate-700'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {room?.mode === 'STRUCTURED_INTERVIEW' && (
            <button
              onClick={handleRoleSwitch}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
              title="Switch roles between Interviewer and Candidate"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Switch Roles</span>
            </button>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
            title="Report conduct violation"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <Button
            variant="danger"
            size="xs"
            className="flex items-center gap-1"
            onClick={() => setShowFeedbackModal(true)}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Finish & Rubric</span>
          </Button>
        </div>
      </div>

      {/* Main Multi-Pane Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Question Bank & Interviewer Rubric Guide */}
        <div className="w-80 border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Approved Questions</span>
            </h2>
            <span className="text-xs text-slate-500">{questions.length} available</span>
          </div>

          {/* Question Selector */}
          <div className="space-y-1.5">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => setActiveQuestion(q)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                  activeQuestion?.id === q.id
                    ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                    : 'border-slate-800/80 bg-slate-900/50 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {q.category}
                  </span>
                  <span className="text-[10px] text-amber-400 font-medium">
                    {q.difficulty}
                  </span>
                </div>
                <div className="truncate font-medium">{q.title}</div>
              </button>
            ))}
          </div>

          {/* Active Question Details */}
          {activeQuestion && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{activeQuestion.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  {activeQuestion.problemStatement}
                </p>
              </div>

              {activeQuestion.expectedConstraints && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Constraints & Assumptions:
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-0.5 list-disc list-inside">
                    {activeQuestion.expectedConstraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interviewer Only Guide (or visible if collaborative mode) */}
              {(myRole === 'INTERVIEWER' || room?.mode === 'COLLABORATIVE_PRACTICE') && (
                <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-400" />
                      Interviewer Evaluation Rubric
                    </span>
                    <button
                      onClick={() => setRevealGuide(!revealGuide)}
                      className="text-slate-400 hover:text-white"
                      title={revealGuide ? 'Hide guide' : 'Show guide'}
                    >
                      {revealGuide ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {revealGuide && (
                    <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                      {activeQuestion.interviewerGuide?.map((point, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Pane: Collaborative Workspace */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          {/* Workspace Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('WORKSPACE')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'WORKSPACE'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5 text-indigo-400" />
                <span>Shared Code & Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('CHAT')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'CHAT'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>Peer Chat ({chatMessages.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Real-time Sync Active (v{notesVersion})</span>
            </div>
          </div>

          {/* Workspace Editor Area */}
          {activeTab === 'WORKSPACE' ? (
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                value={sharedNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="// Type collaborative solutions, function signatures, complexity analysis..."
                className="w-full flex-1 bg-slate-950 font-mono text-xs text-emerald-300 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                spellCheck="false"
              />
            </div>
          ) : (
            /* In-Room Live Chat */
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-12">
                    No messages yet. Use chat to share links, hints, or dry-run tables.
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col text-xs p-2.5 rounded-lg max-w-[85%] ${
                        msg.senderName === 'You'
                          ? 'ml-auto bg-indigo-600/30 border border-indigo-500/40 text-slate-200'
                          : 'mr-auto bg-slate-800 border border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to peer..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <Button type="submit" variant="primary" size="sm">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Right Pane: Media & Presence (Consent Gated) */}
        <div className="w-68 border-l border-slate-800 bg-slate-950/80 flex flex-col p-3 space-y-3 shrink-0">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Session Participants
          </div>

          {/* Local User Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  PS
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Priya Sharma (You)</div>
                  <div className="text-[10px] text-indigo-400 font-semibold">{myRole}</div>
                </div>
              </div>
            </div>

            {/* Video preview / placeholder */}
            <div className="h-28 w-full rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800 overflow-hidden relative">
              {isCamOn ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-500 text-[11px] space-y-1">
                  <VideoOff className="mx-auto h-5 w-5 text-slate-600" />
                  <span>Camera Off</span>
                </div>
              )}
            </div>

            {/* Explicit Consent Controls */}
            {mediaConsentGranted ? (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={toggleMic}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isMicOn ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-rose-950/70 border-rose-800 text-rose-400'
                  }`}
                  title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={toggleCam}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isCamOn ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-rose-950/70 border-rose-800 text-rose-400'
                  }`}
                  title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {isCamOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="xs"
                className="w-full text-xs text-indigo-300 border-indigo-800 hover:bg-indigo-950/40"
                onClick={() => setShowConsentModal(true)}
              >
                Enable Camera / Mic
              </Button>
            )}
          </div>

          {/* Remote Peer Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  AV
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{room?.hostName || 'Practice Peer'}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">
                    {myRole === 'INTERVIEWER' ? 'CANDIDATE' : 'INTERVIEWER'}
                  </div>
                </div>
              </div>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <div className="h-28 w-full rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800">
              <div className="text-center text-slate-500 text-[11px] space-y-1">
                <Users className="mx-auto h-5 w-5 text-slate-600" />
                <span>Text / Notes Primary Mode</span>
              </div>
            </div>
          </div>

          {/* Safety & Fallback Notice */}
          <div className="mt-auto text-[10px] text-slate-500 leading-relaxed p-2 rounded-lg bg-slate-950 border border-slate-800">
            <strong>Privacy Note:</strong> Media never streams without explicit user activation. Text notes and code sync are always fully functional.
          </div>
        </div>
      </div>

      {/* Explicit Media Consent Modal */}
      {showConsentModal && (
        <Modal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          title="Enable Camera & Microphone"
          size="sm"
        >
          <div className="space-y-3 text-slate-700">
            <p className="text-xs leading-relaxed">
              CarrerSync adheres to strict user privacy standards. Camera and microphone access is <strong>optional</strong> and requires your explicit consent.
            </p>
            <p className="text-xs leading-relaxed text-slate-500">
              Your audio/video stream will be transmitted directly P2P to your peer for the duration of this mock interview and is never recorded or stored on central servers.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setShowConsentModal(false)}>
                Keep Audio/Video Off
              </Button>
              <Button variant="primary" size="sm" onClick={handleEnableMedia}>
                Grant Consent & Turn On
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Constructive Structured Rubric Modal */}
      {showFeedbackModal && (
        <Modal
          isOpen={showFeedbackModal}
          onClose={() => {
            if (!submittingRubric) setShowFeedbackModal(false);
          }}
          title="Structured Constructive Feedback Rubric"
          size="lg"
        >
          {rubricSubmitted ? (
            <div className="py-8 text-center space-y-3 text-slate-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Peer Rubric Submitted Successfully</h3>
              <p className="text-xs text-slate-500">
                Thank you for contributing to your peer's placement preparation journey.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRubric} className="space-y-4 text-slate-700">
              <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100 text-xs text-indigo-900">
                <strong>Peer-Provided Assessment:</strong> Evaluate your peer objectively across the 5 core interview dimensions.
              </div>

              {/* 5 Rubric Criteria */}
              <div className="space-y-3">
                {[
                  { key: 'clarity', label: '1. Communication & Clarity', desc: 'Articulation, active listening, asking clarifying questions' },
                  { key: 'problemSolving', label: '2. Problem-Solving Approach', desc: 'Exploration of trade-offs, structured thinking, edge case consideration' },
                  { key: 'technicalExplanation', label: '3. Technical Depth & Code Quality', desc: 'Accurate implementation, language idiom proficiency, time & space bounds' },
                  { key: 'conceptualUnderstanding', label: '4. Conceptual Core Understanding', desc: 'Underlying data structures, invariant preservation, OS/Network fundamentals' },
                  { key: 'answerStructure', label: '5. Answer Structure & Pacing', desc: 'STAR technique execution, whiteboard neatness, time management' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="space-y-0.5 max-w-sm">
                      <div className="text-xs font-bold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => setRubricScores((prev) => ({ ...prev, [item.key]: val }))}
                          className={`h-7 w-7 rounded text-xs font-bold transition-colors ${
                            rubricScores[item.key] === val
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Strengths Observed <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What did the peer execute exceptionally well during the interview?"
                  value={qualitativeStrengths}
                  onChange={(e) => setQualitativeStrengths(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Constructive Improvement Recommendations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Specific actionable areas to practice before real company placement drives..."
                  value={qualitativeImprovements}
                  onChange={(e) => setQualitativeImprovements(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowFeedbackModal(false)}
                  disabled={submittingRubric}
                >
                  Resume Session
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submittingRubric}
                >
                  {submittingRubric ? 'Submitting...' : 'Submit Rubric & Exit'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Participant Report Modal */}
      {showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => {
            if (!reportSubmitting) setShowReportModal(false);
          }}
          title="Report Session Participant"
          size="md"
        >
          {reportSuccess ? (
            <div className="py-6 text-center space-y-2 text-slate-700">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Report Submitted to TPO Cell</h4>
              <p className="text-xs text-slate-500">
                Your report has been queued for institutional review. Thank you for keeping the CarrerSync community safe.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReportParticipant} className="space-y-4 text-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Violation Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {MODERATION_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Details & Evidence <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the specific behavior, inappropriate language, or academic dishonesty observed..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportModal(false)}
                  disabled={reportSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
