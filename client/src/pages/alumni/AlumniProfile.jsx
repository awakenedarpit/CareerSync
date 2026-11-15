import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Globe,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  alumniService,
  MENTORSHIP_TOPICS,
  MENTOR_DOMAINS
} from '../../services/alumniService';

export default function AlumniProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Editable Form Fields
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [domain, setDomain] = useState('Software Engineering');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [graduationYear, setGraduationYear] = useState(2018);
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [degree, setDegree] = useState('B.Tech CSE');
  const [bio, setBio] = useState('');
  const [capacityWeekly, setCapacityWeekly] = useState(2);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [languages, setLanguages] = useState(['English', 'Hindi']);
  const [newLanguage, setNewLanguage] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await alumniService.getProfile();
      setProfile(data);
      if (data) {
        setFullName(data.fullName || '');
        setHeadline(data.headline || '');
        setCompany(data.company || '');
        setRole(data.role || '');
        setDomain(data.domain || 'Software Engineering');
        setYearsExperience(data.yearsExperience || 5);
        setGraduationYear(data.graduationYear || 2018);
        setBranch(data.branch || 'Computer Science & Engineering');
        setDegree(data.degree || 'B.Tech CSE');
        setBio(data.bio || '');
        setCapacityWeekly(data.capacityWeekly || 2);
        setSelectedTopics(data.topics || [MENTORSHIP_TOPICS[0]]);
        setLanguages(data.languages || ['English', 'Hindi']);
        setAvailableSlots(data.availableSlots || []);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  function toggleTopic(topic) {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  }

  function handleAddLanguage(e) {
    e.preventDefault();
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  }

  function handleRemoveLanguage(lang) {
    setLanguages(languages.filter((l) => l !== lang));
  }

  function handleAddSlot() {
    const newSlot = {
      id: 'slot-' + Date.now(),
      dayOfWeek: 'Saturday',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      timezone: 'IST',
    };
    setAvailableSlots([...availableSlots, newSlot]);
  }

  function handleRemoveSlot(slotId) {
    setAvailableSlots(availableSlots.filter((s) => s.id !== slotId));
  }

  function handleSlotChange(slotId, field, value) {
    setAvailableSlots(
      availableSlots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      await alumniService.updateProfile({
        fullName,
        headline,
        company,
        role,
        domain,
        yearsExperience: parseInt(yearsExperience, 10),
        graduationYear: parseInt(graduationYear, 10),
        branch,
        degree,
        bio,
        capacityWeekly: parseInt(capacityWeekly, 10),
        topics: selectedTopics,
        languages,
        availableSlots,
      });
      setSuccessMessage('Profile and mentorship preferences saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-2" />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Alumni Profile & Mentorship Preferences"
        subtitle="Configure your public mentor listing, areas of expertise, weekly mentee capacity, and recurring availability slots."
        badge="Phase 16 Alumni"
        badgeVariant="emerald"
        actions={
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2 shadow-xs"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </Button>
        }
      />

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-xs flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Professional Background */}
        <Card className="p-6 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Current Professional Role</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Headline <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Staff Software Engineer @ Google"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Organization / Company <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designation / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Industry Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
              >
                {MENTOR_DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Years of Industry Experience
              </label>
              <input
                type="number"
                min="1"
                max="40"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Biography & Mentorship Philosophy
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about your career journey, the challenges you navigated, and how you can best support them..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </Card>

        {/* Section 2: College Alumni Credentials */}
        <Card className="p-6 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Alma Mater & Graduation Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Graduation Year
              </label>
              <input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Degree
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department / Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Mentorship Topics & Capacity */}
        <Card className="p-6 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Mentorship Topics & Capacity</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Mentorship Topics You Cover (Click to toggle)
            </label>
            <div className="flex flex-wrap gap-2">
              {MENTORSHIP_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    type="button"
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Mentorship Capacity (Sessions / Week)
              </label>
              <select
                value={capacityWeekly}
                onChange={(e) => setCapacityWeekly(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none bg-white"
              >
                <option value="1">1 Session per week</option>
                <option value="2">2 Sessions per week (Recommended)</option>
                <option value="3">3 Sessions per week</option>
                <option value="5">5 Sessions per week</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Languages Spoken
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                  >
                    <span>{lang}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add language..."
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:outline-none"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddLanguage}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 4: Recurring Weekly Availability Slots */}
        <Card className="p-6 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Weekly Availability Slots</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={handleAddSlot}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Slot</span>
            </Button>
          </div>

          <div className="space-y-3">
            {availableSlots.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No recurring slots added. Click "Add Slot" above to define when students can book sessions.
              </p>
            ) : (
              availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => handleSlotChange(slot.id, 'dayOfWeek', e.target.value)}
                    className="w-full sm:w-36 rounded-md border border-slate-300 py-1.5 px-2 text-xs bg-white"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2 w-full sm:flex-1">
                    <input
                      type="text"
                      placeholder="Start (e.g. 10:00 AM)"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(slot.id, 'startTime', e.target.value)}
                      className="flex-1 rounded-md border border-slate-300 py-1.5 px-2 text-xs bg-white"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="text"
                      placeholder="End (e.g. 11:00 AM)"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(slot.id, 'endTime', e.target.value)}
                      className="flex-1 rounded-md border border-slate-300 py-1.5 px-2 text-xs bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Remove Slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Bottom Save Action */}
        <div className="flex justify-end gap-3 pt-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
