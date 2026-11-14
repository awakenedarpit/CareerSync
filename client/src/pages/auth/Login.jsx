import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Shield,
  Building
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedRole === 'student') navigate('/student');
    else if (selectedRole === 'admin') navigate('/admin');
    else navigate('/recruiter');
  };

  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap, path: '/student' },
    { id: 'admin', label: 'T&P Admin', icon: Shield, path: '/admin' },
    { id: 'recruiter', label: 'Recruiter', icon: Building, path: '/recruiter' }
  ];

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md p-8 border-slate-200 shadow-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Overview
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sign in to CarrerSync</h2>
            <p className="text-xs text-slate-500">Access your placement intelligence portal</p>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 mb-6">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`py-2 px-1 text-xs font-semibold rounded-lg flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <Input
            label="College / Corporate Email"
            type="email"
            placeholder={
              selectedRole === 'student'
                ? 'priya.sharma21@college.edu'
                : selectedRole === 'admin'
                ? 'head.tnp@college.edu'
                : 'sarah.j@google.com'
            }
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded text-indigo-600" />
              <span>Remember session</span>
            </label>
            <a href="#" className="text-indigo-600 hover:underline">Forgot password?</a>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full justify-center mt-2">
            Enter {roles.find(r => r.id === selectedRole)?.label} Portal
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          New to CarrerSync?{' '}
          <Link to="/auth/register" className="font-semibold text-indigo-600 hover:underline">
            Register institution or student account
          </Link>
        </div>
      </Card>
    </div>
  );
}
