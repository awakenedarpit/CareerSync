import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Award,
  ChevronRight,
  ShieldAlert,
  FileCode
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';

export default function StudentDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const students = [
    { id: '1', name: 'Priya Sharma', roll: 'CS2021-084', branch: 'Computer Science', cgpa: 8.42, verifiedCount: 8, status: 'Selected', company: 'TCS Digital', topSkill: 'React / Node.js' },
    { id: '2', name: 'Aarav Patel', roll: 'CS2021-012', branch: 'Computer Science', cgpa: 9.10, verifiedCount: 11, status: 'Shortlisted', company: 'Google', topSkill: 'C++ / Algorithms' },
    { id: '3', name: 'Rohan Deshmukh', roll: 'IT2021-045', branch: 'Information Tech', cgpa: 7.85, verifiedCount: 6, status: 'In Process', company: 'Razorpay', topSkill: 'Python / Django' },
    { id: '4', name: 'Ananya Iyer', roll: 'CS2021-028', branch: 'Computer Science', cgpa: 8.90, verifiedCount: 9, status: 'Selected', company: 'Microsoft', topSkill: 'Cloud / Azure' },
    { id: '5', name: 'Kunal Verma', roll: 'ECE2021-067', branch: 'Electronics', cgpa: 7.40, verifiedCount: 4, status: 'Unplaced', company: 'None', topSkill: 'Embedded C / IoT' },
    { id: '6', name: 'Sneha Gupta', roll: 'IT2021-091', branch: 'Information Tech', cgpa: 8.15, verifiedCount: 7, status: 'Shortlisted', company: 'Amazon', topSkill: 'Java / Spring' },
    { id: '7', name: 'Vikram Singh', roll: 'ME2021-033', branch: 'Mechanical', cgpa: 7.20, verifiedCount: 3, status: 'Unplaced', company: 'None', topSkill: 'AutoCAD / Python' },
    { id: '8', name: 'Neha Reddy', roll: 'CS2021-110', branch: 'Computer Science', cgpa: 8.65, verifiedCount: 8, status: 'Selected', company: 'Goldman Sachs', topSkill: 'FinTech / React' },
    { id: '9', name: 'Aditya Nair', roll: 'ECE2021-019', branch: 'Electronics', cgpa: 7.75, verifiedCount: 5, status: 'In Process', company: 'Infosys', topSkill: 'VLSI / Verilog' },
    { id: '10', name: 'Tanvi Joshi', roll: 'IT2021-073', branch: 'Information Tech', cgpa: 8.30, verifiedCount: 6, status: 'Selected', company: 'Wipro Turbo', topSkill: 'Full Stack' },
    { id: '11', name: 'Rahul Roy', roll: 'CS2021-144', branch: 'Computer Science', cgpa: 6.95, verifiedCount: 3, status: 'Unplaced', company: 'None', topSkill: 'JavaScript' },
    { id: '12', name: 'Meera Nambiar', roll: 'CS2021-052', branch: 'Computer Science', cgpa: 8.80, verifiedCount: 10, status: 'Shortlisted', company: 'Google', topSkill: 'Rust / Systems' }
  ];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.roll.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'All' || s.branch === selectedBranch;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-[11px] text-slate-500">{row.roll} • {row.branch}</div>
          </div>
        </div>
      )
    },
    { key: 'cgpa', label: 'CGPA', sortable: true },
    {
      key: 'verifiedCount',
      label: 'Verified Skills',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="emerald" size="sm">{val} Verified</Badge>
          <span className="text-[11px] text-slate-400">({row.topSkill})</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Placement Status',
      render: (val, row) => {
        let variant = 'slate';
        if (val === 'Selected') variant = 'emerald';
        else if (val === 'Shortlisted') variant = 'indigo';
        else if (val === 'In Process') variant = 'amber';
        return (
          <div>
            <Badge variant={variant} size="sm">{val}</Badge>
            {row.company !== 'None' && (
              <div className="text-[10px] text-slate-500 mt-0.5">{row.company}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <Button onClick={() => setSelectedStudent(row)} variant="outline" size="sm">
          Inspect Evidence
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Directory & Evidence Audit"
        subtitle="Search institutional cohort records with verified code artifacts and academic metrics."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Student Directory' }]}
        action={
          <div className="flex gap-2">
            <span className="text-xs text-slate-500 self-center">Total Students: <strong>{students.length}</strong></span>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700"
          >
            <option value="All">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Tech">Information Technology</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Selected">Selected</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="In Process">In Process</option>
            <option value="Unplaced">Unplaced</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-[#02E8A7] focus:outline-hidden"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        pageSize={6}
      />

      {/* Evidence Inspection Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent ? `${selectedStudent.name} (${selectedStudent.roll})` : 'Student Evidence'}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setSelectedStudent(null)} variant="outline" size="sm">
              Close Audit
            </Button>
          </div>
        }
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Department</span>
                <strong className="text-slate-800">{selectedStudent.branch}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Cumulative GPA</span>
                <strong className="text-slate-800">{selectedStudent.cgpa} / 10.0</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Placement Result</span>
                <Badge variant={selectedStudent.status === 'Selected' ? 'emerald' : 'indigo'} size="sm">
                  {selectedStudent.status} ({selectedStudent.company})
                </Badge>
              </div>
              <div>
                <span className="text-slate-400 block">Verified Skill Count</span>
                <strong className="text-emerald-700">{selectedStudent.verifiedCount} Validated Competencies</strong>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Verified Artifact Snapshot</h4>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white flex justify-between items-center">
                  <span>GitHub Public Repositories (4 Analyzed)</span>
                  <StatusBadge status="verified" />
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white flex justify-between items-center">
                  <span>Coursework & Semester Lab Practical Grades</span>
                  <StatusBadge status="verified" />
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white flex justify-between items-center">
                  <span>Industry Micro-Certifications</span>
                  <StatusBadge status="evidence_linked" />
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-[11px]">
              Audit note: Student evidence records are locked against unverified manual edits. All status promotions conform to institutional T&P criteria.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
