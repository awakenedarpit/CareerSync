import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <BrandLogo variant="card" size="md" withLink={true} to="/" className="mb-4 max-w-[200px]" />
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              Transforming traditional campus placement into an evidence-based placement intelligence ecosystem. Connecting verified skills, real industry demand, and multi-agent hiring orchestration.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict ₹0 Zero-Cost Architecture</span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#problem" className="hover:text-white transition-colors">Placement Problem</a>
              </li>
              <li>
                <a href="#solution" className="hover:text-white transition-colors">Our Solution</a>
              </li>
              <li>
                <a href="#agents" className="hover:text-white transition-colors">4 AI Agents</a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#audiences" className="hover:text-white transition-colors">Audiences</a>
              </li>
            </ul>
          </div>

          {/* Core Agents */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Intelligence
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Student Profiling Agent</li>
              <li>Industry Skill-Gap Agent</li>
              <li>Predictive Placement Agent</li>
              <li>Orchestration Agent</li>
              <li>FalkorDB Graph Memory</li>
            </ul>
          </div>

          {/* Architecture & Portals */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              Portals (Preview)
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/student" className="hover:text-indigo-400 transition-colors">Student Portal</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-indigo-400 transition-colors">T&P Admin Portal</Link>
              </li>
              <li>
                <Link to="/recruiter" className="hover:text-indigo-400 transition-colors">Recruiter Portal</Link>
              </li>
              <li>
                <Link to="/auth/login" className="hover:text-indigo-400 transition-colors">Account Sign In</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CarrerSync. Built with MERN Stack + Agentic AI Architecture.</p>
          <div className="flex items-center gap-6">
            <span>Tenant Data Isolated</span>
            <span>Zero-Cost Guaranteed</span>
            <span>Read-Only GitHub Audits</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
