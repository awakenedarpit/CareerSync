import React from 'react';

/**
 * Reusable Avatar Component
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
    online: 'bg-emerald-500',
    busy: 'bg-rose-500',
    offline: 'bg-slate-400',
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
          className={`rounded-full object-cover border border-slate-200 ${sizeStyles[size] || sizeStyles.md}`}
        />
      ) : (
        <div
          className={`rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center border border-indigo-200 select-none ${
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
