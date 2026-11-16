import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ShieldCheck,
  Check,
  Sliders,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function EligibilityRules() {
  const [showModal, setShowModal] = useState(false);

  const rules = [
    {
      id: 'RUL-01',
      name: 'Tier-1 Product Company Eligibility Engine',
      criteria: 'CGPA ≥ 8.0, 0 Active Backlogs, ≥ 3 Verified Technical Skills (Code Artifact Proof)',
      appliedTo: 'Google, Microsoft, Amazon, Razorpay',
      status: 'Active',
      studentsQualifying: 184
    },
    {
      id: 'RUL-02',
      name: 'Mass & Core IT Recruiter Minimum Baseline',
      criteria: 'CGPA ≥ 6.5, ≤ 1 Historical Backlog cleared, 100% Academic Attendance',
      appliedTo: 'TCS, Infosys, Wipro, Cognizant',
      status: 'Active',
      studentsQualifying: 612
    },
    {
      id: 'RUL-03',
      name: 'Dream Offer Upgrade Policy',
      criteria: 'Students with existing offers < 10 LPA may participate only in drives offering ≥ 1.5x package',
      appliedTo: 'All Institutional Placements',
      status: 'Active',
      studentsQualifying: 142
    },
    {
      id: 'RUL-04',
      name: 'Ethical Code Verification Mandatory Gate',
      criteria: 'Claimed-only skills cannot be submitted to recruiters without accompanying evidence artifact',
      appliedTo: 'All Candidates',
      status: 'Enforced by RLS',
      studentsQualifying: 847
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Placement Eligibility Rules Engine"
        subtitle="Configure institutional placement policy rules, academic cutoffs, and verified skill constraints."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Eligibility Rules' }]}
        action={
          <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Define Policy Rule
          </Button>
        }
      />

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-5 border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-bold text-slate-900">{rule.name}</h4>
                  <Badge variant="emerald" size="sm">{rule.status}</Badge>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  Condition: <span className="font-normal text-slate-600">{rule.criteria}</span>
                </p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Scope: <span className="text-slate-600">{rule.appliedTo}</span>
                </div>
              </div>

              <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">
                  Qualifying Students: <strong className="text-[#009669] text-sm">{rule.studentsQualifying}</strong>
                </span>
                <Button variant="outline" size="sm">
                  Modify Rule
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Define Eligibility Policy Rule"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">Cancel</Button>
            <Button onClick={() => setShowModal(false)} variant="primary" size="sm">Save & Enforce</Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <Input label="Rule Title" placeholder="e.g. FinTech Sector Specialization Rule" />
          <Input label="Minimum CGPA" type="number" step="0.1" placeholder="7.5" />
          <Input label="Verified Skills Count" type="number" placeholder="2" />
        </div>
      </Modal>
    </div>
  );
}
