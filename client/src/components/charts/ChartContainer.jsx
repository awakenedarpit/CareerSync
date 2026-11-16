import React from 'react';
import Card from '../ui/Card';

/**
 * Reusable Chart Container Component
 * Formats data visualizations with consistent margins, legends, and KPI badges.
 */
export default function ChartContainer({
  title,
  subtitle,
  children,
  legends = [],
  kpi,
  actions,
  className = '',
  height = 'h-64 sm:h-72',
}) {
  return (
    <Card
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={`cs-card ${className}`}
      bodyClassName="p-5 sm:p-6"
    >
      {(legends.length > 0 || kpi) && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-[#BACBC0]/30 text-xs">
          {kpi && (
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-[#002020] tracking-tight">{kpi.value}</span>
              {kpi.label && <span className="text-[#3B4A42] font-medium">{kpi.label}</span>}
            </div>
          )}
          {legends.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {legends.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs text-[#3B4A42]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className={`w-full relative flex items-center justify-center ${height}`}>
        {children}
      </div>
    </Card>
  );
}
