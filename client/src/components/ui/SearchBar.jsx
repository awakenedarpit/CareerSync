import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable SearchBar Component
 */
export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className = '',
  size = 'md',
}) {
  const sizeStyles = {
    sm: 'text-xs pl-8 pr-7 py-1.5',
    md: 'text-sm pl-9 pr-8 py-2',
  };

  return (
    <div className={`relative flex items-center w-full max-w-md ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-lg border border-slate-300 bg-white text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${sizeStyles[size] || sizeStyles.md}`}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
