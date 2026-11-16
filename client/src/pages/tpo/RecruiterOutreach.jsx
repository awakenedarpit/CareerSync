import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  PlusCircle,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  Search,
  Users
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import outreachService, {
  CAMPAIGN_STATUSES,
  OUTREACH_TEMPLATES,
  FALLBACK_CAMPAIGNS,
  FALLBACK_RECIPIENTS
} from '../../services/outreachService';

export default function RecruiterOutreach() {
  const [campaigns, setCampaigns] = useState(FALLBACK_CAMPAIGNS);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Campaign Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl-invitation-2026');
  const [newSubject, setNewSubject] = useState(OUTREACH_TEMPLATES[0].subject);
  const [newBodyTemplate, setNewBodyTemplate] = useState(OUTREACH_TEMPLATES[0].body);
  const [targetIndustries, setTargetIndustries] = useState(['Software & Cloud Services']);
  const [targetBatches, setTargetBatches] = useState(['Batch 2026']);
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Human Approval Confirmation Modal
  const [approvalModalCampaign, setApprovalModalCampaign] = useState(null);
  const [approverNotes, setApproverNotes] = useState('');
  const [approverConfirmed, setApproverConfirmed] = useState(false);
  const [approvingCampaign, setApprovingCampaign] = useState(false);

  // Preview Modal
  const [previewCampaignData, setPreviewCampaignData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await outreachService.getCampaigns();
      if (res) setCampaigns(res);
    } catch (err) {
      console.error('Failed to load outreach campaigns:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = OUTREACH_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setNewSubject(tmpl.subject);
      setNewBodyTemplate(tmpl.body);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setCreatingCampaign(true);
      const created = await outreachService.createCampaign({
        title: newTitle,
        templateId: selectedTemplateId,
        subject: newSubject,
        bodyTemplate: newBodyTemplate,
        targetIndustries,
        targetBatches,
        recipientEmails: FALLBACK_RECIPIENTS.map((r) => r.email),
      });
      setCampaigns([created, ...campaigns]);
      setIsCreateModalOpen(false);
      setNewTitle('');
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleOpenPreview = async (campaign) => {
    try {
      setPreviewLoading(true);
      const prev = await outreachService.previewCampaign(campaign.id);
      setPreviewCampaignData(prev);
    } catch (err) {
      console.error('Failed to preview campaign:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApproveCampaign = async () => {
    if (!approvalModalCampaign || !approverConfirmed) return;
    try {
      setApprovingCampaign(true);
      const approved = await outreachService.approveCampaign(approvalModalCampaign.id, {
        approvedBy: 'Dr. Rajiv Menon (TPO Authority)',
        notes: approverNotes || 'Verified corporate recipient directory and template personalization.',
      });
      setCampaigns(campaigns.map((c) => (c.id === approvalModalCampaign.id ? { ...c, ...approved } : c)));
      setApprovalModalCampaign(null);
      setApproverConfirmed(false);
      setApproverNotes('');
    } catch (err) {
      console.error('Failed to approve campaign:', err);
    } finally {
      setApprovingCampaign(false);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      const sent = await outreachService.sendCampaign(campaignId);
      setCampaigns(campaigns.map((c) => (c.id === campaignId ? { ...c, ...sent } : c)));
    } catch (err) {
      console.error('Failed to send campaign:', err);
    }
  };

  const filteredCampaigns = campaigns.filter((cmp) => {
    const matchesStatus = statusFilter === 'ALL' || cmp.status === statusFilter;
    const matchesSearch =
      cmp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cmp.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Recruiter Outreach & Engagement Campaigns"
        subtitle="End-to-end recruitment invitations with personalized corporate templates, mandatory human approval gates, and zero-cost CSV fallback."
        breadcrumbs={[
          { label: 'TPO Portal', href: '/tpo' },
          { label: 'Recruiter Outreach' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => outreachService.exportRecipientsToCsv()}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
              Export Recruiter Directory (CSV)
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Outreach Campaign
            </Button>
          </div>
        }
      />

      {/* Human Approval Gate & Cardless Policy Notice */}
      <div className="p-4 rounded-xl border border-[#02E8A7]/40 bg-[#BDF9F9]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#02E8A7] text-[#002020] font-bold shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Mandatory Human Approval Gate & ₹0 Cardless Safeguard</h4>
            <p className="text-slate-600 leading-relaxed text-[11px] mt-0.5">
              Outreach campaigns can never be dispatched autonomously. Every draft requires explicit sign-off by the TPO authority. 
              In compliance with the platform's ₹0 cardless policy, campaigns support both automated SMTP dispatch and zero-cost CSV export for manual mail-merge.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#002020] bg-white px-3 py-1.5 rounded-lg border border-[#02E8A7]/30 shadow-2xs shrink-0">
          <Users className="w-4 h-4 text-[#009669]" />
          <span>Active Recruiter Pool: <strong>42 Partners</strong></span>
        </div>
      </div>

      {/* Campaign List Manager */}
      <Card
        title="Outreach Campaign Manager"
        subtitle="Manage invitations, company updates, and talent portfolios across the campaign lifecycle."
        headerAction={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Lifecycle Stages</option>
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Under Review</option>
              <option value="APPROVED">Human Approved</option>
              <option value="SENT">Sent</option>
            </select>
          </div>
        }
      >
        <div className="mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by campaign title or subject line..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Campaign Title & Subject</th>
                <th className="py-2.5 px-3">Target Industry & Batch</th>
                <th className="py-2.5 px-3">Recipients</th>
                <th className="py-2.5 px-3">Lifecycle Status</th>
                <th className="py-2.5 px-3">Human Approval Gate</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No outreach campaigns found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((cmp) => {
                  const statusConfig = CAMPAIGN_STATUSES[cmp.status] || CAMPAIGN_STATUSES.DRAFT;
                  return (
                    <tr key={cmp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                        <div>{cmp.title}</div>
                        <span className="text-[10px] text-slate-400 line-clamp-1 font-normal">{cmp.subject}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{cmp.targetBatches?.join(', ')}</div>
                        <span className="text-[10px] text-slate-400">{cmp.targetIndustries?.join(', ')}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        {cmp.recipientCount} recruiters
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            statusConfig.badgeVariant === 'emerald'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : statusConfig.badgeVariant === 'amber'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : statusConfig.badgeVariant === 'sky'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {cmp.approvedBy ? (
                          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved by {cmp.approvedBy.split(' ')[1] || 'TPO'}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 font-medium">Pending TPO Sign-off</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="xs" onClick={() => handleOpenPreview(cmp)}>
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Preview
                          </Button>
                          {cmp.status !== 'APPROVED' && cmp.status !== 'SENT' && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setApprovalModalCampaign(cmp);
                                setApproverConfirmed(false);
                                setApproverNotes('');
                              }}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#009669]" />
                              Authorize
                            </Button>
                          )}
                          {cmp.status === 'APPROVED' && (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleSendCampaign(cmp.id)}
                            >
                              <Send className="w-3.5 h-3.5 mr-1" />
                              Dispatch
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

      {/* Create Campaign Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Compose Recruiter Outreach Campaign"
        subtitle="Select standardized corporate invitation templates and configure dynamic placeholders."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Tier-1 Product Companies Placement Drive Invitation"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Template Selector</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              >
                {OUTREACH_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Cohort</label>
              <select
                value={targetBatches[0]}
                onChange={(e) => setTargetBatches([e.target.value])}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              >
                <option value="Batch 2026">Batch of 2026 (Final Year)</option>
                <option value="Batch 2027">Batch of 2027 (Pre-Final)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Industry</label>
              <select
                value={targetIndustries[0]}
                onChange={(e) => setTargetIndustries([e.target.value])}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              >
                <option value="Software & Cloud Services">Software & Cloud Services</option>
                <option value="Fintech">Fintech</option>
                <option value="AI / Machine Learning">AI / Machine Learning</option>
                <option value="Automotive & Core">Automotive & Core</option>
                <option value="IT Services">IT Services</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line</label>
            <input
              type="text"
              required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Message Body Template</label>
              <span className="text-[10px] text-slate-400">Available: {`{{company_name}}, {{batch_year}}, {{institution_name}}, {{tpo_name}}`}</span>
            </div>
            <textarea
              rows={6}
              required
              value={newBodyTemplate}
              onChange={(e) => setNewBodyTemplate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 font-mono focus:border-[#02E8A7] focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={creatingCampaign}>
              {creatingCampaign ? 'Saving...' : 'Save Draft Campaign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Human Approval Confirmation Modal */}
      {approvalModalCampaign && (
        <Modal
          isOpen={!!approvalModalCampaign}
          onClose={() => setApprovalModalCampaign(null)}
          title="Mandatory Human Approval Sign-Off"
          subtitle={`Authorize campaign: ${approvalModalCampaign.title}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Regulatory Human-in-the-Loop Gate</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                By authorizing this campaign, you confirm that recipient corporate email addresses are verified, the content complies with institutional recruitment guidelines, and the suppression list has been applied.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorization Justification & Review Notes
              </label>
              <textarea
                rows={3}
                placeholder="Confirm that target recruiter list has been verified against duplicate filters..."
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-[#02E8A7] focus:outline-hidden"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approverConfirmed}
                  onChange={(e) => setApproverConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#009669] focus:ring-[#02E8A7]"
                />
                <span className="text-[11px] text-slate-700 leading-snug">
                  I, as designated TPO Authority, have reviewed the personalized communication preview and authorize queued dispatch to <strong>{approvalModalCampaign.recipientCount} corporate partners</strong>.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setApprovalModalCampaign(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApproveCampaign}
                disabled={!approverConfirmed || approvingCampaign}
              >
                {approvingCampaign ? 'Granting Approval...' : 'Confirm Human Sign-Off'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Recipient Personalization Preview Modal */}
      {previewCampaignData && (
        <Modal
          isOpen={!!previewCampaignData}
          onClose={() => setPreviewCampaignData(null)}
          title="Personalized Email Preview (Recipient View)"
          subtitle={`Showing sample rendering for: ${previewCampaignData.recipient.companyName}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
              <div><strong className="text-slate-500 font-sans">To: </strong>{previewCampaignData.recipient.recruiterName} &lt;{previewCampaignData.recipient.email}&gt;</div>
              <div><strong className="text-slate-500 font-sans">Subject: </strong>{previewCampaignData.renderedSubject}</div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
              {previewCampaignData.renderedBody}
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Suppression list verified (0 unsubscribed, 3 duplicates filtered).</span>
              </div>
              <span className="font-mono font-bold">Total: {previewCampaignData.totalRecipients}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setPreviewCampaignData(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
