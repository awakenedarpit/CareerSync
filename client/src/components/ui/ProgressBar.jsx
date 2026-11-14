import React from 'react';

/**
 * Reusable ProgressBar Component
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  color = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'violet'
  className = '',
}) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const sizeStyles = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorStyles = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    violet: 'bg-purple-600',
    sky: 'bg-sky-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-700">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeStyles[size] || sizeStyles.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorStyles[color] || colorStyles.indigo}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
