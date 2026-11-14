import React, { useState } from 'react';
import { Bell, Check, X, Calendar, ShieldCheck, Target, AlertTriangle } from 'lucide-react';

/**
 * Reusable Notification Panel Component
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
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'verified':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'drive':
        return <Target className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
            >
              Mark all read
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/70 transition-colors ${
                !n.isRead ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                  {n.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => clearNotification(n.id)}
                className="text-slate-300 hover:text-slate-500 p-0.5"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <span className="text-[11px] text-slate-400">
          Placement Intelligence Notification Feed
        </span>
      </div>
    </div>
  );
}
