import React from 'react';

/**
 * Reusable Segmented Tabs Component
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
    <div className={`inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 ${className}`}>
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
            onClick={() => onChange(id)}
            className={`inline-flex items-center font-medium rounded-lg transition-all select-none ${sizeStyles[size] || sizeStyles.md} ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
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
