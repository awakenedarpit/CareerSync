import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Building,
  CheckCircle2
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

export default function Register() {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    if (role === 'student') navigate('/student');
    else navigate('/recruiter');
  };

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md p-8 border-slate-200 shadow-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create an Account</h2>
            <p className="text-xs text-slate-500">Join CarrerSync Placement Intelligence</p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 mb-2">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'student' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'recruiter' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Recruiter</span>
            </button>
          </div>

          <Input
            label="Full Name"
            placeholder={role === 'student' ? 'Priya Sharma' : 'Sarah Jenkins'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label={role === 'student' ? 'College Email (.edu / institutional)' : 'Corporate Email'}
            type="email"
            placeholder={role === 'student' ? 'priya.sharma21@college.edu' : 'sarah.j@techcorp.io'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="md" className="w-full justify-center mt-2">
            Create Account & Enter Portal
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/auth/login" className="font-semibold text-indigo-600 hover:underline">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}
