import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Mail,
  Building,
  CheckCircle2,
  Clock,
  Shield
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function RecruiterManagement() {
  const [showModal, setShowModal] = useState(false);

  const [recruiters, setRecruiters] = useState([
    { id: 'REC-01', name: 'Sarah Jenkins', company: 'TechCorp / Google Hiring Team', email: 'sarah.j@google.com', activeJobs: 2, status: 'Active', lastActive: 'Today' },
    { id: 'REC-02', name: 'Vikram Malhotra', company: 'TCS Campus Talent Cell', email: 'v.malhotra@tcs.com', activeJobs: 3, status: 'Active', lastActive: 'Yesterday' },
    { id: 'REC-03', name: 'Deepa Krishnan', company: 'Razorpay Talent Acquisition', email: 'deepa.k@razorpay.com', activeJobs: 1, status: 'Active', lastActive: '3 days ago' },
    { id: 'REC-04', name: 'Michael Chang', company: 'Microsoft India Recruiting', email: 'm.chang@microsoft.com', activeJobs: 2, status: 'Active', lastActive: 'Nov 10' },
    { id: 'REC-05', name: 'Ritu Sen', company: 'Goldman Sachs Early Careers', email: 'ritu.sen@gs.com', activeJobs: 1, status: 'Pending Approval', lastActive: 'Nov 08' }
  ]);

  const columns = [
    {
      key: 'name',
      label: 'Recruiter Contact',
      render: (_, row) => (
        <div>
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.email}</div>
        </div>
      )
    },
    { key: 'company', label: 'Company Organization' },
    { key: 'activeJobs', label: 'Active Openings', sortable: true },
    { key: 'lastActive', label: 'Last Activity' },
    {
      key: 'status',
      label: 'Account Status',
      render: (val) => (
        <Badge variant={val === 'Active' ? 'emerald' : 'amber'} size="sm">
          {val}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Recruiter Directory & Access Authorization"
        subtitle="Manage approved industry talent partners, active requisitions, and candidate discovery permissions."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Recruiters' }]}
        action={
          <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Invite Recruiter
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={recruiters}
        pageSize={6}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Invite Corporate Recruiter"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">Cancel</Button>
            <Button onClick={() => setShowModal(false)} variant="primary" size="sm">Send Invitation</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <Input label="Recruiter Full Name" placeholder="e.g. John Doe" />
          <Input label="Corporate Email" type="email" placeholder="john.doe@company.com" />
          <Input label="Company Name" placeholder="e.g. Amazon Web Services" />
        </div>
      </Modal>
    </div>
  );
}
