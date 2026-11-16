import React from 'react';
import Breadcrumb from './Breadcrumb';

/**
 * Reusable PageHeader Component
 * CarrerSync Mint Design System compliant.
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#002020] tracking-tight">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-[#3B4A42] max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
