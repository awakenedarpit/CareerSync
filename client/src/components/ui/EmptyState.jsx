import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items to display in this view.',
  actionLabel,
  onAction,
  actionTo,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          to={actionTo}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
