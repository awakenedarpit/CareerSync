import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Power,
  UserCog,
  ShieldAlert
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';

export default function UserManagement() {
  const [users, setUsers] = useState([
    {
      id: 'usr-1',
      name: 'Dr. Rajiv Menon',
      email: 'head.tnp@college.edu',
      role: 'College Admin',
      college: 'MIT World Peace University',
      status: 'Active',
      createdAt: '2024-01-20',
      lastLogin: '10 mins ago',
      twoFactorEnabled: true
    },
    {
      id: 'usr-2',
      name: 'Priya Sharma',
      email: 'priya.cs21@college.edu',
      role: 'Student',
      college: 'MIT World Peace University',
      status: 'Active',
      createdAt: '2024-02-05',
      lastLogin: '1 hour ago',
      twoFactorEnabled: false
    },
    {
      id: 'usr-3',
      name: 'Sarah Jenkins',
      email: 'sarah.j@techcorp.io',
      role: 'Recruiter',
      college: 'Corporate Partner (Google / TechCorp)',
      status: 'Active',
      createdAt: '2024-02-14',
      lastLogin: '3 hours ago',
      twoFactorEnabled: true
    },
    {
      id: 'usr-4',
      name: 'Prof. Ananya Sen',
      email: 'a.sen@dtu.ac.in',
      role: 'TPO Admin',
      college: 'Delhi Technological University',
      status: 'Active',
      createdAt: '2024-03-02',
      lastLogin: 'Yesterday',
      twoFactorEnabled: true
    },
    {
      id: 'usr-5',
      name: 'Vikram Patel',
      email: 'vikram.p22@sit.edu.in',
      role: 'Student',
      college: 'Stanford Institute of Technology',
      status: 'Active',
      createdAt: '2024-03-15',
      lastLogin: '2 days ago',
      twoFactorEnabled: false
    },
    {
      id: 'usr-6',
      name: 'Devraj Mukherjee',
      email: 'devraj.m@vii.edu.in',
      role: 'Student',
      college: 'Vellore Institute of Innovation',
      status: 'Suspended',
      createdAt: '2024-04-10',
      lastLogin: '10 days ago',
      twoFactorEnabled: false
    },
    {
      id: 'usr-7',
      name: 'Marcus Vance',
      email: 'm.vance@goldman.com',
      role: 'Recruiter',
      college: 'Corporate Partner (Goldman Sachs)',
      status: 'Active',
      createdAt: '2024-04-25',
      lastLogin: '4 days ago',
      twoFactorEnabled: true
    },
    {
      id: 'usr-8',
      name: 'Dr. Sunita Kulkarni',
      email: 's.kulkarni@nitk.edu.in',
      role: 'College Admin',
      college: 'National Institute of Tech Surathkal',
      status: 'Active',
      createdAt: '2024-05-01',
      lastLogin: 'Today',
      twoFactorEnabled: true
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRoleValue, setNewRoleValue] = useState('');
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleStatus = (userId) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          showToast(
            `Account for ${u.name} is now ${newStatus.toLowerCase()}.`,
            newStatus === 'Active' ? 'success' : 'warning'
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRoleValue(user.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = (e) => {
    e.preventDefault();
    if (!selectedUser || !newRoleValue) return;

    setUsers(prev =>
      prev.map(u => (u.id === selectedUser.id ? { ...u, role: newRoleValue } : u))
    );
    setShowRoleModal(false);
    showToast(`Updated role of ${selectedUser.name} to ${newRoleValue}.`);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.college.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesCollege = collegeFilter === 'All' || u.college.includes(collegeFilter);
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesCollege && matchesStatus;
  });

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'College Admin':
        return 'purple';
      case 'TPO Admin':
        return 'amber';
      case 'Recruiter':
        return 'emerald';
      case 'Student':
        return 'indigo';
      default:
        return 'slate';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User Identity',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <div className="font-semibold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500 font-mono">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Assigned Role',
      render: (val) => (
        <Badge variant={getRoleBadgeVariant(val)} size="sm">
          {val}
        </Badge>
      )
    },
    {
      key: 'college',
      label: 'Affiliated Institution / Partner',
      render: (val) => (
        <span className="text-xs text-slate-700 font-medium truncate max-w-xs block">
          {val}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Account Status',
      align: 'center',
      render: (val) => (
        <Badge variant={val === 'Active' ? 'emerald' : 'rose'} size="sm">
          {val}
        </Badge>
      )
    },
    {
      key: 'lastLogin',
      label: 'Last Seen',
      render: (val) => <span className="text-xs text-slate-500">{val}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedUser(row);
              setShowViewModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-[#009669] hover:bg-[#BDF9F9]/30 rounded-lg transition-colors"
            title="View User Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenRoleModal(row)}
            className="p-1.5 text-slate-500 hover:text-[#009669] hover:bg-[#BDF9F9]/30 rounded-lg transition-colors"
            title="Change Role"
          >
            <UserCog className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'Active'
                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
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
        title="Cross-Institution User Governance"
        subtitle="Universal directory of platform administrators, institutional placement coordinators, corporate recruiters, and students."
        breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Users' }]}
        action={
          <Button to="/super-admin/users/new" variant="primary" size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Create User Account
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
              placeholder="Search by user name, email, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#02E8A7] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-3 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Roles</option>
              <option value="College Admin">College Admin</option>
              <option value="TPO Admin">TPO Admin</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Student">Student</option>
            </select>

            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-3 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Institutions</option>
              <option value="MIT World Peace University">MIT World Peace</option>
              <option value="Stanford Institute">Stanford Tech</option>
              <option value="Delhi Technological University">Delhi Tech</option>
              <option value="Vellore Institute">Vellore Inst</option>
              <option value="National Institute of Tech">NIT Surathkal</option>
              <option value="Corporate Partner">Corporate Partners</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-3 text-xs text-slate-700 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        emptyMessage="No users found matching the selected search and filter criteria."
      />

      {/* View User Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedUser?.name || 'User Profile'}
        subtitle={`System ID: ${selectedUser?.id || ''}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Badge variant={selectedUser?.status === 'Active' ? 'emerald' : 'rose'}>
              {selectedUser?.status}
            </Badge>
            <Button onClick={() => setShowViewModal(false)} variant="secondary" size="sm">
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Avatar name={selectedUser.name} size="md" />
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedUser.name}</p>
                <p className="text-slate-500 font-mono text-xs">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Platform Role</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedUser.role}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Two-Factor Auth</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedUser.twoFactorEnabled ? 'Enabled (MFA)' : 'Disabled'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Assigned Institution / Entity</span>
              <p className="font-semibold text-slate-900 mt-0.5">{selectedUser.college}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-500">
              <div>
                <span>Account Created:</span>
                <p className="font-medium text-slate-800">{selectedUser.createdAt}</p>
              </div>
              <div>
                <span>Last Session:</span>
                <p className="font-medium text-slate-800">{selectedUser.lastLogin}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Modify Platform Role"
        subtitle={`Adjust system authorization level for ${selectedUser?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <p className="text-xs text-slate-600">
            Changing user role dynamically alters permissions, routing gates, and accessible tenant views.
          </p>

          <Select
            label="Assigned Role"
            value={newRoleValue}
            onChange={(e) => setNewRoleValue(e.target.value)}
            options={[
              { value: 'College Admin', label: 'College Admin (Institutional Lead)' },
              { value: 'TPO Admin', label: 'TPO Admin (Placement Coordinator)' },
              { value: 'Recruiter', label: 'Recruiter (Corporate Partner)' },
              { value: 'Student', label: 'Student (Candidate Profile)' },
            ]}
            required
          />

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Audit Notification
            </p>
            <p className="mt-1 text-[11px]">
              This action will be written to the immutable super admin audit log with your administrative signature.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" onClick={() => setShowRoleModal(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Role Change
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
