import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCheck,
  Check,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Compass,
  Award,
  Building2,
  Briefcase,
  Calendar,
  Shield,
  ShieldOff,
  Clock,
  Sparkles,
} from 'lucide-react';
import { notificationService, NOTIFICATION_CATEGORIES } from '../../services/notificationService';

export default function NotificationDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Load notifications
  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      try {
        setLoading(true);
        const data = await notificationService.getNotifications();
        if (mounted) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount ?? (data.notifications || []).filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (isOpen) {
      loadNotifications();
    }
    return () => { mounted = false; };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleActionClick = (notification) => {
    handleMarkAsRead(notification.id);
    if (notification.metadata?.actionUrl) {
      onClose();
      navigate(notification.metadata.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'APPROVALS') {
      return n.eventType === 'TPO_APPROVAL_REQUIRED';
    }
    if (selectedCategory === 'WORKFLOWS') {
      return n.eventType === 'WORKFLOW_COMPLETED' || n.eventType === 'WORKFLOW_FAILED' || n.referenceType === 'WORKFLOW';
    }
    if (selectedCategory === 'DRIVES') {
      return n.eventType === 'DRIVE_PUBLISHED' || n.eventType === 'ELIGIBILITY_UPDATED' || n.eventType === 'INTERVIEW_SCHEDULED' || n.eventType === 'OFFER_UPDATED';
    }
    if (selectedCategory === 'SKILLS') {
      return n.eventType === 'SKILL_VERIFIED' || n.eventType === 'EVIDENCE_REQUESTED' || n.eventType === 'ROADMAP_UPDATED';
    }
    if (selectedCategory === 'GOVERNANCE') {
      return n.eventType === 'DELEGATION_GRANTED' || n.eventType === 'DELEGATION_REVOKED';
    }
    return true;
  });

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'TPO_APPROVAL_REQUIRED':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'WORKFLOW_FAILED':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'WORKFLOW_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'SKILL_VERIFIED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'EVIDENCE_REQUESTED':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'ROADMAP_UPDATED':
        return <Compass className="w-4 h-4 text-[#009669]" />;
      case 'MOCK_ASSESSMENT_COMPLETED':
        return <Award className="w-4 h-4 text-[#009669]" />;
      case 'DRIVE_PUBLISHED':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'ELIGIBILITY_UPDATED':
        return <Briefcase className="w-4 h-4 text-[#009669]" />;
      case 'INTERVIEW_SCHEDULED':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'DELEGATION_GRANTED':
        return <Shield className="w-4 h-4 text-[#009669]" />;
      case 'DELEGATION_REVOKED':
        return <ShieldOff className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#009669]" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#BDF9F9]/30 border border-[#02E8A7]/30 flex items-center justify-center text-[#009669]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    Notification Center
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BDF9F9]/50 text-[#004D36]">
                        {unreadCount} unread
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Real-time cross-agent alerts & approval requests
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#009669] hover:text-[#002020] p-1.5 rounded-md hover:bg-[#BDF9F9]/30 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {NOTIFICATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#02E8A7] text-[#002020] font-bold shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-semibold text-slate-700">No notifications found</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  {selectedCategory === 'ALL'
                    ? 'You are all caught up! New cross-agent orchestration updates will appear here.'
                    : `No notifications in ${selectedCategory.toLowerCase()} category.`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const isUnread = !notification.isRead;
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleActionClick(notification)}
                    className={`p-4 transition-colors cursor-pointer group ${
                      isUnread
                        ? 'bg-[#BDF9F9]/30/30 hover:bg-[#BDF9F9]/30/60'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                        isUnread ? 'bg-white shadow-2xs border border-[#02E8A7]/30' : 'bg-slate-100'
                      }`}>
                        {getEventIcon(notification.eventType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs ${isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {notification.title}
                          </h4>
                          {isUnread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#02E8A7] shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(notification.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {notification.metadata?.actionUrl && (
                              <span className="flex items-center gap-0.5 text-[#009669] group-hover:underline font-medium">
                                View action <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            )}
                            {isUnread && (
                              <button
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200/50"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Event Stream Connected
            </span>
            <button
              onClick={() => {
                onClose();
                navigate('/tpo/orchestration?tab=workflows');
              }}
              className="text-[#009669] hover:text-[#002020] font-medium hover:underline"
            >
              Orchestration Center &rarr;
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
