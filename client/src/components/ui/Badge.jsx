import React from 'react';

/**
 * Reusable Category / Count Badge
 * CarrerSync Mint Design System compliant.
 * Text contrast meets WCAG 2.1 AA/AAA.
 */
export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  ...props
}) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
    lg: 'text-xs px-3 py-1 font-semibold',
  };

  const variantStyles = {
    mint: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/50 font-semibold',
    aqua: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/60 font-semibold',
    amber: 'bg-[#FFF8E7] text-[#7A4E00] border-[#FFC558]/60 font-semibold',
    slate: 'bg-[#BDF9F9]/30 text-[#002020] border-[#BACBC0]/40 font-medium',
    indigo: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/50 font-semibold',
    purple: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/60 font-semibold',
    emerald: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/50 font-semibold',
    rose: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold',
    sky: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/60 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${
        sizeStyles[size] || sizeStyles.md
      } ${variantStyles[variant] || variantStyles.slate} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
