import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Save,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RecruiterSettings() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Account Preferences & Notification Settings"
        subtitle="Manage your recruitment portal configurations and interview notifications."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Settings' }]}
        action={
          <Button onClick={handleSave} variant="primary" size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            Save Preferences
          </Button>
        }
      />

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Recruiter preferences successfully updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-[#009669]" />
            <h3 className="text-sm font-bold text-slate-900">Communication Alerts</h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-[#009669]" />
              <span>Email notification when an eligible student applies to an active job opening</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-[#009669]" />
              <span>Interview schedule confirmations and reminder alerts</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-[#009669]" />
              <span>Daily summary of newly verified candidates matching your active requisitions</span>
            </label>
          </div>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-[#009669]" />
            <h3 className="text-sm font-bold text-slate-900">Security Credentials</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <Input label="Corporate Email" value="sarah.j@google.com" readOnly />
            <Input label="New Password" type="password" placeholder="••••••••" />
            <Button type="submit" variant="outline" size="sm">
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
