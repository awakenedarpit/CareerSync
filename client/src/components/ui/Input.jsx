import React from 'react';

/**
 * Reusable Form Input Component
 * CarrerSync Mint Design System compliant.
 * WCAG 2.1 AA accessible with aria-invalid, aria-describedby, and visible focus indicators.
 */
export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const generatedId = React.useId();
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId);
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const ariaDescribedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-[#002020] select-none">
          {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#6B7B71] pointer-events-none" aria-hidden="true">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={ariaDescribedBy}
          className={`w-full rounded-lg border bg-white text-sm text-[#002020] placeholder-[#6B7B71]/60 shadow-2xs transition-all focus:outline-none focus:ring-2 focus-visible:ring-2 focus-visible:ring-[#02E8A7] disabled:bg-[#BDF9F9]/20 disabled:text-[#6B7B71] disabled:cursor-not-allowed ${
            Icon ? 'pl-9 pr-3.5 py-2' : 'px-3.5 py-2'
          } ${
            error
              ? 'border-rose-400 focus:ring-rose-400 focus-visible:ring-rose-400'
              : 'border-[#BACBC0] focus:border-[#02E8A7]'
          }`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="text-xs text-rose-600 font-medium" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-xs text-[#5E7266]">
          {helperText}
        </p>
      )}
    </div>
  );
}
