import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Play,
  Calendar,
  Clock,
  Award,
  Users
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function AdminMockDrives() {
  const [showModal, setShowModal] = useState(false);

  const [mockTests, setMockTests] = useState([
    {
      id: 'MOCK-CS-01',
      title: 'TCS Digital Advanced Machine Coding',
      branch: 'CS, IT',
      date: 'Nov 18, 2024',
      participants: 215,
      avgScore: '78.4%',
      status: 'Scheduled'
    },
    {
      id: 'MOCK-GEN-02',
      title: 'Cognitive & Quantitative Aptitude Benchmark',
      branch: 'All Branches',
      date: 'Nov 22, 2024',
      participants: 410,
      avgScore: '82.1%',
      status: 'Scheduled'
    },
    {
      id: 'MOCK-SYS-03',
      title: 'System Design Mock Round (Tier-1)',
      branch: 'CS, IT',
      date: 'Nov 10, 2024',
      participants: 94,
      avgScore: '68.5%',
      status: 'Completed'
    }
  ]);

  const columns = [
    { key: 'title', label: 'Mock Test Title' },
    { key: 'branch', label: 'Target Branches' },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'participants', label: 'Registered Students', sortable: true },
    { key: 'avgScore', label: 'Avg Cohort Score' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant={val === 'Completed' ? 'slate' : 'emerald'} size="sm">
          {val}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Placement Drive Control Center"
        subtitle="Schedule automated technical screening tests and analyze cohort readiness."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Mock Drive Control' }]}
        action={
          <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Schedule Mock Test
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockTests}
        pageSize={5}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Mock Drive"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={() => setShowModal(false)} variant="primary" size="sm">
              Publish Test
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <Input label="Test Title" placeholder="e.g. Full Stack Machine Coding Challenge" />
          <Input label="Target Department(s)" placeholder="e.g. CS, IT" />
          <Input label="Scheduled Date" type="date" />
          <p className="text-slate-500 text-[11px]">
            Once published, the test is automatically added to target students' Mock Drives arena.
          </p>
        </div>
      </Modal>
    </div>
  );
}
