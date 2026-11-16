import React from 'react';
import { Cpu, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * Reusable Agent Overview Card Component
 * Showcases the 4 core AI agents with role, hybrid architecture, and capabilities.
 */
export default function AgentCard({
  agentNumber,
  name,
  role,
  description,
  capabilities = [],
  icon: Icon,
  fallbackEngine,
}) {
  return (
    <div className="relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 shadow-xl group">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#02E8A7]/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:bg-[#02E8A7]/20 group-hover:scale-105 transition-all">
              {Icon ? <Icon className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Agent 0{agentNumber}
              </span>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                {name}
              </h3>
            </div>
          </div>
        </div>

        {/* Purpose / Role Tag */}
        <div className="mb-4">
          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50">
            {role}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {description}
        </p>

        {/* Capabilities */}
        <div className="space-y-2.5 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Key Agent Capabilities:
          </div>
          {capabilities.map((cap, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span>{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture & Fallback Footer */}
      <div className="pt-4 border-t border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rule Fallback Ready</span>
          </div>
          <span className="text-slate-500 truncate max-w-[150px]" title={fallbackEngine}>
            {fallbackEngine}
          </span>
        </div>
      </div>
    </div>
  );
}
