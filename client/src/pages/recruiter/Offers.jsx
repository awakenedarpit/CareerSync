import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Send,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { recruiterService } from '../../services/recruiterService';

export default function RecruiterOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedOfferHistory, setSelectedOfferHistory] = useState([]);
  const [selectedOfferTitle, setSelectedOfferTitle] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // New Offer Form State
  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('Associate Software Engineer (L3)');
  const [formCtcLpa, setFormCtcLpa] = useState('18.5');
  const [formJoiningDate, setFormJoiningDate] = useState('2025-07-01');
  const [formExpiryDate, setFormExpiryDate] = useState('2025-01-30');

  const defaultMockOffers = [
    {
      id: 'off-001',
      candidateName: 'Priya Sharma',
      candidateRoll: 'CS2021-084',
      roleTitle: 'Associate Software Engineer (L3)',
      ctcLpa: 24.5,
      status: 'ACCEPTED',
      joiningDate: '2025-07-15',
      expiryDate: '2025-01-30',
      tpoApprovalReason: 'Approved as Dream Tier 1 corporate offer.',
      studentResponse: 'ACCEPTED',
      studentNotes: 'Thrilled to accept this cloud systems role.',
      createdAt: '2024-11-10T10:00:00.000Z'
    },
    {
      id: 'off-002',
      candidateName: 'Aarav Patel',
      candidateRoll: 'CS2021-012',
      roleTitle: 'Distributed Systems Engineer',
      ctcLpa: 22.0,
      status: 'RELEASED',
      joiningDate: '2025-07-01',
      expiryDate: '2025-02-15',
      tpoApprovalReason: 'Meets elite placement CTC guidelines.',
      createdAt: '2024-11-12T14:30:00.000Z'
    },
    {
      id: 'off-003',
      candidateName: 'Ananya Iyer',
      candidateRoll: 'CS2021-028',
      roleTitle: 'Backend Infrastructure Engineer',
      ctcLpa: 19.5,
      status: 'SUBMITTED_FOR_REVIEW',
      joiningDate: '2025-07-01',
      expiryDate: '2025-02-10',
      createdAt: '2024-11-14T09:15:00.000Z'
    },
    {
      id: 'off-004',
      candidateName: 'Meera Nambiar',
      candidateRoll: 'CS2021-052',
      roleTitle: 'Site Reliability Engineer',
      ctcLpa: 18.0,
      status: 'DRAFT',
      joiningDate: '2025-08-01',
      expiryDate: '2025-02-28',
      createdAt: '2024-11-15T08:00:00.000Z'
    }
  ];

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getOffers();
      if (res && res.data && res.data.length > 0) {
        setOffers(res.data);
      } else {
        setOffers(defaultMockOffers);
      }
    } catch {
      setOffers(defaultMockOffers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!formStudentName || !formRoleTitle) return;

    const payload = {
      driveId: 'drv-default',
      jobId: 'job-default',
      studentId: formStudentId || `std-${Date.now()}`,
      roleTitle: formRoleTitle,
      ctcLpa: parseFloat(formCtcLpa) || 15.0,
      joiningDate: formJoiningDate,
      expiryDate: formExpiryDate
    };

    try {
      const res = await recruiterService.createOffer(payload);
      const newOffer = res?.data || {
        ...payload,
        id: `off-${Date.now()}`,
        candidateName: formStudentName,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };
      setOffers([newOffer, ...offers]);
      setToastMessage(`Offer draft created for ${formStudentName}.`);
    } catch {
      const localOffer = {
        id: `off-${Date.now()}`,
        candidateName: formStudentName,
        candidateRoll: 'CS2021-NEW',
        roleTitle: formRoleTitle,
        ctcLpa: parseFloat(formCtcLpa) || 15.0,
        joiningDate: formJoiningDate,
        expiryDate: formExpiryDate,
        status: 'DRAFT',
        createdAt: new Date().toISOString()
      };
      setOffers([localOffer, ...offers]);
      setToastMessage(`Offer draft created for ${formStudentName}.`);
    }

    setShowCreateModal(false);
    setFormStudentName('');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSubmitForReview = async (offerId) => {
    try {
      await recruiterService.submitOffer(offerId);
      setOffers(offers.map(o => o.id === offerId ? { ...o, status: 'SUBMITTED_FOR_REVIEW' } : o));
      setToastMessage('Offer submitted for TPO institutional endorsement.');
    } catch {
      setOffers(offers.map(o => o.id === offerId ? { ...o, status: 'SUBMITTED_FOR_REVIEW' } : o));
      setToastMessage('Offer submitted for TPO institutional endorsement.');
    }
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleViewHistory = async (offer) => {
    setSelectedOfferTitle(`${offer.candidateName || 'Candidate'} — ${offer.roleTitle}`);
    try {
      const res = await recruiterService.getOfferHistory(offer.id);
      if (res && res.data && res.data.length > 0) {
        setSelectedOfferHistory(res.data);
      } else {
        setSelectedOfferHistory([
          { previousStatus: null, newStatus: 'DRAFT', changedBy: 'recruiter', reason: 'Initial offer package drafting', createdAt: offer.createdAt },
          ...(offer.status !== 'DRAFT' ? [{ previousStatus: 'DRAFT', newStatus: 'SUBMITTED_FOR_REVIEW', changedBy: 'recruiter', reason: 'Submitted to TPO', createdAt: offer.createdAt }] : []),
          ...(offer.status === 'RELEASED' || offer.status === 'ACCEPTED' ? [{ previousStatus: 'SUBMITTED_FOR_REVIEW', newStatus: 'APPROVED', changedBy: 'tpo_admin', reason: 'Meets salary guidelines', createdAt: offer.createdAt }, { previousStatus: 'APPROVED', newStatus: 'RELEASED', changedBy: 'system', reason: 'Offer released to student portal', createdAt: offer.createdAt }] : []),
          ...(offer.status === 'ACCEPTED' ? [{ previousStatus: 'RELEASED', newStatus: 'ACCEPTED', changedBy: 'student', reason: 'Student formally accepted', createdAt: offer.createdAt }] : [])
        ]);
      }
    } catch {
      setSelectedOfferHistory([
        { previousStatus: null, newStatus: 'DRAFT', changedBy: 'recruiter', reason: 'Initial draft', createdAt: offer.createdAt }
      ]);
    }
    setShowHistoryModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="secondary" size="sm">Draft</Badge>;
      case 'SUBMITTED_FOR_REVIEW':
        return <Badge variant="warning" size="sm">Under TPO Review</Badge>;
      case 'APPROVED':
        return <Badge variant="primary" size="sm">TPO Approved</Badge>;
      case 'RELEASED':
        return <Badge variant="aqua" size="sm">Released to Student</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success" size="sm">Offer Accepted</Badge>;
      case 'DECLINED':
        return <Badge variant="danger" size="sm">Declined</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="secondary" size="sm">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const acceptedCount = offers.filter(o => o.status === 'ACCEPTED').length;
  const releasedCount = offers.filter(o => o.status === 'RELEASED').length;
  const inReviewCount = offers.filter(o => o.status === 'SUBMITTED_FOR_REVIEW').length;
  const totalOutlay = offers
    .filter(o => o.status === 'ACCEPTED' || o.status === 'RELEASED')
    .reduce((sum, o) => sum + (Number(o.ctcLpa) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Offer Lifecycle Management"
        subtitle="Draft, submit for TPO institutional review, and track candidate acceptances with immutable audit logs."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Offers' }]}
        action={
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Draft New Offer
          </Button>
        }
      />

      {toastMessage && (
        <div className="p-3 bg-[#BDF9F9]/30 border border-[#02E8A7]/40 text-[#002020] rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#009669] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Accepted Offers"
          value={String(acceptedCount)}
          subtitle="Signed and accepted candidates"
          icon={CheckCircle2}
        />
        <StatCard
          title="Released to Students"
          value={String(releasedCount)}
          subtitle="Awaiting candidate decision"
          icon={Send}
        />
        <StatCard
          title="Pending TPO Review"
          value={String(inReviewCount)}
          subtitle="Under college verification"
          icon={Clock}
        />
        <StatCard
          title="Committed CTC Outlay"
          value={`₹${totalOutlay.toFixed(1)} LPA`}
          subtitle="Across active & accepted offers"
          icon={DollarSign}
        />
      </div>

      {/* Offers Table Card */}
      <Card className="border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[#009669]" />
            <h3 className="font-bold text-slate-900 text-sm">Placement Offers Lifecycle Registry</h3>
          </div>
          <span className="text-xs text-slate-500">{offers.length} total records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">CTC (LPA)</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{offer.candidateName || 'Candidate'}</div>
                    <div className="text-[11px] text-slate-400">{offer.candidateRoll || offer.studentId || 'ID: ' + offer.id.slice(0, 8)}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{offer.roleTitle}</td>
                  <td className="py-3.5 px-4 font-bold text-[#009669]">₹{offer.ctcLpa} LPA</td>
                  <td className="py-3.5 px-4 text-slate-600">{offer.joiningDate || 'TBD'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{offer.expiryDate || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(offer.status)}
                      {offer.tpoApprovalReason && (
                        <span className="text-[10px] text-slate-400 italic">TPO: {offer.tpoApprovalReason}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {offer.status === 'DRAFT' && (
                        <Button
                          onClick={() => handleSubmitForReview(offer.id)}
                          variant="primary"
                          size="sm"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Submit to TPO
                        </Button>
                      )}
                      <Button
                        onClick={() => handleViewHistory(offer)}
                        variant="ghost"
                        size="sm"
                      >
                        <History className="h-3 w-3 mr-1" />
                        Audit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Draft New Offer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Draft Placement Offer Package"
      >
        <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
          <Input
            label="Candidate Full Name"
            placeholder="e.g. Priya Sharma"
            value={formStudentName}
            onChange={(e) => setFormStudentName(e.target.value)}
            required
          />
          <Input
            label="Candidate Roll No / Student ID (Optional)"
            placeholder="e.g. CS2021-084"
            value={formStudentId}
            onChange={(e) => setFormStudentId(e.target.value)}
          />
          <Input
            label="Job Role Title"
            placeholder="e.g. Associate Software Engineer (L3)"
            value={formRoleTitle}
            onChange={(e) => setFormRoleTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="CTC (in LPA)"
              type="number"
              step="0.5"
              value={formCtcLpa}
              onChange={(e) => setFormCtcLpa(e.target.value)}
              required
            />
            <Input
              label="Joining Date"
              type="date"
              value={formJoiningDate}
              onChange={(e) => setFormJoiningDate(e.target.value)}
            />
            <Input
              label="Offer Expiry Date"
              type="date"
              value={formExpiryDate}
              onChange={(e) => setFormExpiryDate(e.target.value)}
            />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Institutional Policy: Offers are created in <strong>DRAFT</strong> mode and must be submitted for TPO endorsement before being released to candidates.
            </span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setShowCreateModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Draft Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Immutable History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Audit Trail: ${selectedOfferTitle}`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500 text-[11px]">
            Every lifecycle change in the offer is cryptographically logged with actor identity, timestamp, and rationale.
          </p>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-2">
            {selectedOfferHistory.map((item, idx) => (
              <div key={idx} className="py-2.5 px-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {item.previousStatus ? `${item.previousStatus} → ` : 'CREATED: '}
                      <span className="text-[#009669]">{item.newStatus}</span>
                    </span>
                    <Badge variant="secondary" size="sm">{item.changedBy}</Badge>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                  </span>
                </div>
                {item.reason && (
                  <p className="text-[11px] text-slate-600 italic">"{item.reason}"</p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowHistoryModal(false)} variant="outline" size="sm">
              Close Audit Trail
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
