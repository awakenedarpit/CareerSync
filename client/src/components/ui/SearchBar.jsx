import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable SearchBar Component
 * CarrerSync Mint Design System compliant.
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
      <Search className="absolute left-3 w-4 h-4 text-[#6B7B71] pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-lg border border-[#BACBC0] bg-white text-[#002020] placeholder-[#6B7B71]/60 shadow-2xs transition-all focus:border-[#02E8A7] focus:outline-none focus:ring-2 focus:ring-[#02E8A7]/30 ${
          sizeStyles[size] || sizeStyles.md
        }`}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-0.5 text-[#6B7B71] hover:text-[#002020] rounded-full focus:outline-none focus:ring-1 focus:ring-[#02E8A7]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
