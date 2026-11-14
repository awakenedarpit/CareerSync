import React from 'react';

/**
 * Reusable Category / Count Badge
 */
export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
}) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-xs px-3 py-1 font-semibold',
  };

  const variantStyles = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.slate} ${className}`}
    >
      {children}
    </span>
  );
}
