import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Design System Button
 * Supports primary, secondary, outline, ghost, danger, emerald, and navy styles.
 * Supports React Router Link routing or native button element.
 * WCAG 2.1 AA compliant with visible focus rings and aria attributes.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E2FFFE] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    xs: 'text-xs px-2.5 py-1 gap-1.5',
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#02E8A7] hover:bg-[#00D295] text-[#002020] font-semibold shadow-2xs hover:shadow-xs focus-visible:ring-[#02E8A7] active:bg-[#00B882]',
    secondary: 'bg-white hover:bg-[#BDF9F9] text-[#002020] border border-[#BACBC0] shadow-2xs focus-visible:ring-[#02E8A7] active:bg-[#B8F3F3]',
    aqua: 'bg-[#11F1CF] hover:bg-[#0EDBC0] text-[#002020] font-semibold shadow-2xs focus-visible:ring-[#11F1CF]',
    outline: 'bg-transparent hover:bg-[#BDF9F9]/60 text-[#002020] border border-[#6B7B71]/40 focus-visible:ring-[#02E8A7]',
    ghost: 'bg-transparent hover:bg-[#BDF9F9]/60 text-[#002020] hover:text-[#002020] focus-visible:ring-[#02E8A7]',
    amber: 'bg-[#FFC558] hover:bg-[#F8B638] text-[#002020] font-semibold shadow-2xs focus-visible:ring-[#FFC558]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs focus-visible:ring-rose-500',
    emerald: 'bg-[#02E8A7] hover:bg-[#00D295] text-[#002020] font-semibold shadow-2xs focus-visible:ring-[#02E8A7]',
    navy: 'bg-[#002020] hover:bg-[#0A2E2E] text-white shadow-2xs focus-visible:ring-[#02E8A7]',
  };

  const isDisabled = disabled || loading;
  const combinedClasses = `${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${isDisabled ? 'pointer-events-none' : ''} ${className}`;

  const content = (
    <>
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={combinedClasses}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={combinedClasses}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : undefined}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      onClick={onClick}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
}
