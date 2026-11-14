import React from 'react';
import Breadcrumb from './Breadcrumb';

/**
 * Reusable PageHeader Component
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  badge,
  className = '',
}) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} className="mb-2.5" />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
