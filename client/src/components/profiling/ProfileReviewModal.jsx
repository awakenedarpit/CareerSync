/**
 * ProfileReviewModal Component
 * Phase 09 — AI Profiling & Evidence Verification System
 * 
 * Allows students to review AI-extracted skills from their documents,
 * inspect confidence scores and evidence justifications,
 * select/deselect skills, and approve or reject proposed updates.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  FileText,
  XCircle,
  Check,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import profilingService from '../../services/profilingService';

export default function ProfileReviewModal({
  isOpen,
  onClose,
  extraction,
  onApproved,
  onRejected
}) {
  const [selectedSkills, setSelectedSkills] = useState(new Set());
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [expandedExplanations, setExpandedExplanations] = useState(new Set());

  const skills = useMemo(() => {
    return extraction?.skills || extraction?.extractionResult?.skills || [];
  }, [extraction]);

  const warnings = useMemo(() => {
    return extraction?.warnings || extraction?.extractionResult?.warnings || [];
  }, [extraction]);

  // Initialize selected skills whenever extraction changes
  useEffect(() => {
    if (skills && skills.length > 0) {
      setSelectedSkills(new Set(skills.map((s) => s.name)));
    } else {
      setSelectedSkills(new Set());
    }
    setShowRejectForm(false);
    setRejectReason('');
    setSubmitError(null);
    setExpandedExplanations(new Set());
  }, [skills, extraction]);

  const toggleSkill = (skillName) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillName)) {
        next.delete(skillName);
      } else {
        next.add(skillName);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSkills(new Set(skills.map((s) => s.name)));
  };

  const deselectAll = () => {
    setSelectedSkills(new Set());
  };

  const toggleExplanation = (skillName) => {
    setExpandedExplanations((prev) => {
      const next = new Set(prev);
      if (next.has(skillName)) {
        next.delete(skillName);
      } else {
        next.add(skillName);
      }
      return next;
    });
  };

  const formatConfidence = (val) => {
    if (val === undefined || val === null) return 'N/A';
    const num = Number(val);
    const percent = num <= 1 ? Math.round(num * 100) : Math.round(num);
    return `${percent}%`;
  };

  const getConfidenceBadgeColor = (val) => {
    if (val === undefined || val === null) return 'slate';
    const num = Number(val);
    const pct = num <= 1 ? num * 100 : num;
    if (pct >= 80) return 'emerald';
    if (pct >= 60) return 'sky';
    return 'amber';
  };

  const getCategoryColor = (category = '') => {
    const cat = category.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (cat.includes('language')) return 'indigo';
    if (cat.includes('framework') || cat.includes('frontend')) return 'purple';
    if (cat.includes('database')) return 'sky';
    if (cat.includes('cloud') || cat.includes('devops')) return 'emerald';
    if (cat.includes('ai') || cat.includes('data')) return 'amber';
    return 'slate';
  };

  const formatCategoryName = (category = '') => {
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getEvidenceTypeLabel = (skill) => {
    if (skill.evidence && Array.isArray(skill.evidence) && skill.evidence.length > 0) {
      return skill.evidence[0].evidenceType || 'DOCUMENT';
    }
    return skill.evidenceType || 'RESUME';
  };

  const handleApprove = async () => {
    if (!extraction?.id) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const approvedNames = Array.from(selectedSkills);
      const res = await profilingService.approveExtraction(extraction.id, {
        approvedSkillNames: approvedNames
      });
      if (onApproved) {
        onApproved({ extractionId: extraction.id, approvedSkillNames: approvedNames, res });
      }
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to approve extraction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!extraction?.id) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const rejectedNames = Array.from(selectedSkills);
      const res = await profilingService.rejectExtraction(extraction.id, {
        rejectedSkillNames: rejectedNames,
        reason: rejectReason.trim() || 'Student rejected extraction during review'
      });
      if (onRejected) {
        onRejected({ extractionId: extraction.id, reason: rejectReason, res });
      }
      onClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to reject extraction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalFooter = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-3">
      <div className="text-xs text-slate-500 font-medium">
        {selectedSkills.size} of {skills.length} skills selected
      </div>
      <div className="flex items-center justify-end gap-2">
        {showRejectForm ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectForm(false)}
              disabled={isSubmitting}
            >
              Back to Review
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectForm(true)}
              disabled={isSubmitting}
            >
              Reject Extraction
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              disabled={isSubmitting || selectedSkills.size === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Approve Selected ({selectedSkills.size})
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Profiling Evidence Review"
      subtitle={extraction?.originalFilename ? `Document: ${extraction.originalFilename}` : 'Review skills extracted by CarrerSync AI'}
      maxWidth="max-w-2xl"
      footer={modalFooter}
    >
      <div className="space-y-4">
        {/* Verification Rule Notice */}
        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              AI extraction is for evidence identification and does not equal verified mastery.
            </p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Approved skills will be cataloged as <strong>Evidence Found</strong> or <strong>Pending Review</strong> in your student portfolio. Verified status requires faculty approval, code repository audit, or validated skill assessments.
            </p>
          </div>
        </div>

        {/* Warnings & Scanned Notice */}
        {warnings.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Extraction Warnings</span>
            </div>
            {warnings.map((w, idx) => (
              <p key={idx} className="text-[11px] text-rose-700">
                • {typeof w === 'string' ? w : w.message}
              </p>
            ))}
          </div>
        )}

        {/* Error Notice */}
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Reject Form View */}
        {showRejectForm ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject AI Profiling Extraction</span>
            </div>
            <p className="text-xs text-slate-600">
              If this document was extracted incorrectly or contains inaccurate information, you can reject the extraction. Please provide an optional reason for your records and audit logs.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Skills do not match my coursework, incorrect project assignment..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-hidden"
            />
          </div>
        ) : (
          <>
            {/* Header Toolbar */}
            <div className="flex items-center justify-between pb-1 text-xs">
              <span className="font-semibold text-slate-700">
                Extracted Skills ({skills.length})
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-medium text-[#009669] hover:text-[#002020] transition-colors"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Empty State */}
            {skills.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No skills identified</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  The document did not yield structured skill matches or requires manual OCR review.
                </p>
              </div>
            ) : (
              /* Skills List */
              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {skills.map((skill, index) => {
                  const isChecked = selectedSkills.has(skill.name);
                  const isExpanded = expandedExplanations.has(skill.name);
                  const confidenceBadge = getConfidenceBadgeColor(skill.confidence);
                  const categoryColor = getCategoryColor(skill.category);
                  const evidenceType = getEvidenceTypeLabel(skill);

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'bg-white border-[#02E8A7]/40 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer select-none grow">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSkill(skill.name)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7] cursor-pointer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900">
                                {skill.name}
                              </span>
                              <Badge variant={categoryColor} size="sm">
                                {formatCategoryName(skill.category)}
                              </Badge>
                              <Badge variant={confidenceBadge} size="sm">
                                {formatConfidence(skill.confidence)} confidence
                              </Badge>
                              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                                {evidenceType}
                              </span>
                            </div>
                            {skill.proficiencyClaim && (
                              <p className="text-[11px] text-slate-500">
                                Claimed Level: <span className="capitalize font-medium text-slate-700">{skill.proficiencyClaim}</span>
                              </p>
                            )}
                          </div>
                        </label>

                        {/* Explanation Toggle */}
                        {skill.explanation && (
                          <button
                            type="button"
                            onClick={() => toggleExplanation(skill.name)}
                            className="p-1 text-slate-400 hover:text-[#009669] rounded transition-colors"
                            title="Toggle AI justification explanation"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Explanation Snippet */}
                      {skill.explanation && isExpanded && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50/60 p-2 rounded-lg">
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                            <Info className="w-3 h-3 text-[#009669]" />
                            <span>AI Extraction Rationale</span>
                          </div>
                          <p className="leading-relaxed">{skill.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
