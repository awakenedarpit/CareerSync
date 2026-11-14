import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Reusable StatCard Component
 * Displays KPI metrics, trends, icons, and subtitles.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  accentColor = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'violet' | 'sky'
  className = '',
}) {
  const accentStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-purple-50 text-purple-600 border-purple-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className={`p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${accentStyles[accentColor] || accentStyles.indigo}`}>
            <Icon className="w-4 h-4 shrink-0" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-sm ${
              trendType === 'up'
                ? 'text-emerald-700 bg-emerald-50'
                : trendType === 'down'
                ? 'text-rose-700 bg-rose-50'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            {trendType === 'up' && <TrendingUp className="w-3 h-3 mr-0.5" />}
            {trendType === 'down' && <TrendingDown className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-auto">{subtitle}</p>}
    </div>
  );
}
