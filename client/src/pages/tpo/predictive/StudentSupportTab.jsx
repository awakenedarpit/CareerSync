import React, { useState } from 'react';
import {
  HeartHandshake,
  UserCheck,
  Check,
  Edit3,
  HelpCircle,
  Code2,
  Terminal,
  FolderGit2,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { SUPPORT_CATEGORIES, INTERVENTION_STATUSES } from '../../../services/predictiveAnalyticsService';

export default function StudentSupportTab({
  recommendations = [],
  onReviewSupport,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [assignedMentor, setAssignedMentor] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredItems = recommendations.filter((item) => {
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchStat = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchCat && matchStat;
  });

  const openReviewModal = (item) => {
    setReviewingItem(item);
    setReviewStatus(item.status === 'IDENTIFIED' ? 'APPROVED' : item.status);
    setAssignedMentor(item.assignedMentor || 'TPO Placement Cell');
    setReviewNotes(item.reviewNotes || '');
  };

  const handleSaveReview = async () => {
    if (!reviewingItem) return;
    try {
      setSubmitting(true);
      await onReviewSupport?.(reviewingItem.id, {
        status: reviewStatus,
        assignedMentor,
        reviewNotes,
      });
      setReviewingItem(null);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (categoryKey) => {
    switch (categoryKey) {
      case 'SKILL_DEVELOPMENT':
        return Code2;
      case 'ASSESSMENT_PRACTICE':
        return Terminal;
      case 'PROJECT_GUIDANCE':
        return FolderGit2;
      case 'PROFILE_COMPLETION':
        return FileCheck;
      case 'INTERVIEW_PREPARATION':
        return MessageSquare;
      case 'ADDITIONAL_REVIEW':
        return UserCheck;
      default:
        return HelpCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Guiding Principles Banner */}
      <div className="rounded-xl border border-[#02E8A7]/30 bg-[#BDF9F9]/30/60 p-4 text-xs text-indigo-950 shadow-xs flex items-start gap-3">
        <HeartHandshake className="w-5 h-5 text-[#009669] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm text-[#002020]">
            Constructive & Growth-Oriented Student Support Framework
          </p>
          <p className="text-[#002020] leading-relaxed">
            All diagnostic recommendations utilize supportive, non-stigmatizing language. Support categories identify concrete opportunities for practice sprints, interview simulations, and project refinement rather than labeling students as deficit-ridden. TPO oversight ensures every intervention is approved with human care.
          </p>
        </div>
      </div>

      {/* 7 Category Selector Quick Filters */}
      <Card
        title="Student Support Action Board"
        subtitle="Review, approve, and track proactive institutional support interventions across 7 core development categories."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-52">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All 7 Support Categories' },
                  ...Object.values(SUPPORT_CATEGORIES).map((cat) => ({
                    value: cat.id,
                    label: cat.label,
                  })),
                ]}
              />
            </div>
            <div className="w-48">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  ...Object.values(INTERVENTION_STATUSES).map((st) => ({
                    value: st.id,
                    label: st.label,
                  })),
                ]}
              />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredItems.length}</span> actionable recommendations
          </div>
        </div>

        {/* Support Recommendations Cards / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400 text-sm">
              No student support recommendations match the current filters.
            </div>
          ) : (
            filteredItems.map((rec) => {
              const catConfig = SUPPORT_CATEGORIES[rec.category] || SUPPORT_CATEGORIES.INSUFFICIENT_DATA;
              const statusConfig = INTERVENTION_STATUSES[rec.status] || INTERVENTION_STATUSES.IDENTIFIED;
              const CatIcon = getCategoryIcon(rec.category);

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#BDF9F9]/30 text-[#009669]">
                          <CatIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <Badge variant={catConfig.badgeVariant} size="sm">
                            {catConfig.label}
                          </Badge>
                          <div className="text-xs font-semibold text-slate-900 mt-1">
                            {rec.studentName} •{' '}
                            <span className="font-mono text-slate-500">{rec.department}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={statusConfig.badgeVariant} size="sm">
                          {statusConfig.label}
                        </Badge>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            rec.priority === 'CRITICAL'
                              ? 'text-rose-600'
                              : rec.priority === 'HIGH'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          Priority: {rec.priority}
                        </span>
                      </div>
                    </div>

                    {/* Supportive Content */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {rec.supportiveTitle}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    {/* Evidence Basis Box */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                        Diagnostic Evidence Basis:
                      </span>
                      {rec.evidenceBasis}
                    </div>

                    {/* Assigned Coordinator / Notes */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Mentor: <strong className="text-slate-700">{rec.assignedMentor}</strong>
                      </span>
                      {rec.reviewNotes && (
                        <span className="truncate max-w-[180px] italic" title={rec.reviewNotes}>
                          "{rec.reviewNotes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Action Type: {rec.recommendedInterventionType}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewModal(rec)}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Review / Update
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* TPO Support Review Modal */}
      {reviewingItem && (
        <Modal
          isOpen={!!reviewingItem}
          onClose={() => setReviewingItem(null)}
          title={`TPO Review: ${reviewingItem.supportiveTitle}`}
          subtitle={`Student: ${reviewingItem.studentName} (${reviewingItem.department})`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-semibold text-slate-800">Support Category:</span>{' '}
              {SUPPORT_CATEGORIES[reviewingItem.category]?.label}
              <p className="text-slate-600">{reviewingItem.evidenceBasis}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Update Intervention Status
              </label>
              <Select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                options={[
                  { value: 'APPROVED', label: 'Approve & Schedule Intervention' },
                  { value: 'IN_PROGRESS', label: 'Mark as In Progress' },
                  { value: 'RESOLVED', label: 'Mark Completed / Resolved' },
                  { value: 'UNDER_TPO_REVIEW', label: 'Keep Under TPO Review' },
                  { value: 'DISMISSED', label: 'Dismiss (Not Applicable)' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Assigned Mentor / Coordinator
              </label>
              <input
                type="text"
                value={assignedMentor}
                onChange={(e) => setAssignedMentor(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
                placeholder="e.g. Prof. Alok Gupta, Alumni Circle"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                TPO Review Notes & Guidance
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
                placeholder="Record guidance, workshop slot, or dismissal rationale..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveReview}
                disabled={submitting}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Save TPO Action
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
