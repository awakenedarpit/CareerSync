import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Building,
  Briefcase,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  School,
  Loader2,
  ShieldCheck,
  Info
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import BrandLogo from '../../components/ui/BrandLogo';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPathForRole } from '../../services/authService';

export default function Register() {
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('apex-institute');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [rollNumber, setRollNumber] = useState('');
  const [batchYear, setBatchYear] = useState(new Date().getFullYear().toString());
  const [invitationToken, setInvitationToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();

  const isNonStudentRole = role !== 'student';

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMessage('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Full name, email, and password are required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    // Security Gate: Restrict non-student roles without invitation token
    if (isNonStudentRole && !invitationToken.trim()) {
      setErrorMessage(
        `Self-registration as ${role.replace('_', ' ')} is restricted. You must provide a valid invitation token issued by an administrator.`
      );
      toast.error('Invitation token required for non-student roles.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        tenantSlug: tenantSlug.trim() || 'apex-institute',
      };

      if (role === 'student') {
        payload.department = department.trim() || 'Computer Science and Engineering';
        if (rollNumber.trim()) payload.rollNumber = rollNumber.trim();
        if (batchYear) payload.batchYear = parseInt(batchYear, 10);
      }

      if (invitationToken.trim()) {
        payload.invitationToken = invitationToken.trim();
      }

      const res = await register(payload);

      if (res?.token) {
        toast.success(`Welcome to CareerSync, ${fullName}!`, {
          title: 'Account Created',
        });
        const targetRole = res?.user?.role || role;
        navigate(getDashboardPathForRole(targetRole), { replace: true });
      } else {
        toast.success('Registration successful! Please sign in with your credentials.', {
          title: 'Account Registered',
        });
        navigate('/auth/login', {
          state: { registeredEmail: email.trim() },
          replace: true,
        });
      }
    } catch (err) {
      const rawError =
        err?.message ||
        err?.data?.error ||
        err?.data?.message ||
        'Failed to register account. Please check your information.';
      setErrorMessage(rawError);
      toast.error(rawError, { title: 'Registration Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 flex flex-col items-center justify-center bg-[#E2FFFE] text-[#002020] font-sans antialiased selection:bg-[#02E8A7]/40 selection:text-[#002020]">
      {/* Return Navigation */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004D36] hover:text-[#002020] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#BDF9F9]/60 border border-[#02E8A7]/40 text-[#004D36] text-[11px] font-semibold">
          <ShieldCheck className="h-3 w-3 text-[#004D36]" />
          <span>Institutional Verification</span>
        </div>
      </div>

      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white border border-[#BACBC0]/50 shadow-md rounded-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo variant="full" size="md" className="mx-auto mb-3 max-w-[210px]" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002020]">
            Create CareerSync Account
          </h1>
          <p className="text-xs text-[#3B4A42] mt-1 max-w-sm">
            Join the verified skills placement intelligence platform
          </p>
        </div>

        {/* Role Selector with Gate Warnings */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#004D36] mb-2">
            Select Account Type
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#E2FFFE] border border-[#BACBC0]/40">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                role === 'student'
                  ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                  : 'text-[#004D36] hover:bg-[#BDF9F9] hover:text-[#002020]'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('recruiter')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                role === 'recruiter'
                  ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                  : 'text-[#004D36] hover:bg-[#BDF9F9] hover:text-[#002020]'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Recruiter</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('tpo_admin')}
              className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                role === 'tpo_admin'
                  ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs'
                  : 'text-[#004D36] hover:bg-[#BDF9F9] hover:text-[#002020]'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>TPO / Admin</span>
            </button>
          </div>
        </div>

        {/* Non-Student Invitation Warning Callout */}
        {isNonStudentRole && (
          <div className="mb-4 p-3 rounded-lg bg-[#FFF8E7] border border-[#FFC558]/60 text-[#7A4E00] text-xs flex items-start gap-2 animate-in fade-in">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#7A4E00]" />
            <div className="flex-1">
              <p className="font-bold">Invitation Token Required</p>
              <p className="text-[11px] mt-0.5">
                Administrative and hiring roles require authorization. Enter your single-use invitation token below.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Registration Issue</p>
              <p className="text-[11px] mt-0.5 text-rose-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <Input
            label="Full Name"
            icon={User}
            placeholder={role === 'student' ? 'Aditya Sharma' : 'Sarah Jenkins'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            label={role === 'student' ? 'Institutional / College Email' : 'Corporate Email'}
            type="email"
            icon={Mail}
            placeholder={role === 'student' ? 'aditya.sharma@apex.edu' : 'recruiter@cloudscale.example.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password (min 8 characters)"
            type="password"
            icon={Lock}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {/* Student Specific Fields */}
          {role === 'student' && (
            <div className="space-y-3 pt-1 border-t border-[#BACBC0]/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Department / Branch"
                  placeholder="Computer Science"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
                <Input
                  label="Batch Year"
                  type="number"
                  placeholder="2025"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                />
              </div>

              <Input
                label="Roll Number / Student ID (Optional)"
                placeholder="CS-2021-042"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                helperText="Leave blank to auto-generate institution roll number"
              />
            </div>
          )}

          {/* Non-Student Invitation Token Field */}
          {isNonStudentRole && (
            <div className="pt-1 border-t border-[#BACBC0]/30">
              <Input
                label="Invitation Token"
                icon={KeyRound}
                placeholder="Enter 32-character invitation token"
                value={invitationToken}
                onChange={(e) => setInvitationToken(e.target.value)}
                required
                helperText="Issued by Super Admin or College Leadership"
              />
            </div>
          )}

          {/* Institution Tenant Slug */}
          <Input
            label="Institution Slug"
            icon={School}
            placeholder="apex-institute"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            helperText="Default: apex-institute (Apex Institute of Technology; accepts apex-tech)"
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full justify-center text-xs font-bold py-2.5 mt-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Registering Account...
              </>
            ) : (
              <>
                Complete Registration
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 pt-4 border-t border-[#BACBC0]/30 text-center text-xs text-[#3B4A42]">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="font-bold text-[#004D36] hover:text-[#002020] underline transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </Card>
    </div>
  );
}
