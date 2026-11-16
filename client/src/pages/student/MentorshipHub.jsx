import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  GraduationCap,
  MessageSquare,
  Shield,
  Star,
  Users,
  Briefcase,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { alumniService, MENTORSHIP_TOPICS, MENTOR_DOMAINS } from '../../services/alumniService';

export default function MentorshipHub() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  
  // Modals
  const [selectedMentorForDetails, setSelectedMentorForDetails] = useState(null);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestTimeSlot, setRequestTimeSlot] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('');

  useEffect(() => {
    loadMentors();
  }, [selectedDomain, selectedTopic]);

  async function loadMentors() {
    try {
      setLoading(true);
      const data = await alumniService.getDirectory({
        search: searchQuery,
        domain: selectedDomain,
        topic: selectedTopic,
      });
      setMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load mentor directory:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadMentors();
  }

  async function handleSendRequest(e) {
    e.preventDefault();
    if (!selectedMentorForRequest || !requestTopic || !requestMessage.trim()) return;

    try {
      setRequestSubmitting(true);
      await alumniService.createMentorshipRequest({
        mentorId: selectedMentorForRequest.id,
        topic: requestTopic,
        message: requestMessage,
        preferredTimeSlots: requestTimeSlot || 'Flexible on weekends',
      });
      setRequestSuccessMessage(`Your mentorship request was sent to ${selectedMentorForRequest.fullName}!`);
      setTimeout(() => {
        setSelectedMentorForRequest(null);
        setRequestSuccessMessage('');
        setRequestTopic('');
        setRequestMessage('');
        setRequestTimeSlot('');
      }, 1500);
    } catch (err) {
      console.error('Error submitting mentorship request:', err);
    } finally {
      setRequestSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Alumni Mentorship Network"
        subtitle="Connect 1-on-1 with verified alumni leaders for technical mock feedback, system design reviews, and career guidance."
        badge="Phase 16 Mentorship"
        badgeVariant="emerald"
        actions={
          <div className="flex items-center gap-3">
            <Button
              to="/student/mentorship-requests"
              variant="outline"
              size="md"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>My Requests & Sessions</span>
            </Button>
          </div>
        }
      />

      {/* Platform Mediation & Governance Alert */}
      <div className="rounded-xl border border-[#02E8A7]/40/80 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[#02E8A7] p-2 text-white shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1 text-sm text-slate-700">
            <div className="font-semibold text-indigo-950 flex items-center gap-2">
              <span>Platform-Mediated & Safe Mentorship Environment</span>
              <Badge variant="aqua" size="xs">T&P Verified</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              All alumni profiles are officially verified by your institution's Training & Placement Cell.
              Private contact information (phone numbers and personal emails) is protected and never exposed.
              All sessions and messaging occur through secure platform channels with explicit code of conduct governance.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Verified Alumni Mentors"
          value={mentors.length.toString()}
          icon={GraduationCap}
          iconColor="text-[#009669]"
          bgColor="bg-[#BDF9F9]/30"
          subtitle="Actively accepting mentees"
        />
        <StatCard
          title="Available Domains"
          value={MENTOR_DOMAINS.length.toString()}
          icon={Briefcase}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          subtitle="Software, AI, Cloud & more"
        />
        <StatCard
          title="Avg Session Rating"
          value="4.92 / 5.0"
          icon={Star}
          iconColor="text-amber-500"
          bgColor="bg-amber-50"
          subtitle="Based on student reviews"
        />
        <StatCard
          title="Avg Response Time"
          value="< 24 Hours"
          icon={Clock}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          subtitle="High response rate"
        />
      </div>

      {/* Search & Multi-Faceted Filters */}
      <Card className="p-4 shadow-xs border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by mentor name, company (e.g. Google, Microsoft), role, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-[#02E8A7] focus:outline-none focus:ring-1 focus:ring-[#02E8A7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-[#02E8A7] focus:outline-none text-slate-700 bg-white"
            >
              <option value="ALL">All Domains</option>
              {MENTOR_DOMAINS.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-[#02E8A7] focus:outline-none text-slate-700 bg-white max-w-[220px]"
            >
              <option value="ALL">All Mentorship Topics</option>
              {MENTORSHIP_TOPICS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <Button type="submit" variant="primary" size="md">
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Mentor Directory Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Verified Alumni Directory</span>
            <span className="text-xs font-normal text-slate-500">({mentors.length} active mentors found)</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-2" />
            <p className="text-sm">Loading verified alumni mentors...</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">No mentors found matching your filters</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting the domain or search keyword to see more alumni.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedDomain('ALL');
                setSelectedTopic('ALL');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
            {mentors.map((mentor) => (
              <Card
                key={mentor.id}
                className="flex flex-col justify-between border-slate-200 shadow-xs hover:border-[#02E8A7]/50 transition-all hover:shadow-sm"
              >
                <div className="p-5">
                  {/* Card Header with Recommendation Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-base font-bold text-white shadow-xs">
                        {mentor.fullName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{mentor.fullName}</h3>
                          <Badge variant="emerald" size="xs" className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Alum
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-[#004D36]">{mentor.role} @ {mentor.company}</p>
                        <p className="text-xs text-slate-500">
                          Class of {mentor.graduationYear} • {mentor.branch}
                        </p>
                      </div>
                    </div>

                    {mentor.recommendationBadge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/80">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        {mentor.recommendationBadge}
                      </span>
                    )}
                  </div>

                  {/* Explainable Recommendation Note */}
                  {mentor.recommendationReason && (
                    <div className="mt-3 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 border border-slate-100 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#009669] shrink-0" />
                      <span className="font-medium text-slate-700">{mentor.recommendationReason}</span>
                    </div>
                  )}

                  {/* Bio snippet */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {mentor.bio}
                  </p>

                  {/* Skills Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {mentor.skills?.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {mentor.skills?.length > 4 && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                        +{mentor.skills.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Rating & Capacity Summary */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span>{mentor.rating}</span>
                      <span className="font-normal text-slate-400">({mentor.reviewsCount || 25} reviews)</span>
                    </div>
                    <div>
                      <span>Capacity: </span>
                      <span className="font-semibold text-slate-700">
                        {mentor.capacityWeekly || 2} sessions / week
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 p-3 px-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-slate-700"
                    onClick={() => setSelectedMentorForDetails(mentor)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() => {
                      setSelectedMentorForRequest(mentor);
                      setRequestTopic(mentor.topics?.[0] || MENTORSHIP_TOPICS[0]);
                      setRequestTimeSlot(mentor.availableSlots?.[0] ? `${mentor.availableSlots[0].dayOfWeek} ${mentor.availableSlots[0].startTime}` : '');
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Request Mentorship
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Mentor Profile Details Modal */}
      {selectedMentorForDetails && (
        <Modal
          isOpen={!!selectedMentorForDetails}
          onClose={() => setSelectedMentorForDetails(null)}
          title="Alumni Mentor Profile"
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-xl font-bold text-white shadow-xs">
                {selectedMentorForDetails.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{selectedMentorForDetails.fullName}</h3>
                  <Badge variant="emerald" size="sm">Verified Alum</Badge>
                </div>
                <p className="text-sm font-medium text-[#004D36]">{selectedMentorForDetails.headline}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alum Class of {selectedMentorForDetails.graduationYear} • {selectedMentorForDetails.degree}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <strong className="text-slate-800">{selectedMentorForDetails.rating}</strong> ({selectedMentorForDetails.reviewsCount} reviews)
                  </span>
                  <span>•</span>
                  <span>{selectedMentorForDetails.completedSessions} completed sessions</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Biography & Mentorship Philosophy</h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
                {selectedMentorForDetails.bio}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mentorship Topics Covered</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMentorForDetails.topics?.map((topic) => (
                  <span key={topic} className="rounded-lg bg-[#BDF9F9]/30 border border-[#02E8A7]/40/80 px-2.5 py-1 text-xs font-semibold text-[#002020]">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Core Skills & Tech Stack</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedMentorForDetails.skills?.map((skill) => (
                  <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Weekly Available Slots</h4>
              <div className="space-y-2">
                {selectedMentorForDetails.availableSlots?.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-800">{slot.dayOfWeek}</span>
                    <span className="text-slate-600">{slot.startTime} - {slot.endTime} ({slot.timezone})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button variant="outline" size="md" onClick={() => setSelectedMentorForDetails(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  const m = selectedMentorForDetails;
                  setSelectedMentorForDetails(null);
                  setSelectedMentorForRequest(m);
                  setRequestTopic(m.topics?.[0] || MENTORSHIP_TOPICS[0]);
                  setRequestTimeSlot(m.availableSlots?.[0] ? `${m.availableSlots[0].dayOfWeek} ${m.availableSlots[0].startTime}` : '');
                }}
              >
                Request Mentorship
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Mentorship Modal */}
      {selectedMentorForRequest && (
        <Modal
          isOpen={!!selectedMentorForRequest}
          onClose={() => {
            if (!requestSubmitting) setSelectedMentorForRequest(null);
          }}
          title={`Request Mentorship with ${selectedMentorForRequest.fullName}`}
          size="md"
        >
          {requestSuccessMessage ? (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{requestSuccessMessage}</h3>
              <p className="text-xs text-slate-500">You will be notified as soon as the mentor accepts or proposes a slot.</p>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#02E8A7] text-[#002020] font-bold font-bold text-sm">
                  {selectedMentorForRequest.fullName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedMentorForRequest.fullName}</h4>
                  <p className="text-xs text-slate-500">{selectedMentorForRequest.role} @ {selectedMentorForRequest.company}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Discussion Topic <span className="text-rose-500">*</span>
                </label>
                <select
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-[#02E8A7] focus:outline-none"
                >
                  {selectedMentorForRequest.topics?.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  )) || MENTORSHIP_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Time Slot
                </label>
                <select
                  value={requestTimeSlot}
                  onChange={(e) => setRequestTimeSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-[#02E8A7] focus:outline-none"
                >
                  {selectedMentorForRequest.availableSlots?.map((slot) => (
                    <option key={slot.id} value={`${slot.dayOfWeek} ${slot.startTime} - ${slot.endTime} (${slot.timezone})`}>
                      {slot.dayOfWeek} {slot.startTime} - {slot.endTime} ({slot.timezone})
                    </option>
                  ))}
                  <option value="Flexible on weekends">Flexible on weekends</option>
                  <option value="Flexible on weekday evenings">Flexible on weekday evenings</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Learning Goals & Specific Questions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your current preparation level, specific questions you want to ask, or the project/resume section you want to review..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-[#02E8A7] focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Tip: Specific, prepared questions help mentors make the most impactful use of your 45-minute session.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedMentorForRequest(null)}
                  disabled={requestSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={requestSubmitting}
                  className="flex items-center gap-2"
                >
                  {requestSubmitting ? 'Sending Request...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
