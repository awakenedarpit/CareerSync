import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: {
    container: 'bg-[#E6FAF4] border-[#02E8A7]/50 text-[#004D36]',
    iconColor: 'text-[#004D36]',
    progress: 'bg-[#02E8A7]',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-950',
    iconColor: 'text-rose-600',
    progress: 'bg-rose-500',
  },
  warning: {
    container: 'bg-[#FFF8E7] border-[#FFC558]/60 text-[#7A4E00]',
    iconColor: 'text-[#7A4E00]',
    progress: 'bg-[#FFC558]',
  },
  info: {
    container: 'bg-[#E3FFFB] border-[#11F1CF]/60 text-[#00473C]',
    iconColor: 'text-[#00473C]',
    progress: 'bg-[#11F1CF]',
  },
};

/**
 * Toast Item Component
 * Fully accessible with role="status", aria-live="polite", and keyboard dismiss.
 */
export default function Toast({
  id,
  type = 'info',
  title,
  message,
  duration = 4500,
  onDismiss,
}) {
  const Icon = ICONS[type] || ICONS.info;
  const style = STYLES[type] || STYLES.info;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2 w-full max-w-md ${style.container}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} aria-hidden="true" />
      
      <div className="flex-1 min-w-0 pr-2">
        {title && <h4 className="text-xs font-bold leading-tight mb-0.5">{title}</h4>}
        <p className="text-xs leading-relaxed text-slate-700">{message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <X className="w-4 h-4" />
      </button>

      {duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl opacity-60 ${style.progress}`}
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}
