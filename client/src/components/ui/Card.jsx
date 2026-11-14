import React from 'react';

/**
 * Reusable Card Surface Component
 */
export default function Card({
  children,
  title,
  subtitle,
  actions,
  className = '',
  bodyClassName = 'p-5 sm:p-6',
  headerClassName = 'px-5 py-4 border-b border-slate-100',
  footer,
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}
