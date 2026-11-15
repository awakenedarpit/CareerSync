import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Play,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  peerInterviewService,
  PEER_INTERVIEW_TYPES,
  PEER_INTERVIEW_MODES,
  PEER_DIFFICULTIES
} from '../../services/peerInterviewService';

export default function PeerInterviews() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MARKETPLACE'); // MARKETPLACE, HISTORY
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  // Create Room Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTargetRole, setFormTargetRole] = useState('Software Development Engineer');
  const [formDomain, setFormDomain] = useState('Software Engineering');
  const [formType, setFormType] = useState('TECHNICAL');
  const [formMode, setFormMode] = useState('STRUCTURED_INTERVIEW');
  const [formDifficulty, setFormDifficulty] = useState('INTERMEDIATE');
  const [formDuration, setFormDuration] = useState(45);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // History Rubric Inspector Modal
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedType, selectedDifficulty]);

  async function loadData() {
    try {
      setLoading(true);
      const [roomsData, historyData] = await Promise.all([
        peerInterviewService.getRooms({
          type: selectedType,
          difficulty: selectedDifficulty,
          search: searchQuery,
        }),
        peerInterviewService.getInterviewHistory(),
      ]);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      console.error('Failed to load peer interviews data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      setFormSubmitting(true);
      const newRoom = await peerInterviewService.createRoom({
        title: formTitle,
        targetRole: formTargetRole,
        domain: formDomain,
        type: formType,
        mode: formMode,
        difficulty: formDifficulty,
        durationMinutes: parseInt(formDuration, 10),
      });
      setShowCreateModal(false);
      // Navigate directly into the created room
      navigate(`/student/peer-interviews/room/${newRoom.id || 'room-peer-' + Date.now()}`);
    } catch (err) {
      console.error('Failed to create peer room:', err);
    } finally {
      setFormSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Peer Mock Interviews"
        subtitle="Practice technical coding, system design, and behavioral interviews with peers. Gain hands-on practice as both candidate and interviewer."
        badge="Phase 16 Dual-Mode"
        badgeVariant="indigo"
        actions={
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2 shadow-xs"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Interview Session</span>
          </Button>
        }
      />

      {/* Formative Peer Evaluation Notice Banner */}
      <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-sky-600 p-2 text-white shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-sky-950 flex items-center gap-2">
              <span>Formative Peer Learning Environment</span>
              <Badge variant="blue" size="xs">Formative Practice</Badge>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Peer interviews are collaborative learning exercises designed for safe, repetitive practice.
              All feedback submitted carries an explicit <strong>Peer-Provided</strong> label and serves as formative coaching rather than official placement cell evaluation scores.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Peer Sessions"
          value={rooms.length.toString()}
          icon={Users}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          subtitle="Open rooms in marketplace"
        />
        <StatCard
          title="My Practice Sessions"
          value={history.length.toString()}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          subtitle="Completed mock interviews"
        />
        <StatCard
          title="Avg Peer Rubric Score"
          value="4.5 / 5.0"
          icon={Award}
          iconColor="text-amber-500"
          bgColor="bg-amber-50"
          subtitle="Across technical & clarity criteria"
        />
        <StatCard
          title="Practice Time"
          value="105 Mins"
          icon={Clock}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          subtitle="Live collaborative coding"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('MARKETPLACE')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'MARKETPLACE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Peer Discovery Marketplace ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Interview History & Rubrics ({history.length})
        </button>
      </div>

      {activeTab === 'MARKETPLACE' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-4 border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search rooms by title or target role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white text-slate-700"
              >
                <option value="ALL">All Types</option>
                {PEER_INTERVIEW_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white text-slate-700"
              >
                <option value="ALL">All Difficulties</option>
                {PEER_DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>

              <Button variant="outline" size="md" onClick={loadData}>
                Search
              </Button>
            </div>
          </Card>

          {/* Rooms Grid */}
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-2" />
              <p className="text-sm">Loading available peer interview rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No open interview rooms found</h3>
              <p className="text-xs text-slate-500 mt-1">Be the first to host a peer interview room today.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                Create a Room
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => {
                const diffBadge = PEER_DIFFICULTIES.find(d => d.id === room.difficulty) || PEER_DIFFICULTIES[0];
                return (
                  <Card
                    key={room.id}
                    className="flex flex-col justify-between border-slate-200 shadow-xs hover:border-indigo-300 transition-all p-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-${diffBadge.badgeVariant}-50 text-${diffBadge.badgeVariant}-700 border border-${diffBadge.badgeVariant}-200`}>
                            {diffBadge.label}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">{room.title}</h3>
                          <p className="text-xs text-indigo-700 font-medium">{room.targetRole}</p>
                        </div>

                        <Badge variant={room.mode === 'STRUCTURED_INTERVIEW' ? 'indigo' : 'purple'} size="xs">
                          {room.mode === 'STRUCTURED_INTERVIEW' ? 'Mode A: Dual Role' : 'Mode B: Collab'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {room.tags?.map((tag) => (
                          <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Host: <strong className="text-slate-700">{room.hostName}</strong></span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {room.durationMinutes} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {room.participantsCount} / {room.maxParticipants}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {room.status === 'IN_PROGRESS' ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Now
                          </span>
                        ) : 'Ready to start'}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex items-center gap-1.5"
                        onClick={() => navigate(`/student/peer-interviews/room/${room.id}`)}
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        Join Session
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* History & Rubrics Tab */
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
              <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">No mock interview history yet</h3>
              <p className="text-xs text-slate-500 mt-1">Join or host an interview to build your constructive rubric record.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Card key={item.id} className="p-5 border-slate-200 shadow-xs">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="emerald" size="xs">Completed</Badge>
                        <Badge variant="slate" size="xs">Peer Evaluated</Badge>
                        <span className="text-xs text-slate-400">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-600">
                        Target Role: <strong>{item.targetRole}</strong> • Practice Partner: <strong>{item.peerName}</strong> ({item.durationMinutes}m)
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="rounded-lg bg-emerald-50/60 p-2.5 text-xs border border-emerald-100">
                          <strong className="text-emerald-950 block mb-0.5">Strengths Highlighted:</strong>
                          <span className="text-emerald-800">{item.strengths}</span>
                        </div>
                        <div className="rounded-lg bg-amber-50/60 p-2.5 text-xs border border-amber-100">
                          <strong className="text-amber-950 block mb-0.5">Constructive Growth Areas:</strong>
                          <span className="text-amber-800">{item.improvements}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 shrink-0 min-w-[140px]">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Rubric Score</span>
                      <span className="text-3xl font-black text-indigo-600">{item.rubricScore}</span>
                      <span className="text-xs text-slate-400">out of 5.0</span>
                      <Button
                        variant="outline"
                        size="xs"
                        className="mt-3 text-xs w-full"
                        onClick={() => setSelectedHistoryItem(item)}
                      >
                        Inspect Rubric
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            if (!formSubmitting) setShowCreateModal(false);
          }}
          title="Create Peer Mock Interview Room"
          size="md"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Room Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Trees, Graphs & Dynamic Programming Sprint"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={formTargetRole}
                  onChange={(e) => setFormTargetRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Domain
                </label>
                <select
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Cloud & Systems">Cloud & Systems</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data & AI">Data & AI</option>
                  <option value="General">General / Behavioral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interview Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {PEER_INTERVIEW_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {PEER_DIFFICULTIES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interview Structure Mode
              </label>
              <div className="space-y-2">
                {PEER_INTERVIEW_MODES.map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      formMode === mode.id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interviewMode"
                      value={mode.id}
                      checked={formMode === mode.id}
                      onChange={() => setFormMode(mode.id)}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{mode.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{mode.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Session Duration
              </label>
              <select
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="30">30 Minutes (Quick Sprint)</option>
                <option value="45">45 Minutes (Standard Industry Interview)</option>
                <option value="60">60 Minutes (Comprehensive In-Depth)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowCreateModal(false)}
                disabled={formSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Creating Room...' : 'Launch Room'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Rubric Inspector Modal */}
      {selectedHistoryItem && (
        <Modal
          isOpen={!!selectedHistoryItem}
          onClose={() => setSelectedHistoryItem(null)}
          title={`Detailed Feedback Rubric: ${selectedHistoryItem.title}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <div>
                <span>Evaluator: <strong>{selectedHistoryItem.peerName}</strong> (Peer)</span>
                <span className="block text-slate-400 mt-0.5">Formative assessment • Not official TPO credential</span>
              </div>
              <Badge variant="indigo" size="sm">Overall: {selectedHistoryItem.rubricScore} / 5.0</Badge>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Constructive Rubric Dimensions</h4>
              {[
                { label: 'Communication & Clarity', score: selectedHistoryItem.rubricBreakdown?.clarity || 4.8 },
                { label: 'Problem-Solving Approach', score: selectedHistoryItem.rubricBreakdown?.problemSolving || 4.5 },
                { label: 'Technical Depth & Accuracy', score: selectedHistoryItem.rubricBreakdown?.technicalExplanation || 4.6 },
                { label: 'Conceptual Understanding', score: selectedHistoryItem.rubricBreakdown?.conceptualUnderstanding || 4.5 },
                { label: 'Structure & Time Management', score: selectedHistoryItem.rubricBreakdown?.answerStructure || 4.6 },
              ].map((dim) => (
                <div key={dim.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{dim.label}</span>
                    <span className="font-bold text-slate-900">{dim.score} / 5.0</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(dim.score / 5.0) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="rounded-lg bg-emerald-50 p-3 text-xs border border-emerald-100">
                <strong className="text-emerald-950 block mb-1">Key Strengths:</strong>
                <span className="text-emerald-800 leading-relaxed">{selectedHistoryItem.strengths}</span>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-xs border border-amber-100">
                <strong className="text-amber-950 block mb-1">Constructive Recommendations:</strong>
                <span className="text-amber-800 leading-relaxed">{selectedHistoryItem.improvements}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <Button variant="primary" size="md" onClick={() => setSelectedHistoryItem(null)}>
                Close Rubric
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
