import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Star,
  Users,
  ChevronLeft,
  Video,
  FileText,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { alumniService, MENTORSHIP_REQUEST_STATUSES } from '../../services/alumniService';

export default function MentorshipRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UPCOMING, PENDING, COMPLETED
  
  // Feedback Modal
  const [selectedSessionForFeedback, setSelectedSessionForFeedback] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackStrengths, setFeedbackStrengths] = useState('');
  const [feedbackImprovements, setFeedbackImprovements] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await alumniService.getMentorshipRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load mentorship requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!selectedSessionForFeedback) return;

    try {
      setFeedbackSubmitting(true);
      await alumniService.submitSessionFeedback(selectedSessionForFeedback.id, {
        rating: feedbackRating,
        strengths: feedbackStrengths,
        improvements: feedbackImprovements,
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setRequests(prev => prev.map(r => r.id === selectedSessionForFeedback.id ? { ...r, feedbackGiven: true } : r));
        setSelectedSessionForFeedback(null);
        setFeedbackSuccess(false);
        setFeedbackStrengths('');
        setFeedbackImprovements('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'UPCOMING') return r.status === 'ACCEPTED';
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  const upcomingSessions = requests.filter((r) => r.status === 'ACCEPTED');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="My Mentorship Requests & Sessions"
        subtitle="Manage upcoming 1-on-1 mentorship appointments, review agendas, join secure rooms, and submit constructive session reviews."
        badge="Phase 16 Student"
        badgeVariant="emerald"
        actions={
          <Button
            to="/student/mentorship"
            variant="outline"
            size="md"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Browse Mentors</span>
          </Button>
        }
      />

      {/* Upcoming Sessions Showcase Banner */}
      {upcomingSessions.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wide">
                  Next Upcoming Session
                </h3>
                <Badge variant="emerald" size="xs">Confirmed</Badge>
              </div>
              <p className="text-base font-bold text-slate-900">
                {upcomingSessions[0].topic} with {upcomingSessions[0].mentorName} ({upcomingSessions[0].mentorCompany})
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-medium text-emerald-800">
                  <Calendar className="h-3.5 w-3.5" />
                  {upcomingSessions[0].scheduledAt ? new Date(upcomingSessions[0].scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Saturday 11:00 AM IST'}
                </span>
                <span>•</span>
                <span>Platform Meeting Room Ready</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              onClick={() => {
                if (upcomingSessions[0].meetingLink) {
                  window.open(upcomingSessions[0].meetingLink, '_blank');
                } else {
                  alert('Launching secure platform audio/video session...');
                }
              }}
            >
              <Video className="h-4 w-4" />
              <span>Join Mentorship Session</span>
            </Button>
          </div>

          {upcomingSessions[0].agenda && (
            <div className="mt-4 pt-3 border-t border-emerald-200/70">
              <h4 className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Agreed Session Agenda:
              </h4>
              <p className="text-xs text-emerald-800 whitespace-pre-line leading-relaxed font-mono bg-white/70 rounded-md p-2 border border-emerald-100">
                {upcomingSessions[0].agenda}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'ALL', label: `All Requests (${requests.length})` },
          { id: 'UPCOMING', label: `Upcoming Sessions (${upcomingSessions.length})` },
          { id: 'PENDING', label: `Pending Review (${requests.filter(r => r.status === 'PENDING').length})` },
          { id: 'COMPLETED', label: `Completed (${requests.filter(r => r.status === 'COMPLETED').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Table / Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-2" />
          <p className="text-sm">Loading your mentorship requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No mentorship requests in this view</h3>
          <p className="text-xs text-slate-500 mt-1">Explore our alumni directory to request 1-on-1 career guidance.</p>
          <Button to="/student/mentorship" variant="primary" size="sm" className="mt-4">
            Browse Mentors
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const statusConfig = MENTORSHIP_REQUEST_STATUSES[req.status] || MENTORSHIP_REQUEST_STATUSES.PENDING;
            return (
              <Card key={req.id} className="p-5 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border border-${statusConfig.color}-200`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Requested on {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{req.topic}</h3>
                      <p className="text-xs text-slate-600">
                        Mentor: <strong className="text-slate-800">{req.mentorName}</strong> ({req.mentorHeadline})
                      </p>
                    </div>

                    <div className="rounded-md bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                      <strong className="text-slate-900 font-semibold">Your Note: </strong>
                      <span>{req.message}</span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span><strong>Requested Slot:</strong> {req.preferredTimeSlots}</span>
                      {req.scheduledAt && (
                        <span>
                          <strong>Confirmed Time:</strong> {new Date(req.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                    {req.status === 'ACCEPTED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          if (req.meetingLink) {
                            window.open(req.meetingLink, '_blank');
                          } else {
                            alert('Connecting to platform secure audio/video room...');
                          }
                        }}
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join Session
                      </Button>
                    )}

                    {req.status === 'COMPLETED' && !req.feedbackGiven && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex items-center justify-center gap-1.5"
                        onClick={() => setSelectedSessionForFeedback(req)}
                      >
                        <Star className="h-3.5 w-3.5" />
                        Leave Feedback
                      </Button>
                    )}

                    {req.status === 'COMPLETED' && req.feedbackGiven && (
                      <span className="inline-flex items-center justify-center gap-1 rounded-md bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 border border-purple-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                        Feedback Submitted
                      </span>
                    )}

                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center justify-center gap-1 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 border border-amber-200">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        Awaiting Response
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Structured Session Feedback Modal */}
      {selectedSessionForFeedback && (
        <Modal
          isOpen={!!selectedSessionForFeedback}
          onClose={() => {
            if (!feedbackSubmitting) setSelectedSessionForFeedback(null);
          }}
          title={`Session Feedback for ${selectedSessionForFeedback.mentorName}`}
          size="md"
        >
          {feedbackSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Thank you for your constructive feedback!</h3>
              <p className="text-xs text-slate-500">Your review helps our alumni mentors improve and guides fellow students.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Session Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= feedbackRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-700 ml-2">
                    {feedbackRating} out of 5 stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Strengths & Valuable Takeaways <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What advice or actionable critique helped you the most during this session?"
                  value={feedbackStrengths}
                  onChange={(e) => setFeedbackStrengths(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Constructive Suggestions for the Mentor
                </label>
                <textarea
                  rows={3}
                  placeholder="Any areas where the session pacing, depth, or examples could be even better?"
                  value={feedbackImprovements}
                  onChange={(e) => setFeedbackImprovements(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedSessionForFeedback(null)}
                  disabled={feedbackSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={feedbackSubmitting}
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
