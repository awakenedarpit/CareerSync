import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Download,
  FileText,
  Edit3,
  Check
} from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { INTERVENTION_STATUSES } from '../../../services/predictiveAnalyticsService';

export default function InterventionsReportingTab({
  interventions = [],
  reports = [],
  onCreateIntervention,
  onUpdateInterventionStatus,
  onGenerateReport,
}) {
  // Intervention Propose State
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDept, setTargetDept] = useState('ALL');
  const [targetCohort, setTargetCohort] = useState('Batch 2026');
  const [priority, setPriority] = useState('HIGH');
  const [objective, setObjective] = useState('');
  const [coordinators, setCoordinators] = useState('');
  const [rationale, setRationale] = useState('');
  const [submittingIntervention, setSubmittingIntervention] = useState(false);

  // Intervention Status Update State
  const [updatingIntervention, setUpdatingIntervention] = useState(null);
  const [newStatus, setNewStatus] = useState('APPROVED');
  const [statusNotes, setStatusNotes] = useState('');

  // Report Generation State
  const [reportScope, setReportScope] = useState('Batch 2026 (All Departments)');
  const [reportFormat, setReportFormat] = useState('JSON / PDF');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingIntervention(true);
      await onCreateIntervention?.({
        title,
        targetDepartment: targetDept,
        targetCohort,
        priority,
        objective,
        assignedCoordinators: coordinators.split(',').map((c) => c.trim()).filter(Boolean),
        rationale,
      });
      setIsProposeOpen(false);
      setTitle('');
      setObjective('');
      setRationale('');
      setCoordinators('');
    } finally {
      setSubmittingIntervention(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!updatingIntervention) return;
    await onUpdateInterventionStatus?.(updatingIntervention.id, {
      status: newStatus,
      reviewNotes: statusNotes,
    });
    setUpdatingIntervention(null);
  };

  const handleTriggerReport = async () => {
    try {
      setGeneratingReport(true);
      await onGenerateReport?.({
        title: `Placement Intelligence Audit (${reportScope})`,
        scope: reportScope,
        format: reportFormat,
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadJson = (rep) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rep, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${rep.id || 'audit-report'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Institutional Interventions Section */}
      <Card
        title="Institutional TPO Interventions & Remediation Programs"
        subtitle="Orchestrate proactive department-wide workshops, algorithmic clinics, and mentor circles with auditable status governance."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProposeOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Propose Intervention
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interventions.map((intv) => {
            const statusCfg = INTERVENTION_STATUSES[intv.status] || INTERVENTION_STATUSES.IDENTIFIED;

            return (
              <div
                key={intv.id}
                className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant={statusCfg.badgeVariant} size="sm">
                        {statusCfg.label}
                      </Badge>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                        {intv.title}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        intv.priority === 'CRITICAL'
                          ? 'text-rose-600'
                          : intv.priority === 'HIGH'
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      Priority: {intv.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {intv.objective}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <div>
                      Scope: <strong className="text-slate-800">{intv.targetDepartment}</strong> • Cohort:{' '}
                      <strong className="text-slate-800">{intv.targetCohort}</strong>
                    </div>
                    <div>
                      Coordinators:{' '}
                      <span className="text-slate-700">
                        {Array.isArray(intv.assignedCoordinators)
                          ? intv.assignedCoordinators.join(', ')
                          : intv.assignedCoordinators}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic">
                      Rationale: {intv.rationale}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Enrolled: <strong>{intv.participantsEnrolled}</strong> candidates
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUpdatingIntervention(intv);
                      setNewStatus(intv.status);
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Update Status
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Automated Placement Reporting & Audit Generator */}
      <Card
        title="Automated Placement Reporting & Audit Generator"
        subtitle="Generate structured institutional placement intelligence audits with zero fabricated metrics, compliant with NIRF and AICTE documentation standards."
      >
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="w-64">
              <Select
                value={reportScope}
                onChange={(e) => setReportScope(e.target.value)}
                options={[
                  { value: 'Batch 2026 (All Departments)', label: 'Batch 2026 (All Departments)' },
                  { value: 'Batch 2026 (CSE & IT Only)', label: 'Batch 2026 (CSE & IT Only)' },
                  { value: 'Batch 2026 (Circuit & Core Branches)', label: 'Batch 2026 (Circuit & Core)' },
                  { value: 'Multi-Year Historical Trend Audit (2023-2026)', label: 'Multi-Year Trend (2023-2026)' },
                ]}
              />
            </div>
            <div className="w-44">
              <Select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
                options={[
                  { value: 'JSON / PDF', label: 'Structured JSON & PDF' },
                  { value: 'JSON Only', label: 'Raw Audit JSON' },
                ]}
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleTriggerReport}
            disabled={generatingReport}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 mr-1.5 ${generatingReport ? 'animate-spin' : ''}`} />
            Generate Placement Report
          </Button>
        </div>

        {/* Existing Reports List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Generated Institutional Audit Reports
          </h4>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#009669] shrink-0" />
                    <span className="font-semibold text-slate-900 text-sm">
                      {rep.title}
                    </span>
                    <Badge variant="aqua" size="sm">
                      {rep.format}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>Generated: {new Date(rep.generatedAt).toLocaleDateString()}</span>
                    <span>Auditor: {rep.generatedBy}</span>
                    <span>Scope: {rep.scope}</span>
                  </div>
                  {rep.summaryMetrics && (
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Assessed: {rep.summaryMetrics.assessedStudents}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Projected: {rep.summaryMetrics.predictedPlacementRate}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Fairness: {rep.summaryMetrics.fairnessCompliance}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingReport(rep)}
                  >
                    View Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadJson(rep)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download JSON
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Propose Intervention Modal */}
      <Modal
        isOpen={isProposeOpen}
        onClose={() => setIsProposeOpen(false)}
        title="Propose Institutional Intervention"
        subtitle="Formally register a department or cohort-level skill intervention program."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleProposeSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Intervention Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Intensive Algorithmic Practice Sprint"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Department
              </label>
              <Select
                value={targetDept}
                onChange={(e) => setTargetDept(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Departments' },
                  { value: 'CSE', label: 'Computer Science & Engineering' },
                  { value: 'IT', label: 'Information Technology' },
                  { value: 'ECE', label: 'Electronics & Communication' },
                  { value: 'EEE', label: 'Electrical & Electronics' },
                  { value: 'MECH', label: 'Mechanical Engineering' },
                  { value: 'CIVIL', label: 'Civil Engineering' },
                ]}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Cohort
              </label>
              <Select
                value={targetCohort}
                onChange={(e) => setTargetCohort(e.target.value)}
                options={[
                  { value: 'Batch 2026', label: 'Batch 2026 (Active)' },
                  { value: 'Batch 2027', label: 'Batch 2027 (Upcoming)' },
                  { value: 'Moderate Readiness Group', label: 'Moderate Readiness Group' },
                  { value: 'Developing Readiness Group', label: 'Developing Readiness Group' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Priority Level
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: 'HIGH', label: 'High Priority' },
                { value: 'CRITICAL', label: 'Critical Priority' },
                { value: 'MEDIUM', label: 'Medium Priority' },
                { value: 'LOW', label: 'Low Priority' },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Program Objective *
            </label>
            <textarea
              required
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Elevate technical coding clearance rate by 15% before Super Dream drives..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Assigned Faculty / Coordinators (comma-separated)
            </label>
            <input
              type="text"
              value={coordinators}
              onChange={(e) => setCoordinators(e.target.value)}
              placeholder="Dr. Rajiv Menon, Prof. Alok Gupta"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Diagnostic Rationale *
            </label>
            <input
              type="text"
              required
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="e.g. Identified dynamic programming speed deficit in Phase 12 mock test."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsProposeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submittingIntervention}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Register Program
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Intervention Status Modal */}
      {updatingIntervention && (
        <Modal
          isOpen={!!updatingIntervention}
          onClose={() => setUpdatingIntervention(null)}
          title={`Update Status: ${updatingIntervention.title}`}
          subtitle={`Department: ${updatingIntervention.targetDepartment} • Cohort: ${updatingIntervention.targetCohort}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Intervention Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                options={[
                  { value: 'APPROVED', label: 'Approved & Scheduled' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'RESOLVED', label: 'Completed / Resolved' },
                  { value: 'UNDER_TPO_REVIEW', label: 'Under TPO Review' },
                  { value: 'DISMISSED', label: 'Dismissed' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Status Notes / Progress Update
              </label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Log milestone details, schedule adjustments, or completion notes..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/20 focus:border-[#02E8A7]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdatingIntervention(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStatusUpdate}
              >
                Save Status
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Summary Report Modal */}
      {viewingReport && (
        <Modal
          isOpen={!!viewingReport}
          onClose={() => setViewingReport(null)}
          title={viewingReport.title}
          subtitle={`Audit generated on ${new Date(viewingReport.generatedAt).toLocaleString()} by ${viewingReport.generatedBy}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div><strong>Scope:</strong> {viewingReport.scope}</div>
              <div><strong>Format:</strong> {viewingReport.format}</div>
              <div><strong>Auditor Authority:</strong> {viewingReport.generatedBy}</div>
            </div>

            {viewingReport.summaryMetrics && (
              <div className="space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-slate-600">
                  Key Institutional Findings
                </h5>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-500 block uppercase">Assessed Students</span>
                    <span className="text-lg font-black text-slate-900">{viewingReport.summaryMetrics.assessedStudents}</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                    <span className="text-[10px] text-slate-500 block uppercase">Projected Rate</span>
                    <span className="text-lg font-black text-[#004D36]">{viewingReport.summaryMetrics.predictedPlacementRate}</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800">
                  <strong>Fairness Verification:</strong> {viewingReport.summaryMetrics.fairnessCompliance}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingReport(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadJson(viewingReport)}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export Audit JSON
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
