import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CarrerSync Official Brand Logo Component
 * 
 * Supports:
 * - variant="full": The complete official logo (emblem, wordmark, tagline).
 * - variant="horizontal": Emblem paired with horizontal typography for navbars/sidebars.
 * - variant="icon": Standalone emblem for compact avatars, favicons, collapsed drawers.
 * - variant="card": Logo with rounded white card for high contrast on dark surfaces.
 * 
 * Options:
 * - theme: 'light' (default) | 'dark'
 * - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * - withLink: boolean (wraps in accessible React Router Link)
 * - to: target route (defaults to '/')
 */
export default function BrandLogo({
  variant = 'horizontal',
  size = 'md',
  theme = 'light',
  className = '',
  withLink = false,
  to = '/',
  ariaLabel = 'CarrerSync — Learn • Verify • Get Hired',
}) {
  // Predefined sizing scale based on size prop
  const sizeMap = {
    xs: {
      full: 'h-6 w-auto',
      horizontal: 'h-6',
      icon: 'h-6 w-6',
      text: 'text-sm',
      tagline: 'text-[8px]',
    },
    sm: {
      full: 'h-8 w-auto',
      horizontal: 'h-8',
      icon: 'h-8 w-8',
      text: 'text-base',
      tagline: 'text-[9px]',
    },
    md: {
      full: 'h-10 w-auto',
      horizontal: 'h-9',
      icon: 'h-9 w-9',
      text: 'text-lg',
      tagline: 'text-[10px]',
    },
    lg: {
      full: 'h-14 w-auto',
      horizontal: 'h-12',
      icon: 'h-12 w-12',
      text: 'text-2xl',
      tagline: 'text-xs',
    },
    xl: {
      full: 'h-20 w-auto',
      horizontal: 'h-16',
      icon: 'h-16 w-16',
      text: 'text-3xl',
      tagline: 'text-sm',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isDark = theme === 'dark';

  let logoContent = null;

  if (variant === 'full' || variant === 'card') {
    // If on a dark surface and variant is 'full', automatically use card variant for contrast
    const src = (variant === 'card' || isDark)
      ? '/brand/carrersync-logo-card.svg' 
      : '/brand/carrersync-brand-logo.svg';

    logoContent = (
      <img
        src={src}
        alt={ariaLabel}
        className={`object-contain max-w-full ${currentSize.full} ${className}`}
        loading="eager"
        width="1024"
        height="576"
      />
    );
  } else if (variant === 'icon') {
    logoContent = (
      <img
        src="/brand/carrersync-icon.svg"
        alt="CarrerSync Emblem"
        className={`object-contain shrink-0 ${currentSize.icon} ${className}`}
        loading="eager"
      />
    );
  } else {
    // variant="horizontal" (Emblem + Wordmark for Sidebar, Navbar, Topbar)
    logoContent = (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <img
          src="/brand/carrersync-icon.svg"
          alt="CarrerSync Emblem"
          className={`object-contain shrink-0 rounded-lg shadow-2xs ${currentSize.icon}`}
          loading="eager"
        />
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${
                isDark ? 'text-white' : 'text-[#002020]'
              } ${currentSize.text}`}
            >
              Carrer<span className={isDark ? 'text-[#11F1CF]' : 'text-[#009669]'}>Sync</span>
            </span>
          </div>
          <span
            className={`font-semibold tracking-wider uppercase mt-0.5 ${
              isDark ? 'text-slate-300' : 'text-[#3B4A42]'
            } ${currentSize.tagline}`}
          >
            Learn • Verify • Get Hired
          </span>
        </div>
      </div>
    );
  }

  if (withLink) {
    return (
      <Link
        to={to}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7] rounded-lg transition-transform hover:opacity-95"
        aria-label={ariaLabel}
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
