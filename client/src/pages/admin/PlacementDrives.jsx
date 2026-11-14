import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Building,
  CheckCircle2,
  Clock,
  Users,
  Briefcase
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function AdminPlacementDrives() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [drives, setDrives] = useState([
    {
      id: 'DRV-101',
      company: 'Google',
      role: 'Associate Software Engineer',
      package: '24.5 LPA',
      minCgpa: 8.0,
      branches: 'CS, IT',
      date: 'Nov 28, 2024',
      status: 'Upcoming',
      eligibleCount: 84,
      appliedCount: 78
    },
    {
      id: 'DRV-102',
      company: 'TCS Digital',
      role: 'System Engineer',
      package: '9.2 LPA',
      minCgpa: 7.0,
      branches: 'CS, IT, ECE, ME',
      date: 'Nov 15, 2024',
      status: 'Active',
      eligibleCount: 312,
      appliedCount: 298
    },
    {
      id: 'DRV-103',
      company: 'Razorpay',
      role: 'Backend Engineering Intern',
      package: '18.0 LPA',
      minCgpa: 7.5,
      branches: 'CS, IT',
      date: 'Dec 05, 2024',
      status: 'Upcoming',
      eligibleCount: 142,
      appliedCount: 94
    },
    {
      id: 'DRV-104',
      company: 'Microsoft',
      role: 'Software Development Engineer',
      package: '28.0 LPA',
      minCgpa: 8.2,
      branches: 'CS, IT, ECE',
      date: 'Dec 12, 2024',
      status: 'Upcoming',
      eligibleCount: 76,
      appliedCount: 65
    },
    {
      id: 'DRV-105',
      company: 'Infosys',
      role: 'Specialist Programmer',
      package: '9.5 LPA',
      minCgpa: 7.0,
      branches: 'All Branches',
      date: 'Oct 20, 2024',
      status: 'Completed',
      eligibleCount: 420,
      appliedCount: 395
    }
  ]);

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    package: '',
    minCgpa: '7.5',
    branches: 'CS, IT',
    date: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.role) return;

    const newDrive = {
      id: `DRV-${Date.now()}`,
      company: formData.company,
      role: formData.role,
      package: formData.package || '10.0 LPA',
      minCgpa: parseFloat(formData.minCgpa) || 7.0,
      branches: formData.branches,
      date: formData.date || 'TBD',
      status: 'Upcoming',
      eligibleCount: 120,
      appliedCount: 0
    };

    setDrives([newDrive, ...drives]);
    setShowCreateModal(false);
    setFormData({ company: '', role: '', package: '', minCgpa: '7.5', branches: 'CS, IT', date: '' });
  };

  const filteredDrives = drives.filter(d => {
    const matchesQuery = d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchesQuery && matchesStatus;
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
    { key: 'package', label: 'Package', sortable: true },
    { key: 'minCgpa', label: 'Min CGPA', sortable: true },
    { key: 'branches', label: 'Eligible Branches' },
    { key: 'date', label: 'Drive Date', sortable: true },
    {
      key: 'stats',
      label: 'Cohort Reach',
      render: (_, row) => (
        <div className="text-xs">
          <span>Eligible: <strong>{row.eligibleCount}</strong></span>
          <span className="text-slate-400 mx-1">|</span>
          <span className="text-emerald-700">Applied: <strong>{row.appliedCount}</strong></span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'Active' ? 'emerald' : val === 'Upcoming' ? 'indigo' : 'slate'} size="sm">
          {val}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Placement Drive Orchestration"
        subtitle="Manage upcoming company recruitment schedules, eligibility criteria, and candidate applications."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Placement Drives' }]}
        action={
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule New Drive
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          {['All', 'Active', 'Upcoming', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white'
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
            placeholder="Search company or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredDrives}
        pageSize={6}
      />

      {/* Create Drive Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Campus Placement Drive"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowCreateModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={handleCreate} variant="primary" size="sm">
              Publish Drive
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <Input
            label="Company Name"
            placeholder="e.g. Google, Atlassian, Cisco"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
          />
          <Input
            label="Job Role Title"
            placeholder="e.g. Software Development Engineer - 1"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Package / CTC (LPA)"
              placeholder="e.g. 18.5 LPA"
              value={formData.package}
              onChange={(e) => setFormData({ ...formData, package: e.target.value })}
            />
            <Input
              label="Minimum CGPA Cutoff"
              type="number"
              step="0.1"
              value={formData.minCgpa}
              onChange={(e) => setFormData({ ...formData, minCgpa: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Eligible Branches"
              placeholder="e.g. CS, IT, ECE"
              value={formData.branches}
              onChange={(e) => setFormData({ ...formData, branches: e.target.value })}
            />
            <Input
              label="Drive Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
