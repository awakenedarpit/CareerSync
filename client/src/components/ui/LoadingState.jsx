import React from 'react';

/**
 * Reusable Loading Skeleton / Spinner State
 * CarrerSync Mint Design System compliant.
 * WCAG 2.1 AA compliant with role="status", aria-live="polite", and aria-busy="true".
 */
export default function LoadingState({
  message = 'Loading data...',
  rows = 3,
  className = '',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`p-8 rounded-2xl bg-white border border-[#BACBC0]/40 shadow-xs flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="w-10 h-10 border-2 border-[#C3FFFE] border-t-[#02E8A7] rounded-full animate-spin"
          aria-hidden="true"
        />
        <img
          src="/brand/carrersync-icon.svg"
          alt=""
          className="absolute w-5 h-5 object-contain"
          aria-hidden="true"
        />
      </div>
      <span className="text-xs font-semibold text-[#002020]">{message}</span>
      <div className="w-full max-w-md space-y-2.5 pt-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-4 bg-[#BDF9F9]/50 rounded-md animate-pulse"
            style={{ width: `${100 - idx * 15}%` }}
          />
        ))}
      </div>
      <span className="sr-only">Please wait, data is loading...</span>
    </div>
  );
}
