import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Code2 } from 'lucide-react';
import Button from '../../components/common/Button';

export default function RecruiterPreview() {
  const verifiedCandidates = [
    { name: 'Aditya S.', roll: 'CS-2022-041', primaryStack: 'React, Node.js, MongoDB', matchScore: '96%', codeInspectable: true },
    { name: 'Priya M.', roll: 'IT-2022-112', primaryStack: 'Python, FastAPI, PostgreSQL', matchScore: '92%', codeInspectable: true },
    { name: 'Rahul K.', roll: 'CS-2022-088', primaryStack: 'Java, Spring Boot, Docker', matchScore: '89%', codeInspectable: true },
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
              Recruiter Talent Portal
            </h1>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
              Preview Mode
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Access pre-verified candidates with inspectable code evidence and zero resume exaggeration.
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

      {/* Recruiter Value Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Pre-Verified Candidates</div>
          <div className="text-3xl font-black text-emerald-400">100% Verified</div>
          <div className="text-xs text-slate-500 mt-1">No unverified skills allowed in shortlists</div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Assessment Pass Rate</div>
          <div className="text-3xl font-black text-indigo-400">3.4x Higher</div>
          <div className="text-xs text-slate-500 mt-1">Compared to unverified resume pools</div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1">Hiring Cycle Reduction</div>
          <div className="text-3xl font-black text-cyan-400">45% Faster</div>
          <div className="text-xs text-slate-500 mt-1">Automated eligibility and multi-stage triage</div>
        </div>
      </div>

      {/* Verified Candidates Shortlist Preview */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Candidate Pipeline for "Full-Stack SDE Drive"
          </h2>
          <span className="text-xs text-slate-400">Filtering: Verified Commits ≥ 25</span>
        </div>

        <div className="space-y-4">
          {verifiedCandidates.map((c, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-base">{c.name}</span>
                  <span className="text-xs font-mono text-slate-400">{c.roll}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Match: {c.matchScore}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Primary Tech Stack: <span className="text-slate-300 font-medium">{c.primaryStack}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400 font-medium bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-900">
                  <Code2 className="w-3.5 h-3.5" />
                  Code Evidence Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
