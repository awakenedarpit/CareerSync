import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Play,
  CheckCircle2,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Users,
  Activity,
  Plus,
  Search,
  Lock,
  UserCheck,
  RefreshCw,
  Cpu,
  Check,
  X
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import StatCard from '../../components/ui/StatCard';
import {
  orchestrationService,
  WORKFLOW_STATUSES,
  AGENT_ROSTER,
  REGISTERED_WORKFLOW_DEFINITIONS
} from '../../services/orchestrationService';

export default function AgentOrchestration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'workflows';
  const initialWorkflowId = searchParams.get('workflowId') || null;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Data states
  const [workflows, setWorkflows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [registry, setRegistry] = useState(REGISTERED_WORKFLOW_DEFINITIONS);
  const [delegatedReviewers, setDelegatedReviewers] = useState([]);
  const [observabilityStats, setObservabilityStats] = useState(null);

  // Filter states
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState('ALL');
  const [workflowSearch, setWorkflowSearch] = useState('');

  // Modal states
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [selectedWorkflowForTrigger, setSelectedWorkflowForTrigger] = useState(REGISTERED_WORKFLOW_DEFINITIONS[0].workflowDefinitionId);
  const [triggerPayloadText, setTriggerPayloadText] = useState('{\n  "targetCohort": "2026",\n  "priority": "HIGH"\n}');
  const [triggerPriority, setTriggerPriority] = useState('NORMAL');

  // Inspection modal
  const [inspectWorkflow, setInspectWorkflow] = useState(null);
  const [showInspectModal, setShowInspectModal] = useState(false);

  // Approval action modal
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED'
  const [reviewerNotes, setReviewerNotes] = useState('');

  // Delegation modal
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [newDelegation, setNewDelegation] = useState({
    reviewerName: '',
    reviewerEmail: '',
    department: 'Computer Science & Engineering',
    role: 'Assistant Professor',
    permissions: ['VERIFY_SKILLS', 'REVIEW_EVIDENCE'],
    validUntil: '2026-12-31',
    notes: '',
  });

  // Load all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, appRes, regRes, delRes, statRes] = await Promise.all([
        orchestrationService.getWorkflows(),
        orchestrationService.getPendingApprovals(),
        orchestrationService.getWorkflowRegistry(),
        orchestrationService.getDelegatedReviewers(),
        orchestrationService.getObservabilityStats(),
      ]);

      setWorkflows(wfRes.workflows || wfRes || []);
      setApprovals(appRes || []);
      setRegistry(regRes || REGISTERED_WORKFLOW_DEFINITIONS);
      setDelegatedReviewers(delRes || []);
      setObservabilityStats(statRes);

      // Auto-open workflow if workflowId is passed in query params
      if (initialWorkflowId) {
        const target = (wfRes.workflows || wfRes || []).find(w => w.id === initialWorkflowId);
        if (target) {
          setInspectWorkflow(target);
          setShowInspectModal(true);
        }
      }
    } catch (err) {
      console.error('Failed to load orchestration data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Trigger manual workflow
  const handleTriggerWorkflow = async () => {
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(triggerPayloadText);
      } catch {
        alert('Invalid JSON input payload. Please fix syntax.');
        return;
      }

      await orchestrationService.startWorkflow(selectedWorkflowForTrigger, parsedPayload, {
        priority: triggerPriority,
      });

      setShowTriggerModal(false);
      showToast(`Workflow ${selectedWorkflowForTrigger} dispatched successfully.`);
      fetchData();
    } catch (err) {
      console.error('Trigger error:', err);
      showToast('Failed to dispatch workflow.');
    }
  };

  // Human approval action
  const handleApprovalSubmit = async () => {
    if (!selectedApproval) return;
    try {
      await orchestrationService.approveWorkflow(selectedApproval.workflowId, {
        status: approvalAction,
        reviewerNotes,
      });
      setShowApprovalModal(false);
      showToast(`Human Gate decision submitted: ${approvalAction}`);
      fetchData();
    } catch (err) {
      console.error('Approval submit error:', err);
      showToast('Error recording approval decision.');
    }
  };

  // Retry workflow
  const handleRetryWorkflow = async (workflowId) => {
    try {
      await orchestrationService.retryWorkflow(workflowId);
      showToast(`Workflow ${workflowId} scheduled for retry.`);
      fetchData();
    } catch (err) {
      console.error('Retry error:', err);
    }
  };

  // Cancel workflow
  const handleCancelWorkflow = async (workflowId) => {
    if (!window.confirm(`Are you sure you want to cancel workflow ${workflowId}?`)) return;
    try {
      await orchestrationService.cancelWorkflow(workflowId, 'Cancelled via TPO Command Center');
      showToast(`Workflow ${workflowId} has been cancelled.`);
      fetchData();
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  // Delegate reviewer
  const handleCreateDelegation = async () => {
    if (!newDelegation.reviewerName || !newDelegation.reviewerEmail) {
      alert('Reviewer Name and Email are required.');
      return;
    }
    try {
      await orchestrationService.delegateReviewer(newDelegation);
      setShowDelegationModal(false);
      showToast(`Review authority delegated to ${newDelegation.reviewerName}`);
      setNewDelegation({
        reviewerName: '',
        reviewerEmail: '',
        department: 'Computer Science & Engineering',
        role: 'Assistant Professor',
        permissions: ['VERIFY_SKILLS', 'REVIEW_EVIDENCE'],
        validUntil: '2026-12-31',
        notes: '',
      });
      fetchData();
    } catch (err) {
      console.error('Delegation error:', err);
    }
  };

  // Revoke reviewer delegation instantly
  const handleRevokeDelegation = async (delId, reviewerName) => {
    if (!window.confirm(`Revoke verification authority for ${reviewerName}? This action takes effect immediately.`)) {
      return;
    }
    try {
      await orchestrationService.revokeDelegation(delId, 'Revoked by Chief TPO Administrator');
      showToast(`Authority revoked for ${reviewerName}. Reviewer deactivated.`);
      fetchData();
    } catch (err) {
      console.error('Revoke error:', err);
    }
  };

  // Filtered workflows
  const filteredWorkflows = workflows.filter(w => {
    if (workflowStatusFilter !== 'ALL' && w.status !== workflowStatusFilter) {
      return false;
    }
    if (workflowSearch) {
      const q = workflowSearch.toLowerCase();
      const nameMatch = w.workflowName?.toLowerCase().includes(q);
      const idMatch = w.id?.toLowerCase().includes(q);
      const agentMatch = w.responsibleAgent?.toLowerCase().includes(q);
      const initMatch = w.initiatedBy?.toLowerCase().includes(q);
      return nameMatch || idMatch || agentMatch || initMatch;
    }
    return true;
  });

  const tabsConfig = [
    { id: 'workflows', label: 'Workflow Command Center', count: workflows.length },
    { id: 'approvals', label: 'Human Approvals Queue', count: approvals.filter(a => a.status === 'PENDING').length },
    { id: 'registry', label: 'Workflow Registry Catalog', count: registry.length },
    { id: 'delegation', label: 'Faculty Reviewer Delegation', count: delegatedReviewers.filter(r => r.isActive).length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in duration-200">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Agent Orchestration & Platform Reliability"
        subtitle="Deterministic cross-agent pipeline coordination, human-in-the-loop review gating, and decentralized faculty delegation."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => setShowTriggerModal(true)}
            >
              Dispatch Workflow
            </Button>
          </div>
        }
      />

      {/* High-Level Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Workflows"
          value={workflows.filter(w => w.status === 'RUNNING' || w.status === 'QUEUED').length.toString()}
          subtitle="Executing in pipeline"
          icon={Activity}
          variant="indigo"
        />
        <StatCard
          title="Human Gating Queue"
          value={approvals.filter(a => a.status === 'PENDING').length.toString()}
          subtitle="Mandatory TPO reviews"
          icon={ShieldAlert}
          variant="amber"
        />
        <StatCard
          title="Execution Success"
          value={`${observabilityStats?.overview?.successRate ?? 98.4}%`}
          subtitle="Zero silent failures"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          title="Delegated Faculty"
          value={delegatedReviewers.filter(r => r.isActive).length.toString()}
          subtitle="Active department reviewers"
          icon={Users}
          variant="purple"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOW COMMAND CENTER                                           */}
      {/* ========================================================================= */}
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by workflow, ID, agent, user..."
                  value={workflowSearch}
                  onChange={(e) => setWorkflowSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
                {['ALL', 'WAITING_FOR_REVIEW', 'RUNNING', 'COMPLETED', 'FAILED', 'QUEUED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setWorkflowStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                      workflowStatusFilter === st
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'All Status' : st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Workflow Executions List */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Workflow Execution</th>
                    <th className="py-3 px-4">Responsible Agent</th>
                    <th className="py-3 px-4">Trigger & Initiator</th>
                    <th className="py-3 px-4">Duration / Timeout</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkflows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium">No workflow executions found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredWorkflows.map((wf) => {
                      const st = WORKFLOW_STATUSES[wf.status] || WORKFLOW_STATUSES.QUEUED;
                      const agent = AGENT_ROSTER[wf.responsibleAgent] || { name: wf.responsibleAgent, badgeColor: 'bg-slate-100 text-slate-700' };

                      return (
                        <tr key={wf.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {wf.workflowName}
                              {wf.priority === 'HIGH' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200">
                                  HIGH
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>{wf.id}</span>
                              {wf.idempotencyKey && (
                                <span className="text-slate-300 truncate max-w-[140px]" title={wf.idempotencyKey}>
                                  key: {wf.idempotencyKey}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${agent.badgeColor}`}>
                              {agent.name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 font-medium">
                              {wf.triggerType?.replace(/_/g, ' ') || 'Manual'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {wf.initiatedBy || 'system'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 font-medium font-mono">
                              {wf.executionDurationMs ? `${(wf.executionDurationMs / 1000).toFixed(2)}s` : '—'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Limit: {Math.round(wf.timeoutMs / 1000)}s (Retries: {wf.retryCount || 0}/{wf.maxRetries || 3})
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${st.color}`}>
                              {wf.status === 'RUNNING' && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />}
                              {st.label}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => {
                                  setInspectWorkflow(wf);
                                  setShowInspectModal(true);
                                }}
                              >
                                Inspect
                              </Button>

                              {wf.status === 'WAITING_FOR_REVIEW' && (
                                <Button
                                  variant="primary"
                                  size="xs"
                                  onClick={() => {
                                    const app = approvals.find(a => a.workflowId === wf.id) || {
                                      workflowId: wf.id,
                                      workflowName: wf.workflowName,
                                      inputPayload: wf.inputPayload,
                                      companyName: wf.inputPayload?.companyName,
                                      targetRole: wf.inputPayload?.targetRole,
                                    };
                                    setSelectedApproval(app);
                                    setShowApprovalModal(true);
                                  }}
                                >
                                  Review
                                </Button>
                              )}

                              {wf.status === 'FAILED' && (
                                <Button
                                  variant="outline"
                                  size="xs"
                                  icon={RotateCcw}
                                  onClick={() => handleRetryWorkflow(wf.id)}
                                >
                                  Retry
                                </Button>
                              )}

                              {(wf.status === 'RUNNING' || wf.status === 'WAITING_FOR_REVIEW') && (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  onClick={() => handleCancelWorkflow(wf.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HUMAN APPROVALS QUEUE                                             */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Banner Explaining Human Gating */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white shadow-2xs text-amber-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-amber-900">
                Mandatory Human-in-the-Loop Gating
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Workflows touching student placements, shortlist releases, and credential authentications are structurally halted until an authorized TPO officer or designated faculty reviewer validates the payload. Autonomous agents are prohibited from unilaterally excluding candidates or finalizing hiring commitments.
              </p>
            </div>
          </div>

          {/* Pending Approvals List */}
          <div className="grid grid-cols-1 gap-4">
            {approvals.filter(a => a.status === 'PENDING').length === 0 ? (
              <Card className="p-12 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">Approvals Queue is Clear</h4>
                <p className="text-xs text-slate-400 mt-1">
                  All pending workflow gating steps have been reviewed and decided.
                </p>
              </Card>
            ) : (
              approvals.filter(a => a.status === 'PENDING').map((app) => (
                <Card key={app.id} className="p-5 border-l-4 border-l-amber-500">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                          {app.actionType?.replace(/_/g, ' ') || 'Human Gate Review'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {app.id}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">
                        {app.workflowName}
                      </h3>

                      <p className="text-xs text-slate-600">
                        Initiated by <strong className="text-slate-800">{app.initiatedBy || 'Recruiter Portal'}</strong> for{' '}
                        <strong className="text-slate-800">{app.companyName || app.studentName || 'Campus Pipeline'}</strong>
                        {app.targetRole && ` • Role: ${app.targetRole}`}
                      </p>

                      {/* Payload preview box */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                          Inspected Step Payload:
                        </div>
                        <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap max-h-32">
                          {JSON.stringify(app.inputPayload, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        onClick={() => {
                          setSelectedApproval(app);
                          setApprovalAction('APPROVED');
                          setShowApprovalModal(true);
                        }}
                      >
                        Approve & Resume
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        icon={X}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          setSelectedApproval(app);
                          setApprovalAction('REJECTED');
                          setShowApprovalModal(true);
                        }}
                      >
                        Reject Step
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKFLOW REGISTRY CATALOG                                         */}
      {/* ========================================================================= */}
      {activeTab === 'registry' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-800">
                Registered Deterministic Workflows ({registry.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Strict multi-agent handoff contracts with guaranteed input/output schemas and execution SLAs.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registry.map((def) => {
              const agent = AGENT_ROSTER[def.responsibleAgent] || { name: def.responsibleAgent, badgeColor: 'bg-slate-100 text-slate-700' };

              return (
                <Card key={def.workflowDefinitionId} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {def.workflowDefinitionId}
                      </span>
                      {def.requiredHumanApproval ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Mandatory TPO Review
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Autonomous Pipeline
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {def.workflowName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {def.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Responsible Agent</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border mt-0.5 ${agent.badgeColor}`}>
                          {agent.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Initiating Roles</span>
                        <span className="text-slate-700 font-medium">
                          {def.initiatingRoles?.join(', ') || 'all'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Timeout / Retries</span>
                        <span className="text-slate-700 font-mono">
                          {Math.round(def.timeoutMs / 1000)}s (max {def.maxRetries})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Default Trigger</span>
                        <span className="text-slate-700 font-medium">
                          {def.triggerType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-mono space-y-1">
                      <div><strong className="text-slate-800">In:</strong> {def.inputSchemaSummary}</div>
                      <div><strong className="text-slate-800">Out:</strong> {def.outputSchemaSummary}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Play}
                      onClick={() => {
                        setSelectedWorkflowForTrigger(def.workflowDefinitionId);
                        setShowTriggerModal(true);
                      }}
                    >
                      Trigger Workflow
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FACULTY REVIEWER DELEGATION                                       */}
      {/* ========================================================================= */}
      {activeTab === 'delegation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200/80 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white shadow-2xs text-purple-600 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-purple-900">
                  Decentralized Faculty Reviewer Registry (Stop-Gate 5 Resolution)
                </h3>
                <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                  TPO administrators can delegate evidence and skill audit authority to departmental faculty coordinators. Delegations are tenant-isolated, auditable, and instantaneously revocable with zero stale permissions.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowDelegationModal(true)}
              className="shrink-0"
            >
              Delegate Faculty
            </Button>
          </div>

          {/* Delegated Reviewers Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Granted Permissions</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4">Authority Status</th>
                    <th className="py-3 px-4 text-right">Revocation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {delegatedReviewers.map((rev) => (
                    <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{rev.reviewerName}</div>
                        <div className="text-[11px] text-slate-400">{rev.reviewerEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{rev.department}</div>
                        <div className="text-[11px] text-slate-400">{rev.role}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rev.permissions?.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {p.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {rev.validUntil ? new Date(rev.validUntil).toLocaleDateString() : 'Indefinite'}
                      </td>

                      <td className="py-3.5 px-4">
                        {rev.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <ShieldOff className="w-3 h-3" /> REVOKED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {rev.isActive ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleRevokeDelegation(rev.id, rev.reviewerName)}
                          >
                            Revoke Immediately
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Authority Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TRIGGER WORKFLOW VALIDATION MODAL                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showTriggerModal}
        onClose={() => setShowTriggerModal(false)}
        title="Dispatch Deterministic Workflow"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Workflow Definition
            </label>
            <select
              value={selectedWorkflowForTrigger}
              onChange={(e) => setSelectedWorkflowForTrigger(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
            >
              {registry.map((def) => (
                <option key={def.workflowDefinitionId} value={def.workflowDefinitionId}>
                  {def.workflowName} ({def.workflowDefinitionId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Execution Priority
            </label>
            <div className="flex gap-2">
              {['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((pr) => (
                <button
                  key={pr}
                  type="button"
                  onClick={() => setTriggerPriority(pr)}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-medium transition-colors ${
                    triggerPriority === pr
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Input Payload (JSON Contract)
            </label>
            <textarea
              rows={6}
              value={triggerPayloadText}
              onChange={(e) => setTriggerPayloadText(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 font-mono text-[11px] focus:border-indigo-500 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Strictly validated against registered Zod contract. Idempotency key generated automatically.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTriggerModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={Play} onClick={handleTriggerWorkflow}>
              Dispatch Workflow
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: INSPECT WORKFLOW STEPS & PAYLOADS                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showInspectModal}
        onClose={() => setShowInspectModal(false)}
        title={inspectWorkflow ? `Workflow Inspection: ${inspectWorkflow.workflowName}` : 'Workflow Inspection'}
        size="lg"
      >
        {inspectWorkflow && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Execution ID</span>
                <span className="font-mono text-slate-800">{inspectWorkflow.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Status</span>
                <span className="font-semibold text-slate-800">{inspectWorkflow.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Duration</span>
                <span className="font-mono text-slate-800">
                  {inspectWorkflow.executionDurationMs ? `${(inspectWorkflow.executionDurationMs / 1000).toFixed(2)}s` : 'In progress'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase text-[9px]">Responsible Agent</span>
                <span className="text-indigo-600 font-semibold">{inspectWorkflow.responsibleAgent}</span>
              </div>
            </div>

            {/* Steps Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Execution Steps Pipeline</h4>
              <div className="space-y-2">
                {inspectWorkflow.steps?.map((step) => (
                  <div key={step.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                        {step.stepIndex}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800">{step.stepName}</div>
                        <div className="text-[10px] text-slate-400">Agent: {step.responsibleAgent}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-slate-500">{step.executionTimeMs}ms</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {step.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Input & Output Inspectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Input Payload</h5>
                <pre className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-40">
                  {JSON.stringify(inspectWorkflow.inputPayload, null, 2)}
                </pre>
              </div>
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Output Result</h5>
                <pre className="p-3 rounded-lg bg-slate-900 text-blue-400 font-mono text-[11px] overflow-x-auto max-h-40">
                  {JSON.stringify(inspectWorkflow.outputResult || { status: inspectWorkflow.status, note: 'Execution pending completion' }, null, 2)}
                </pre>
              </div>
            </div>

            {inspectWorkflow.errorDetails && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                <div className="font-bold">Error Diagnostic:</div>
                <div className="text-[11px] mt-1">{inspectWorkflow.errorDetails.message}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: HUMAN APPROVAL ACTION DECISION                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title={approvalAction === 'APPROVED' ? 'Confirm Human Gate Approval' : 'Confirm Human Gate Rejection'}
        size="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            You are about to record a permanent audit decision for workflow{' '}
            <strong className="text-slate-900">{selectedApproval?.workflowName}</strong>.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              TPO Reviewer Audit Comments & Rationale
            </label>
            <textarea
              rows={3}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="e.g. Verified zero bias; verified all 14 candidates met minimum criteria."
              className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowApprovalModal(false)}>
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'APPROVED' ? 'primary' : 'outline'}
              size="sm"
              className={approvalAction === 'REJECTED' ? 'text-rose-600 border-rose-300 hover:bg-rose-50' : ''}
              onClick={handleApprovalSubmit}
            >
              Confirm {approvalAction}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DELEGATE NEW FACULTY REVIEWER                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showDelegationModal}
        onClose={() => setShowDelegationModal(false)}
        title="Delegate Faculty Verification Authority"
        size="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Faculty Member Name
            </label>
            <input
              type="text"
              value={newDelegation.reviewerName}
              onChange={(e) => setNewDelegation({ ...newDelegation, reviewerName: e.target.value })}
              placeholder="Dr. S. K. Mukherjee"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Official Institutional Email
            </label>
            <input
              type="email"
              value={newDelegation.reviewerEmail}
              onChange={(e) => setNewDelegation({ ...newDelegation, reviewerEmail: e.target.value })}
              placeholder="faculty@college.edu"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newDelegation.department}
                onChange={(e) => setNewDelegation({ ...newDelegation, department: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Information Technology">IT</option>
                <option value="Electronics & Communication">ECE</option>
                <option value="Electrical Engineering">EEE</option>
                <option value="Mechanical Engineering">Mechanical</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expiration Date</label>
              <input
                type="date"
                value={newDelegation.validUntil}
                onChange={(e) => setNewDelegation({ ...newDelegation, validUntil: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Delegation Notes & Domain Specialization
            </label>
            <input
              type="text"
              value={newDelegation.notes}
              onChange={(e) => setNewDelegation({ ...newDelegation, notes: e.target.value })}
              placeholder="Authorized for AI/ML and Distributed Systems portfolio audits"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDelegationModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" icon={UserCheck} onClick={handleCreateDelegation}>
              Grant Verification Authority
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
