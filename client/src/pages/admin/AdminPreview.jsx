import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, Users, Calendar, BarChart3, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';

export default function AdminPreview() {
  const drives = [
    { company: 'CloudScale Technologies', role: 'Full Stack Engineer', batch: '2026', eligible: 142, status: 'Active Registration' },
    { company: 'FinCore Systems', role: 'Backend SDE', batch: '2026', eligible: 88, status: 'Shortlisting' },
    { company: 'DataVertex Labs', role: 'Data Analyst & ML', batch: '2026', eligible: 64, status: 'Interview Round 1' },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to CarrerSync Overview
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              T&P Admin Command Center
            </h1>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950 border border-cyan-800 text-cyan-300">
              Preview Mode
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Automated campus recruitment orchestration, cohort readiness monitoring, and rule-based shortlisting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button to="/auth/register" variant="secondary" size="sm">
            Switch Persona
          </Button>
          <Button to="/" variant="primary" size="sm">
            Return to Landing
          </Button>
        </div>
      </div>

      {/* Cohort Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Batch Size (2026)</div>
          <div className="text-3xl font-black text-white">480 Students</div>
          <div className="text-xs text-slate-500 mt-1">CS, IT & Circuit Branches</div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Verified Placement Ready</div>
          <div className="text-3xl font-black text-emerald-400">74.5%</div>
          <div className="text-xs text-slate-500 mt-1">358 students meeting criteria</div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">At-Risk Students</div>
          <div className="text-3xl font-black text-amber-400">42 Students</div>
          <div className="text-xs text-slate-500 mt-1">Remediation roadmaps assigned</div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Active Campus Drives</div>
          <div className="text-3xl font-black text-indigo-400">12 Drives</div>
          <div className="text-xs text-slate-500 mt-1">3 ongoing this week</div>
        </div>
      </div>

      {/* Drives Management Preview */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Active Recruitment Drives (Agent 4 Orchestration)
          </h2>
          <span className="text-xs font-mono text-emerald-400">Multi-Tenant Isolation Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Target Batch</th>
                <th className="py-3 px-4">Verified Shortlist</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {drives.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-4 px-4 font-bold text-white">{d.company}</td>
                  <td className="py-4 px-4">{d.role}</td>
                  <td className="py-4 px-4">{d.batch}</td>
                  <td className="py-4 px-4 text-emerald-400 font-semibold">{d.eligible} Candidates</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
