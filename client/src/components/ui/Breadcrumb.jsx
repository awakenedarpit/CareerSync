import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Reusable Breadcrumb Trail Component
 */
export default function Breadcrumb({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-1.5 text-xs text-slate-400 select-none ${className}`} aria-label="Breadcrumb">
      <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
            {isLast || !item.to ? (
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link to={item.to} className="hover:text-slate-600 transition-colors truncate max-w-[150px]">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
