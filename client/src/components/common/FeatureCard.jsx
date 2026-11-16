import React from 'react';

/**
 * Reusable Feature Card Component
 * Highlights core platform capabilities with icons, subtle borders, and hover elevation.
 */
export default function FeatureCard({
  icon: Icon,
  title,
  description,
  tag,
  accentColor = 'indigo',
  className = '',
}) {
  const accentGlow = {
    indigo: 'group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10 text-indigo-400 bg-[#BDF9F9]/300/10 border-indigo-500/20',
    cyan: 'group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/10 text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'group-hover:border-emerald-500/50 group-hover:shadow-emerald-500/10 text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'group-hover:border-amber-500/50 group-hover:shadow-amber-500/10 text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className={`group relative p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900/90 transition-all duration-300 shadow-xl hover:shadow-2xl flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-5">
          {Icon && (
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors duration-300 ${accentGlow[accentColor] || accentGlow.indigo}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          {tag && (
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2.5 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
