import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  User,
  Building2,
  Briefcase,
  GraduationCap,
  Shield,
  KeyRound,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function CreateUser() {
  const navigate = useNavigate();

  const [role, setRole] = useState('college_admin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    collegeId: 'col-1',
    // Student specifics
    studentId: '',
    branch: 'Computer Science & Engineering',
    gradYear: '2025',
    // Recruiter specifics
    companyName: '',
    companyDomain: '',
    designation: '',
    // Auth method
    sendInvitation: true,
    tempPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUserSuccess, setCreatedUserSuccess] = useState(null);

  const collegeOptions = [
    { value: 'col-1', label: 'MIT World Peace University (Pune)' },
    { value: 'col-2', label: 'Stanford Institute of Technology (Bengaluru)' },
    { value: 'col-3', label: 'Delhi Technological University (Delhi)' },
    { value: 'col-4', label: 'National Institute of Tech Surathkal' },
    { value: 'col-6', label: 'Birla Institute of Technology Mesra' },
    { value: 'col-7', label: 'Indore Institute of Science and Technology' },
    { value: 'col-8', label: 'Indian Institute of Engineering Science Shibpur' },

  ];

  const roleConfigs = [
    { id: 'college_admin', label: 'College Admin', icon: Building2, desc: 'Institutional Head / Dean' },
    { id: 'tpo_admin', label: 'TPO Admin', icon: Shield, desc: 'Placement Coordinator / Officer' },
    { id: 'recruiter', label: 'Recruiter', icon: Briefcase, desc: 'Corporate Talent Acquisition Partner' },
    { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Placement Candidate' },
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Valid email address is required';
    }

    if (role === 'recruiter') {
      if (!formData.companyName.trim()) errs.companyName = 'Company / Organization name is required';
      if (!formData.companyDomain.trim()) errs.companyDomain = 'Company domain is required';
    }

    if (role === 'student') {
      if (!formData.studentId.trim()) errs.studentId = 'USN or Student ID is required';
    }

    if (!formData.sendInvitation && !formData.tempPassword) {
      errs.tempPassword = 'Temporary password is required when invitation email is disabled';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const token = `cs_inv_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      setCreatedUserSuccess({
        name: formData.name,
        email: formData.email,
        role: roleConfigs.find(r => r.id === role)?.label || role,
        college: role === 'recruiter' ? formData.companyName : collegeOptions.find(c => c.value === formData.collegeId)?.label,
        invitationToken: token,
        invitationSent: formData.sendInvitation
      });
    }, 600);
  };

  if (createdUserSuccess) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="User Account Provisioned"
          subtitle="Identity record created with tenant-scoped permissions."
          breadcrumbs={[
            { label: 'Super Admin', href: '/super-admin' },
            { label: 'Users', href: '/super-admin/users' },
            { label: 'Created' }
          ]}
        />

        <Card className="border-emerald-200 bg-emerald-50/40 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                User Account Created: {createdUserSuccess.name}
              </h3>
              <p className="text-sm text-slate-600">
                Identity registered with assigned role <strong className="text-slate-800">{createdUserSuccess.role}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold uppercase">Email Identity</span>
              <p className="text-slate-900 font-mono font-bold text-sm mt-0.5">{createdUserSuccess.email}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold uppercase">Organization / College</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{createdUserSuccess.college}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 sm:col-span-2">
              <span className="text-slate-400 font-semibold uppercase">Onboarding Invitation Token</span>
              <p className="text-[#009669] font-mono font-bold text-xs mt-0.5 break-all">
                {createdUserSuccess.invitationToken}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {createdUserSuccess.invitationSent
                  ? 'An automated activation email with cryptographic onboarding link has been dispatched.'
                  : 'Manual credentials configured.'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button to="/super-admin/users" variant="primary" size="md">
              Return to User Directory
            </Button>
            <Button
              onClick={() => {
                setCreatedUserSuccess(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  collegeId: 'col-1',
                  studentId: '',
                  branch: 'Computer Science & Engineering',
                  gradYear: '2025',
                  companyName: '',
                  companyDomain: '',
                  designation: '',
                  sendInvitation: true,
                  tempPassword: ''
                });
                setErrors({});
              }}
              variant="secondary"
              size="md"
            >
              Provision Another User
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Provision Platform User Account"
        subtitle="Provision accounts across institutions and corporate recruiters with role-specific constraints."
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin' },
          { label: 'Users', href: '/super-admin/users' },
          { label: 'Create User' }
        ]}
        action={
          <Button to="/super-admin/users" variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Role Selection */}
        <Card>
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Select Target Role</h3>
            <p className="text-xs text-slate-500">Determines permission boundaries and UI capabilities.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {roleConfigs.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${isSelected
                    ? 'border-indigo-600 bg-[#BDF9F9]/30/60 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#02E8A7] text-[#002020] font-bold' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-[#02E8A7]" />}
                  </div>
                  <div className="mt-3">
                    <p className={`text-sm font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>{r.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Step 2: User Identity & Contact */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User className="h-4 w-4 text-[#009669]" />
            <h3 className="font-bold text-slate-900 text-sm">Identity & Credentials</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Full Legal Name"
              placeholder="e.g. Aditi Roy"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              required
            />

            <Input
              label="Primary Email Address"
              type="email"
              placeholder="e.g. aditi.roy@institution.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              icon={Mail}
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Contact Phone Number (Optional)"
                placeholder="e.g. +91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Step 3: Dynamic Role Context */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Building2 className="h-4 w-4 text-[#009669]" />
            <h3 className="font-bold text-slate-900 text-sm">
              {role === 'recruiter' ? 'Corporate Partner Assignment' : 'Institutional College Assignment'}
            </h3>
          </div>

          <div className="space-y-4 mt-4">
            {role !== 'recruiter' ? (
              <Select
                label="Affiliated College Institution"
                value={formData.collegeId}
                onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                options={collegeOptions}
                helperText="Tenant scoping will enforce strict Row-Level Security for this college."
                required
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company / Enterprise Name"
                  placeholder="e.g. Google India / Razorpay"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  error={errors.companyName}
                  required
                />
                <Input
                  label="Corporate Domain"
                  placeholder="e.g. google.com"
                  value={formData.companyDomain}
                  onChange={(e) => setFormData({ ...formData, companyDomain: e.target.value })}
                  error={errors.companyDomain}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Recruiter Designation"
                    placeholder="e.g. Senior Technical University Recruiter"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  />
                </div>
              </div>
            )}

            {role === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <Input
                  label="University Reg No / USN"
                  placeholder="e.g. 1MS21CS042"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  error={errors.studentId}
                  required
                />
                <Select
                  label="Department / Branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  options={[
                    'Computer Science & Engineering',
                    'Computer Science & Engineering (Data Science)',
                    'Artificial Intelligence & Machine Learning',
                    'Robotics and Artificial Intelligence',
                    'Information Technology',
                    'Electronics & Communication Engineering',
                    'Electronics and Computer Science',
                    'Mechanical Engineering',
                    'Civil Engineering',
                  ]}
                  required
                />
                <Select
                  label="Graduation Year"
                  value={formData.gradYear}
                  onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                  options={['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032']}
                  required
                />
              </div>
            )}
          </div>
        </Card>

        {/* Step 4: Activation & Invitation Security */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <KeyRound className="h-4 w-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Account Activation & Token Dispatch</h3>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <input
                id="sendInv"
                type="checkbox"
                checked={formData.sendInvitation}
                onChange={(e) => setFormData({ ...formData, sendInvitation: e.target.checked })}
                className="mt-0.5 h-4 w-4 text-[#009669] rounded border-slate-300 focus:ring-[#02E8A7]"
              />
              <div>
                <label htmlFor="sendInv" className="text-xs font-semibold text-slate-900 select-none cursor-pointer">
                  Send cryptographic invitation email (Recommended)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Generates an expiring one-time link allowing the recipient to securely set their password and setup 2FA.
                </p>
              </div>
            </div>

            {!formData.sendInvitation && (
              <Input
                label="Temporary Password"
                type="password"
                placeholder="Enter initial temporary password..."
                value={formData.tempPassword}
                onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                error={errors.tempPassword}
                helperText="User will be forced to change password on first login."
                required
              />
            )}
          </div>
        </Card>

        {/* Submission Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button to="/super-admin/users" variant="secondary" size="md">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Create Account & Dispatch Token
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
