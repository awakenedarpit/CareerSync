import React from 'react';

/**
 * Reusable ProgressBar Component
 * CarrerSync Mint Design System compliant.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  color = 'mint', // 'mint' | 'aqua' | 'amber' | 'gradient'
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
    mint: 'bg-[#02E8A7]',
    aqua: 'bg-[#11F1CF]',
    amber: 'bg-[#FFC558]',
    gradient: 'bg-gradient-to-r from-[#02E8A7] to-[#11F1CF]',
    // Backward compatibility mappings
    indigo: 'bg-gradient-to-r from-[#02E8A7] to-[#11F1CF]',
    emerald: 'bg-[#02E8A7]',
    violet: 'bg-[#11F1CF]',
    sky: 'bg-[#11F1CF]',
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-[#002020]">
          <span>{label}</span>
          <span className="font-bold">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-[#C3FFFE]/60 rounded-full overflow-hidden ${sizeStyles[size] || sizeStyles.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorStyles[color] || colorStyles.mint}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
