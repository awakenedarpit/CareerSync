import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white pt-16 pb-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">CarrerSync</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              The Agentic Placement Intelligence Platform. Connecting student evidence, verified skills, and personalized learning paths with institutional placement workflows.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Strict ₹0-Budget • Zero-Cost Architecture</span>
            </div>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Live Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/student" className="hover:text-indigo-600 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-600 transition-colors">
                  T&P Admin Center
                </Link>
              </li>
              <li>
                <Link to="/recruiter" className="hover:text-indigo-600 transition-colors">
                  Recruiter Portal
                </Link>
              </li>
              <li>
                <Link to="/student/knowledge-graph" className="hover:text-indigo-600 transition-colors">
                  Knowledge Graph
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Intelligence
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#agents" className="hover:text-indigo-600 transition-colors">4 Multi-Agent Core</a></li>
              <li><a href="#solution" className="hover:text-indigo-600 transition-colors">5 Skill Lifecycle States</a></li>
              <li><a href="#trust" className="hover:text-indigo-600 transition-colors">Explainable AI Policy</a></li>
              <li><a href="#trust" className="hover:text-indigo-600 transition-colors">Student Data Privacy</a></li>
            </ul>
          </div>

          {/* Governance */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-4">
              Governance
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><span className="text-slate-500">Human Approval Gate</span></li>
              <li><span className="text-slate-500">Tenant RLS Isolation</span></li>
              <li><span className="text-slate-500">No Behavioral Surveillance</span></li>
              <li><span className="text-slate-500">Open Source Stack</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} CarrerSync. Built with Antigravity.</p>
          <p className="flex items-center gap-1">
            Engineered with evidence-based intelligence for modern higher education.
          </p>
        </div>
      </div>
    </footer>
  );
}
