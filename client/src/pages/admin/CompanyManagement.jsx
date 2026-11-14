import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Award,
  Users,
  Briefcase
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function CompanyManagement() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const companies = [
    { name: 'Google', tier: 'Tier-1 Product', hires: 14, avgPackage: '24.5 LPA', relationship: 'Active Partner', visitMonth: 'November' },
    { name: 'Microsoft', tier: 'Tier-1 Product', hires: 22, avgPackage: '28.0 LPA', relationship: 'Active Partner', visitMonth: 'December' },
    { name: 'TCS Digital', tier: 'Enterprise IT', hires: 85, avgPackage: '9.2 LPA', relationship: 'Core Recruiter', visitMonth: 'October' },
    { name: 'Razorpay', tier: 'FinTech Unicorn', hires: 8, avgPackage: '18.0 LPA', relationship: 'Active Partner', visitMonth: 'December' },
    { name: 'Amazon', tier: 'Tier-1 Product', hires: 32, avgPackage: '22.0 LPA', relationship: 'Core Recruiter', visitMonth: 'November' },
    { name: 'Infosys', tier: 'Mass IT', hires: 140, avgPackage: '6.5 - 9.5 LPA', relationship: 'Core Recruiter', visitMonth: 'September' },
  ];

  const filtered = companies.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visiting Company & Corporate Partner Directory"
        subtitle="Manage campus recruiting relationships, compensation brackets, and historical hiring statistics."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Company Directory' }]}
        action={
          <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Corporate Partner
          </Button>
        }
      />

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((co) => (
          <Card key={co.name} hover className="p-5 border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-base font-bold text-slate-900">{co.name}</h4>
                <Badge variant="indigo" size="sm">{co.tier}</Badge>
              </div>
              <div className="text-xs text-slate-500 space-y-1 mt-2">
                <div>Avg Package: <strong className="text-slate-800">{co.avgPackage}</strong></div>
                <div>Campus Hires (Past 3 Yrs): <strong className="text-emerald-700">{co.hires} students</strong></div>
                <div>Regular Visit Season: <span className="text-slate-700">{co.visitMonth}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-medium">{co.relationship}</span>
              <button className="text-indigo-600 font-semibold hover:underline">
                View Past Drives
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Corporate Partner"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowModal(false)} variant="outline" size="sm">
              Cancel
            </Button>
            <Button onClick={() => setShowModal(false)} variant="primary" size="sm">
              Save Partner
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <Input label="Company Name" placeholder="e.g. Cisco Systems" />
          <Input label="Category Tier" placeholder="e.g. Tier-1 Product / FinTech" />
          <Input label="Expected Package Range" placeholder="e.g. 15 - 20 LPA" />
        </div>
      </Modal>
    </div>
  );
}
