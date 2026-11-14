import React, { useState } from 'react';
import {
  ListOrdered,
  Calendar,
  Download,
  Mail,
  CheckCircle2,
  Users
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

export default function Shortlists() {
  const [shortlisted, setShortlisted] = useState([
    { id: '1', name: 'Priya Sharma', roll: 'CS2021-084', role: 'Associate Software Engineer', stage: 'Round 1 Scheduled', interviewDate: 'Nov 28, 10:00 AM', verifiedSkills: 'React, Node.js, SQL' },
    { id: '2', name: 'Aarav Patel', roll: 'CS2021-012', role: 'Associate Software Engineer', stage: 'Round 2 Technical', interviewDate: 'Nov 29, 02:00 PM', verifiedSkills: 'C++, Distributed Systems' },
    { id: '3', name: 'Ananya Iyer', roll: 'CS2021-028', role: 'Backend Infrastructure Intern', stage: 'Round 1 Scheduled', interviewDate: 'Nov 28, 11:30 AM', verifiedSkills: 'Go, Docker, Kubernetes' },
    { id: '4', name: 'Meera Nambiar', roll: 'CS2021-052', role: 'Associate Software Engineer', stage: 'Round 1 Scheduled', interviewDate: 'Nov 28, 03:00 PM', verifiedSkills: 'Rust, Networks, Linux' },
  ]);

  const columns = [
    {
      key: 'name',
      label: 'Candidate',
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-[11px] text-slate-500">{row.roll} • {row.role}</div>
          </div>
        </div>
      )
    },
    { key: 'verifiedSkills', label: 'Verified Skills' },
    {
      key: 'stage',
      label: 'Evaluation Stage',
      render: (val) => (
        <Badge variant={val.includes('Round 2') ? 'violet' : 'indigo'} size="sm">
          {val}
        </Badge>
      )
    },
    { key: 'interviewDate', label: 'Scheduled Time', sortable: true },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <Button to="/recruiter/interviews" variant="outline" size="sm">
          Join Interview Room
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Shortlists & Pipeline"
        subtitle="Manage candidates invited to technical interview rounds and track evaluation progression."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Shortlists' }]}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export Shortlist (CSV)
            </Button>
            <Button to="/recruiter/discovery" variant="primary" size="sm">
              + Add More Candidates
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={shortlisted}
        pageSize={6}
      />
    </div>
  );
}
