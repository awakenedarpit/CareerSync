import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Shield,
  Building,
  Briefcase,
  ShieldAlert,
  Award,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Loader2,
  KeyRound
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import BrandLogo from '../../components/ui/BrandLogo';
import { useToast } from '../../components/ui/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  DEMO_CREDENTIALS,
  getDashboardPathForRole
} from '../../services/authService';

const ROLE_OPTIONS = [
  {
    id: 'student',
    roleKey: 'student',
    label: 'Student',
    icon: GraduationCap,
    desc: 'Aditya Sharma (B.Tech CSE)',
  },
  {
    id: 'tpo_admin',
    roleKey: 'tpo_admin',
    label: 'TPO Admin',
    icon: Shield,
    desc: 'Prof. Rajiv Menon (TPO)',
  },
  {
    id: 'college_admin',
    roleKey: 'college_admin',
    label: 'College Admin',
    icon: Building,
    desc: 'Dr. Rajesh Sharma (Dean)',
  },
  {
    id: 'recruiter',
    roleKey: 'recruiter',
    label: 'Recruiter',
    icon: Briefcase,
    desc: 'Vikram Mehta (CloudScale)',
  },
  {
    id: 'superadmin',
    roleKey: 'superadmin',
    label: 'Super Admin',
    icon: ShieldAlert,
    desc: 'Platform Super Admin',
  },
  {
    id: 'alumni',
    roleKey: 'alumni',
    label: 'Alumni',
    icon: Award,
    desc: 'Vikram Malhotra (Mentor)',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.student.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.student.password);
  const [tenantSlug, setTenantSlug] = useState('apex-institute');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login } = useAuth();

  // Check if redirected with registration success message
  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
      setPassword('');
      setSuccessMessage('Registration successful! Please sign in with your credentials.');
    }
  }, [location.state]);

  // When selected role tab changes, update defaults
  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setErrorMessage('');
    const demo = DEMO_CREDENTIALS[roleKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      if (roleKey === 'superadmin') {
        setTenantSlug('');
      } else if (roleKey === 'recruiter') {
        setTenantSlug('apex-institute');
      } else {
        setTenantSlug('apex-institute');
      }
    }
  };

  // Perform actual login against backend API
  const executeLogin = async (loginEmail, loginPassword, roleHint, slug) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        email: loginEmail.trim(),
        password: loginPassword,
        role: roleHint,
      };

      if (slug && slug.trim()) {
        payload.tenantSlug = slug.trim();
      }

      const res = await login(payload);

      const targetRole = res?.user?.role || roleHint;
      const destination = getDashboardPathForRole(targetRole);

      toast.success(`Welcome back, ${res?.user?.fullName || 'User'}!`, {
        title: 'Authentication Successful',
      });

      navigate(destination, { replace: true });
    } catch (err) {
      const rawError =
        err?.message ||
        err?.data?.error ||
        err?.data?.message ||
        'Unable to authenticate. Please check your credentials or tenant context.';
      setErrorMessage(rawError);
      toast.error(rawError, { title: 'Sign In Failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    executeLogin(email, password, selectedRole, tenantSlug);
  };

  // One-click instant login for evaluators
  const handleOneClickDemo = (roleKey) => {
    const demo = DEMO_CREDENTIALS[roleKey];
    if (!demo) return;
    setSelectedRole(roleKey);
    setEmail(demo.email);
    setPassword(demo.password);
    const slug = roleKey === 'superadmin' ? '' : 'apex-institute';
    setTenantSlug(slug);
    executeLogin(demo.email, demo.password, demo.role, slug);
  };

  const activeRoleConfig = ROLE_OPTIONS.find((r) => r.roleKey === selectedRole) || ROLE_OPTIONS[0];

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
          <Sparkles className="h-3 w-3 text-[#004D36]" />
          <span>Real JWT Authentication</span>
        </div>
      </div>

      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white border border-[#BACBC0]/50 shadow-md rounded-2xl">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo variant="full" size="md" className="mx-auto mb-3 max-w-[210px]" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#002020]">
            Sign in to CareerSync
          </h1>
          <p className="text-xs text-[#3B4A42] mt-1 max-w-sm">
            Institutional Placement Intelligence, Verified Evidence & Automated Compliance
          </p>
        </div>

        {/* 6-Role Selector Tabs */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#004D36]">
              Select Demo Role (6 Supported Roles)
            </span>
            <span className="text-[11px] text-[#3B4A42]">Click role to autofill</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#E2FFFE] border border-[#BACBC0]/40">
            {ROLE_OPTIONS.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.roleKey;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.roleKey)}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-xs ring-1 ring-[#004D36]/20'
                      : 'text-[#004D36] hover:bg-[#BDF9F9] hover:text-[#002020]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="text-[11px] leading-tight text-center">{r.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-center text-[11px] text-[#3B4A42] bg-[#BDF9F9]/30 rounded-lg py-1 px-2 border border-[#BACBC0]/30">
            Active Profile: <span className="font-semibold text-[#002020]">{activeRoleConfig.desc}</span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-[#E6FAF4] border border-[#02E8A7]/60 text-[#004D36] text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="flex-1">{successMessage}</p>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Authentication Error</p>
              <p className="text-[11px] mt-0.5 text-rose-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="College / Corporate Email"
            type="email"
            icon={Mail}
            placeholder="user@apex.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[#002020] cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#BACBC0] text-[#006973] focus:ring-[#02E8A7]"
              />
              <span>Remember session</span>
            </label>
            <span className="text-[11px] text-[#004D36] font-medium">
              Target: <code className="bg-[#BDF9F9]/50 px-1 py-0.5 rounded text-[#002020]">{getDashboardPathForRole(selectedRole)}</code>
            </span>
          </div>

          {/* Primary Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full justify-center text-xs font-bold py-2.5 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              <>
                Enter {activeRoleConfig.label} Portal
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        {/* Quick 1-Click Evaluation Bar */}
        <div className="mt-6 pt-5 border-t border-[#BACBC0]/40">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#004D36] flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              1-Click Fast Demo Login
            </span>
            <span className="text-[10px] text-[#3B4A42] bg-[#E2FFFE] px-2 py-0.5 rounded border border-[#BACBC0]/40">
              Zero Typing Required
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleOneClickDemo(r.roleKey)}
                  className="flex items-center gap-1.5 p-2 rounded-lg border border-[#BACBC0]/60 bg-[#E2FFFE]/40 hover:bg-[#02E8A7]/30 hover:border-[#02E8A7] text-[#002020] text-left transition-all group disabled:opacity-50 cursor-pointer"
                  title={`Fast login as ${r.label}`}
                >
                  <div className="h-7 w-7 rounded-md bg-white border border-[#BACBC0]/40 flex items-center justify-center text-[#004D36] group-hover:bg-[#02E8A7] group-hover:text-[#002020] transition-colors shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#002020] truncate">{r.label}</p>
                    <p className="text-[9px] text-[#3B4A42] truncate">{r.roleKey}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / Registration Link */}
        <div className="mt-6 pt-4 border-t border-[#BACBC0]/30 text-center text-xs text-[#3B4A42]">
          Need a student account?{' '}
          <Link
            to="/auth/register"
            className="font-bold text-[#004D36] hover:text-[#002020] underline transition-colors"
          >
            Register Student Profile
          </Link>
        </div>
      </Card>

      {/* Security notice footer */}
      <p className="mt-6 text-[11px] text-[#3B4A42] text-center max-w-md">
        Protected by Argon2id / bcrypt salted hashing & signed HS256 JWT tokens. Enforcing strict multi-tenant institutional isolation.
      </p>
    </div>
  );
}
