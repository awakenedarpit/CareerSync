import React from 'react';

/**
 * Reusable Select Dropdown Component
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
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 select-none">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300'
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
      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
      {helperText && !error && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
}
