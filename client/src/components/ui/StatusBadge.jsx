import React from 'react';
import { ShieldCheck, Eye, Link2, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Reusable StatusBadge Component
 * Strictly adheres to CarrerSync Brand Guidelines:
 * - Verified: Green (Emerald)
 * - Claimed: Grey (Slate)
 * - Observed: Blue (Sky)
 * - Evidence-linked: Indigo
 * - Expired: Orange (Amber/Orange)
 * - Warning: Amber
 * - Error: Red (Rose)
 */
export default function StatusBadge({
  status = 'Claimed',
  showIcon = true,
  size = 'md',
  className = '',
}) {
  const normStatus = String(status).toLowerCase().trim();

  // Status mapping
  const statusConfig = {
    // 5 Canonical Skill States
    verified: {
      label: 'Verified',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      icon: ShieldCheck,
    },
    claimed: {
      label: 'Claimed',
      styles: 'bg-slate-100 text-slate-700 border-slate-200',
      dotColor: 'bg-slate-400',
      icon: Clock,
    },
    observed: {
      label: 'Observed',
      styles: 'bg-sky-50 text-sky-700 border-sky-200',
      dotColor: 'bg-sky-500',
      icon: Eye,
    },
    'evidence-linked': {
      label: 'Evidence-linked',
      styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotColor: 'bg-indigo-500',
      icon: Link2,
    },
    expired: {
      label: 'Expired',
      styles: 'bg-orange-50 text-orange-700 border-orange-200',
      dotColor: 'bg-orange-500',
      icon: AlertTriangle,
    },

    // Drive / Application Statuses
    eligible: {
      label: 'Eligible',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    shortlisted: {
      label: 'Shortlisted',
      styles: 'bg-purple-50 text-purple-700 border-purple-200',
      dotColor: 'bg-purple-500',
      icon: CheckCircle2,
    },
    ongoing: {
      label: 'Ongoing',
      styles: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dotColor: 'bg-indigo-500 animate-pulse',
      icon: Clock,
    },
    active: {
      label: 'Active',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotColor: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    warning: {
      label: 'Warning',
      styles: 'bg-amber-50 text-amber-700 border-amber-200',
      dotColor: 'bg-amber-500',
      icon: AlertTriangle,
    },
    error: {
      label: 'Rejected / Error',
      styles: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      icon: AlertCircle,
    },
    rejected: {
      label: 'Rejected',
      styles: 'bg-rose-50 text-rose-700 border-rose-200',
      dotColor: 'bg-rose-500',
      icon: AlertCircle,
    },
  };

  const current = statusConfig[normStatus] || {
    label: status,
    styles: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    icon: null,
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2 font-semibold',
  };

  const IconComponent = current.icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${sizeStyles[size] || sizeStyles.md} ${current.styles} ${className}`}
    >
      {showIcon && IconComponent && <IconComponent className="w-3 h-3 shrink-0" />}
      {!showIcon && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotColor}`} />}
      <span>{current.label}</span>
    </span>
  );
}
