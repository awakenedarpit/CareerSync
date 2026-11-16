import React from 'react';

/**
 * Reusable Card Surface Component
 * CarrerSync Mint Design System compliant.
 * Variants:
 * - 'surface' (default white elevated surface)
 * - 'container' (subtle #BDF9F9 container)
 * - 'low' (subtle #C3FFFE tonal container)
 */
export default function Card({
  children,
  title,
  subtitle,
  actions,
  variant = 'surface',
  hover = false,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
  headerClassName = 'px-5 py-4 border-b border-[#BACBC0]/30',
  footer,
}) {
  const variantStyles = {
    surface: 'bg-white border-[#BACBC0]/40',
    container: 'bg-[#BDF9F9]/40 border-[#BACBC0]/50',
    low: 'bg-[#C3FFFE]/30 border-[#BACBC0]/40',
  };

  const hoverStyle = hover
    ? 'transition-all duration-200 hover:shadow-md hover:border-[#02E8A7]/50'
    : '';

  return (
    <div
      className={`rounded-xl border shadow-xs overflow-hidden ${
        variantStyles[variant] || variantStyles.surface
      } ${hoverStyle} ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#002020] tracking-tight leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#3B4A42] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-[#BDF9F9]/25 border-t border-[#BACBC0]/30 text-xs text-[#3B4A42]">
          {footer}
        </div>
      )}
    </div>
  );
}
