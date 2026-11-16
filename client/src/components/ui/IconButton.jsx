import React from 'react';

/**
 * Reusable Icon Button
 * CarrerSync Mint Design System compliant.
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
    ghost: 'text-[#3B4A42] hover:text-[#002020] hover:bg-[#BDF9F9]/50',
    outline: 'border border-[#BACBC0]/50 text-[#002020] hover:bg-[#BDF9F9]/40',
    primary: 'bg-[#02E8A7] text-[#002020] hover:bg-[#00D295] shadow-2xs',
    secondary: 'bg-white text-[#002020] border border-[#BACBC0] hover:bg-[#BDF9F9]/30',
    danger: 'text-rose-600 hover:bg-rose-50',
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E2FFFE] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.ghost} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {title && <span className="sr-only">{title}</span>}
    </button>
  );
}
