import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Download,
  AlertTriangle,
  Code2,
  CheckCircle2,
  Trash2,
  History,
  FolderGit2,
  Globe
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import authService from '../../services/authService';

export default function PrivacyConsent() {
  const currentUser = authService.getCurrentUser();
  const isDemoStudent = ['aditya.sharma@apex.edu', 'student@apex.edu', 'priya.sharma21@college.edu'].includes(currentUser?.email);

  const [recruiterSharing, setRecruiterSharing] = useState(true);
  const [repoExtraction, setRepoExtraction] = useState(true);
  const [anonymizedReporting, setAnonymizedReporting] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  const connectedServices = isDemoStudent ? [
    {
      name: 'GitHub',
      handle: '@adityasharma-dev',
      icon: FolderGit2,
      status: 'Connected',
      lastSynced: '2 hours ago',
      permissions: 'Read-only public repositories and commit metadata'
    },
    {
      name: 'LeetCode',
      handle: 'aditya_codes',
      icon: Code2,
      status: 'Connected',
      lastSynced: 'Yesterday',
      permissions: 'Solved problem count and contest rating'
    },
    {
      name: 'LinkedIn',
      handle: 'Not Connected',
      icon: Globe,
      status: 'Disconnected',
      lastSynced: 'Never',
      permissions: 'Work history and verified endorsements'
    }
  ] : [
    {
      name: 'GitHub',
      handle: 'Not Connected',
      icon: FolderGit2,
      status: 'Disconnected',
      lastSynced: 'Never',
      permissions: 'Read-only public repositories and commit metadata'
    },
    {
      name: 'LeetCode',
      handle: 'Not Connected',
      icon: Code2,
      status: 'Disconnected',
      lastSynced: 'Never',
      permissions: 'Solved problem count and contest rating'
    },
    {
      name: 'LinkedIn',
      handle: 'Not Connected',
      icon: Globe,
      status: 'Disconnected',
      lastSynced: 'Never',
      permissions: 'Work history and verified endorsements'
    }
  ];

  const consentLogs = isDemoStudent ? [
    { id: 'LOG-01', timestamp: '2024-11-12 14:32', event: 'Recruiter Sharing Consent Granted', scope: 'TCS Digital Drive', status: 'Active' },
    { id: 'LOG-02', timestamp: '2024-11-04 09:15', event: 'GitHub OAuth Access Token Refreshed', scope: 'Public Repositories', status: 'Active' },
    { id: 'LOG-03', timestamp: '2024-10-18 16:40', event: 'Academic Transcript Evidence Verified', scope: 'Institutional Records', status: 'Immutable' },
    { id: 'LOG-04', timestamp: '2024-10-01 10:00', event: 'Initial Terms & Privacy Policy Accepted', scope: 'Tenant Default', status: 'Active' }
  ] : [
    { id: 'LOG-01', timestamp: new Date().toLocaleDateString(), event: 'Initial Terms & Privacy Policy Accepted', scope: 'Tenant Default', status: 'Active' }
  ];

  const columns = [
    { key: 'timestamp', label: 'Timestamp', sortable: true },
    { key: 'event', label: 'Consent Event' },
    { key: 'scope', label: 'Scope' },
    {
      key: 'status',
      label: 'Audit Status',
      render: (val) => (
        <Badge variant={val === 'Immutable' ? 'purple' : 'emerald'} size="sm">
          {val}
        </Badge>
      )
    }
  ];

  const handleExportData = () => {
    setActionNotice('Preparing your encrypted evidence package. Download will initiate automatically.');
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleRevokeAll = () => {
    setRecruiterSharing(false);
    setRepoExtraction(false);
    setActionNotice('All external data sharing consents have been revoked. External recruiters cannot view your profile.');
    setTimeout(() => setActionNotice(''), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy, Data Consent & Ethical AI Controls"
        subtitle="You own your skill data. Manage institutional visibility, connected tools, and audit history."
        breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Privacy & Consent' }]}
        action={
          <div className="flex gap-2">
            <Button onClick={handleExportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Download My Archive
            </Button>
            <Button onClick={handleRevokeAll} variant="danger" size="sm">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Revoke All Sharing
            </Button>
          </div>
        }
      />

      {actionNotice && (
        <div className="p-3 bg-[#BDF9F9]/30 border border-[#02E8A7]/40 text-[#002020] rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#009669] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Ethical AI Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 text-[#009669] mb-2">
            <EyeOff className="h-4.5 w-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Zero Surveillance</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strictly no webcam monitoring, eye tracking, or keystroke biometrics. We evaluate working code and software evidence only.
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Lock className="h-4.5 w-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Tenant RLS Security</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your university's placement database is cryptographically segregated. Other colleges cannot inspect your candidacy records.
          </p>
        </Card>

        <Card className="p-4 border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-2 text-[#009669] mb-2">
            <ShieldCheck className="h-4.5 w-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Human Sign-Off</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            No autonomous AI algorithm can reject or disqualify your job application. Final decisions require human T&P staff or recruiter action.
          </p>
        </Card>
      </div>

      {/* Granular Consent Controls */}
      <Card className="p-6 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">Granular Data Sharing Controls</h3>
        <div className="divide-y divide-slate-100">
          <div className="py-3.5 flex items-center justify-between">
            <div className="max-w-xl">
              <h4 className="text-xs font-bold text-slate-900">Share Verified Code Evidence with Visiting Recruiters</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Allows registered recruiters visiting campus to view your verified GitHub projects, PRs, and test benchmarks.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={recruiterSharing}
                onChange={(e) => setRecruiterSharing(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#02E8A7]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="max-w-xl">
              <h4 className="text-xs font-bold text-slate-900">Continuous GitHub Repository Evidence Extraction</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Allows CarrerSync Profiling Agent to periodically scan public repositories for new technology commits.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={repoExtraction}
                onChange={(e) => setRepoExtraction(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#02E8A7]"></div>
            </label>
          </div>

          <div className="py-3.5 flex items-center justify-between">
            <div className="max-w-xl">
              <h4 className="text-xs font-bold text-slate-900">Anonymized Placement Cohort Benchmarks</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Permits institutional aggregate analytics (e.g. "72% of CS batch knows React") without revealing your name.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={anonymizedReporting}
                onChange={(e) => setAnonymizedReporting(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#02E8A7]"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Connected Accounts */}
      <Card className="p-6 border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">Connected Evidence Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {connectedServices.map((svc) => {
            const Icon = svc.icon;
            return (
              <div key={svc.name} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-slate-800" />
                      <span className="font-bold text-sm text-slate-900">{svc.name}</span>
                    </div>
                    <Badge variant={svc.status === 'Connected' ? 'emerald' : 'slate'} size="sm">
                      {svc.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 font-mono">{svc.handle}</div>
                  <p className="text-[11px] text-slate-500 mt-2">{svc.permissions}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Synced: {svc.lastSynced}</span>
                  <button className="text-[#009669] font-semibold hover:underline">
                    {svc.status === 'Connected' ? 'Re-sync' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Immutable Consent Audit Trail */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-slate-500" />
          <h3 className="text-base font-bold text-slate-900">Consent & Access Audit Log</h3>
        </div>
        <DataTable
          columns={columns}
          data={consentLogs}
          pageSize={5}
        />
      </div>
    </div>
  );
}
