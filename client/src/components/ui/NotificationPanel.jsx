import React, { useState } from 'react';
import { Bell, Check, X, Calendar, ShieldCheck, Target, AlertTriangle } from 'lucide-react';

/**
 * Reusable Notification Panel Component
 * CarrerSync Mint Design System compliant.
 */
export default function NotificationPanel({
  notifications: initialNotifications = [],
  onClose,
}) {
  const [notifications, setNotifications] = useState(
    initialNotifications.length > 0
      ? initialNotifications
      : [
          {
            id: '1',
            title: 'Technical Interview Scheduled',
            message: 'Your Round 1 interview with CloudScale Systems is confirmed for Friday, 10:30 AM.',
            time: '15m ago',
            type: 'interview',
            isRead: false,
          },
          {
            id: '2',
            title: 'Skill Verified by Faculty Coordinator',
            message: 'Your React proficiency has been elevated to "Verified" backed by 3 inspected repos.',
            time: '2h ago',
            type: 'verified',
            isRead: false,
          },
          {
            id: '3',
            title: 'New Placement Drive Announced',
            message: 'FinCore Systems has posted a Backend SDE requirement for 2026 batch.',
            time: '1d ago',
            type: 'drive',
            isRead: true,
          },
        ]
  );

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'interview':
        return <Calendar className="w-4 h-4 text-[#00473C]" />;
      case 'verified':
        return <ShieldCheck className="w-4 h-4 text-[#004D36]" />;
      case 'drive':
        return <Target className="w-4 h-4 text-[#009669]" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-[#7A4E00]" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#BACBC0]/50 overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#BDF9F9]/30 border-b border-[#BACBC0]/30">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#004D36]" />
          <span className="text-xs font-bold text-[#002020]">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#E6FAF4] text-[#004D36] border border-[#02E8A7]/40">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-[#009669] hover:underline"
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="text-[#6B7B71] hover:text-[#002020] p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-[#BACBC0]/20">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5E7266]">
            No active notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 flex items-start gap-3 hover:bg-[#E2FFFE]/30 transition-colors ${
                !n.isRead ? 'bg-[#BDF9F9]/15' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-[#BACBC0]/40 shadow-2xs shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-[#002020] truncate">{n.title}</h4>
                  <span className="text-[10px] text-[#5E7266] shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-[#3B4A42] mt-0.5 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => clearNotification(n.id)}
                className="text-[#BACBC0] hover:text-[#6B7B71] p-1 shrink-0"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 bg-[#BDF9F9]/20 border-t border-[#BACBC0]/30 text-center">
        <span className="text-[11px] font-medium text-[#5E7266]">
          Real-time institutional placement notifications
        </span>
      </div>
    </div>
  );
}
