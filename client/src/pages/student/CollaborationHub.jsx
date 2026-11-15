import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  PlusCircle,
  Search,
  MessageSquare,
  BookOpen,
  Code,
  CheckCircle2,
  Lock,
  Globe,
  Binary,
  Server,
  Database,
  Cpu,
  Calculator,
  GitPullRequest,
  Filter,
  ArrowRight
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { collaborationService, COLLABORATION_CATEGORIES } from '../../services/collaborationService';

export default function CollaborationHub() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Room Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomCategory, setRoomCategory] = useState('DSA');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [selectedCategory]);

  async function loadRooms() {
    try {
      setLoading(true);
      const data = await collaborationService.getStudyRooms({
        category: selectedCategory,
        search: searchQuery,
      });
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load study rooms:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadRooms();
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!roomTitle.trim()) return;

    try {
      setSubmitting(true);
      const newRoom = await collaborationService.createStudyRoom({
        title: roomTitle,
        description: roomDescription,
        category: roomCategory,
        maxParticipants: parseInt(maxParticipants, 10),
        isPrivate,
      });
      setShowCreateModal(false);
      navigate(`/student/collaboration/room/${newRoom.id}`);
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Real-Time Learning Collaboration"
        subtitle="Join live interactive study rooms with fellow students. Co-write shared notes, solve DSA questions, and collaborate across 9 learning domains."
        badge="Phase 16 Collaboration"
        badgeVariant="cyan"
        actions={
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2 shadow-xs"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Study Room</span>
          </Button>
        }
      />

      {/* 9 Domain Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Domains
        </button>
        {COLLABORATION_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Stats Bar */}
      <Card className="p-4 border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active study rooms by topic, keyword, or host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <Button type="submit" variant="outline" size="md">
            Filter Rooms
          </Button>
        </form>
      </Card>

      {/* Active Study Rooms Directory */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Active Study Rooms</span>
            <span className="text-xs font-normal text-slate-500">({rooms.length} rooms live)</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-2" />
            <p className="text-sm">Loading active collaboration rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No active study rooms found</h3>
            <p className="text-xs text-slate-500 mt-1">Start a room for your peer cohort to study together.</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Create Study Room
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const catObj = COLLABORATION_CATEGORIES.find(c => c.id === room.category) || COLLABORATION_CATEGORIES[0];
              const isFull = room.participantsCount >= room.maxParticipants;
              return (
                <Card
                  key={room.id}
                  className="flex flex-col justify-between border-slate-200 shadow-xs hover:border-indigo-300 transition-all p-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {catObj.label}
                      </span>
                      {room.isPrivate ? (
                        <span className="text-slate-400" title="Private Room">
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1 text-xs font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">{room.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {room.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {room.tags?.map((tag) => (
                        <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 font-mono">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Host: <strong className="text-slate-700">{room.hostName}</strong></span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="h-3.5 w-3.5 text-indigo-600" />
                        {room.participantsCount} / {room.maxParticipants}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Button
                      variant={isFull ? 'outline' : 'primary'}
                      size="sm"
                      disabled={isFull}
                      className="w-full flex items-center justify-center gap-1.5"
                      onClick={() => navigate(`/student/collaboration/room/${room.id}`)}
                    >
                      <span>{isFull ? 'Room Full' : 'Join Room'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            if (!submitting) setShowCreateModal(false);
          }}
          title="Create Collaborative Study Room"
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
                placeholder="e.g. Dynamic Programming & LeetCode Hard Study Group"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Domain Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomCategory}
                onChange={(e) => setRoomCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
              >
                {COLLABORATION_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Focus & Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe what your group will work on (e.g., problems to solve, repo to review, topics to whiteboard)..."
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Participant Capacity
                </label>
                <select
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="4">4 Students (Focused)</option>
                  <option value="6">6 Students</option>
                  <option value="8">8 Students (Standard)</option>
                  <option value="12">12 Students (Open Workshop)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Access Level
                </label>
                <select
                  value={isPrivate ? 'PRIVATE' : 'PUBLIC'}
                  onChange={(e) => setIsPrivate(e.target.value === 'PRIVATE')}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
                >
                  <option value="PUBLIC">Public (College Directory)</option>
                  <option value="PRIVATE">Invite Only (Direct Link)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
              >
                {submitting ? 'Creating Room...' : 'Launch Room'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
