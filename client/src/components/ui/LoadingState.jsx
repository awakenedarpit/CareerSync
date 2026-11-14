import React from 'react';

/**
 * Reusable Loading Skeleton / Spinner State
 */
export default function LoadingState({
  message = 'Loading data...',
  rows = 3,
  className = '',
}) {
  return (
    <div className={`p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
      <div className="w-full max-w-md space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-4 bg-slate-100 rounded-md animate-pulse"
            style={{ width: `${100 - idx * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}
