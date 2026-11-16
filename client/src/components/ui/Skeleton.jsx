import React from 'react';

/**
 * Reusable Accessible Skeleton Component
 * Provides smooth pulse placeholder animations for text, shapes, and complex cards.
 */
export default function Skeleton({
  variant = 'text',
  className = '',
  width,
  height,
  count = 1,
  ...props
}) {
  const baseClasses = 'bg-[#BDF9F9]/50 animate-pulse rounded-md';

  const variantClasses = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    badge: 'h-5 w-16 rounded-full',
    button: 'h-9 w-24 rounded-lg',
    card: 'h-32 w-full rounded-2xl bg-white border border-[#BACBC0]/40',
    statCard: 'h-24 w-full rounded-2xl border border-[#BACBC0]/40 bg-white p-5',
    tableRow: 'h-10 w-full rounded-lg',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (count > 1) {
    return (
      <div className="space-y-2.5 w-full" role="status" aria-label="Loading..." aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
            style={{
              ...style,
              width: width || (variant === 'text' ? `${100 - (i % 3) * 15}%` : undefined),
            }}
            {...props}
          />
        ))}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading..."
      aria-busy="true"
      className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
      style={style}
      {...props}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * Full Page or Section Skeleton for Suspense fallback
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-2 animate-in fade-in duration-150" role="status" aria-busy="true" aria-label="Loading page">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <Skeleton variant="badge" width="90px" />
          <Skeleton variant="title" width="260px" height="28px" />
          <Skeleton variant="text" width="380px" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="button" width="100px" />
          <Skeleton variant="button" width="120px" />
        </div>
      </div>

      {/* KPI Stat Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton variant="statCard" height="100px" />
        <Skeleton variant="statCard" height="100px" />
        <Skeleton variant="statCard" height="100px" />
        <Skeleton variant="statCard" height="100px" />
      </div>

      {/* Main Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 p-6 bg-white rounded-2xl border border-slate-200/80">
          <Skeleton variant="title" width="200px" />
          <Skeleton variant="text" count={4} />
          <div className="pt-4">
            <Skeleton variant="card" height="160px" />
          </div>
        </div>
        <div className="space-y-4 p-6 bg-white rounded-2xl border border-slate-200/80">
          <Skeleton variant="title" width="160px" />
          <Skeleton variant="text" count={5} />
        </div>
      </div>
    </div>
  );
}
