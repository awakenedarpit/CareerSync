import React, { useState } from 'react';
import {
  History,
  Shield,
  Search,
  Filter,
  Lock,
  Calendar
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';

export default function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');

  const logs = [
    { id: 'AUD-01', timestamp: '2024-11-14 11:24:02', actor: 'Dr. Rajiv Menon (T&P Admin)', action: 'Drive Scheduled', resource: 'Google - ASE Drive', details: 'Cutoff set to CGPA 8.0, CS/IT only' },
    { id: 'AUD-02', timestamp: '2024-11-14 09:12:45', actor: 'Prof. K. Rao (Faculty Evaluator)', action: 'Skill Verified', resource: 'Priya Sharma (CS2021-084)', details: 'JavaScript Core elevated to Verified via code audit' },
    { id: 'AUD-03', timestamp: '2024-11-13 16:45:11', actor: 'Sarah Jenkins (Recruiter - Google)', action: 'Candidate Shortlisted', resource: 'Aarav Patel (CS2021-012)', details: 'Passed Round 1 Algorithmic Screen' },
    { id: 'AUD-04', timestamp: '2024-11-13 14:02:19', actor: 'Profiling Agent Fleet', action: 'Evidence Re-indexed', resource: 'GitHub Org Webhook', details: 'Batch of 14 commits processed' },
    { id: 'AUD-05', timestamp: '2024-11-12 18:30:00', actor: 'System Governance Engine', action: 'RLS Session Verified', resource: 'Tenant ID: col_mit_01', details: 'Cross-tenant isolation check passed' },
    { id: 'AUD-06', timestamp: '2024-11-12 10:15:33', actor: 'Priya Sharma (Student)', action: 'Consent Updated', resource: 'Data Sharing Consent', details: 'Granted recruiter access for TCS Digital' },
    { id: 'AUD-07', timestamp: '2024-11-11 12:00:22', actor: 'Dr. Rajiv Menon (T&P Admin)', action: 'Rule Modified', resource: 'Eligibility Engine RUL-01', details: 'Verified skills constraint updated' },
  ];

  const filtered = logs.filter(l =>
    l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: 'timestamp', label: 'Timestamp (UTC)', sortable: true },
    { key: 'actor', label: 'Actor' },
    {
      key: 'action',
      label: 'Event Action',
      render: (val) => <Badge variant="aqua" size="sm">{val}</Badge>
    },
    { key: 'resource', label: 'Affected Entity' },
    { key: 'details', label: 'Audit Details' }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Governance & Activity Audit Trail"
        subtitle="Cryptographically sealed log of all administrative actions, skill state modifications, and candidate selections."
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Trail' }]}
      />

      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-emerald-400" />
          <span>
            <strong>Tamper-Evident Ledger:</strong> Audit logs are write-once and cannot be altered or purged by any role.
          </span>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
          HASH: SHA-256 VERIFIED
        </span>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8.5 pr-3 text-xs text-slate-900 focus:border-[#02E8A7] focus:outline-hidden"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={6}
      />
    </div>
  );
}
