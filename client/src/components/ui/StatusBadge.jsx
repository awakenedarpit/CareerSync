import React from 'react';
import { ShieldCheck, Eye, Link2, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Reusable StatusBadge Component
 * CarrerSync Mint Design System:
 * - Verified: Mint Green (#02E8A7)
 * - Observed: Aqua (#11F1CF)
 * - Evidence-linked: Aqua/Mint Tonal
 * - Claimed: Neutral (#BACBC0 / #6B7B71)
 * - Expired / Warning: Amber (#FFC558)
 * - Error / Rejected: Rose
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
      styles: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/50 font-semibold',
      dotColor: 'bg-[#02E8A7]',
      icon: ShieldCheck,
    },
    claimed: {
      label: 'Claimed',
      styles: 'bg-[#BDF9F9]/30 text-[#3B4A42] border-[#BACBC0]/50 font-medium',
      dotColor: 'bg-[#6B7B71]',
      icon: Clock,
    },
    observed: {
      label: 'Observed',
      styles: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/60 font-semibold',
      dotColor: 'bg-[#11F1CF]',
      icon: Eye,
    },
    'evidence-linked': {
      label: 'Evidence-linked',
      styles: 'bg-[#BDF9F9]/50 text-[#002020] border-[#02E8A7]/40 font-semibold',
      dotColor: 'bg-[#02E8A7]',
      icon: Link2,
    },
    expired: {
      label: 'Expired',
      styles: 'bg-[#FFF8E7] text-[#7A4E00] border-[#FFC558]/60 font-semibold',
      dotColor: 'bg-[#FFC558]',
      icon: AlertTriangle,
    },

    // Drive / Application Statuses
    eligible: {
      label: 'Eligible',
      styles: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/50 font-semibold',
      dotColor: 'bg-[#02E8A7]',
      icon: CheckCircle2,
    },
    shortlisted: {
      label: 'Shortlisted',
      styles: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/60 font-semibold',
      dotColor: 'bg-[#11F1CF]',
      icon: CheckCircle2,
    },
    ongoing: {
      label: 'Ongoing',
      styles: 'bg-[#E3FFFB] text-[#00473C] border-[#11F1CF]/60 font-medium',
      dotColor: 'bg-[#11F1CF] animate-pulse',
      icon: Clock,
    },
    active: {
      label: 'Active',
      styles: 'bg-[#E6FAF4] text-[#004D36] border-[#02E8A7]/50 font-semibold',
      dotColor: 'bg-[#02E8A7]',
      icon: CheckCircle2,
    },
    warning: {
      label: 'Warning',
      styles: 'bg-[#FFF8E7] text-[#7A4E00] border-[#FFC558]/60 font-semibold',
      dotColor: 'bg-[#FFC558]',
      icon: AlertTriangle,
    },
    error: {
      label: 'Rejected / Error',
      styles: 'bg-rose-50 text-rose-800 border-rose-200 font-medium',
      dotColor: 'bg-rose-500',
      icon: AlertCircle,
    },
    rejected: {
      label: 'Rejected',
      styles: 'bg-rose-50 text-rose-800 border-rose-200 font-medium',
      dotColor: 'bg-rose-500',
      icon: AlertCircle,
    },
  };

  const current = statusConfig[normStatus] || {
    label: status,
    styles: 'bg-[#BDF9F9]/30 text-[#002020] border-[#BACBC0]/40 font-medium',
    dotColor: 'bg-[#6B7B71]',
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
      className={`inline-flex items-center rounded-full border shadow-2xs ${
        sizeStyles[size] || sizeStyles.md
      } ${current.styles} ${className}`}
    >
      {showIcon && IconComponent && <IconComponent className="w-3 h-3 shrink-0" />}
      {!showIcon && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dotColor}`} />}
      <span>{current.label}</span>
    </span>
  );
}
