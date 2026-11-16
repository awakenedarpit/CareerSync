import React, { useState } from 'react';
import {
  RefreshCw,
  Ban,
  Copy,
  Check,
  Search,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

export default function InvitationManagement() {
  const [invitations, setInvitations] = useState([
    {
      id: 'inv-1',
      email: 'prof.mehta@mitwpu.edu.in',
      role: 'College Admin',
      tenant: 'MIT World Peace University',
      status: 'Pending',
      token: 'cs_inv_9f8d7c6b5a_1731600000',
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-11-20',
      createdAt: '2024-11-13'
    },
    {
      id: 'inv-2',
      email: 'recruiter.campus@uber.com',
      role: 'Recruiter',
      tenant: 'Uber Technologies India',
      status: 'Pending',
      token: 'cs_inv_8a7b6c5d4e_1731500000',
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-11-19',
      createdAt: '2024-11-12'
    },
    {
      id: 'inv-3',
      email: 'tpo.director@sit.edu.in',
      role: 'TPO Admin',
      tenant: 'Stanford Institute of Technology',
      status: 'Accepted',
      token: 'cs_inv_7b6c5d4e3f_1731400000',
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-11-18',
      createdAt: '2024-11-11'
    },
    {
      id: 'inv-4',
      email: 'dean.eng@dtu.ac.in',
      role: 'College Admin',
      tenant: 'Delhi Technological University',
      status: 'Accepted',
      token: 'cs_inv_6c5d4e3f2g_1731300000',
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-11-17',
      createdAt: '2024-11-10'
    },
    {
      id: 'inv-5',
      email: 'lead.talent@amazon.com',
      role: 'Recruiter',
      tenant: 'Amazon Web Services',
      status: 'Expired',
      token: 'cs_inv_5d4e3f2g1h_1730000000',
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-11-05',
      createdAt: '2024-10-28'
    },
    {
      id: 'inv-6',
      email: 'coord.placement@vii.edu.in',
      role: 'TPO Admin',
      tenant: 'Vellore Institute of Innovation',
      status: 'Revoked',
      token: 'cs_inv_4e3f2g1h0i_1729000000',
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-10-25',
      createdAt: '2024-10-18'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal & notification state
  const [activeInviteLink, setActiveInviteLink] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState(null);

  // New invitation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('College Admin');
  const [newInviteTenant, setNewInviteTenant] = useState('MIT World Peace University');

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRevoke = (inviteId) => {
    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id === inviteId) {
          showToast(`Invitation for ${inv.email} has been revoked.`, 'warning');
          return { ...inv, status: 'Revoked' };
        }
        return inv;
      })
    );
  };

  const handleResend = (inviteId) => {
    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id === inviteId) {
          showToast(`Refreshed invitation token dispatched to ${inv.email}.`);
          return { ...inv, status: 'Pending', expiresAt: '2024-11-22' };
        }
        return inv;
      })
    );
  };

  const handleOpenLinkModal = (inv) => {
    setActiveInviteLink(
      `${window.location.origin}/auth/register?token=${inv.token}&email=${encodeURIComponent(inv.email)}`
    );
    setShowLinkModal(true);
    setCopied(false);
  };

  const handleCopy = () => {
    if (activeInviteLink) {
      navigator.clipboard.writeText(activeInviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateInvite = (e) => {
    e.preventDefault();
    if (!newInviteEmail) return;

    const newInv = {
      id: `inv-${Date.now()}`,
      email: newInviteEmail,
      role: newInviteRole,
      tenant: newInviteTenant,
      status: 'Pending',
      token: `cs_inv_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`,
      invitedBy: 'Platform Administrator',
      expiresAt: '2024-11-21',
      createdAt: 'Just now'
    };

    setInvitations([newInv, ...invitations]);
    setShowCreateModal(false);
    setNewInviteEmail('');
    showToast(`Invitation created and sent to ${newInviteEmail}`);
  };

  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch =
      inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesRole = roleFilter === 'All' || inv.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <Badge variant="emerald" size="sm">Accepted</Badge>;
      case 'Pending':
        return <Badge variant="amber" size="sm">Pending</Badge>;
      case 'Expired':
        return <Badge variant="slate" size="sm">Expired</Badge>;
      case 'Revoked':
        return <Badge variant="rose" size="sm">Revoked</Badge>;
      default:
        return <Badge variant="slate" size="sm">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'email',
      label: 'Invited Recipient',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 font-mono text-xs">{row.email}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Invited by: {row.invitedBy}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Target Role',
      render: (val) => (
        <Badge
          variant={
            val === 'College Admin'
              ? 'purple'
              : val === 'TPO Admin'
              ? 'amber'
              : val === 'Recruiter'
              ? 'emerald'
              : 'indigo'
          }
          size="sm"
        >
          {val}
        </Badge>
      )
    },
    {
      key: 'tenant',
      label: 'Institution / Entity',
      render: (val) => <span className="text-xs text-slate-700 font-medium">{val}</span>
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val) => getStatusBadge(val)
    },
    {
      key: 'expiresAt',
      label: 'Expiration',
      render: (val, row) => (
        <div className="text-xs">
          <span className={row.status === 'Expired' ? 'text-rose-600 font-medium' : 'text-slate-600'}>
            {val}
          </span>
          <div className="text-[10px] text-slate-400">Sent: {row.createdAt}</div>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenLinkModal(row)}
            className="p-1.5 text-slate-500 hover:text-[#009669] hover:bg-[#BDF9F9]/30 rounded-lg transition-colors"
            title="Inspect / Copy Invite Link"
          >
            <Copy className="h-4 w-4" />
          </button>
          {row.status !== 'Accepted' && row.status !== 'Revoked' && (
            <>
              <button
                onClick={() => handleResend(row.id)}
                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Resend Invitation Token"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRevoke(row.id)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Revoke Token"
              >
                <Ban className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            notification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.type === 'warning' ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <PageHeader
        title="Platform Invitation Management"
        subtitle="Issue, monitor, and revoke single-use cryptographic invitation tokens across institutions and partners."
        breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Invitations' }]}
        action={
          <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Issue New Invitation
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient email or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#02E8A7] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-3 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Expired">Expired</option>
              <option value="Revoked">Revoked</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-3 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Roles</option>
              <option value="College Admin">College Admin</option>
              <option value="TPO Admin">TPO Admin</option>
              <option value="Recruiter">Recruiter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invitations Table */}
      <DataTable
        columns={columns}
        data={filteredInvitations}
        emptyMessage="No invitations match the current query."
      />

      {/* Invite Link Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Single-Use Invitation Link"
        subtitle="Cryptographically sealed activation token"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            This URL permits the recipient to claim their account, verify their institutional identity, and set up MFA.
          </p>

          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 break-all select-all">
            <span className="flex-1">{activeInviteLink}</span>
            <Button onClick={handleCopy} variant="primary" size="sm">
              {copied ? (
                <span className="flex items-center gap-1 text-xs">
                  <Check className="h-3.5 w-3.5" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </span>
              )}
            </Button>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
            <p className="font-semibold flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-amber-600" /> Security Notice
            </p>
            <p className="mt-1 text-[11px]">
              This link expires after 7 days or immediately upon completion of password configuration.
            </p>
          </div>
        </div>
      </Modal>

      {/* Issue New Invitation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Issue New Platform Invitation"
        subtitle="Dispatches a secure cryptographic activation invite"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <Input
            label="Recipient Email Address"
            type="email"
            placeholder="e.g. dean.placement@college.edu"
            value={newInviteEmail}
            onChange={(e) => setNewInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Assigned Role"
            value={newInviteRole}
            onChange={(e) => setNewInviteRole(e.target.value)}
            options={[
              { value: 'College Admin', label: 'College Admin' },
              { value: 'TPO Admin', label: 'TPO Admin' },
              { value: 'Recruiter', label: 'Corporate Recruiter' },
              { value: 'Student', label: 'Student' }
            ]}
            required
          />

          <Select
            label="Institution / Partner Tenant"
            value={newInviteTenant}
            onChange={(e) => setNewInviteTenant(e.target.value)}
            options={[
              'MIT World Peace University',
              'Stanford Institute of Technology',
              'Delhi Technological University',
              'National Institute of Tech Surathkal',
              'Google India Hiring'
            ]}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" onClick={() => setShowCreateModal(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
