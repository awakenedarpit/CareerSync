import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Reusable Breadcrumb Trail Component
 * CarrerSync Mint Design System compliant.
 */
export default function Breadcrumb({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-1.5 text-xs text-[#5E7266] select-none ${className}`} aria-label="Breadcrumb">
      <Link to="/" className="text-[#5E7266] hover:text-[#002020] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#02E8A7] rounded">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-[#BACBC0] shrink-0" />
            {isLast || !item.to ? (
              <span className="font-semibold text-[#002020] truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="text-[#5E7266] hover:text-[#002020] transition-colors truncate max-w-[150px] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#02E8A7] rounded">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
