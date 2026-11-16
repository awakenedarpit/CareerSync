import React from 'react';

/**
 * Reusable Avatar Component
 * CarrerSync Mint Design System compliant.
 */
export default function Avatar({
  name = 'User',
  src,
  size = 'md',
  status = 'online', // 'online' | 'offline' | 'busy' | 'none'
  className = '',
}) {
  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm font-bold',
    xl: 'w-14 h-14 text-base font-bold',
  };

  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const statusColors = {
    online: 'bg-[#02E8A7]',
    busy: 'bg-rose-500',
    offline: 'bg-[#6B7B71]',
  };

  const getInitials = (n) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover border border-[#BACBC0]/50 ${sizeStyles[size] || sizeStyles.md}`}
        />
      ) : (
        <div
          className={`rounded-full bg-[#BDF9F9] text-[#004D36] font-bold flex items-center justify-center border border-[#02E8A7]/40 select-none ${
            sizeStyles[size] || sizeStyles.md
          }`}
        >
          {getInitials(name)}
        </div>
      )}

      {status !== 'none' && statusColors[status] && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white ${statusColors[status]} ${
            statusSize[size] || statusSize.md
          }`}
        />
      )}
    </div>
  );
}
