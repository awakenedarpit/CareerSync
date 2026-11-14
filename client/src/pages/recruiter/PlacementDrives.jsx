import React from 'react';
import {
  Calendar,
  Building,
  Users,
  Clock,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function RecruiterPlacementDrives() {
  const drives = [
    {
      id: 'DRV-REC-01',
      college: 'Apex Institute of Technology & Science',
      date: 'Nov 28, 2024',
      status: 'Confirmed by T&P',
      location: 'Virtual / Online Assessments',
      roles: ['Associate Software Engineer (L3)', 'Backend Infrastructure Intern'],
      appliedCandidates: 78,
      eligibleCandidates: 84
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Campus Placement Drives"
        subtitle="Schedule and monitor institutional recruitment drives organized with partner college placement cells."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Placement Drives' }]}
      />

      <div className="space-y-4">
        {drives.map((drv) => (
          <Card key={drv.id} className="p-6 border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{drv.college}</h3>
                  <Badge variant="emerald" size="sm">{drv.status}</Badge>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-4">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {drv.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {drv.location}</span>
                </div>
              </div>

              <Button to="/recruiter/discovery" variant="primary" size="sm">
                Inspect Candidate Pool
              </Button>
            </div>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Invited Roles</span>
                <span className="font-semibold text-slate-800">{drv.roles.join(', ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Eligible Pool</span>
                <strong className="text-indigo-600">{drv.eligibleCandidates} Students</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Applications Submitted</span>
                <strong className="text-emerald-600">{drv.appliedCandidates} Profiles</strong>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
