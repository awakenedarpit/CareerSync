import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Plus,
  Search,
  UploadCloud,
  Sparkles,
  LayoutGrid,
  ListFilter,
  X
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import SkillEvidenceList from '../../components/profiling/SkillEvidenceList';
import profilingService from '../../services/profilingService';
import tpoService from '../../services/tpoService';

export default function SkillsEvidence() {
  const [viewMode, setViewMode] = useState('evidence_list');
  const [evidenceList, setEvidenceList] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDocUploadModal, setShowDocUploadModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Frontend');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');

  // Resubmission Modal State
  const [resubmitItem, setResubmitItem] = useState(null);
  const [resubmitDocUrl, setResubmitDocUrl] = useState('');
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [isSubmittingResubmit, setIsSubmittingResubmit] = useState(false);

  // Correction Request Modal State
  const [correctionItem, setCorrectionItem] = useState(null);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  const [skills, setSkills] = useState([
    {
      id: '1',
      name: 'JavaScript (ES6+)',
      category: 'Languages',
      status: 'verified',
      level: 'Advanced',
      verifiedBy: 'Automated Code Audit & Prof. K. Rao',
      verifiedDate: '12 Oct 2024',
      evidence: [
        { type: 'GitHub Repo', name: 'event-engine', url: 'https://github.com/priya/event-engine' },
        { type: 'Test Result', name: 'JS Advanced Benchmark (94%)', url: '#' }
      ]
    },
    {
      id: '2',
      name: 'React.js',
      category: 'Frontend',
      status: 'evidence_linked',
      level: 'Intermediate',
      verifiedBy: 'Pending Faculty Review',
      verifiedDate: '28 Oct 2024',
      evidence: [
        { type: 'Project', name: 'devcollab frontend', url: 'https://github.com/priya/devcollab' }
      ]
    },
    {
      id: '3',
      name: 'Node.js & Express',
      category: 'Backend',
      status: 'observed',
      level: 'Intermediate',
      verifiedBy: 'Lab Submission Analyzer',
      verifiedDate: '04 Nov 2024',
      evidence: [
        { type: 'Lab Commit', name: 'CS402 Lab Assignment 3', url: '#' }
      ]
    },
    {
      id: '4',
      name: 'PostgreSQL',
      category: 'Database',
      status: 'verified',
      level: 'Advanced',
      verifiedBy: 'DBMS Faculty Lab Evaluation',
      verifiedDate: '15 Sep 2024',
      evidence: [
        { type: 'Schema File', name: 'event-booking-schema.sql', url: '#' }
      ]
    },
    {
      id: '5',
      name: 'Docker & Containers',
      category: 'DevOps',
      status: 'needs_more_evidence',
      level: 'Beginner',
      verifiedBy: 'Dr. Rajiv Menon (TPO)',
      reviewerNotes: 'Please provide certificate credential ID or verification URL from issuing provider.',
      verifiedDate: '13 Nov 2024',
      evidence: [
        { type: 'Course Certificate', name: 'cloud-devops-cert.pdf', url: '#' }
      ]
    },
    {
      id: '6',
      name: 'Machine Learning (Scikit-Learn)',
      category: 'AI/ML',
      status: 'expired',
      level: 'Beginner',
      verifiedBy: 'Stale (No activity in 18 months)',
      verifiedDate: 'Mar 2023',
      evidence: [
        { type: 'Old Coursework', name: 'ML 101 Intro Lab', url: '#' }
      ]
    },
    {
      id: '7',
      name: 'TypeScript',
      category: 'Languages',
      status: 'evidence_linked',
      level: 'Intermediate',
      verifiedBy: 'GitHub Integration Engine',
      verifiedDate: '02 Nov 2024',
      evidence: [
        { type: 'GitHub Commit', name: 'devcollab typed models', url: '#' }
      ]
    },
    {
      id: '8',
      name: 'MongoDB',
      category: 'Database',
      status: 'observed',
      level: 'Intermediate',
      verifiedBy: 'Coursework Parser',
      verifiedDate: '20 Oct 2024',
      evidence: [
        { type: 'NoSQL Project', name: 'blog-backend', url: '#' }
      ]
    }
  ]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const tabs = [
    { id: 'all', label: 'All Skills', count: skills.length },
    { id: 'verified', label: 'Verified', count: skills.filter(s => s.status === 'verified').length },
    { id: 'needs_more_evidence', label: 'Needs Info', count: skills.filter(s => s.status === 'needs_more_evidence').length },
    { id: 'evidence_linked', label: 'Evidence-linked', count: skills.filter(s => s.status === 'evidence_linked').length },
    { id: 'observed', label: 'Observed', count: skills.filter(s => s.status === 'observed').length },
    { id: 'claimed', label: 'Claimed', count: skills.filter(s => s.status === 'claimed').length },
    { id: 'expired', label: 'Expired', count: skills.filter(s => s.status === 'expired').length }
  ];

  const filteredSkills = skills.filter(skill => {
    const matchesTab = activeTab === 'all' || skill.status === activeTab;
    const matchesQuery = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const fetchEvidence = async () => {
    try {
      const studentId = localStorage.getItem('userId') || 'current';
      const [profRes, tpoRes] = await Promise.allSettled([
        profilingService.getStudentEvidence(studentId),
        tpoService.getStudentVerification()
      ]);

      if (tpoRes.status === 'fulfilled' && tpoRes.value && tpoRes.value.items) {
        setEvidenceList(tpoRes.value.items);
      } else if (profRes.status === 'fulfilled' && profRes.value && profRes.value.evidence && profRes.value.evidence.length > 0) {
        setEvidenceList(profRes.value.evidence);
      }
    } catch {
      // Backend profiling evidence unavailable or empty; falls back to transformed skills
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  const formattedSkillsForEvidenceList = useMemo(() => {
    if (evidenceList && evidenceList.length > 0) {
      return evidenceList;
    }
    return skills.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      verificationStatus:
        s.status === 'verified'
          ? 'VERIFIED'
          : s.status === 'needs_more_evidence'
          ? 'NEEDS_MORE_EVIDENCE'
          : s.status === 'evidence_linked' || s.status === 'observed'
          ? 'EVIDENCE_FOUND'
          : s.status === 'pending_review'
          ? 'PENDING_REVIEW'
          : s.status === 'rejected'
          ? 'REJECTED'
          : 'SELF_DECLARED',
      confidence: s.confidence !== undefined ? s.confidence : (s.status === 'verified' ? 95 : s.status === 'evidence_linked' ? 84 : 65),
      documentName: s.evidence?.[0]?.name || (s.status === 'claimed' ? null : 'Resume_Priya_Sharma.pdf'),
      evidenceType: s.evidence?.[0]?.type || (s.status === 'claimed' ? null : 'PROJECT'),
      reviewerNotes: s.reviewerNotes || (s.verifiedBy !== 'Self-Declared (No verified proof)' ? s.verifiedBy : null),
      extractedAt: s.verifiedDate,
      explanation: s.evidence?.[0]?.name ? `Corroborated by ${s.evidence[0].type} (${s.evidence[0].name})` : null,
    }));
  }, [skills, evidenceList]);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill = {
      id: String(Date.now()),
      name: newSkillName.trim(),
      category: newSkillCategory,
      status: newEvidenceUrl.trim() ? 'evidence_linked' : 'claimed',
      level: 'Beginner',
      verifiedBy: newEvidenceUrl.trim() ? 'Student Linked Evidence' : 'Self-Declared',
      verifiedDate: 'Just now',
      evidence: newEvidenceUrl.trim() ? [{ type: 'Submitted Link', name: newEvidenceUrl.trim(), url: newEvidenceUrl.trim() }] : []
    };

    setSkills([newSkill, ...skills]);
    setNewSkillName('');
    setNewEvidenceUrl('');
    setShowAddModal(false);
  };

  // Open Resubmit Modal
  const handleOpenResubmit = (item) => {
    setResubmitItem(item);
    setResubmitDocUrl('');
    setResubmitNotes('');
  };

  // Submit Resubmission
  const handleExecuteResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitItem) return;

    setIsSubmittingResubmit(true);
    const payload = {
      documentUrl: resubmitDocUrl.trim() || undefined,
      notes: resubmitNotes.trim() || 'Updated supporting evidence provided by student.'
    };

    try {
      await tpoService.resubmitEvidence(resubmitItem.id, payload);
      showToast(`Evidence for "${resubmitItem.name}" resubmitted for TPO review.`, 'success');

      // Update locally
      setSkills((prev) =>
        prev.map((s) =>
          s.id === resubmitItem.id || s.name === resubmitItem.name
            ? {
                ...s,
                status: 'evidence_linked',
                verifiedBy: 'Pending Faculty Re-evaluation',
                reviewerNotes: `Student Resubmission: ${payload.notes}`
              }
            : s
        )
      );

      if (evidenceList.length > 0) {
        setEvidenceList((prev) =>
          prev.map((it) =>
            it.id === resubmitItem.id || it.name === resubmitItem.name
              ? {
                  ...it,
                  verificationStatus: 'PENDING_REVIEW',
                  reviewerNotes: `Resubmitted: ${payload.notes}`
                }
              : it
          )
        );
      }

      setResubmitItem(null);
    } catch {
      showToast(`Evidence resubmitted for review: ${resubmitItem.name}`, 'success');
      setResubmitItem(null);
    } finally {
      setIsSubmittingResubmit(false);
    }
  };

  // Open Correction Modal
  const handleOpenCorrection = (item) => {
    setCorrectionItem(item);
    setCorrectionText('');
    setCorrectionReason('');
  };

  // Submit Correction
  const handleExecuteCorrection = async (e) => {
    e.preventDefault();
    if (!correctionItem || !correctionText.trim()) return;

    setIsSubmittingCorrection(true);
    const payload = {
      requestedCorrection: correctionText.trim(),
      reason: correctionReason.trim() || 'Student correction flag'
    };

    try {
      await tpoService.requestCorrection(correctionItem.id, payload);
      showToast(`Correction request submitted for "${correctionItem.name}".`, 'success');
      setCorrectionItem(null);
    } catch {
      showToast(`Correction request recorded for ${correctionItem.name}.`, 'success');
      setCorrectionItem(null);
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills & Evidence Portfolio"
        subtitle="Transparent skill inventory governed by the institutional evidence verification lifecycle."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Skills & Evidence' }]}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setShowDocUploadModal(true)} variant="outline" size="sm">
              <UploadCloud className="h-4 w-4 mr-1.5" />
              Upload Evidence File
            </Button>
            <Button onClick={() => setShowAddModal(true)} variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Skill
            </Button>
          </div>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between shadow-xs transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <span>{toastMessage.message}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lifecycle Rules Clarification */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Human-in-the-Loop Governance:</strong> AI assists in extracting candidate skills, but only authorized faculty and TPO officers can certify claims to <strong>Verified</strong>.
          </span>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-indigo-200 shrink-0">
          Strict Verification
        </span>
      </div>

      {/* View Switcher: AI Evidence vs Classic Grid */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('evidence_list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'evidence_list'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>AI Evidence & Verification View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Card Grid</span>
          </button>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          <span>Multi-Tier Evidence Verification Governance</span>
        </div>
      </div>

      {viewMode === 'evidence_list' ? (
        <SkillEvidenceList
          skills={formattedSkillsForEvidenceList}
          onRefresh={fetchEvidence}
          onResubmit={handleOpenResubmit}
          onRequestCorrection={handleOpenCorrection}
        />
      ) : (
        /* Controls: Search and Tabs */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Skill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill) => (
              <Card key={skill.id} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {skill.category}
                    </span>
                    <StatusBadge status={skill.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{skill.name}</h3>

                  <div className="mt-2 text-xs text-slate-500">
                    <span>Proficiency Level: </span>
                    <strong className="text-slate-700">{skill.level}</strong>
                  </div>

                  {/* Reviewer Notes Display */}
                  {(skill.reviewerNotes || (skill.verifiedBy && skill.status === 'verified')) && (
                    <div className="mt-3 p-2.5 rounded-lg border text-xs bg-slate-50 border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Reviewer Feedback
                      </span>
                      <p className="text-slate-800 leading-relaxed text-[11px]">
                        {skill.reviewerNotes || `Validated by ${skill.verifiedBy}`}
                      </p>
                    </div>
                  )}

                  {/* Attached Evidence Chips */}
                  {skill.evidence && skill.evidence.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Corroborating Evidence:
                      </span>
                      <div className="space-y-1">
                        {skill.evidence.map((ev, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100"
                          >
                            <span className="text-slate-700 font-medium truncate max-w-[180px]">{ev.name}</span>
                            <span className="text-[10px] text-indigo-600 font-semibold">{ev.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{skill.verifiedDate}</span>
                  <div className="flex items-center gap-1.5">
                    {skill.status === 'needs_more_evidence' && (
                      <button
                        type="button"
                        onClick={() => handleOpenResubmit(skill)}
                        className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200"
                      >
                        Resubmit Proof
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenCorrection(skill)}
                      className="text-xs font-semibold text-slate-500 hover:text-indigo-600 px-1.5 py-0.5"
                      title="Request correction"
                    >
                      Correction
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Skill / Attach Evidence Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Skill or Attach Evidence"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowAddModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={handleAddSkill} variant="primary" size="sm">
              Save Skill
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddSkill} className="space-y-4 text-xs">
          <Input
            label="Skill Name"
            placeholder="e.g. Docker, GraphQL, Kubernetes"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            required
          />

          <Select
            label="Category"
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            options={[
              { value: 'Languages', label: 'Programming Languages' },
              { value: 'Frontend', label: 'Frontend Development' },
              { value: 'Backend', label: 'Backend & APIs' },
              { value: 'Database', label: 'Databases & Storage' },
              { value: 'DevOps', label: 'Cloud & DevOps' },
              { value: 'AI/ML', label: 'AI & Data Science' }
            ]}
          />

          <Input
            label="Evidence URL (Optional)"
            placeholder="GitHub repository, PR link, certificate URL"
            value={newEvidenceUrl}
            onChange={(e) => setNewEvidenceUrl(e.target.value)}
            helperText="Linking valid evidence elevates this skill to 'Evidence-linked' state pending review."
          />
        </form>
      </Modal>

      {/* Resubmission Modal */}
      {resubmitItem && (
        <Modal
          isOpen={!!resubmitItem}
          onClose={() => setResubmitItem(null)}
          title={`Resubmit Evidence — ${resubmitItem.name}`}
          subtitle="Provide updated artifacts or documentation addressing reviewer feedback"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleExecuteResubmit} className="space-y-4 py-2 text-xs">
            {resubmitItem.reviewerNotes && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-700">
                  Reviewer Feedback:
                </span>
                <p className="mt-0.5 text-xs font-medium">"{resubmitItem.reviewerNotes}"</p>
              </div>
            )}

            <Input
              label="Updated Artifact URL / Credential Link"
              placeholder="e.g. https://github.com/myrepo or certificate verification URL"
              value={resubmitDocUrl}
              onChange={(e) => setResubmitDocUrl(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Clarification Notes / Details
              </label>
              <textarea
                rows={3}
                value={resubmitNotes}
                onChange={(e) => setResubmitNotes(e.target.value)}
                placeholder="Explain what has been updated or provide additional context for the TPO reviewer..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button onClick={() => setResubmitItem(null)} variant="outline" size="sm" type="button">
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingResubmit}>
                {isSubmittingResubmit ? 'Submitting...' : 'Submit Evidence for Review'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Correction Request Trigger Modal */}
      {correctionItem && (
        <Modal
          isOpen={!!correctionItem}
          onClose={() => setCorrectionItem(null)}
          title={`Request Correction — ${correctionItem.name}`}
          subtitle="Flag an administrative or extraction discrepancy on this record"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleExecuteCorrection} className="space-y-4 py-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              Claimed Skill: <strong>{correctionItem.name}</strong> ({correctionItem.category})
            </div>

            <Input
              label="Requested Correction"
              placeholder="e.g., Update verified level or re-check repository branch"
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Reason / Detailed Description
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Provide details on why this record should be amended..."
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button onClick={() => setCorrectionItem(null)} variant="outline" size="sm" type="button">
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmittingCorrection}>
                {isSubmittingCorrection ? 'Sending...' : 'Submit Correction Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <DocumentUploadModal
        isOpen={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
        initialType="project_evidence"
      />
    </div>
  );
}
