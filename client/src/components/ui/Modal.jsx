import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';

/**
 * Reusable Accessible Modal Dialog
 * CarrerSync Mint Design System compliant.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#002020]/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-2xl border border-[#BACBC0]/50 overflow-hidden z-10 transition-all animate-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-[#BACBC0]/30">
          <div>
            <h3 className="text-base font-bold text-[#002020]">{title}</h3>
            {subtitle && <p className="text-xs text-[#3B4A42] mt-0.5">{subtitle}</p>}
          </div>
          <IconButton icon={X} size="sm" onClick={onClose} title="Close dialog" />
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-sm text-[#002020]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-[#BDF9F9]/20 border-t border-[#BACBC0]/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
