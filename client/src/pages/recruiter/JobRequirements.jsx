import React, { useState } from 'react';
import {
  Target,
  Plus,
  Briefcase,
  Users,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function JobRequirements() {
  const [showModal, setShowModal] = useState(false);

  const [jobs, setJobs] = useState([
    {
      id: 'JOB-01',
      title: 'Associate Software Engineer (L3)',
      package: '24.5 LPA',
      skills: ['C++', 'Data Structures & Algorithms', 'Operating Systems', 'System Design'],
      minCgpa: 8.0,
      openings: 8,
      status: 'Accepting Applications'
    },
    {
      id: 'JOB-02',
      title: 'Backend Infrastructure Intern / FTE',
      package: '18.0 LPA',
      skills: ['Go', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
      minCgpa: 7.5,
      openings: 4,
      status: 'Accepting Applications'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const [newCgpa, setNewCgpa] = useState('7.5');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setJobs([
      ...jobs,
      {
        id: `JOB-${Date.now()}`,
        title: newTitle,
        package: newPackage || '15.0 LPA',
        skills: ['TypeScript', 'Full Stack', 'Cloud'],
        minCgpa: parseFloat(newCgpa) || 7.0,
        openings: 5,
        status: 'Draft'
      }
    ]);
    setShowModal(false);
    setNewTitle('');
    setNewPackage('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Requirements & Candidate Criteria"
        subtitle="Specify technical competencies, minimum academic baselines, and hiring slots for campus drives."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Job Requirements' }]}
        action={
          <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Post New Opening
          </Button>
        }
      />

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-5 border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-bold text-slate-900">{job.title}</h4>
                  <Badge variant="emerald" size="sm">{job.status}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Package: <strong className="text-slate-900">{job.package}</strong> • Cutoff: <strong>CGPA ≥ {job.minCgpa}</strong> • Slots: <strong>{job.openings} Openings</strong>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s) => (
                    <span key={s} className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button to="/recruiter/discovery" variant="primary" size="sm">
                  View Matching Candidates
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Post New Requisition"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">Cancel</Button>
            <Button onClick={handleCreate} variant="primary" size="sm">Publish Role</Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <Input label="Job Title" placeholder="e.g. Frontend Engineer" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          <Input label="Package CTC" placeholder="e.g. 16.0 LPA" value={newPackage} onChange={(e) => setNewPackage(e.target.value)} />
          <Input label="Minimum CGPA" type="number" step="0.1" value={newCgpa} onChange={(e) => setNewCgpa(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}
