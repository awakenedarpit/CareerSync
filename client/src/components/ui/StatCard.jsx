import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Reusable StatCard Component
 * Displays KPI metrics, trends, icons, and subtitles in the Mint Design System.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  accentColor = 'mint', // 'mint' | 'aqua' | 'amber' | 'teal'
  className = '',
}) {
  const accentStyles = {
    mint: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/40',
    aqua: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/50',
    amber: 'bg-[#FFF8E7] text-[#7A4E00] border-[#FFC558]/50',
    teal: 'bg-[#BDF9F9]/40 text-[#002020] border-[#BACBC0]/50',
    // Backwards compatibility mappings
    indigo: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/40',
    emerald: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/40',
    violet: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/50',
    sky: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/50',
    slate: 'bg-[#BDF9F9]/30 text-[#002020] border-[#BACBC0]/40',
  };

  return (
    <div
      className={`p-5 rounded-xl bg-white border border-[#BACBC0]/40 shadow-xs flex flex-col justify-between transition-all duration-200 hover:shadow-sm hover:border-[#02E8A7]/40 ${className}`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#3B4A42]">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${accentStyles[accentColor] || accentStyles.mint}`}>
            <Icon className="w-4 h-4 shrink-0" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl sm:text-3xl font-black text-[#002020] tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trendType === 'up'
                ? 'text-[#004D36] bg-[#E6FAF4] border border-[#02E8A7]/30'
                : trendType === 'down'
                ? 'text-rose-800 bg-rose-50 border border-rose-200'
                : 'text-[#3B4A42] bg-[#BDF9F9]/40'
            }`}
          >
            {trendType === 'up' && <TrendingUp className="w-3 h-3 mr-0.5" />}
            {trendType === 'down' && <TrendingDown className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-[#5E7266]">{subtitle}</p>}
    </div>
  );
}
