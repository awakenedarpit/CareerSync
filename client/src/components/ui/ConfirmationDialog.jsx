import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

/**
 * Reusable ConfirmationDialog Component
 * Confirms consequential actions with clear visual signals.
 */
export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
}) {
  const iconConfig = {
    danger: { icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    warning: { icon: AlertTriangle, color: 'text-amber-800 bg-[#FFF8E7] border-[#FFC558]/50' },
    primary: { icon: HelpCircle, color: 'text-[#004D36] bg-[#E6FAF4] border-[#02E8A7]/50' },
  };

  const currentIcon = iconConfig[variant] || iconConfig.primary;
  const Icon = currentIcon.icon;

  const footer = (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={onClose}
        disabled={loading}
      >
        {cancelLabel}
      </Button>
      <Button
        variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'amber' : 'primary'}
        size="sm"
        onClick={onConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      maxWidth="max-w-md"
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-xl border shrink-0 ${currentIcon.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm text-[#3B4A42] leading-relaxed pt-1">
          {message}
        </p>
      </div>
    </Modal>
  );
}
