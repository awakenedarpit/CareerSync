import React, { useState } from 'react';
import {
  Settings,
  Building,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Database
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    institutionName: 'Apex Institute of Technology & Science',
    collegeCode: 'AITS-UNI-2024',
    headName: 'Dr. Rajiv Menon',
    headEmail: 'head.tnp@college.edu',
    academicYear: '2024 - 2025',
    tenantId: 'tenant_apex_2024_001'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Placement Settings & Tenant Configuration"
        subtitle="Manage college information, academic term metadata, and platform tenant isolation parameters."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
        action={
          <Button onClick={handleSave} variant="primary" size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            Save Institutional Settings
          </Button>
        }
      />

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Institutional configuration successfully saved and synchronized.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">College & Placement Cell Profile</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <Input
              label="Institution Name"
              value={settings.institutionName}
              onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
            />
            <Input
              label="Accreditation / College Code"
              value={settings.collegeCode}
              onChange={(e) => setSettings({ ...settings, collegeCode: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Head of T&P"
                value={settings.headName}
                onChange={(e) => setSettings({ ...settings, headName: e.target.value })}
              />
              <Input
                label="Official Email"
                value={settings.headEmail}
                onChange={(e) => setSettings({ ...settings, headEmail: e.target.value })}
              />
            </div>
            <Input
              label="Active Placement Cycle"
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
            />
          </form>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Tenant Isolation & Free-Tier Quota</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Assigned Tenant Key (RLS Scope)</span>
              <code className="text-xs font-mono font-bold text-indigo-700">{settings.tenantId}</code>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900">Zero-Cost Infrastructure Status</h4>
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-900">
                <span className="font-semibold block">Policy Enforced: ₹0 Budget</span>
                <span className="text-[11px] text-emerald-800">No paid API credits or automated card charging can be triggered.</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
