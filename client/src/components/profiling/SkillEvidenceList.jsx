/**
 * SkillEvidenceList Component
 * Phase 09 — AI Profiling & Evidence Verification System
 * 
 * Displays student skills with transparent 4-tier evidence badges:
 * - VERIFIED (Green)
 * - EVIDENCE_FOUND (Blue)
 * - PENDING_REVIEW (Amber)
 * - SELF_DECLARED (Gray)
 * 
 * Includes linked document reference, extraction date, confidence score,
 * and human reviewer notes.
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Calendar,
  User,
  RotateCw,
  HelpCircle,
  XCircle,
  Upload,
  MessageSquare
} from 'lucide-react';
import Card from '../ui/Card';

export default function SkillEvidenceList({
  skills = [],
  studentId: _studentId = null,
  onRefresh = null,
  onRequestCorrection = null,
  onResubmit = null,
  className = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  /**
   * Normalize verification status to one of the canonical states:
   * VERIFIED | EVIDENCE_FOUND | PENDING_REVIEW | NEEDS_MORE_EVIDENCE | REJECTED | SELF_DECLARED
   */
  const normalizeStatus = (status = '') => {
    const s = String(status).toUpperCase().replace(/[-\s]/g, '_');
    if (s.includes('VERIFIED')) return 'VERIFIED';
    if (s.includes('NEEDS_MORE') || s.includes('NEEDS_INFO')) return 'NEEDS_MORE_EVIDENCE';
    if (s.includes('REJECTED')) return 'REJECTED';
    if (s.includes('EVIDENCE_FOUND') || s.includes('EVIDENCE_LINKED') || s.includes('OBSERVED')) return 'EVIDENCE_FOUND';
    if (s.includes('PENDING')) return 'PENDING_REVIEW';
    return 'SELF_DECLARED';
  };

  const getStatusBadgeConfig = (rawStatus) => {
    const norm = normalizeStatus(rawStatus);
    switch (norm) {
      case 'VERIFIED':
        return {
          label: 'VERIFIED',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
          description: 'Officially validated by faculty or verified benchmark assessment'
        };
      case 'NEEDS_MORE_EVIDENCE':
        return {
          label: 'NEEDS MORE INFO',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          icon: HelpCircle,
          description: 'Reviewer requested additional documentation or credentials'
        };
      case 'REJECTED':
        return {
          label: 'REJECTED',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
          description: 'Claim rejected by TPO reviewer; justification provided'
        };
      case 'EVIDENCE_FOUND':
        return {
          label: 'EVIDENCE FOUND',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: CheckCircle2,
          description: 'Identified in uploaded project, code repository, or coursework'
        };
      case 'PENDING_REVIEW':
        return {
          label: 'PENDING REVIEW',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
          description: 'Extracted from resume or portfolio awaiting human evaluation'
        };
      case 'SELF_DECLARED':
      default:
        return {
          label: 'SELF DECLARED',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: User,
          description: 'Self-claimed by student without attached document evidence'
        };
    }
  };

  const formatCategory = (category = '') => {
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A') return 'Recent';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSkills = useMemo(() => {
    return skills.filter((item) => {
      const norm = normalizeStatus(item.verificationStatus || item.status);
      const matchesFilter = selectedFilter === 'ALL' || norm === selectedFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.documentName && item.documentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.documentReference && item.documentReference.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [skills, selectedFilter, searchQuery]);

  const counts = useMemo(() => {
    const res = { ALL: skills.length, VERIFIED: 0, EVIDENCE_FOUND: 0, PENDING_REVIEW: 0, NEEDS_MORE_EVIDENCE: 0, REJECTED: 0, SELF_DECLARED: 0 };
    skills.forEach((s) => {
      const norm = normalizeStatus(s.verificationStatus || s.status);
      if (res[norm] !== undefined) {
        res[norm]++;
      }
    });
    return res;
  }, [skills]);

  const filterTabs = [
    { key: 'ALL', label: 'All Skills', count: counts.ALL },
    { key: 'VERIFIED', label: 'Verified', count: counts.VERIFIED, dot: 'bg-emerald-500' },
    { key: 'NEEDS_MORE_EVIDENCE', label: 'Needs Info', count: counts.NEEDS_MORE_EVIDENCE, dot: 'bg-purple-500' },
    { key: 'REJECTED', label: 'Rejected', count: counts.REJECTED, dot: 'bg-rose-500' },
    { key: 'EVIDENCE_FOUND', label: 'Evidence Found', count: counts.EVIDENCE_FOUND, dot: 'bg-blue-500' },
    { key: 'PENDING_REVIEW', label: 'Pending Review', count: counts.PENDING_REVIEW, dot: 'bg-amber-500' },
    { key: 'SELF_DECLARED', label: 'Self Declared', count: counts.SELF_DECLARED, dot: 'bg-slate-400' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {tab.dot && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedFilter === tab.key ? 'bg-white' : tab.dot
                  }`}
                />
              )}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedFilter === tab.key
                    ? 'bg-indigo-700/60 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shrink-0"
              title="Refresh evidence list"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No skill evidence found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {searchQuery
              ? 'No skills match your search query.'
              : 'Upload and analyze documents in your Document Vault to automatically populate evidence.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSkills.map((item, idx) => {
            const badge = getStatusBadgeConfig(item.verificationStatus || item.status);
            const Icon = badge.icon;
            const docName = item.documentName || item.documentReference || (item.evidence && item.evidence[0]?.documentName);
            const dateStr = item.extractedAt || item.verifiedDate || item.createdAt;
            const reviewerNotes = item.reviewerNotes || item.verifiedBy;
            const confidence = item.confidence !== undefined ? item.confidence : null;

            return (
              <Card
                key={item.id || idx}
                hover
                className="p-4 border-slate-200 flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Top Bar: Category & Evidence Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                      {formatCategory(item.category || 'General')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${badge.color}`}
                      title={badge.description}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Skill Name */}
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {item.name}
                  </h3>

                  {/* Confidence Bar (if present) */}
                  {confidence !== null && (
                    <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500">
                      <span>Confidence:</span>
                      <div className="grow bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.round(Number(confidence) <= 1 ? Number(confidence) * 100 : Number(confidence)))}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">
                        {Math.min(100, Math.round(Number(confidence) <= 1 ? Number(confidence) * 100 : Number(confidence)))}%
                      </span>
                    </div>
                  )}

                  {/* Linked Document Reference */}
                  {docName && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate" title={docName}>
                        {docName}
                      </span>
                    </div>
                  )}

                  {/* Reviewer / Extracted Notes */}
                  {reviewerNotes && reviewerNotes !== 'N/A' && (
                    <div className="text-[11px] text-slate-600 space-y-0.5 mt-2">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Reviewer Notes
                      </span>
                      <p
                        className={`p-2 rounded text-[11px] leading-relaxed border ${
                          normalizeStatus(item.verificationStatus || item.status) === 'NEEDS_MORE_EVIDENCE'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : normalizeStatus(item.verificationStatus || item.status) === 'REJECTED'
                            ? 'bg-rose-50 text-rose-900 border-rose-200'
                            : 'bg-emerald-50/50 text-slate-700 border-emerald-100/60'
                        }`}
                      >
                        {reviewerNotes}
                      </p>
                    </div>
                  )}

                  {/* Justification / Explanation if available */}
                  {item.explanation && (
                    <div className="mt-2 text-[11px] text-slate-500 italic border-l-2 border-slate-200 pl-2">
                      "{item.explanation}"
                    </div>
                  )}

                  {/* Resubmit or Correction Buttons */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    {(normalizeStatus(item.verificationStatus || item.status) === 'NEEDS_MORE_EVIDENCE' ||
                      normalizeStatus(item.verificationStatus || item.status) === 'REJECTED') && onResubmit ? (
                      <button
                        type="button"
                        onClick={() => onResubmit(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Resubmit Evidence</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    {onRequestCorrection && (
                      <button
                        type="button"
                        onClick={() => onRequestCorrection(item)}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        title="Request correction on this claim or status"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>Request Correction</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer: Date & Evidence Type */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(dateStr)}</span>
                  </div>
                  {item.evidenceType && (
                    <span className="uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.evidenceType}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
