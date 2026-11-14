import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Shield,
  Eye,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function AuditLogs() {
  const [logs] = useState([
    {
      id: 'AUD-001',
      timestamp: '2024-11-14 18:42:10 UTC',
      actor: 'Platform Administrator (superadmin@carrersync.io)',
      action: 'COLLEGE_PROVISIONED',
      category: 'Tenant',
      entity: 'Tenant: Stanford Institute of Tech (sit-blr)',
      ipAddress: '192.168.1.104',
      status: 'Success',
      diff: {
        before: null,
        after: {
          slug: 'sit-blr',
          domain: 'sit.edu.in',
          status: 'Active',
          isolationLevel: 'ROW_LEVEL_SECURITY_STRICT'
        }
      }
    },
    {
      id: 'AUD-002',
      timestamp: '2024-11-14 17:15:22 UTC',
      actor: 'Platform Administrator (superadmin@carrersync.io)',
      action: 'USER_ROLE_ELEVATED',
      category: 'User',
      entity: 'User: dr.rajiv@college.edu',
      ipAddress: '192.168.1.104',
      status: 'Success',
      diff: {
        before: { role: 'TPO Admin' },
        after: { role: 'College Admin' }
      }
    },
    {
      id: 'AUD-003',
      timestamp: '2024-11-14 14:02:44 UTC',
      actor: 'System Governance Daemon',
      action: 'USER_ACCOUNT_SUSPENDED',
      category: 'Security',
      entity: 'User: devraj.m@vii.edu.in',
      ipAddress: '10.0.0.1 (internal)',
      status: 'Warning',
      diff: {
        before: { status: 'Active', violationCount: 0 },
        after: { status: 'Suspended', violationCount: 3, reason: 'Duplicate profile verification failure' }
      }
    },
    {
      id: 'AUD-004',
      timestamp: '2024-11-14 11:20:05 UTC',
      actor: 'Platform Administrator (superadmin@carrersync.io)',
      action: 'INVITATION_TOKEN_REVOKED',
      category: 'Security',
      entity: 'Invitation: coord.placement@vii.edu.in',
      ipAddress: '192.168.1.104',
      status: 'Success',
      diff: {
        before: { status: 'Pending', validUntil: '2024-10-25' },
        after: { status: 'Revoked', revokedBy: 'superadmin' }
      }
    },
    {
      id: 'AUD-005',
      timestamp: '2024-11-13 20:30:00 UTC',
      actor: 'Platform Administrator (superadmin@carrersync.io)',
      action: 'SECURITY_POLICY_MODIFIED',
      category: 'Policy',
      entity: 'Global Platform Security Configuration',
      ipAddress: '192.168.1.104',
      status: 'Success',
      diff: {
        before: { sessionTimeoutMinutes: 60, mfaEnforcedForAdmins: false },
        after: { sessionTimeoutMinutes: 30, mfaEnforcedForAdmins: true }
      }
    },
    {
      id: 'AUD-006',
      timestamp: '2024-11-13 09:14:18 UTC',
      actor: 'System Health Sentinel',
      action: 'CROSS_TENANT_LEAK_TEST',
      category: 'Security',
      entity: 'Tenant Partition Verification',
      ipAddress: '127.0.0.1 (localhost)',
      status: 'Success',
      diff: {
        before: { passedTenants: 18, violated: 0 },
        after: { passedTenants: 18, violated: 0, rlsLatencyMs: 3.2 }
      }
    },
    {
      id: 'AUD-007',
      timestamp: '2024-11-12 16:48:51 UTC',
      actor: 'Platform Administrator (superadmin@carrersync.io)',
      action: 'MAINTENANCE_WINDOW_SCHEDULED',
      category: 'Policy',
      entity: 'Database Partition Re-indexing',
      ipAddress: '192.168.1.104',
      status: 'Success',
      diff: {
        before: { maintenanceMode: false },
        after: { maintenanceMode: false, scheduledWindow: '2024-11-20 02:00 UTC' }
      }
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp (UTC)',
      render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>
    },
    {
      key: 'action',
      label: 'Security / Audit Action',
      render: (val, row) => (
        <div>
          <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {val}
          </span>
          <div className="text-[10px] text-slate-400 mt-1">IP: {row.ipAddress}</div>
        </div>
      )
    },
    {
      key: 'actor',
      label: 'Initiating Principal',
      render: (val) => <span className="text-xs text-slate-800 font-medium">{val}</span>
    },
    {
      key: 'entity',
      label: 'Target Entity / Resource',
      render: (val) => <span className="text-xs font-mono text-indigo-700">{val}</span>
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <Badge
          variant={
            val === 'Security' ? 'rose' : val === 'Tenant' ? 'purple' : val === 'Policy' ? 'amber' : 'indigo'
          }
          size="sm"
        >
          {val}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Result',
      align: 'center',
      render: (val) => (
        <Badge variant={val === 'Success' ? 'emerald' : 'amber'} size="sm">
          {val}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Diff',
      align: 'right',
      render: (_, row) => (
        <button
          onClick={() => {
            setSelectedLog(row);
            setShowDiffModal(true);
          }}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
          title="Inspect Audit Diff"
        >
          <Eye className="h-4 w-4" />
          <span>Inspect</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {exportNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle2 className="h-4 w-4" />
          <span>Audit stream bundle exported in cryptographically signed JSON format.</span>
        </div>
      )}

      <PageHeader
        title="Immutable Platform Audit Trail"
        subtitle="Non-repudiable audit logs recording all administrative actions, role transitions, tenant allocations, and policy shifts."
        breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Audit Trail' }]}
        action={
          <Button onClick={handleExport} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            Export Audit Trail
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, actor, or target entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Category:</span>
          </div>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {['All', 'Security', 'Tenant', 'User', 'Policy'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-md transition-all ${
                  categoryFilter === cat
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log DataTable */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        emptyMessage="No audit logs match the current query criteria."
      />

      {/* Diff Inspection Modal */}
      <Modal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        title="Audit Event Diff & State Delta"
        subtitle={`Event ID: ${selectedLog?.id || ''} • ${selectedLog?.action || ''}`}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-500 font-mono">
              Recorded: {selectedLog?.timestamp}
            </span>
            <Button onClick={() => setShowDiffModal(false)} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Actor Principal</p>
                <p className="text-slate-900 font-medium text-xs mt-0.5">{selectedLog.actor}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Source IP Address</p>
                <p className="text-slate-900 font-mono text-xs mt-0.5">{selectedLog.ipAddress}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Target Entity</p>
                <p className="text-indigo-700 font-mono text-xs mt-0.5">{selectedLog.entity}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-2">State Diff (Before vs After):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-rose-50/50 border border-rose-200/60 rounded-xl p-3">
                  <span className="font-semibold text-rose-700 block mb-1">Previous State</span>
                  <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                    {selectedLog.diff?.before
                      ? JSON.stringify(selectedLog.diff.before, null, 2)
                      : 'None (Initial Resource Creation)'}
                  </pre>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3">
                  <span className="font-semibold text-emerald-700 block mb-1">Committed State</span>
                  <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.diff?.after, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 flex items-start gap-2">
              <Shield className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                Audit entries are cryptographically signed with SHA-256 HMAC and replicated across distributed nodes to guarantee audit integrity.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
