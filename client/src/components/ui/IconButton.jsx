import React from 'react';

/**
 * Reusable Icon Button
 * Compact button for actions like close, search, notifications, more options.
 */
export default function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  title,
  disabled = false,
  onClick,
  ...props
}) {
  const sizeStyles = {
    sm: 'p-1.5 w-7 h-7 text-xs',
    md: 'p-2 w-9 h-9 text-sm',
    lg: 'p-2.5 w-11 h-11 text-base',
  };

  const variantStyles = {
    ghost: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100',
    outline: 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'text-rose-600 hover:bg-rose-50',
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.ghost} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {title && <span className="sr-only">{title}</span>}
    </button>
  );
}
