import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student');

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 sm:px-6 flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sign In to CarrerSync</h2>
            <p className="text-xs text-slate-400">Select your portal to continue</p>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800 mb-6">
          {['student', 'admin', 'recruiter'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                selectedRole === role
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {role === 'admin' ? 'T&P Admin' : role}
            </button>
          ))}
        </div>

        {/* Architectural Notice */}
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 mb-6 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Phase 1 Architecture Status</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Multi-tenant JWT authentication and session management will be activated in Phase 2. Explore the live interface preview below:
          </p>
        </div>

        <div className="space-y-4">
          <Button
            to={selectedRole === 'student' ? '/student' : selectedRole === 'admin' ? '/admin' : '/recruiter'}
            variant="primary"
            size="md"
            icon={ArrowRight}
            className="w-full"
          >
            Launch {selectedRole === 'admin' ? 'T&P Admin' : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Portal Preview
          </Button>

          <div className="text-center pt-4 border-t border-slate-800 text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/auth/register" className="text-indigo-400 hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
