import React, { useState, useRef, useEffect } from 'react';

/**
 * Reusable Dropdown Menu Component
 */
export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignStyles = {
    right: 'right-0',
    left: 'left-0',
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute ${alignStyles[align] || alignStyles.right} mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 z-50 py-1 text-sm focus:outline-none animate-in fade-in zoom-in-95 duration-100`}
        >
          {typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
