import React from 'react';

/**
 * Reusable Segmented Tabs Component
 * CarrerSync Mint Design System compliant.
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) {
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
  };

  return (
    <div
      className={`inline-flex p-1 bg-[#BDF9F9]/40 rounded-xl border border-[#BACBC0]/50 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const id = typeof tab === 'object' ? tab.id : tab;
        const label = typeof tab === 'object' ? tab.label : tab;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const Icon = typeof tab === 'object' ? tab.icon : null;
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`inline-flex items-center font-medium rounded-lg transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7] cursor-pointer ${
              sizeStyles[size] || sizeStyles.md
            } ${
              isActive
                ? 'bg-white text-[#002020] font-bold shadow-xs border border-[#02E8A7]/40'
                : 'text-[#3B4A42] hover:text-[#002020] hover:bg-[#BDF9F9]/50'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-[#E6FAF4] text-[#004D36] border border-[#02E8A7]/40'
                    : 'bg-[#C3FFFE]/50 text-[#3B4A42]'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
