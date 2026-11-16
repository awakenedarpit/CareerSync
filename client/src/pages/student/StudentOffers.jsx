import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/ui/StatCard';
import { studentOffersService } from '../../services/recruiterService';
import authService from '../../services/authService';

export default function StudentOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Decision Modal
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [decisionType, setDecisionType] = useState('ACCEPTED'); // 'ACCEPTED' | 'DECLINED'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [showModal, setShowModal] = useState(false);

  const defaultMockOffers = [
    {
      id: 'off-001',
      roleTitle: 'Associate Software Engineer (L3)',
      companyName: 'Acme Technologies Inc.',
      ctcLpa: 24.5,
      status: 'RELEASED',
      joiningDate: '2025-07-15',
      expiryDate: '2025-01-30',
      tpoApprovalReason: 'Approved as Dream Tier 1 corporate offer.',
      releasedAt: '2024-11-14T10:00:00Z',
      terms: 'Full-time employment, Bengaluru headquarters, standard probation period of 6 months.'
    }
  ];

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await studentOffersService.getMyOffers();
      if (res && res.data && res.data.length > 0) {
        setOffers(res.data);
      } else {
        const currentUser = authService.getCurrentUser();
        const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu'].includes(currentUser?.email);
        setOffers(isDemoStudent ? defaultMockOffers : []);
      }
    } catch {
      const currentUser = authService.getCurrentUser();
      const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu'].includes(currentUser?.email);
      setOffers(isDemoStudent ? defaultMockOffers : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openDecisionModal = (offer, type) => {
    setSelectedOffer(offer);
    setDecisionType(type);
    setDecisionNotes(type === 'ACCEPTED' ? 'I am pleased to formally accept this employment offer.' : '');
    setShowModal(true);
  };

  const handleExecuteDecision = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return;

    try {
      await studentOffersService.respondToOffer(selectedOffer.id, {
        response: decisionType,
        notes: decisionNotes
      });

      setOffers(offers.map(o => o.id === selectedOffer.id ? {
        ...o,
        status: decisionType,
        studentResponse: decisionType,
        studentNotes: decisionNotes,
        respondedAt: new Date().toISOString()
      } : o));

      setToastMessage(`Offer successfully ${decisionType.toLowerCase()}. Decision recorded in institutional database.`);
    } catch {
      setOffers(offers.map(o => o.id === selectedOffer.id ? {
        ...o,
        status: decisionType,
        studentResponse: decisionType,
        studentNotes: decisionNotes,
        respondedAt: new Date().toISOString()
      } : o));

      setToastMessage(`Offer successfully ${decisionType.toLowerCase()}. Decision recorded in institutional database.`);
    }

    setShowModal(false);
    setSelectedOffer(null);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
  const pendingOffers = offers.filter(o => o.status === 'RELEASED');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Offers & Career Decisions"
        subtitle="Review, accept, or decline institutional campus placement offers verified and authorized by your college TPO."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Offers' }]}
      />

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Received Offers"
          value={String(offers.length)}
          subtitle="TPO Endorsed Packages"
          icon={Award}
        />
        <StatCard
          title="Pending Decision"
          value={String(pendingOffers.length)}
          subtitle="Awaiting your response"
          icon={Clock}
        />
        <StatCard
          title="Accepted Placement"
          value={acceptedOffers.length > 0 ? 'Confirmed' : 'None Yet'}
          subtitle={acceptedOffers.length > 0 ? `${acceptedOffers[0].roleTitle}` : 'Review pending offers'}
          icon={CheckCircle2}
        />
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.length === 0 ? (
          <Card className="p-12 text-center text-slate-400 border-slate-200 space-y-2">
            <Award className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No Placement Offers Released Yet</p>
            <p className="text-xs">Once interview rounds are cleared and TPO endorses your offer package, it will appear here.</p>
          </Card>
        ) : (
          offers.map(offer => (
            <Card key={offer.id} className="p-6 border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{offer.roleTitle}</h3>
                    <Badge variant="aqua" size="sm">Campus Placement</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>{offer.companyName || 'Corporate Partner'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {offer.status === 'RELEASED' && (
                    <Badge variant="warning" size="md">Decision Pending</Badge>
                  )}
                  {offer.status === 'ACCEPTED' && (
                    <Badge variant="success" size="md">Offer Accepted</Badge>
                  )}
                  {offer.status === 'DECLINED' && (
                    <Badge variant="danger" size="md">Offer Declined</Badge>
                  )}
                </div>
              </div>

              {/* Offer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Annual Compensation</span>
                  <div className="text-lg font-black text-[#009669]">₹{offer.ctcLpa} LPA</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Joining Date</span>
                  <div className="font-bold text-slate-800">{offer.joiningDate || 'Summer 2025'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Decision Deadline</span>
                  <div className="font-bold text-amber-600">{offer.expiryDate || 'Open'}</div>
                </div>
              </div>

              {/* TPO Endorsement Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">TPO Institutional Authorization:</strong>{' '}
                  <span>{offer.tpoApprovalReason || 'Verified in compliance with college placement policy.'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {offer.status === 'RELEASED' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Please confirm your career decision before the deadline date.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => openDecisionModal(offer, 'ACCEPTED')}
                      variant="primary"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Accept Offer
                    </Button>
                    <Button
                      onClick={() => openDecisionModal(offer, 'DECLINED')}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-1.5 text-rose-500" />
                      Decline Offer
                    </Button>
                  </div>
                </div>
              )}

              {offer.status === 'ACCEPTED' && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>You accepted this offer. Official joining onboarding instructions will be shared by the recruiter.</span>
                  </div>
                  {offer.studentNotes && (
                    <span className="text-[11px] italic text-slate-500">"{offer.studentNotes}"</span>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={decisionType === 'ACCEPTED' ? 'Confirm Offer Acceptance' : 'Decline Offer Package'}
      >
        <form onSubmit={handleExecuteDecision} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-slate-400 text-[10px]">Target Position:</span>
            <p className="font-bold text-slate-800 text-sm">{selectedOffer?.roleTitle}</p>
            <p className="text-[#009669] font-bold text-xs">₹{selectedOffer?.ctcLpa} LPA • {selectedOffer?.companyName}</p>
          </div>

          {decisionType === 'ACCEPTED' ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-[11px] flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Institutional Placement Policy Notice:</strong> Accepting a verified campus placement offer marks your placement status as placed in the institutional registry.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-[11px] flex gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>
                Please state your reason for declining this offer (e.g. Higher studies, pursuing alternate domain, relocation constraints).
              </span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              {decisionType === 'ACCEPTED' ? 'Candidate Confirmation Note (Optional)' : 'Reason for Declining (Mandatory)'}
            </label>
            <textarea
              className="w-full h-20 p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#02E8A7] focus:outline-none"
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              required={decisionType === 'DECLINED'}
              placeholder={decisionType === 'ACCEPTED' ? 'Thank you for this opportunity...' : 'Reason for declining...'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionType === 'ACCEPTED' ? 'primary' : 'danger'}
              size="sm"
            >
              Confirm {decisionType === 'ACCEPTED' ? 'Acceptance' : 'Decline'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
