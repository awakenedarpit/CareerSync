import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  CheckSquare,
  HelpCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Send,
  Plus,
  Trash2,
  ThumbsUp,
  LogOut,
  Flag,
  Copy,
  Check,
  Shield,
  Code,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { collaborationService } from '../../services/collaborationService';
import { moderationService, MODERATION_REASONS } from '../../services/moderationService';
import { realtimeClient } from '../../services/realtimeClient';

export default function CollaborationRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Room State
  const [room, setRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('NOTES'); // NOTES, CHAT, TASKS, DOUBTS

  // Shared Notes with Conflict Protection
  const [notesContent, setNotesContent] = useState('');
  const [notesVersion, setNotesVersion] = useState(1);
  const [lastModifiedBy, setLastModifiedBy] = useState('');
  const [hasConflict, setHasConflict] = useState(false);

  // Group Chat
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [codeSnippetInput, setCodeSnippetInput] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Task Checklist
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Questions / Doubts Board
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');

  // Participants & Presence
  const [participants, setParticipants] = useState([]);

  // Media (Consent Gated)
  const [mediaConsentGranted, setMediaConsentGranted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const localVideoRef = useRef(null);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState(MODERATION_REASONS[0].id);
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadRoom();

    // Connect to WebSocket realtime room
    realtimeClient.joinRoom(roomId, 'COLLABORATION', {
      id: 'user-curr',
      name: 'Priya Sharma (You)',
      role: 'Participant',
    });

    const unsubChat = realtimeClient.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    const unsubNotes = realtimeClient.on('notes:update', (data) => {
      setNotesContent(data.content);
      setNotesVersion(data.version);
      setLastModifiedBy(data.lastModifiedBy || 'Peer');
    });

    const unsubTask = realtimeClient.on('task:update', (data) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === data.taskId ? { ...t, ...data.updates } : t))
      );
    });

    return () => {
      unsubChat();
      unsubNotes();
      unsubTask();
      realtimeClient.leaveRoom();
    };
  }, [roomId]);

  async function loadRoom() {
    try {
      const roomData = await collaborationService.getStudyRoom(roomId);
      setRoom(roomData);
      setNotesContent(roomData?.sharedNotes?.content || '');
      setNotesVersion(roomData?.sharedNotes?.version || 1);
      setLastModifiedBy(roomData?.sharedNotes?.lastModifiedBy || 'Host');
      setTasks(roomData?.tasks || []);
      setQuestions(roomData?.questions || []);
      setMessages(roomData?.messages || []);
      setParticipants(roomData?.participants || []);
    } catch (err) {
      console.error('Failed to load study room details:', err);
    }
  }

  // Handle Notes Local Change and Conflict Safeguard
  async function handleNotesChange(e) {
    const newContent = e.target.value;
    setNotesContent(newContent);
    try {
      realtimeClient.syncNotes(newContent, notesVersion);
    } catch (err) {
      setHasConflict(true);
    }
  }

  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() && !codeSnippetInput.trim()) return;

    const payload = {
      id: 'msg-' + Date.now(),
      senderName: 'Priya Sharma (You)',
      text: chatInput,
      codeSnippet: codeSnippetInput || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, payload]);
    realtimeClient.sendChatMessage(chatInput, codeSnippetInput || null);
    setChatInput('');
    setCodeSnippetInput('');
    setShowCodeInput(false);
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: 'task-' + Date.now(),
      title: newTaskTitle,
      completed: false,
      assignedTo: 'Priya Sharma',
    };
    setTasks((prev) => [...prev, newTask]);
    await collaborationService.createTask(roomId, newTask);
    setNewTaskTitle('');
  }

  async function handleToggleTask(taskId, currentStatus) {
    const updatedStatus = !currentStatus;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: updatedStatus } : t))
    );
    await collaborationService.updateTask(roomId, taskId, { completed: updatedStatus });
    realtimeClient.syncTaskUpdate(taskId, { completed: updatedStatus });
  }

  async function handleDeleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await collaborationService.deleteTask(roomId, taskId);
  }

  async function handlePostQuestion(e) {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQ = {
      id: 'q-' + Date.now(),
      text: newQuestionText,
      author: 'Priya Sharma',
      upvotes: 1,
      resolved: false,
    };
    setQuestions((prev) => [...prev, newQ]);
    await collaborationService.postQuestion(roomId, newQuestionText);
    setNewQuestionText('');
  }

  async function handleUpvoteQuestion(questionId) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
    await collaborationService.upvoteQuestion(roomId, questionId);
  }

  async function handleEnableMedia() {
    setShowConsentModal(false);
    setMediaConsentGranted(true);
    const stream = await realtimeClient.enableUserMedia(true, false);
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    setIsMicOn(true);
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

  function handleCopyInvite() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleReportParticipant(e) {
    e.preventDefault();
    try {
      setReportSubmitting(true);
      await moderationService.reportParticipant({
        targetUserId: 'room-participant',
        sessionId: roomId,
        sessionType: 'COLLABORATION_ROOM',
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
      console.error('Failed to report participant:', err);
    } finally {
      setReportSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 -mt-2">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
              {room?.title || 'Collaborative Study Room'}
            </h1>
          </div>
          <Badge variant="indigo" size="xs">
            {room?.category || 'DSA'}
          </Badge>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite'}</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Report participant conduct violation"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <Button
            variant="danger"
            size="xs"
            className="flex items-center gap-1"
            onClick={() => navigate('/student/collaboration')}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave Room</span>
          </Button>
        </div>
      </div>

      {/* Main Multi-Pane Collaborative Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left / Center Work Area */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 shrink-0">
            <div className="flex items-center gap-2">
              {[
                { id: 'NOTES', label: 'Shared Notes', icon: FileText, color: 'text-indigo-600' },
                { id: 'CHAT', label: `Group Chat (${messages.length})`, icon: MessageSquare, color: 'text-blue-600' },
                { id: 'TASKS', label: `Checklist (${tasks.filter(t => t.completed).length}/${tasks.length})`, icon: CheckSquare, color: 'text-emerald-600' },
                { id: 'DOUBTS', label: `Question Board (${questions.length})`, icon: HelpCircle, color: 'text-amber-600' },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 hidden sm:flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Notes synced • v{notesVersion}</span>
            </div>
          </div>

          {/* Conflict Safeguard Notification */}
          {hasConflict && (
            <div className="bg-amber-50 border-b border-amber-200 p-2.5 px-4 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  Another participant modified the shared notes simultaneously. Reloading ensures no changes are lost.
                </span>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setHasConflict(false);
                  loadRoom();
                }}
              >
                Reload Latest Notes
              </Button>
            </div>
          )}

          {/* TAB 1: Shared Notes Editor */}
          {activeTab === 'NOTES' && (
            <div className="flex-1 flex flex-col p-4 bg-slate-50/50 overflow-hidden">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Markdown & code blocks supported</span>
                {lastModifiedBy && (
                  <span>Last edited by <strong className="text-slate-700">{lastModifiedBy}</strong></span>
                )}
              </div>
              <textarea
                value={notesContent}
                onChange={handleNotesChange}
                placeholder="# Collaborative Study Session Notes&#10;&#10;Write shared code, formulas, discussion points, or paste solutions here..."
                className="w-full flex-1 p-4 font-mono text-xs text-slate-800 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 shadow-2xs resize-none leading-relaxed"
                spellCheck="false"
              />
            </div>
          )}

          {/* TAB 2: Live Group Chat */}
          {activeTab === 'CHAT' && (
            <div className="flex-1 flex flex-col bg-slate-50/40 overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-16">
                    No messages in room yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderName?.includes('You') || m.senderName === 'Priya Sharma (You)';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col text-xs max-w-[80%] ${
                          isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-600">{m.senderName}</span>
                          <span>{m.timestamp}</span>
                        </div>
                        <div
                          className={`p-3 rounded-xl shadow-2xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <div className="leading-relaxed">{m.text}</div>
                          {m.codeSnippet && (
                            <pre
                              className={`mt-2 p-2 rounded-lg font-mono text-[11px] overflow-x-auto ${
                                isMe ? 'bg-indigo-950/60 text-emerald-300' : 'bg-slate-900 text-emerald-400'
                              }`}
                            >
                              <code>{m.codeSnippet}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white">
                {showCodeInput && (
                  <div className="mb-2">
                    <textarea
                      rows={3}
                      placeholder="// Paste code snippet to share with peers..."
                      value={codeSnippetInput}
                      onChange={(e) => setCodeSnippetInput(e.target.value)}
                      className="w-full font-mono text-xs p-2 rounded-lg bg-slate-900 text-emerald-300 border border-slate-800 focus:outline-none"
                    />
                  </div>
                )}
                <form onSubmit={handleSendChat} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeInput(!showCodeInput)}
                    className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                      showCodeInput ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Toggle code snippet input"
                  >
                    <Code className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type message to room participants..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <Button type="submit" variant="primary" size="sm">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Collaborative Tasks Checklist */}
          {activeTab === 'TASKS' && (
            <div className="flex-1 flex flex-col p-4 bg-slate-50/50 overflow-y-auto">
              {/* Add Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Add actionable study task or problem to solve..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
                <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Task</span>
                </Button>
              </form>

              {/* Task Items */}
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12">
                    No tasks yet. Create learning checklist items for this study session.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id, task.completed)}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs font-medium ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {task.assignedTo || 'Unassigned'}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Questions & Doubts Board */}
          {activeTab === 'DOUBTS' && (
            <div className="flex-1 flex flex-col p-4 bg-slate-50/50 overflow-y-auto">
              <form onSubmit={handlePostQuestion} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Post a doubt or topic question for the group to answer..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
                <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Post Doubt</span>
                </Button>
              </form>

              <div className="space-y-3">
                {questions.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12">
                    No questions posted yet. Drop questions or conceptual doubts here.
                  </div>
                ) : (
                  questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-900">{q.text}</p>
                        <div className="text-[11px] text-slate-400">
                          Asked by <span className="font-medium text-slate-600">{q.author}</span>
                          {q.resolved && (
                            <span className="ml-2 text-emerald-600 font-semibold">• Resolved</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpvoteQuestion(q.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        <ThumbsUp className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{q.upvotes}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Presence & Optional Audio/Video */}
        <div className="w-64 bg-slate-50 flex flex-col p-3 space-y-4 shrink-0 overflow-y-auto">
          {/* Active Participants Presence */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>Participants ({participants.length})</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>

            <div className="space-y-1.5">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-[10px] font-bold text-white flex items-center justify-center">
                      {p.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 truncate max-w-[120px]">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.role}</div>
                    </div>
                  </div>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      p.isOnline !== false ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Optional Audio/Video Control Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Audio & Video</span>
            </div>

            {mediaConsentGranted ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={toggleMic}
                    className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 flex-1 justify-center transition-colors ${
                      isMicOn ? 'bg-slate-900 text-white border-slate-900' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isMicOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    <span>{isMicOn ? 'Mic On' : 'Muted'}</span>
                  </button>

                  <button
                    onClick={toggleCam}
                    className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 flex-1 justify-center transition-colors ${
                      isCamOn ? 'bg-slate-900 text-white border-slate-900' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {isCamOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                    <span>{isCamOn ? 'Cam On' : 'Cam Off'}</span>
                  </button>
                </div>

                {isCamOn && (
                  <div className="h-24 w-full rounded-lg bg-slate-950 overflow-hidden">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mic & Camera are off by default. Collaborative notes and text chat are primary.
                </p>
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full text-xs"
                  onClick={() => setShowConsentModal(true)}
                >
                  Enable Mic / Camera
                </Button>
              </div>
            )}
          </div>

          {/* Code of Conduct Reminder */}
          <div className="mt-auto p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
            <Shield className="h-3.5 w-3.5 text-indigo-600 mb-1" />
            <span>
              All study interactions are governed by institutional campus conduct rules. Treat peers with respect.
            </span>
          </div>
        </div>
      </div>

      {/* Media Consent Modal */}
      {showConsentModal && (
        <Modal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          title="Enable Audio & Video"
          size="sm"
        >
          <div className="space-y-3 text-slate-700">
            <p className="text-xs leading-relaxed">
              Camera and microphone transmission is strictly opt-in. Audio/video flows P2P among room members and is never recorded.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setShowConsentModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleEnableMedia}>
                Grant Consent & Enable
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => {
            if (!reportSubmitting) setShowReportModal(false);
          }}
          title="Report Inappropriate Conduct in Room"
          size="md"
        >
          {reportSuccess ? (
            <div className="py-6 text-center space-y-2 text-slate-700">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Report Queued for TPO Review</h4>
              <p className="text-xs text-slate-500">
                The Training & Placement moderation team has been alerted.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReportParticipant} className="space-y-4 text-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Report <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {MODERATION_REASONS.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide details regarding the participant conduct violation..."
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
