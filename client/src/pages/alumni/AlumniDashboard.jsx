import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Star,
  ExternalLink,
  MessageSquare,
  Settings,
  User,
  Video,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  alumniService,
  ALUMNI_VERIFICATION_STATUSES,
  MENTORSHIP_REQUEST_STATUSES
} from '../../services/alumniService';

export default function AlumniDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [availability, setAvailability] = useState({
    active: true,
    capacityWeekly: 2,
    slots: [],
  });
  const [loading, setLoading] = useState(true);

  // Reschedule Modal
  const [selectedReqForReschedule, setSelectedReqForReschedule] = useState(null);
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Accept with Agenda Modal
  const [selectedReqForAccept, setSelectedReqForAccept] = useState(null);
  const [acceptAgenda, setAcceptAgenda] = useState('1. Overview & Goal Setting (10m)\n2. Interactive Mock / Deep Dive (30m)\n3. Constructive Feedback & Action Items (10m)');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [profileData, requestsData, availData] = await Promise.all([
        alumniService.getProfile(),
        alumniService.getMentorshipRequests(),
        alumniService.getAvailability(),
      ]);
      setProfile(profileData);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setAvailability(availData);
    } catch (err) {
      console.error('Failed to load alumni dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(req) {
    try {
      setSubmittingAction(true);
      await alumniService.updateMentorshipRequest(req.id, {
        status: 'ACCEPTED',
        agenda: acceptAgenda,
        meetingLink: `https://carrersync.io/meet/session-${req.id}`,
        scheduledAt: req.preferredTimeSlots?.includes('Saturday') ? '2026-11-21T11:00:00Z' : new Date(Date.now() + 86400000 * 3).toISOString(),
      });
      setSelectedReqForAccept(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to accept request:', err);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleDecline(reqId) {
    if (!window.confirm('Are you sure you want to decline this mentorship request?')) return;
    try {
      setSubmittingAction(true);
      await alumniService.updateMentorshipRequest(reqId, {
        status: 'DECLINED',
        reason: 'Capacity full for this week',
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to decline request:', err);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleRescheduleSubmit(e) {
    e.preventDefault();
    if (!selectedReqForReschedule) return;

    try {
      setSubmittingAction(true);
      await alumniService.updateMentorshipRequest(selectedReqForReschedule.id, {
        status: 'RESCHEDULE_REQUESTED',
        proposedTimeSlot: rescheduleSlot,
        mentorNote: rescheduleNote,
      });
      setSelectedReqForReschedule(null);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to reschedule:', err);
    } finally {
      setSubmittingAction(false);
    }
  }

  const verificationStatus = profile?.verificationStatus || 'VERIFIED';
  const statusBadge = ALUMNI_VERIFICATION_STATUSES[verificationStatus] || ALUMNI_VERIFICATION_STATUSES.VERIFIED;

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const upcomingSessions = requests.filter((r) => r.status === 'ACCEPTED');
  const completedSessions = requests.filter((r) => r.status === 'COMPLETED');

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Alumni Mentorship Portal"
        subtitle={`Welcome back, ${profile?.fullName || 'Alumnus'}! Manage your mentorship requests, adjust weekly availability, and guide junior students.`}
        badge="Phase 16 Alumni"
        badgeVariant="emerald"
        actions={
          <div className="flex items-center gap-3">
            <Button
              to="/alumni/profile"
              variant="outline"
              size="md"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span>Edit Profile & Capacity</span>
            </Button>
          </div>
        }
      />

      {/* Verification Status Banner */}
      {verificationStatus === 'PENDING' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-xs flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <h4 className="font-bold text-amber-950">Alumni Profile Verification Pending</h4>
            <p>
              Your alumni profile has been submitted and is currently being verified against college records by the Training & Placement Cell.
              Once verified, your profile will be published to the student mentor directory.
            </p>
          </div>
        </div>
      )}

      {verificationStatus === 'VERIFIED' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>Verified Alumni Mentor</span>
                <Badge variant="emerald" size="xs">Active Status</Badge>
              </div>
              <p className="text-xs text-emerald-800">
                Your profile is active in the student directory. Students can request 1-on-1 mentorship sessions within your weekly capacity.
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 block">Weekly Capacity</span>
            <span className="text-sm font-bold text-slate-800">
              {upcomingSessions.length} / {availability.capacityWeekly || 2} booked
            </span>
          </div>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length.toString()}
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          subtitle="Awaiting your review"
        />
        <StatCard
          title="Upcoming Sessions"
          value={upcomingSessions.length.toString()}
          icon={Calendar}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          subtitle="Confirmed appointments"
        />
        <StatCard
          title="Completed Sessions"
          value={(profile?.completedSessions || completedSessions.length || 38).toString()}
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          subtitle="Mentees coached"
        />
        <StatCard
          title="Student Satisfaction"
          value={`${profile?.rating || 4.9} / 5.0`}
          icon={Star}
          iconColor="text-amber-500"
          bgColor="bg-amber-50"
          subtitle="From 38 student reviews"
        />
      </div>

      {/* Incoming Requests Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Incoming Mentorship Requests</span>
            <span className="text-xs font-normal text-slate-500">({pendingRequests.length} pending)</span>
          </h2>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center border-slate-200">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">No pending student mentorship requests at the moment.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-5 border-slate-200 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="amber" size="xs">Pending Review</Badge>
                      <span className="text-xs text-slate-400">
                        Submitted {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900">{req.topic}</h3>
                      <p className="text-xs text-slate-600">
                        Student: <strong className="text-slate-800">{req.studentName}</strong> ({req.studentBranch})
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
                      <strong className="block text-slate-900 mb-1">Student Note & Objectives:</strong>
                      <span>{req.message}</span>
                    </div>

                    <div className="text-xs text-slate-500">
                      <strong>Requested Time Slot:</strong> {req.preferredTimeSlots}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setSelectedReqForAccept(req)}
                      disabled={submittingAction}
                    >
                      Accept & Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReqForReschedule(req);
                        setRescheduleSlot(profile?.availableSlots?.[0] ? `${profile.availableSlots[0].dayOfWeek} ${profile.availableSlots[0].startTime}` : '');
                      }}
                      disabled={submittingAction}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDecline(req.id)}
                      disabled={submittingAction}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Mentorship Sessions */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Upcoming Mentorship Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <Card className="p-8 text-center border-slate-200">
            <Calendar className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">No upcoming sessions scheduled</h3>
            <p className="text-xs text-slate-500 mt-1">Accept incoming requests above to populate your calendar.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="p-4 border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-slate-900 text-sm">{session.topic}</h4>
                    <Badge variant="emerald" size="xs">Confirmed</Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Mentee: <strong>{session.studentName}</strong> • {session.studentBranch}
                  </p>
                  <p className="text-xs text-indigo-700 font-medium">
                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Saturday 11:00 AM IST'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => {
                    if (session.meetingLink) {
                      window.open(session.meetingLink, '_blank');
                    } else {
                      alert('Launching platform secure meeting room...');
                    }
                  }}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Launch Session</span>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Accept & Confirm Modal */}
      {selectedReqForAccept && (
        <Modal
          isOpen={!!selectedReqForAccept}
          onClose={() => setSelectedReqForAccept(null)}
          title={`Confirm Mentorship Session with ${selectedReqForAccept.studentName}`}
          size="md"
        >
          <div className="space-y-4 text-slate-700">
            <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-900">
              A secure platform meeting link will be generated and dispatched to the student.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agreed Topic & Time
              </label>
              <div className="text-xs font-medium text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {selectedReqForAccept.topic} • {selectedReqForAccept.preferredTimeSlots}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Agenda & Preparation Checklist
              </label>
              <textarea
                rows={4}
                value={acceptAgenda}
                onChange={(e) => setAcceptAgenda(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedReqForAccept(null)}
                disabled={submittingAction}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleAccept(selectedReqForAccept)}
                disabled={submittingAction}
              >
                {submittingAction ? 'Confirming...' : 'Confirm Session'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {selectedReqForReschedule && (
        <Modal
          isOpen={!!selectedReqForReschedule}
          onClose={() => setSelectedReqForReschedule(null)}
          title={`Propose Alternate Slot for ${selectedReqForReschedule.studentName}`}
          size="md"
        >
          <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Your Available Alternate Slot <span className="text-rose-500">*</span>
              </label>
              <select
                value={rescheduleSlot}
                onChange={(e) => setRescheduleSlot(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-500 bg-white"
              >
                {profile?.availableSlots?.map((slot) => (
                  <option key={slot.id} value={`${slot.dayOfWeek} ${slot.startTime} - ${slot.endTime}`}>
                    {slot.dayOfWeek} {slot.startTime} - {slot.endTime} ({slot.timezone})
                  </option>
                ))}
                <option value="Sunday 5:00 PM - 6:00 PM IST">Sunday 5:00 PM - 6:00 PM IST</option>
                <option value="Saturday 2:00 PM - 3:00 PM IST">Saturday 2:00 PM - 3:00 PM IST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Note to Student
              </label>
              <textarea
                rows={3}
                placeholder="Brief reason or guidance for the proposed time change..."
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setSelectedReqForReschedule(null)}
                disabled={submittingAction}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submittingAction}
              >
                {submittingAction ? 'Sending...' : 'Propose Slot'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
