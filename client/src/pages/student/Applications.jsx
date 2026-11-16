import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  IndianRupee,
  Calendar,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import authService from '../../services/authService';

const DEMO_DRIVES = [
  {
    id: 'DRV-2024-001',
    company: 'Google',
    role: 'Associate Software Engineer (L3)',
    package: '24.5 LPA',
    location: 'Bengaluru / Hyderabad',
    date: '28 Nov 2024',
    status: 'Shortlisted',
    eligible: true,
    eligibilityReason: 'CGPA: 8.4 ≥ 8.0, 5 Verified skills met (DSA, JS, DB). Round 1 Technical Test passed.',
    appliedDate: '02 Nov 2024'
  },
  {
    id: 'DRV-2024-002',
    company: 'TCS Digital',
    role: 'System Engineer - Digital Cadre',
    package: '9.2 LPA',
    location: 'Pan India',
    date: '15 Nov 2024',
    status: 'Selected',
    eligible: true,
    eligibilityReason: 'Full match. Offer letter issued and verified by T&P cell.',
    appliedDate: '15 Oct 2024'
  },
  {
    id: 'DRV-2024-003',
    company: 'Razorpay',
    role: 'Backend Engineering Intern / FTE',
    package: '18.0 LPA',
    location: 'Bengaluru',
    date: '05 Dec 2024',
    status: 'Eligible',
    eligible: true,
    eligibilityReason: 'CGPA ≥ 7.5 and verified Node.js/PostgreSQL credentials matched.',
    appliedDate: 'Not Applied'
  },
  {
    id: 'DRV-2024-004',
    company: 'Microsoft',
    role: 'Software Development Engineer',
    package: '28.0 LPA',
    location: 'Hyderabad',
    date: '12 Dec 2024',
    status: 'Eligible',
    eligible: true,
    eligibilityReason: 'All criteria satisfied. Registrations open.',
    appliedDate: 'Not Applied'
  },
  {
    id: 'DRV-2024-005',
    company: 'Amazon Web Services',
    role: 'Cloud Support Associate',
    package: '16.0 LPA',
    location: 'Bengaluru',
    date: '02 Dec 2024',
    status: 'Applied',
    eligible: true,
    eligibilityReason: 'Application submitted. Resume and verified GitHub portfolio forwarded.',
    appliedDate: '08 Nov 2024'
  },
  {
    id: 'DRV-2024-006',
    company: 'Goldman Sachs',
    role: 'Summer Analyst / FTE',
    package: '26.0 LPA',
    location: 'Bengaluru',
    date: '18 Dec 2024',
    status: 'Ineligible',
    eligible: false,
    eligibilityReason: 'Requires CGPA ≥ 8.5 (Current CGPA: 8.42 - gap of 0.08 points).',
    appliedDate: 'N/A'
  },
  {
    id: 'DRV-2024-007',
    company: 'Infosys',
    role: 'Specialist Programmer',
    package: '9.5 LPA',
    location: 'Pune / Mysore',
    date: '22 Nov 2024',
    status: 'Applied',
    eligible: true,
    eligibilityReason: 'Application under review with technical screening team.',
    appliedDate: '01 Nov 2024'
  }
];

export default function Applications() {
  const currentUser = authService.getCurrentUser();
  const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu'].includes(currentUser?.email);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const [drives, setDrives] = useState(() => (isDemoStudent ? DEMO_DRIVES : []));

  const handleApply = (drive) => {
    setSelectedDrive(drive);
    setShowApplyModal(true);
  };

  const confirmApply = () => {
    setDrives(drives.map(d => {
      if (d.id === selectedDrive.id) {
        return { ...d, status: 'Applied', appliedDate: 'Just now' };
      }
      return d;
    }));
    setShowApplyModal(false);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  const filteredDrives = drives.filter(d => {
    const matchesFilter = filterStatus === 'all' || d.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesQuery = d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const columns = [
    {
      key: 'company',
      label: 'Company & Role',
      render: (_, row) => (
        <div>
          <div className="font-bold text-slate-900">{row.company}</div>
          <div className="text-xs text-slate-500">{row.role}</div>
        </div>
      )
    },
    { key: 'package', label: 'Compensation', sortable: true },
    { key: 'location', label: 'Location' },
    { key: 'date', label: 'Drive Date', sortable: true },
    {
      key: 'status',
      label: 'Application Status',
      render: (val) => {
        let variant = 'slate';
        if (val === 'Selected') variant = 'emerald';
        else if (val === 'Shortlisted') variant = 'indigo';
        else if (val === 'Applied') variant = 'sky';
        else if (val === 'Eligible') variant = 'purple';
        else if (val === 'Ineligible') variant = 'rose';
        return <Badge variant={variant} size="sm">{val}</Badge>;
      }
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Eligible' ? (
            <Button onClick={() => handleApply(row)} variant="primary" size="sm">
              Apply Now
            </Button>
          ) : (
            <button
              onClick={() => {
                setSelectedDrive(row);
                setShowApplyModal(true);
              }}
              className="text-xs font-semibold text-[#009669] hover:underline"
            >
              View Details
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Drives & Applications"
        subtitle="Manage your active drive applications with automated, transparent eligibility checks."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Applications' }]}
      />

      {appliedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Application successfully submitted! Verified evidence package forwarded to company T&P coordinators.</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['all', 'eligible', 'applied', 'shortlisted', 'selected', 'ineligible'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-[#02E8A7] text-[#002020] font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search drives or roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-[#02E8A7] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Drives DataTable or Empty State */}
      {filteredDrives.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-slate-200 space-y-2">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">No Applications Submitted Yet</p>
          <p className="text-xs">Browse upcoming placement drives or check back when your college T&P cell announces new corporate drive schedules.</p>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDrives}
          pageSize={6}
        />
      )}

      {/* Modal for Details / Apply */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title={selectedDrive ? `${selectedDrive.company} - ${selectedDrive.role}` : 'Drive Info'}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowApplyModal(false)} variant="outline" size="sm">
              Close
            </Button>
            {selectedDrive?.status === 'Eligible' && (
              <Button onClick={confirmApply} variant="primary" size="sm">
                Submit One-Click Application
              </Button>
            )}
          </div>
        }
      >
        {selectedDrive && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block">Package</span>
                <strong className="text-slate-900">{selectedDrive.package}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Location</span>
                <strong className="text-slate-900">{selectedDrive.location}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Drive Date</span>
                <strong className="text-slate-900">{selectedDrive.date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Current Status</span>
                <strong className="text-[#009669]">{selectedDrive.status}</strong>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Eligibility Explanation</h4>
              <div className={`p-3 rounded-lg border ${selectedDrive.eligible ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-rose-50/50 border-rose-200 text-rose-900'}`}>
                {selectedDrive.eligibilityReason}
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              Submitting sends your verified profile snapshot, including GPA and code evidence, directly to the recruiter with human T&P approval.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
