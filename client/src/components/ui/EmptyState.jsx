import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 * CarrerSync Mint Design System compliant.
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
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#BACBC0]/60 bg-[#BDF9F9]/20 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-white border border-[#BACBC0]/40 shadow-2xs flex items-center justify-center text-[#6B7B71] mb-4">
        <Icon className="w-6 h-6 text-[#02E8A7]" />
      </div>
      <h3 className="text-base font-bold text-[#002020] mb-1">{title}</h3>
      <p className="text-xs text-[#3B4A42] max-w-sm mb-6 leading-relaxed">{description}</p>
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
