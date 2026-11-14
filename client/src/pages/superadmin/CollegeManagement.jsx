import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Eye,
  ShieldAlert,
  MapPin,
  Globe,
  Mail,
  Phone,
  Power
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function CollegeManagement() {
  const [colleges, setColleges] = useState([
    {
      id: 'col-1',
      name: 'MIT World Peace University',
      slug: 'mit-wpu',
      domain: 'mitwpu.edu.in',
      location: 'Pune, Maharashtra',
      contactEmail: 'admin@mitwpu.edu.in',
      contactPhone: '+91 20 2740 0000',
      admins: 3,
      students: 2450,
      status: 'Active',
      createdAt: '2024-01-15'
    },
    {
      id: 'col-2',
      name: 'Stanford Institute of Technology',
      slug: 'sit-blr',
      domain: 'sit.edu.in',
      location: 'Bengaluru, Karnataka',
      contactEmail: 'director@sit.edu.in',
      contactPhone: '+91 80 4123 4567',
      admins: 2,
      students: 1890,
      status: 'Active',
      createdAt: '2024-02-10'
    },
    {
      id: 'col-3',
      name: 'Delhi Technological University',
      slug: 'dtu-delhi',
      domain: 'dtu.ac.in',
      location: 'New Delhi, Delhi',
      contactEmail: 'tnp@dtu.ac.in',
      contactPhone: '+91 11 2787 1018',
      admins: 4,
      students: 3120,
      status: 'Active',
      createdAt: '2024-03-01'
    },
    {
      id: 'col-4',
      name: 'National Institute of Tech Surathkal',
      slug: 'nitk',
      domain: 'nitk.edu.in',
      location: 'Surathkal, Karnataka',
      contactEmail: 'registrar@nitk.edu.in',
      contactPhone: '+91 824 247 4000',
      admins: 3,
      students: 2780,
      status: 'Active',
      createdAt: '2024-03-22'
    },
    {
      id: 'col-5',
      name: 'Vellore Institute of Innovation',
      slug: 'vii-tn',
      domain: 'vii.edu.in',
      location: 'Vellore, Tamil Nadu',
      contactEmail: 'admin@vii.edu.in',
      contactPhone: '+91 416 220 2000',
      admins: 2,
      students: 1640,
      status: 'Suspended',
      createdAt: '2024-04-05'
    },
    {
      id: 'col-6',
      name: 'Birla Institute of Technology Mesra',
      slug: 'bit-mesra',
      domain: 'bitmesra.ac.in',
      location: 'Ranchi, Jharkhand',
      contactEmail: 'tnp@bitmesra.ac.in',
      contactPhone: '+91 651 227 5444',
      admins: 3,
      students: 2150,
      status: 'Active',
      createdAt: '2024-05-18'
    },
    {
      id: 'col-7',
      name: 'Indian Institute of Engineering Science',
      slug: 'iiest-shibpur',
      domain: 'iiests.ac.in',
      location: 'Howrah, West Bengal',
      contactEmail: 'contact@iiests.ac.in',
      contactPhone: '+91 33 2668 4561',
      admins: 2,
      students: 1420,
      status: 'Active',
      createdAt: '2024-06-11'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleStatus = (collegeId) => {
    setColleges(prev =>
      prev.map(c => {
        if (c.id === collegeId) {
          const newStatus = c.status === 'Active' ? 'Suspended' : 'Active';
          showToast(
            `${c.name} has been ${newStatus === 'Active' ? 'reactivated' : 'suspended'}.`,
            newStatus === 'Active' ? 'success' : 'warning'
          );
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const handleOpenEdit = (college) => {
    setSelectedCollege(college);
    setEditFormData({
      name: college.name,
      domain: college.domain,
      location: college.location,
      contactEmail: college.contactEmail,
      contactPhone: college.contactPhone
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedCollege) return;
    setColleges(prev =>
      prev.map(c => (c.id === selectedCollege.id ? { ...c, ...editFormData } : c))
    );
    setShowEditModal(false);
    showToast(`Updated details for ${editFormData.name || selectedCollege.name}.`);
  };

  const filteredColleges = colleges.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'name',
      label: 'Institution Name & Slug',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>{row.name}</span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            slug: {row.slug} • domain: {row.domain}
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Location',
      render: (val) => (
        <span className="flex items-center gap-1 text-slate-600 text-xs">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {val}
        </span>
      )
    },
    {
      key: 'admins',
      label: 'Admins',
      align: 'center',
      render: (val) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
          {val} Admins
        </span>
      )
    },
    {
      key: 'students',
      label: 'Enrolled Students',
      align: 'center',
      render: (val) => (
        <span className="text-xs font-medium text-slate-800">
          {val.toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (val) => (
        <Badge variant={val === 'Active' ? 'emerald' : 'rose'} size="sm">
          {val}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedCollege(row);
              setShowViewModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit College"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'Active'
                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={row.status === 'Active' ? 'Suspend Institution' : 'Reactivate Institution'}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Floating Notification */}
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
        title="Institutional College Management"
        subtitle="Provision and administer institutional tenants, official domains, contact personnel, and access statuses."
        breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Colleges' }]}
        action={
          <Button to="/super-admin/colleges/new" variant="primary" size="sm">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Register New College
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by college name, slug, domain, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter Status:</span>
          </div>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {['All', 'Active', 'Suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md transition-all ${
                  statusFilter === status
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Colleges Table */}
      <DataTable
        columns={columns}
        data={filteredColleges}
        emptyMessage="No colleges found matching the selected filter criteria."
      />

      {/* View College Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedCollege?.name || 'Institution Details'}
        subtitle={`Tenant Slug: ${selectedCollege?.slug || ''}`}
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Badge variant={selectedCollege?.status === 'Active' ? 'emerald' : 'rose'}>
              Status: {selectedCollege?.status}
            </Badge>
            <Button onClick={() => setShowViewModal(false)} variant="secondary" size="sm">
              Close
            </Button>
          </div>
        }
      >
        {selectedCollege && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Official Domain</p>
                <p className="text-slate-900 font-medium text-sm mt-0.5 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-indigo-600" />
                  {selectedCollege.domain}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Campus Location</p>
                <p className="text-slate-900 font-medium text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                  {selectedCollege.location}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Contact Email</p>
                <p className="text-slate-900 font-medium text-sm mt-0.5 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-indigo-600" />
                  {selectedCollege.contactEmail}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Contact Phone</p>
                <p className="text-slate-900 font-medium text-sm mt-0.5 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-indigo-600" />
                  {selectedCollege.contactPhone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Admins</span>
                <p className="text-lg font-bold text-purple-700 mt-0.5">{selectedCollege.admins}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Students</span>
                <p className="text-lg font-bold text-sky-700 mt-0.5">{selectedCollege.students.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">Since</span>
                <p className="text-sm font-bold text-slate-700 mt-1">{selectedCollege.createdAt}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900">
              <p className="font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                Data Isolation Policy
              </p>
              <p className="text-indigo-800 text-[11px] mt-1">
                Cross-institution queries strictly enforced via tenant ID <code>{selectedCollege.slug}</code>. Students and recruiters outside this organization cannot access private resumes without explicit consent.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit College Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit College Information"
        subtitle={`Update metadata and contact points for ${selectedCollege?.name || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="College Name"
            value={editFormData.name || ''}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />
          <Input
            label="Official Domain"
            value={editFormData.domain || ''}
            onChange={(e) => setEditFormData({ ...editFormData, domain: e.target.value })}
            required
          />
          <Input
            label="Location"
            value={editFormData.location || ''}
            onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              value={editFormData.contactEmail || ''}
              onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
              required
            />
            <Input
              label="Contact Phone"
              value={editFormData.contactPhone || ''}
              onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" onClick={() => setShowEditModal(false)} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
