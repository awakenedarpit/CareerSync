import React from 'react';

/**
 * Reusable Select Dropdown Component
 * CarrerSync Mint Design System compliant.
 * WCAG 2.1 AA accessible with aria-invalid, aria-describedby, and visible focus indicators.
 */
export default function Select({
  label,
  id,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const generatedId = React.useId();
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : generatedId);
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const ariaDescribedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#002020] select-none">
          {label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={ariaDescribedBy}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#002020] shadow-2xs transition-all focus:outline-none focus:ring-2 focus-visible:ring-2 focus-visible:ring-[#02E8A7] disabled:bg-[#BDF9F9]/20 disabled:text-[#6B7B71] disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:ring-rose-400 focus-visible:ring-rose-400'
            : 'border-[#BACBC0] focus:border-[#02E8A7]'
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
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
