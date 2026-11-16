import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Moon,
  Shield,
  Save,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function StudentSettings() {
  const [driveAlerts, setDriveAlerts] = useState(true);
  const [gapReminders, setGapReminders] = useState(true);
  const [recruiterViews, setRecruiterViews] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Account & Notification Settings"
        subtitle="Configure your communication preferences and security credentials."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Settings' }]}
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
          <span>Account preferences successfully updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-[#009669]" />
            <h3 className="text-sm font-bold text-slate-900">Notification Alerts</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">New Placement Drive Announcements</h4>
                <p className="text-[11px] text-slate-500">Get notified when a new company drive is scheduled for your branch.</p>
              </div>
              <input
                type="checkbox"
                checked={driveAlerts}
                onChange={(e) => setDriveAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-[#009669]"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Weekly Skill-Gap & Action Reminders</h4>
                <p className="text-[11px] text-slate-500">Automated micro-task suggestions to stay placement ready.</p>
              </div>
              <input
                type="checkbox"
                checked={gapReminders}
                onChange={(e) => setGapReminders(e.target.checked)}
                className="h-4 w-4 rounded text-[#009669]"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Recruiter Profile Inspection Alerts</h4>
                <p className="text-[11px] text-slate-500">Notify me whenever a recruiter views my verified evidence portfolio.</p>
              </div>
              <input
                type="checkbox"
                checked={recruiterViews}
                onChange={(e) => setRecruiterViews(e.target.checked)}
                className="h-4 w-4 rounded text-[#009669]"
              />
            </div>
          </div>
        </Card>

        {/* Security & Password */}
        <Card className="p-6 border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-[#009669]" />
            <h3 className="text-sm font-bold text-slate-900">Security Credentials</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <Input label="Current Password" type="password" placeholder="••••••••" />
            <Input label="New Password" type="password" placeholder="Minimum 8 characters" />
            <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" />

            <div className="pt-2">
              <Button type="submit" variant="outline" size="sm">
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
