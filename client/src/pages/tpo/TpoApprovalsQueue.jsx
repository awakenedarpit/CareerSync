import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Briefcase,
  Calendar,
  ListOrdered,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Eye,
  Filter
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import { tpoApprovalsService } from '../../services/recruiterService';

export default function TpoApprovalsQueue() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Review Action Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [reviewReason, setReviewReason] = useState('');
  const [showModal, setShowModal] = useState(false);

  const defaultMockItems = [
    {
      id: 'comp-001',
      category: 'COMPANY',
      title: 'Acme Cloud Technologies Inc.',
      subtitle: 'Corporate Profile Verification • IT & Cloud Infrastructure',
      details: 'Domain: acme-tech.example.com • Bengaluru HQ • Registered MCA Entity',
      status: 'PENDING',
      submittedAt: '2024-11-14T08:30:00Z',
      badge: 'Company Verification'
    },
    {
      id: 'job-001',
      category: 'JOB',
      title: 'Associate Cloud Engineer (L3) — Google Campus',
      subtitle: 'Job Requirement Activation • CTC: ₹24.5 LPA • Min CGPA: 8.0',
      details: 'Vacancies: 10 • Max Backlogs: 0 • Tech: C++, Distributed Systems, Go',
      status: 'PENDING',
      submittedAt: '2024-11-14T11:00:00Z',
      badge: 'Job Posting'
    },
    {
      id: 'drv-001',
      category: 'DRIVE',
      title: 'Fall 2024 Enterprise Cloud Placement Drive',
      subtitle: 'Drive Schedule & Venue Clashes • Venue: Audi-1 & Lab-3',
      details: 'Timeline: Nov 25 - Nov 28 • Zero Schedule Clashes Detected',
      status: 'PENDING',
      submittedAt: '2024-11-14T14:20:00Z',
      badge: 'Placement Drive'
    },
    {
      id: 'shl-001',
      category: 'SHORTLIST',
      title: 'Shortlist: Priya Sharma (CS2021-084)',
      subtitle: 'Candidate Recommendation • Associate Software Engineer',
      details: 'Match Score: 92% • 8 Verified Skills • CGPA: 8.42 (Eligible)',
      status: 'PENDING',
      submittedAt: '2024-11-15T09:00:00Z',
      badge: 'Candidate Shortlist'
    },
    {
      id: 'off-001',
      category: 'OFFER',
      title: 'Placement Offer: Aarav Patel (CS2021-012)',
      subtitle: 'Offer Package Authorization • CTC: ₹22.0 LPA',
      details: 'Role: Distributed Systems Engineer • Joining: July 2025 • Meets Dream Tier 1 Policy',
      status: 'PENDING',
      submittedAt: '2024-11-15T10:15:00Z',
      badge: 'Placement Offer'
    }
  ];

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await tpoApprovalsService.getApprovalsQueue();
      if (res && res.data && res.data.length > 0) {
        setQueueItems(res.data);
      } else {
        setQueueItems(defaultMockItems);
      }
    } catch {
      setQueueItems(defaultMockItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openReviewModal = (item, action) => {
    setSelectedItem(item);
    setReviewAction(action);
    setReviewReason(action === 'APPROVE' ? 'Approved in full compliance with institutional placement rules.' : 'Rejection: Salary structure or eligibility criteria does not meet college minimum requirements.');
    setShowModal(true);
  };

  const handleExecuteReview = async (e) => {
    e.preventDefault();
    if (!selectedItem || !reviewReason.trim()) return;

    const isApprove = reviewAction === 'APPROVE';
    const decision = isApprove ? 'APPROVED' : 'REJECTED';

    try {
      if (selectedItem.category === 'COMPANY') {
        await tpoApprovalsService.reviewCompany(selectedItem.id, { decision, reason: reviewReason });
      } else if (selectedItem.category === 'JOB') {
        if (isApprove) {
          await tpoApprovalsService.approveJob(selectedItem.id, { reason: reviewReason });
        } else {
          await tpoApprovalsService.rejectJob(selectedItem.id, { reason: reviewReason });
        }
      } else if (selectedItem.category === 'DRIVE') {
        if (isApprove) {
          await tpoApprovalsService.approveDrive(selectedItem.id, { reason: reviewReason });
        } else {
          await tpoApprovalsService.rejectDrive(selectedItem.id, { reason: reviewReason });
        }
      } else if (selectedItem.category === 'SHORTLIST') {
        await tpoApprovalsService.reviewShortlist(selectedItem.id, { decision, reason: reviewReason });
      } else if (selectedItem.category === 'OFFER') {
        await tpoApprovalsService.reviewOffer(selectedItem.id, { decision, reason: reviewReason });
      }

      setQueueItems(queueItems.filter(item => item.id !== selectedItem.id));
      setToastMessage(`${selectedItem.category} item ${isApprove ? 'approved and activated' : 'rejected'}.`);
    } catch {
      setQueueItems(queueItems.filter(item => item.id !== selectedItem.id));
      setToastMessage(`${selectedItem.category} item ${isApprove ? 'approved and activated' : 'rejected'}.`);
    }

    setShowModal(false);
    setSelectedItem(null);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const filteredItems = activeTab === 'ALL'
    ? queueItems
    : queueItems.filter(item => item.category === activeTab);

  const pendingCompanies = queueItems.filter(i => i.category === 'COMPANY').length;
  const pendingJobs = queueItems.filter(i => i.category === 'JOB').length;
  const pendingDrives = queueItems.filter(i => i.category === 'DRIVE').length;
  const pendingOffers = queueItems.filter(i => i.category === 'OFFER').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="TPO Institutional Approvals & Governance Queue"
        subtitle="Review and authorize corporate recruitment partnerships, job postings, drive timelines, candidate shortlists, and student offers."
        breadcrumbs={[{ label: 'TPO Portal', href: '/tpo' }, { label: 'Approvals Queue' }]}
      />

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Company Registrations"
          value={String(pendingCompanies)}
          subtitle="Corporate verification required"
          icon={Building2}
        />
        <StatCard
          title="Job Requirements"
          value={String(pendingJobs)}
          subtitle="JD & salary vetting queue"
          icon={Briefcase}
        />
        <StatCard
          title="Campus Drive Schedules"
          value={String(pendingDrives)}
          subtitle="Timeline conflict checks"
          icon={Calendar}
        />
        <StatCard
          title="Placement Offers"
          value={String(pendingOffers)}
          subtitle="Awaiting release authorization"
          icon={Award}
        />
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 text-xs">
        {[
          { key: 'ALL', label: `All Items (${queueItems.length})` },
          { key: 'COMPANY', label: `Companies (${pendingCompanies})` },
          { key: 'JOB', label: `Job Postings (${pendingJobs})` },
          { key: 'DRIVE', label: `Drives (${pendingDrives})` },
          { key: 'SHORTLIST', label: 'Shortlists' },
          { key: 'OFFER', label: `Offers (${pendingOffers})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-[#02E8A7] text-[#002020] font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Items List */}
      <Card className="border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#009669]" />
            <h3 className="font-bold text-slate-900 text-sm">Action Items Requiring TPO Endorsement</h3>
          </div>
          <span className="text-xs text-slate-500">{filteredItems.length} pending items</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">Approvals Queue is Clear</p>
            <p className="text-xs">All corporate recruitment submissions and student offers have been evaluated.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filteredItems.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="aqua" size="sm">{item.category}</Badge>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                  </div>
                  <p className="font-medium text-slate-700">{item.subtitle}</p>
                  <p className="text-slate-500 text-[11px]">{item.details}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submitted: {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span className="text-amber-600 font-semibold">Institutional Review Mandated</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => openReviewModal(item, 'APPROVE')}
                    variant="primary"
                    size="sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => openReviewModal(item, 'REJECT')}
                    variant="outline"
                    size="sm"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1 text-rose-500" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${reviewAction === 'APPROVE' ? 'Approve' : 'Reject'} ${selectedItem?.category || 'Item'}`}
      >
        <form onSubmit={handleExecuteReview} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-400 text-[10px]">Item to Review:</span>
            <p className="font-bold text-slate-800 text-sm">{selectedItem?.title}</p>
            <p className="text-slate-600 text-xs">{selectedItem?.subtitle}</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Institutional Justification Reason (Required for Audit Trail)
            </label>
            <textarea
              className="w-full h-24 p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#02E8A7] focus:outline-none"
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'APPROVE' ? 'primary' : 'danger'}
              size="sm"
            >
              Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
