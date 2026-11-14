import React from 'react';

/**
 * Reusable Section Heading Component
 * Includes optional category pill, title with gradient highlight, and subtitle.
 */
export default function SectionHeading({
  badge,
  title,
  highlight,
  subtitle,
  align = 'center',
  className = '',
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start';

  return (
    <div className={`flex flex-col max-w-3xl ${alignClass} ${className} mb-12 sm:mb-16`}>
      {badge && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/70 border border-indigo-800/50 mb-3 shadow-sm">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
        {title}{' '}
        {highlight && (
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            {highlight}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
