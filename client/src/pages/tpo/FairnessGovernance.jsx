import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Lock,
  ChevronRight
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import fairnessService, {
  CASE_STATUSES,
  FALLBACK_FAIRNESS_ANALYSIS,
  FALLBACK_REVIEW_CASES
} from '../../services/fairnessService';

export default function FairnessGovernance() {
  const [analysis, setAnalysis] = useState(FALLBACK_FAIRNESS_ANALYSIS);
  const [cases, setCases] = useState(FALLBACK_REVIEW_CASES);
  const [refreshing, setRefreshing] = useState(false);

  // Active Stage Filter for Funnel Analysis
  const [selectedStageIdx, setSelectedStageIdx] = useState(1); // default: 'Applications -> Technical Shortlists'

  // Case Adjudication Modal
  const [activeCase, setActiveCase] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedReviewer, setAssignedReviewer] = useState('');
  const [updatingCase, setUpdatingCase] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fairnessService.getFairnessAnalysis();
      if (res) {
        setAnalysis(res);
        if (res.reviewCases) setCases(res.reviewCases);
      }
    } catch (err) {
      console.error('Failed to load fairness analysis:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCaseModal = (caseItem) => {
    setActiveCase(caseItem);
    setNewStatus(caseItem.status);
    setResolutionNotes(caseItem.resolutionNotes || '');
    setAssignedReviewer(caseItem.assignedReviewer || 'Dr. Rajiv Menon');
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    if (!activeCase) return;
    try {
      setUpdatingCase(true);
      const updated = await fairnessService.updateReviewCase(activeCase.id, {
        status: newStatus,
        resolutionNotes,
        assignedReviewer,
      });
      setCases(cases.map((c) => (c.id === activeCase.id ? { ...c, ...updated } : c)));
      setActiveCase(null);
    } catch (err) {
      console.error('Failed to update review case:', err);
    } finally {
      setUpdatingCase(false);
    }
  };

  const currentStage = analysis?.stagesAnalysis?.[selectedStageIdx] || analysis?.stagesAnalysis?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Fairness, Equity & Algorithmic Governance"
        subtitle="Selection funnel disparity monitoring using the EEOC Four-Fifths benchmark, small-group privacy suppression (N < 5), and human-in-the-loop review queue."
        breadcrumbs={[
          { label: 'TPO Portal', href: '/tpo' },
          { label: 'Institutional Intelligence', href: '/tpo/institutional-intelligence' },
          { label: 'Fairness Governance' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
              <RotateCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Re-compute Ratios
            </Button>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero Sensitive Attributes Used</span>
            </div>
          </div>
        }
      />

      {/* Regulatory Context & Benchmark Callout */}
      <div className="p-4 rounded-xl border border-[#02E8A7]/40 bg-[#BDF9F9]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#02E8A7] text-[#002020] font-bold shrink-0 mt-0.5">
            <Scale className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">EEOC Four-Fifths Benchmark Rule (80% Selection Ratio)</h4>
            <p className="text-slate-600 leading-relaxed max-w-4xl text-[11px]">
              A selection rate for any group that is less than <strong>80% (0.80)</strong> of the rate for the reference group 
              triggers an automated <strong>Human Review Flag</strong>. In CarrerSync, a flag is an investigative advisory for the 
              TPO committee to evaluate syllabus alignment or prerequisite suitability — <em>never an automated finding of unfair bias</em>.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-[#02E8A7]/30 shadow-2xs">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">Compliant Stages</span>
            <span className="font-bold text-emerald-700">{analysis?.governanceSummary?.optimalRatiosCount || 20} / 24</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
            <span className="text-[10px] text-amber-600 block uppercase font-sans font-bold">Review Flags</span>
            <span className="font-bold text-amber-700">{analysis?.governanceSummary?.reviewFlagsCount || 3}</span>
          </div>
        </div>
      </div>

      {/* Stage Disparity Funnel Analysis */}
      <Card
        title="Selection Stage Conversion & Disparity Ratio Matrix"
        subtitle={`Reference Group: ${analysis?.referenceGroup || 'Computer Science (CSE)'}. Compare selection rates across conversion stages.`}
        headerAction={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Funnel Stage:</span>
            <select
              value={selectedStageIdx}
              onChange={(e) => setSelectedStageIdx(Number(e.target.value))}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
            >
              {analysis?.stagesAnalysis?.map((stageItem, idx) => (
                <option key={stageItem.stage} value={idx}>
                  {stageItem.stage}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Currently Analyzing: </span>
            <strong className="text-slate-900">{currentStage?.stage}</strong>
          </div>
          <div className="font-mono text-xs">
            <span className="text-slate-500">Reference Benchmark Rate: </span>
            <strong className="text-[#004D36]">{currentStage?.referenceRate}%</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Cohort / Candidate Group</th>
                <th className="py-2.5 px-3">Sample Size (N)</th>
                <th className="py-2.5 px-3">Selected Count</th>
                <th className="py-2.5 px-3">Stage Conversion Rate</th>
                <th className="py-2.5 px-3">Four-Fifths Ratio</th>
                <th className="py-2.5 px-3">Benchmark Status</th>
                <th className="py-2.5 px-3 text-right">Governance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentStage?.groups?.map((grp) => {
                if (grp.isSuppressed) {
                  return (
                    <tr key={grp.groupName} className="bg-slate-50/40">
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{grp.groupName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">N = {grp.sampleSize}</td>
                      <td colSpan={4} className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                          Small-Group Suppression Active (N &lt; 5) — Masked for Privacy Safeguard
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-[11px] text-slate-400 font-mono">
                        Protected
                      </td>
                    </tr>
                  );
                }

                const isReviewRequired = grp.disparityRatio !== null && grp.disparityRatio < 0.80;

                return (
                  <tr key={grp.groupName} className={`hover:bg-slate-50/70 transition-colors ${isReviewRequired ? 'bg-amber-50/30' : ''}`}>
                    <td className="py-3 px-3 font-semibold text-slate-900">{grp.groupName}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{grp.sampleSize}</td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">{grp.selectedCount}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{grp.rate}%</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        <span className={isReviewRequired ? 'text-amber-700' : 'text-emerald-700'}>
                          {grp.disparityRatio?.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({Math.round((grp.disparityRatio || 1) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {isReviewRequired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Ratio &lt; 0.80 (Review Flag)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Meets Benchmark (&ge; 0.80)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isReviewRequired ? (
                        <button
                          onClick={() => {
                            const matched = cases.find((c) => c.affectedGroup.includes(grp.groupName.split(' ')[0]));
                            if (matched) openCaseModal(matched);
                            else {
                              openCaseModal({
                                id: `FC-NEW-${Date.now()}`,
                                caseTitle: `${grp.groupName} ${currentStage.stage} Disparity Review`,
                                driveOrStage: currentStage.stage,
                                companyOrCohort: 'Active Drive Season',
                                affectedGroup: grp.groupName,
                                referenceGroup: analysis.referenceGroup,
                                selectionRateGroup: `${grp.rate}%`,
                                selectionRateReference: `${currentStage.referenceRate}%`,
                                disparityRatio: grp.disparityRatio,
                                impactedCount: grp.sampleSize - grp.selectedCount,
                                status: 'FLAGGED',
                                assignedReviewer: 'Dr. Rajiv Menon',
                                resolutionNotes: 'Triggered from Four-Fifths Benchmark Table.',
                              });
                            }
                          }}
                          className="text-xs text-[#009669] hover:text-[#002020] font-semibold inline-flex items-center gap-1"
                        >
                          <span>Review Case</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Compliant</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fairness Review Cases Queue */}
      <Card
        title="Fairness Review Cases & Adjudication Queue"
        subtitle="Transparent governance workflow tracking flagged disparity ratios, assigned academic reviewers, and institutional resolution logs."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Case ID & Title</th>
                <th className="py-2.5 px-3">Selection Stage</th>
                <th className="py-2.5 px-3">Disparity Ratio</th>
                <th className="py-2.5 px-3">Impacted Count</th>
                <th className="py-2.5 px-3">Assigned Reviewer</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3 text-right">Adjudicate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((c) => {
                const statusConfig = CASE_STATUSES[c.status] || CASE_STATUSES.UNDER_REVIEW;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                      <div>{c.caseTitle}</div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">ID: {c.id}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div>{c.driveOrStage}</div>
                      <span className="text-[10px] text-slate-400">{c.companyOrCohort}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-700">
                      {c.disparityRatio?.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">vs 0.80 benchmark</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{c.impactedCount} students</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{c.assignedReviewer}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          statusConfig.badgeVariant === 'amber'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : statusConfig.badgeVariant === 'purple'
                            ? 'bg-[#BDF9F9]/30 text-[#004D36] border border-[#02E8A7]/40'
                            : statusConfig.badgeVariant === 'indigo'
                            ? 'bg-[#BDF9F9]/30 text-[#004D36] border border-[#02E8A7]/40'
                            : statusConfig.badgeVariant === 'emerald'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button variant="ghost" size="xs" onClick={() => openCaseModal(c)}>
                        Open Case
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Case Details & Resolution Notes Modal */}
      {activeCase && (
        <Modal
          isOpen={!!activeCase}
          onClose={() => setActiveCase(null)}
          title={`Fairness Case: ${activeCase.id}`}
          subtitle={activeCase.caseTitle}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleUpdateCase} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-sans block">Affected Group</span>
                <span className="text-slate-900 font-bold">{activeCase.affectedGroup}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-sans block">Reference Group</span>
                <span className="text-slate-900 font-bold">{activeCase.referenceGroup}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-sans block">Selection Disparity</span>
                <span className="text-amber-700 font-bold">
                  {activeCase.selectionRateGroup} vs {activeCase.selectionRateReference} (Ratio: {activeCase.disparityRatio})
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-slate-400 font-sans block">Potential Impact</span>
                <span className="text-slate-900">{activeCase.impactedCount} candidates</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjudication Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
                >
                  <option value="FLAGGED">Flagged for Review</option>
                  <option value="UNDER_REVIEW">Under Review (Committee)</option>
                  <option value="EXPLANATION_REQUESTED">Explanation Requested from Recruiter</option>
                  <option value="RESOLVED">Resolved (Legitimate Criteria Verified)</option>
                  <option value="ESCALATED">Escalated to Institutional Head</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Academic Reviewer</label>
                <input
                  type="text"
                  value={assignedReviewer}
                  onChange={(e) => setAssignedReviewer(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution & Contextual Findings</label>
              <textarea
                rows={4}
                placeholder="Record committee evaluation notes (e.g. syllabus prerequisite differences, curriculum gap interventions, or corrective policy actions)..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              />
            </div>

            {/* Audit Log Timeline */}
            {activeCase.auditLog && activeCase.auditLog.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Case Audit Trail</span>
                {activeCase.auditLog.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-600">
                    <span>{log.action} <strong className="text-slate-800 font-medium">({log.actor})</strong></span>
                    <span className="font-mono text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setActiveCase(null)}>
                Close
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={updatingCase}>
                {updatingCase ? 'Saving...' : 'Save Adjudication Decision'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
