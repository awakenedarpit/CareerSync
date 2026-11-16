import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  Link2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Save,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  Info,
  Loader2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import ProgressBar from '../../components/ui/ProgressBar';
import studentProfileService from '../../services/studentProfileService';
import authService from '../../services/authService';
import { calculateProfileCompleteness } from '../../utils/profileCompleteness';
import { PLATFORM_CONFIG } from '../../components/profile/SocialPlatformIcons';
import { useToast } from '../../components/ui/ToastContext';

const DEFAULT_ROLES = [
  'Full Stack Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'DevOps & Cloud Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Mobile Application Developer',
  'Cybersecurity Analyst',
  'Product Engineer',
  'QA & Automation Engineer'
];

const DEFAULT_INDUSTRIES = [
  'FinTech',
  'Enterprise SaaS',
  'E-Commerce & Retail',
  'HealthTech & Bio',
  'Artificial Intelligence',
  'EdTech',
  'CyberSecurity',
  'CleanTech & Energy',
  'Automotive & EV',
  'Logistics & Supply Chain'
];

const DEFAULT_LOCATIONS = [
  'Remote',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Delhi-NCR',
  'Noida',
  'Gurgaon',
  'Chennai'
];

export default function StudentProfileEdit() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null); // 'personal' | 'contact' | 'social' | 'preferences' | 'all' | null
  const [alertMessage, setAlertMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    avatarUrl: '',
    bio: '',
    professionalSummary: '',
    careerObjective: '',
    dateOfBirth: '',
    gender: '',
    currentCity: '',
    state: '',
    country: 'India',
  });

  const [contactInfo, setContactInfo] = useState({
    loginEmail: '',
    personalEmail: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    preferredContactMethod: 'email',
    currentCity: '',
    state: '',
  });

  const [socialLinks, setSocialLinks] = useState({
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    leetcodeUrl: '',
    hackerrankUrl: '',
    codeforcesUrl: '',
    codechefUrl: '',
    kaggleUrl: '',
    geeksforgeeksUrl: '',
    personalWebsiteUrl: '',
    customLinks: [], // Array of { id?: string, platform: string, url: string, label?: string }
  });

  const [academicInfo, setAcademicInfo] = useState({
    rollNumber: '',
    department: '',
    batchYear: '',
    degree: 'B.Tech',
    cgpa: '0.00',
    backlogCount: 0,
    currentSemester: '7th Semester',
    verified: true,
  });

  const [preferences, setPreferences] = useState({
    targetJobRoles: [],
    preferredIndustries: [],
    preferredLocations: [],
    preferredEmploymentTypes: ['full-time'],
    careerInterests: '',
    selfDeclaredSkills: [],
    profileVisibility: {
      tpoTeam: true,
      recruitersOnShare: false,
      professionalLinksVisible: true,
      contactDetailsHidden: true,
      portfolioOnShare: true,
    },
  });

  // Academic Correction Requests
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    fieldName: 'cgpa',
    currentValue: '',
    requestedValue: '',
    reason: '',
  });
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Custom Tag Inputs
  const [newRoleInput, setNewRoleInput] = useState('');
  const [newIndustryInput, setNewIndustryInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');

  // Fetch full profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu', 'priya.sharma21@college.edu'].includes(currentUser?.email);

      // Only attempt auto-session if unauthenticated in demo mode
      if (!authService.isAuthenticated() && isDemoStudent) {
        await authService.ensureAuthenticatedSession('student');
      }

      const res = await studentProfileService.getProfile();
      const profile = res?.data || res?.profile || res || {};

      // Populate personal info
      setPersonalInfo({
        name: profile.name || profile.user?.name || profile.user?.fullName || currentUser?.fullName || (isDemoStudent ? 'Aditya Sharma' : ''),
        avatarUrl: profile.avatarUrl || '',
        bio: profile.bio || '',
        professionalSummary: profile.professionalSummary || '',
        careerObjective: profile.careerObjective || '',
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).split('T')[0] : '',
        gender: profile.gender || '',
        currentCity: profile.currentCity || '',
        state: profile.state || '',
        country: profile.country || 'India',
      });

      // Populate contact info
      setContactInfo({
        loginEmail: profile.user?.email || profile.loginEmail || currentUser?.email || '',
        personalEmail: profile.personalEmail || '',
        phoneNumber: profile.phoneNumber || '',
        alternatePhoneNumber: profile.alternatePhoneNumber || '',
        preferredContactMethod: profile.preferredContactMethod || 'email',
        currentCity: profile.currentCity || '',
        state: profile.state || '',
      });

      // Populate social links
      setSocialLinks({
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        leetcodeUrl: profile.leetcodeUrl || '',
        hackerrankUrl: profile.hackerrankUrl || '',
        codeforcesUrl: profile.codeforcesUrl || '',
        codechefUrl: profile.codechefUrl || '',
        kaggleUrl: profile.kaggleUrl || '',
        geeksforgeeksUrl: profile.geeksforgeeksUrl || '',
        personalWebsiteUrl: profile.personalWebsiteUrl || '',
        customLinks: Array.isArray(profile.customLinks) ? profile.customLinks : [],
      });

      // Populate academic info
      setAcademicInfo({
        rollNumber: profile.rollNumber || (isDemoStudent ? 'CS2021-084' : ''),
        department: profile.department || (isDemoStudent ? 'Computer Science and Engineering' : ''),
        batchYear: profile.batchYear ? String(profile.batchYear) : (isDemoStudent ? '2025' : ''),
        degree: profile.degree || 'B.Tech',
        cgpa: profile.cgpa ? String(profile.cgpa) : (isDemoStudent ? '8.42' : '0.00'),
        backlogCount: profile.backlogCount ?? 0,
        currentSemester: profile.currentSemester || '7th Semester',
        verified: true,
      });

      // Populate preferences & privacy
      setPreferences({
        targetJobRoles: Array.isArray(profile.targetJobRoles) ? profile.targetJobRoles : (isDemoStudent ? ['Full Stack Engineer', 'Backend Engineer'] : []),
        preferredIndustries: Array.isArray(profile.preferredIndustries) ? profile.preferredIndustries : (isDemoStudent ? ['FinTech', 'Enterprise SaaS'] : []),
        preferredLocations: Array.isArray(profile.preferredLocations) ? profile.preferredLocations : (isDemoStudent ? ['Bangalore', 'Remote', 'Pune'] : []),
        preferredEmploymentTypes: Array.isArray(profile.preferredEmploymentTypes) ? profile.preferredEmploymentTypes : ['full-time'],
        careerInterests: profile.careerInterests || '',
        selfDeclaredSkills: Array.isArray(profile.selfDeclaredSkills) ? profile.selfDeclaredSkills : [],
        profileVisibility: {
          tpoTeam: profile.profileVisibility?.tpoTeam ?? true,
          recruitersOnShare: profile.profileVisibility?.recruitersOnShare ?? false,
          professionalLinksVisible: profile.profileVisibility?.professionalLinksVisible ?? true,
          contactDetailsHidden: profile.profileVisibility?.contactDetailsHidden ?? true,
          portfolioOnShare: profile.profileVisibility?.portfolioOnShare ?? true,
        },
      });

      // Populate correction requests
      if (Array.isArray(profile.correctionRequests)) {
        setCorrectionRequests(profile.correctionRequests);
      } else {
        try {
          const reqRes = await studentProfileService.getCorrectionRequests();
          const reqs = reqRes?.data || reqRes?.requests || reqRes || [];
          if (Array.isArray(reqs)) setCorrectionRequests(reqs);
        } catch {
          // ignore error if secondary endpoint empty
        }
      }
    } catch (err) {
      console.warn('Profile fetch note (using fallback state):', err.message);
      if (err.status === 401 || err.code === 'MISSING_BEARER_TOKEN' || err.code === 'EMPTY_BEARER_TOKEN' || err.code === 'TOKEN_VERIFICATION_FAILED') {
        setAlertMessage({
          type: 'info',
          text: 'Viewing profile in offline preview mode. Sign in to synchronize live changes with college placement cell.',
        });
      } else {
        setAlertMessage({
          type: 'info',
          text: 'Loaded local session state. Backend profile sync will persist your updates when submitted.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Validation helper
  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Profile completeness preview
  const mergedProfileForCompleteness = {
    ...personalInfo,
    ...contactInfo,
    ...socialLinks,
    ...academicInfo,
    ...preferences,
  };
  const completeness = calculateProfileCompleteness(mergedProfileForCompleteness);

  // Tab definitions
  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'contact', label: 'Contact Details', icon: Phone },
    { id: 'social', label: 'Professional Links', icon: Link2 },
    { id: 'academic', label: 'Academic & Corrections', icon: GraduationCap },
    { id: 'preferences', label: 'Skills & Preferences', icon: Sparkles },
    { id: 'privacy', label: 'Privacy & Visibility', icon: ShieldCheck },
  ];

  // Save handler per section or global
  const handleSaveSection = async (sectionKey) => {
    try {
      setSavingSection(sectionKey);
      setAlertMessage(null);

      // Verify and ensure active student authentication session before saving
      const session = await authService.ensureAuthenticatedSession('student');
      if (!session.authenticated) {
        const authErrMsg = 'Your session has expired. Please sign in again to save your profile changes.';
        setAlertMessage({
          type: 'error',
          text: authErrMsg,
        });
        toast.error(authErrMsg);
        return;
      }

      if (sectionKey === 'personal' || sectionKey === 'all') {
        await studentProfileService.updatePersonalInfo({
          bio: personalInfo.bio,
          professionalSummary: personalInfo.professionalSummary || personalInfo.bio,
          careerObjective: personalInfo.careerObjective,
          avatarUrl: personalInfo.avatarUrl,
          dateOfBirth: personalInfo.dateOfBirth || null,
          gender: personalInfo.gender || null,
          currentCity: personalInfo.currentCity,
          state: personalInfo.state,
          country: personalInfo.country,
        });
      }

      if (sectionKey === 'contact' || sectionKey === 'all') {
        await studentProfileService.updateContactInfo({
          phoneNumber: contactInfo.phoneNumber,
          alternatePhoneNumber: contactInfo.alternatePhoneNumber,
          personalEmail: contactInfo.personalEmail,
          preferredContactMethod: contactInfo.preferredContactMethod,
          currentCity: personalInfo.currentCity,
          state: personalInfo.state,
        });
      }

      if (sectionKey === 'social' || sectionKey === 'all') {
        // Validate all urls
        const invalidUrls = Object.entries(socialLinks)
          .filter(([k, v]) => k.endsWith('Url') && v && !isValidUrl(v))
          .map(([k]) => PLATFORM_CONFIG[k]?.label || k);

        if (invalidUrls.length > 0) {
          throw new Error(`Please check invalid URL format for: ${invalidUrls.join(', ')}`);
        }

        await studentProfileService.updateSocialLinks({
          githubUrl: socialLinks.githubUrl,
          linkedinUrl: socialLinks.linkedinUrl,
          portfolioUrl: socialLinks.portfolioUrl,
          leetcodeUrl: socialLinks.leetcodeUrl,
          hackerrankUrl: socialLinks.hackerrankUrl,
          codeforcesUrl: socialLinks.codeforcesUrl,
          codechefUrl: socialLinks.codechefUrl,
          kaggleUrl: socialLinks.kaggleUrl,
          geeksforgeeksUrl: socialLinks.geeksforgeeksUrl,
          personalWebsiteUrl: socialLinks.personalWebsiteUrl,
          customLinks: socialLinks.customLinks,
        });
      }

      if (sectionKey === 'preferences' || sectionKey === 'privacy' || sectionKey === 'all') {
        await studentProfileService.updatePreferences({
          targetJobRoles: preferences.targetJobRoles,
          preferredIndustries: preferences.preferredIndustries,
          preferredLocations: preferences.preferredLocations,
          preferredEmploymentTypes: preferences.preferredEmploymentTypes,
          careerInterests: preferences.careerInterests,
          selfDeclaredSkills: preferences.selfDeclaredSkills,
          profileVisibility: preferences.profileVisibility,
        });
      }

      const successMsg = `${sectionKey === 'all' ? 'All profile sections' : `${tabs.find((t) => t.id === sectionKey)?.label || sectionKey}`} saved and synchronized with institutional database!`;
      setAlertMessage({
        type: 'success',
        text: successMsg,
      });
      toast.success(successMsg);
    } catch (err) {
      console.error('Save error:', err);
      let errMsg = err.message || 'Failed to save changes. Please review your entries.';
      if (err.status === 401 || err.code === 'MISSING_BEARER_TOKEN' || err.code === 'EMPTY_BEARER_TOKEN' || err.code === 'TOKEN_VERIFICATION_FAILED') {
        errMsg = 'Your session has expired or is unauthorized. Please sign in again.';
        authService.logout();
      }
      setAlertMessage({
        type: 'error',
        text: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setSavingSection(null);
    }
  };

  // Submit Academic Correction Request
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.requestedValue.trim() || !correctionForm.reason.trim()) {
      toast.warning('Please fill out the requested value and reason for TPO review.');
      return;
    }

    try {
      setSubmittingCorrection(true);
      const session = await authService.ensureAuthenticatedSession('student');
      if (!session.authenticated) {
        toast.error('Session expired. Please sign in again to submit correction requests.');
        return;
      }
      const res = await studentProfileService.submitAcademicCorrection({
        fieldName: correctionForm.fieldName,
        currentValue: correctionForm.currentValue || String(academicInfo[correctionForm.fieldName] || ''),
        requestedValue: correctionForm.requestedValue,
        reason: correctionForm.reason,
      });

      const newReq = res?.data || res?.request || {
        id: `local-${Date.now()}`,
        fieldName: correctionForm.fieldName,
        currentValue: correctionForm.currentValue,
        requestedValue: correctionForm.requestedValue,
        reason: correctionForm.reason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      setCorrectionRequests((prev) => [newReq, ...prev]);
      setIsCorrectionModalOpen(false);
      setCorrectionForm({
        fieldName: 'cgpa',
        currentValue: '',
        requestedValue: '',
        reason: '',
      });
      const correctionMsg = 'Academic correction request submitted to College TPO team for review.';
      setAlertMessage({
        type: 'success',
        text: correctionMsg,
      });
      toast.success(correctionMsg);
    } catch (err) {
      const correctionErr = err.message || 'Failed to submit correction request.';
      setAlertMessage({
        type: 'error',
        text: correctionErr,
      });
      toast.error(correctionErr);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Add / Remove Custom Link
  const handleAddCustomLink = () => {
    setSocialLinks((prev) => ({
      ...prev,
      customLinks: [
        ...prev.customLinks,
        { platform: '', url: '', label: '' },
      ],
    }));
  };

  const handleUpdateCustomLink = (index, field, value) => {
    setSocialLinks((prev) => {
      const updated = [...prev.customLinks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customLinks: updated };
    });
  };

  const handleRemoveCustomLink = (index) => {
    setSocialLinks((prev) => ({
      ...prev,
      customLinks: prev.customLinks.filter((_, i) => i !== index),
    }));
  };

  // Multi-select toggle helpers
  const toggleArrayItem = (stateField, item) => {
    setPreferences((prev) => {
      const arr = prev[stateField] || [];
      const nextArr = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
      return { ...prev, [stateField]: nextArr };
    });
  };

  const addCustomArrayItem = (stateField, value, clearFn) => {
    if (!value || !value.trim()) return;
    const trimmed = value.trim();
    setPreferences((prev) => {
      const arr = prev[stateField] || [];
      if (arr.includes(trimmed)) return prev;
      return { ...prev, [stateField]: [...arr, trimmed] };
    });
    clearFn('');
  };

  const removeArrayItem = (stateField, item) => {
    setPreferences((prev) => ({
      ...prev,
      [stateField]: (prev[stateField] || []).filter((x) => x !== item),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#009669] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading student profile details...</p>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Student', href: '/student' },
    { label: 'My Profile', href: '/student/profile' },
    { label: 'Edit Profile' },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <PageHeader
        title="Edit Student Profile & Preferences"
        subtitle="Manage your personal background, external professional links, career preferences, and institutional privacy controls."
        breadcrumbs={breadcrumbs}
        action={
          <div className="flex items-center gap-2">
            <Button to="/student/profile" variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Cancel & View Profile
            </Button>
            <Button
              onClick={() => handleSaveSection('all')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'all' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving All...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 transition-all ${
            alertMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : alertMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {alertMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : alertMessage.type === 'info' ? (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <p className="font-medium leading-relaxed">{alertMessage.text}</p>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Profile Completeness Header Card */}
      <Card className="p-5 border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#004D36]">
                Live Profile Completeness
              </span>
              <Badge
                variant={completeness.score >= 80 ? 'emerald' : completeness.score >= 50 ? 'amber' : 'slate'}
                size="sm"
              >
                {completeness.score}% Completed
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Complete all sections to maximize your ranking score in automated recruiter search queries.
            </p>
          </div>

          <div className="w-full md:w-72">
            <ProgressBar
              value={completeness.score}
              max={100}
              showLabel
              label="Completeness Index"
              color={completeness.score >= 80 ? 'mint' : completeness.score >= 50 ? 'aqua' : 'amber'}
            />
          </div>
        </div>

        {/* Category Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
          {Object.entries(completeness.breakdown).map(([k, cat]) => {
            const isFull = cat.score >= cat.max;
            return (
              <div
                key={k}
                className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                  isFull ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className="text-[11px] font-medium text-slate-500 truncate">{cat.label}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`font-bold ${isFull ? 'text-emerald-700' : 'text-slate-800'}`}>
                    {cat.score} / {cat.max}
                  </span>
                  <span className="text-[10px] text-slate-400">pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestions chips */}
        {completeness.suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#009669]" />
              Suggested additions:
            </span>
            {completeness.suggestions.map((s, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-[#BDF9F9]/40 border border-[#02E8A7]/40 text-[#004D36] px-2 py-0.5 rounded-md"
              >
                {s.text}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Tabs Navigation */}
      <div className="overflow-x-auto pb-1">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} size="md" />
      </div>

      {/* TAB A: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <Card className="p-6 border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-[#009669]" />
                Personal Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your professional profile summary, career objective, and current residential location.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSection('personal')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'personal' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Personal Info
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name & Avatar */}
            <div>
              <Input
                label="Full Name"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                helperText="Official student name on academic transcripts."
              />
            </div>

            <div>
              <Input
                label="Avatar URL (Profile Photo)"
                value={personalInfo.avatarUrl}
                onChange={(e) => setPersonalInfo({ ...personalInfo, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                helperText="Direct image URL for your profile photo (HTTPS required)."
              />
            </div>

            {/* Avatar Preview */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#002020] text-[#02E8A7] flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 shadow-xs border border-[#02E8A7]/40">
                {personalInfo.avatarUrl && isValidUrl(personalInfo.avatarUrl) ? (
                  <img
                    src={personalInfo.avatarUrl}
                    alt={personalInfo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>
                    {personalInfo.name
                      ? personalInfo.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'ST'}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">Avatar Photo Preview</p>
                <p className="text-[11px] text-slate-500">
                  Visible to college TPO administrators and recruiter review panels.
                </p>
              </div>
            </div>

            {/* Date of Birth & Gender */}
            <div>
              <Input
                type="date"
                label="Date of Birth (Optional)"
                value={personalInfo.dateOfBirth}
                onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                helperText="Used only for corporate eligibility age verification if required."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Gender (Optional)</label>
              <select
                value={personalInfo.gender}
                onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]"
              >
                <option value="">Select Gender (Optional)</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
              <span className="text-xs text-slate-500">Voluntary declaration; never used for bias screening.</span>
            </div>

            {/* City, State, Country */}
            <div>
              <Input
                label="Current City"
                value={personalInfo.currentCity}
                onChange={(e) => setPersonalInfo({ ...personalInfo, currentCity: e.target.value })}
                placeholder="e.g. Bangalore"
              />
            </div>

            <div>
              <Input
                label="State / Province"
                value={personalInfo.state}
                onChange={(e) => setPersonalInfo({ ...personalInfo, state: e.target.value })}
                placeholder="e.g. Karnataka"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label="Country"
                value={personalInfo.country}
                onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
                placeholder="India"
              />
            </div>

            {/* Bio / Professional Summary */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Professional Bio & Career Summary
              </label>
              <textarea
                rows={3}
                value={personalInfo.bio}
                onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                placeholder="Brief summary of your technical engineering focus, key achievements, and passions..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]"
              />
              <span className="text-xs text-slate-500">
                A concise 2-3 sentence introduction displayed at the top of your candidate sheet.
              </span>
            </div>

            {/* Career Objective */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Career Objective</label>
              <textarea
                rows={2}
                value={personalInfo.careerObjective}
                onChange={(e) => setPersonalInfo({ ...personalInfo, careerObjective: e.target.value })}
                placeholder="Targeted objective for your initial post-graduate roles (e.g. Seeking high-scale cloud backend engineering positions)..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]"
              />
              <span className="text-xs text-slate-500">
                Clarifies your placement trajectory for matching job opportunities.
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB B: CONTACT INFORMATION */}
      {activeTab === 'contact' && (
        <Card className="p-6 border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#009669]" />
                Contact Information
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your phone numbers, personal email, and preferred communication method.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSection('contact')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'contact' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Contact Info
                </>
              )}
            </Button>
          </div>

          {/* Login Email Security Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Institutional Login Email Protection</p>
              <p className="leading-relaxed">
                Your authenticated login email (<strong className="font-semibold">{contactInfo.loginEmail}</strong>) is tied to your institutional single sign-on directory and college tenant. It cannot be altered directly. To update your college email address, submit an academic correction request in the Academic tab.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Input
                label="Primary Phone Number"
                value={contactInfo.phoneNumber}
                onChange={(e) => setContactInfo({ ...contactInfo, phoneNumber: e.target.value })}
                placeholder="+91 98765 43210"
                helperText="Used for interview notifications and placement drive alerts."
              />
            </div>

            <div>
              <Input
                label="Alternate Phone Number (Optional)"
                value={contactInfo.alternatePhoneNumber}
                onChange={(e) => setContactInfo({ ...contactInfo, alternatePhoneNumber: e.target.value })}
                placeholder="+91 91234 56789"
                helperText="Backup contact in case primary number is unreachable."
              />
            </div>

            <div>
              <Input
                label="Personal Email Address"
                value={contactInfo.personalEmail}
                onChange={(e) => setContactInfo({ ...contactInfo, personalEmail: e.target.value })}
                placeholder="priya.personal@gmail.com"
                helperText="Backup personal contact email for alumni and post-graduation records."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Preferred Contact Method</label>
              <select
                value={contactInfo.preferredContactMethod}
                onChange={(e) => setContactInfo({ ...contactInfo, preferredContactMethod: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]"
              >
                <option value="email">College & Personal Email</option>
                <option value="phone">Direct Phone Call</option>
                <option value="whatsapp">WhatsApp / SMS</option>
              </select>
              <span className="text-xs text-slate-500">Method used by TPO coordinators for urgent schedule updates.</span>
            </div>
          </div>
        </Card>
      )}

      {/* TAB C: PROFESSIONAL & SOCIAL LINKS */}
      {activeTab === 'social' && (
        <Card className="p-6 border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#009669]" />
                Professional & Social Links
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your code repositories, competitive coding handles, and professional portfolios.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSection('social')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'social' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Links
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
              const val = socialLinks[key] || '';
              const valid = isValidUrl(val);
              const IconComp = config.icon;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <div className={`p-1 rounded ${config.bg} ${config.color}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span>{config.label}</span>
                    </label>
                    {val && (
                      <div className="flex items-center gap-1">
                        {valid ? (
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-medium text-[#009669] hover:text-[#002020] flex items-center gap-1"
                          >
                            <span>Preview</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-500">Invalid URL</span>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="url"
                    value={val}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                    placeholder={config.placeholder}
                    className={`w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      !valid && val
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-300 focus:border-[#02E8A7] focus:ring-[#02E8A7]'
                    }`}
                  />
                  {!valid && val && (
                    <p className="text-[11px] text-rose-500">
                      Must be a valid web address starting with http:// or https://
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Custom Professional Links Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Custom Professional Links</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add custom profiles such as Behance, Medium, Dribbble, Substack, or research repositories.
                </p>
              </div>
              <Button onClick={handleAddCustomLink} variant="outline" size="xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Custom Link
              </Button>
            </div>

            {socialLinks.customLinks.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500 bg-slate-50/50">
                No custom links added yet. Click &quot;Add Custom Link&quot; to connect other developer profiles.
              </div>
            ) : (
              <div className="space-y-3">
                {socialLinks.customLinks.map((item, index) => {
                  const valid = isValidUrl(item.url);
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="w-full sm:w-1/3">
                        <Input
                          placeholder="Platform (e.g. Behance, Medium)"
                          value={item.platform}
                          onChange={(e) => handleUpdateCustomLink(index, 'platform', e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-1/2">
                        <Input
                          placeholder="https://..."
                          value={item.url}
                          onChange={(e) => handleUpdateCustomLink(index, 'url', e.target.value)}
                          error={!valid && item.url ? 'Invalid URL' : undefined}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.url && valid && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[#009669] hover:bg-[#BDF9F9]/30 rounded-lg transition-colors"
                            title="Open Link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomLink(index)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* TAB D: ACADEMIC & CORRECTIONS */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <Card className="p-6 border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#009669]" />
                  Academic Records (Institution-Verified)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These records are certified by your university administration and cannot be directly edited.
                </p>
              </div>
              <Button
                onClick={() => setIsCorrectionModalOpen(true)}
                variant="outline"
                size="sm"
                className="text-[#009669] border-[#02E8A7]/40 hover:bg-[#BDF9F9]/30"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
                Request Academic Correction
              </Button>
            </div>

            {/* Read-Only Academic Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Student Roll Number
                </span>
                <span className="text-sm font-bold text-slate-900">{academicInfo.rollNumber}</span>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>College Verified</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Department & Branch
                </span>
                <span className="text-sm font-bold text-slate-900">{academicInfo.department}</span>
                <span className="text-[11px] text-slate-500 block pt-1">{academicInfo.degree}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Batch Graduation Year
                </span>
                <span className="text-sm font-bold text-slate-900">{academicInfo.batchYear}</span>
                <span className="text-[11px] text-slate-500 block pt-1">4-Year Degree Program</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Cumulative CGPA
                </span>
                <span className="text-xl font-black text-[#009669]">{academicInfo.cgpa} / 10.0</span>
                <span className="text-[11px] text-slate-500 block">Calculated over all completed semesters</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Current Standing
                </span>
                <span className="text-sm font-bold text-slate-900">{academicInfo.currentSemester}</span>
                <span className="text-[11px] text-slate-500 block pt-1">Final Year Placement Drive Cycle</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">
                  Active Backlogs
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {academicInfo.backlogCount === 0 ? (
                    <span className="text-emerald-600 font-bold">0 Backlogs (Clear)</span>
                  ) : (
                    <span className="text-rose-600 font-bold">{academicInfo.backlogCount} Active</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 block pt-1">Eligibility status: Qualified</span>
              </div>
            </div>
          </Card>

          {/* Academic Correction Requests History */}
          <Card className="p-6 border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Academic Correction History</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audit trail of correction requests submitted to the college TPO cell.
                </p>
              </div>
              <Badge variant="aqua" size="sm">
                {correctionRequests.length} Requests
              </Badge>
            </div>

            {correctionRequests.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No correction requests submitted</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  If any verified academic detail is incorrect, click &quot;Request Academic Correction&quot; above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {correctionRequests.map((req) => (
                  <div key={req.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 capitalize">
                          {req.fieldName.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <Badge
                          variant={
                            req.status === 'APPROVED'
                              ? 'emerald'
                              : req.status === 'REJECTED'
                              ? 'rose'
                              : req.status === 'UNDER_REVIEW'
                              ? 'aqua'
                              : 'amber'
                          }
                          size="xs"
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        Requested: <strong className="text-slate-900 font-semibold">{req.requestedValue}</strong> (Current: {req.currentValue || 'N/A'})
                      </p>
                      <p className="text-[11px] text-slate-400">Reason: {req.reason}</p>
                      {req.reviewNote && (
                        <p className="text-[11px] text-[#009669] font-medium">TPO Note: {req.reviewNote}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB E: SKILLS & PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card className="p-6 border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#009669]" />
                Skills & Career Preferences
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Declare career preferences, target roles, preferred locations, and self-reported skills.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSection('preferences')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'preferences' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>

          {/* Self-Declared Skills Notice Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Verified Skills vs. Self-Declared Skills Notice</p>
              <p className="leading-relaxed">
                Verified skills require code repository evidence, document proof, and college TPO verification in the{' '}
                <Link to="/student/skills" className="font-semibold underline hover:text-amber-950">
                  Skills & Evidence Portal
                </Link>
                . Self-declared skills entered here help customize career recommendations and job alerts, but are not marked as verified on official recruiter shortlists.
              </p>
            </div>
          </div>

          {/* Self-declared Skills Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Self-Declared Technical Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(preferences.selfDeclaredSkills || []).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-medium border border-slate-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('selfDeclaredSkills', skill)}
                    className="hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Add skill (e.g. GraphQL, AWS, Next.js)"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArrayItem('selfDeclaredSkills', newSkillInput, setNewSkillInput);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addCustomArrayItem('selfDeclaredSkills', newSkillInput, setNewSkillInput)}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Target Job Roles */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Target Job Roles</label>
            <p className="text-xs text-slate-500">Select all career paths you wish to be considered for:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {DEFAULT_ROLES.map((role) => {
                const isSelected = (preferences.targetJobRoles || []).includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleArrayItem('targetJobRoles', role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#002020] text-[#02E8A7] shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {role} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
            {/* Custom role adder */}
            <div className="flex gap-2 max-w-md pt-2">
              <Input
                placeholder="Add other target role..."
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArrayItem('targetJobRoles', newRoleInput, setNewRoleInput);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addCustomArrayItem('targetJobRoles', newRoleInput, setNewRoleInput)}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Preferred Industries */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Preferred Industries</label>
            <p className="text-xs text-slate-500">Filter placements by business domain:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {DEFAULT_INDUSTRIES.map((ind) => {
                const isSelected = (preferences.preferredIndustries || []).includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleArrayItem('preferredIndustries', ind)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#009669] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {ind} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 max-w-md pt-2">
              <Input
                placeholder="Add other industry..."
                value={newIndustryInput}
                onChange={(e) => setNewIndustryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArrayItem('preferredIndustries', newIndustryInput, setNewIndustryInput);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addCustomArrayItem('preferredIndustries', newIndustryInput, setNewIndustryInput)}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Preferred Work Locations */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Preferred Work Locations</label>
            <p className="text-xs text-slate-500">Select cities or remote preference:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {DEFAULT_LOCATIONS.map((loc) => {
                const isSelected = (preferences.preferredLocations || []).includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleArrayItem('preferredLocations', loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {loc} {isSelected ? '✓' : '+'}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 max-w-md pt-2">
              <Input
                placeholder="Add other city / country..."
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomArrayItem('preferredLocations', newLocationInput, setNewLocationInput);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => addCustomArrayItem('preferredLocations', newLocationInput, setNewLocationInput)}
                variant="outline"
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Preferred Employment Types */}
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Preferred Employment Types</label>
            <div className="flex gap-4 pt-1">
              {[
                { id: 'full-time', label: 'Full-time Placement' },
                { id: 'internship', label: 'Pre-Placement Internship' },
                { id: 'contract', label: 'Contract / Co-op' },
              ].map((emp) => {
                const isChecked = (preferences.preferredEmploymentTypes || []).includes(emp.id);
                return (
                  <label key={emp.id} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleArrayItem('preferredEmploymentTypes', emp.id)}
                      className="rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] w-4 h-4"
                    />
                    <span>{emp.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* TAB F: PRIVACY & VISIBILITY CONTROLS */}
      {activeTab === 'privacy' && (
        <Card className="p-6 border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#009669]" />
                Profile Privacy & Visibility Controls
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Granular student consent controls governing who can view your credentials and evidence.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSection('privacy')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'privacy' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Privacy Settings
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {/* Consent Item 1: Visible to College TPO team */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="tpoTeam"
                checked={preferences.profileVisibility.tpoTeam}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    profileVisibility: {
                      ...preferences.profileVisibility,
                      tpoTeam: e.target.checked,
                    },
                  })
                }
                className="mt-1 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] w-4 h-4"
              />
              <div className="space-y-0.5">
                <label htmlFor="tpoTeam" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Visible to college Training & Placement Officer (TPO) team
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Allows campus placement officers to review academic eligibility, map company drives, and verify skills. (Default: Enabled)
                </p>
              </div>
            </div>

            {/* Consent Item 2: Visible to recruiters when explicitly shared */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="recruitersOnShare"
                checked={preferences.profileVisibility.recruitersOnShare}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    profileVisibility: {
                      ...preferences.profileVisibility,
                      recruitersOnShare: e.target.checked,
                    },
                  })
                }
                className="mt-1 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] w-4 h-4"
              />
              <div className="space-y-0.5">
                <label htmlFor="recruitersOnShare" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Visible to verified corporate recruiters when explicitly shared
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  When disabled, your candidate profile is strictly hidden from general recruiter search pools until you apply to their drive.
                </p>
              </div>
            </div>

            {/* Consent Item 3: Professional links visible */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="professionalLinksVisible"
                checked={preferences.profileVisibility.professionalLinksVisible}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    profileVisibility: {
                      ...preferences.profileVisibility,
                      professionalLinksVisible: e.target.checked,
                    },
                  })
                }
                className="mt-1 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] w-4 h-4"
              />
              <div className="space-y-0.5">
                <label htmlFor="professionalLinksVisible" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Professional & coding links visible to recruiters
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Permits authorized recruiters to inspect connected GitHub repositories, LeetCode ratings, and coding platform ranks.
                </p>
              </div>
            </div>

            {/* Consent Item 4: Contact details hidden */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="contactDetailsHidden"
                checked={preferences.profileVisibility.contactDetailsHidden}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    profileVisibility: {
                      ...preferences.profileVisibility,
                      contactDetailsHidden: e.target.checked,
                    },
                  })
                }
                className="mt-1 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] w-4 h-4"
              />
              <div className="space-y-0.5">
                <label htmlFor="contactDetailsHidden" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Contact details hidden from recruiters by default (Privacy Guard)
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hides personal phone number and home location until an official interview invitation or job offer is extended.
                </p>
              </div>
            </div>

            {/* Consent Item 5: Portfolio visible when explicitly shared */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3.5">
              <input
                type="checkbox"
                id="portfolioOnShare"
                checked={preferences.profileVisibility.portfolioOnShare}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    profileVisibility: {
                      ...preferences.profileVisibility,
                      portfolioOnShare: e.target.checked,
                    },
                  })
                }
                className="mt-1 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] w-4 h-4"
              />
              <div className="space-y-0.5">
                <label htmlFor="portfolioOnShare" className="text-sm font-bold text-slate-900 cursor-pointer">
                  Portfolio and projects visible when explicitly shared
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Allows evaluated technical project evidence cards to be reviewed by campus hiring evaluators.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Global Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Profile Completeness: <strong className="text-slate-900">{completeness.score}%</strong>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="hidden sm:inline text-xs text-slate-500">
              Editing: <strong className="text-[#009669]">{tabs.find((t) => t.id === activeTab)?.label}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={() => {
                if (window.confirm('Reset unsaved changes to original values?')) {
                  loadProfile();
                }
              }}
              variant="outline"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
            <Button
              to="/student/profile"
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveSection(activeTab)}
              variant="outline"
              size="sm"
              disabled={Boolean(savingSection)}
              className="text-[#009669] border-[#02E8A7]/40 hover:bg-[#BDF9F9]/30"
            >
              {savingSection === activeTab ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Saving Tab...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save Tab
                </>
              )}
            </Button>
            <Button
              onClick={() => handleSaveSection('all')}
              variant="primary"
              size="sm"
              disabled={Boolean(savingSection)}
            >
              {savingSection === 'all' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Saving All...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal: Request Academic Correction */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Request Academic Record Correction"
        subtitle="Submit a formal change request to the College Placement Cell (TPO) with supporting justification."
      >
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Academic Field to Correct</label>
            <select
              value={correctionForm.fieldName}
              onChange={(e) => {
                const f = e.target.value;
                setCorrectionForm({
                  ...correctionForm,
                  fieldName: f,
                  currentValue: String(academicInfo[f] || ''),
                });
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]"
            >
              <option value="cgpa">Cumulative CGPA</option>
              <option value="department">Department / Branch</option>
              <option value="batchYear">Batch Graduation Year</option>
              <option value="degree">Degree Title</option>
              <option value="currentSemester">Current Semester</option>
              <option value="backlogCount">Backlog Count</option>
              <option value="rollNumber">Student Roll Number</option>
              <option value="loginEmail">Institutional Login Email</option>
            </select>
          </div>

          <div>
            <Input
              label="Current Verified Value"
              value={correctionForm.currentValue || String(academicInfo[correctionForm.fieldName] || '')}
              onChange={(e) => setCorrectionForm({ ...correctionForm, currentValue: e.target.value })}
              placeholder="e.g. 8.42"
            />
          </div>

          <div>
            <Input
              label="Requested Correct Value"
              value={correctionForm.requestedValue}
              onChange={(e) => setCorrectionForm({ ...correctionForm, requestedValue: e.target.value })}
              placeholder="e.g. 8.75 (Re-evaluated 6th Sem Marksheet)"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Reason / Justification</label>
            <textarea
              rows={3}
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              placeholder="Provide reason for correction (e.g. Grade re-evaluation completed by exam cell; marksheet uploaded to document vault)..."
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCorrectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submittingCorrection}
            >
              {submittingCorrection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request to TPO'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
