import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';

export default function Register() {
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
            <h2 className="text-xl font-bold text-white">Join CarrerSync</h2>
            <p className="text-xs text-slate-400">Select your onboarding persona</p>
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

        {/* Role Explanation Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 mb-6 space-y-2">
          <div className="font-semibold text-white">
            {selectedRole === 'student' && 'Student Onboarding'}
            {selectedRole === 'admin' && 'College T&P Cell Onboarding'}
            {selectedRole === 'recruiter' && 'Corporate Recruiter Onboarding'}
          </div>
          <p className="text-slate-400 leading-relaxed">
            {selectedRole === 'student' && 'Connect GitHub repositories, generate verified skill profiles, and benchmark against upcoming campus drives.'}
            {selectedRole === 'admin' && 'Automate placement drives, configure eligibility rules, and view cohort-wide readiness analytics.'}
            {selectedRole === 'recruiter' && 'Post job requirements, view pre-verified candidate shortlists, and evaluate authentic code evidence.'}
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
            Explore {selectedRole === 'admin' ? 'T&P Admin' : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Dashboard Preview
          </Button>

          <div className="text-center pt-4 border-t border-slate-800 text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-indigo-400 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
