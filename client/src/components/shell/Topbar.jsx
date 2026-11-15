import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  GraduationCap,
  Building,
  ShieldAlert,
  Check
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import NotificationDrawer from '../notifications/NotificationDrawer';
import { notificationService } from '../../services/notificationService';

export default function Topbar({ role = 'student', onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const roleRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const data = await notificationService.getNotifications();
        if (mounted && data) {
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        // keep default
      }
    }
    fetchUnread();
    return () => { mounted = false; };
  }, [showNotifications]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target)) {
        setShowRoleSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles = [
    { id: 'student', label: 'Student Portal', path: '/student', icon: GraduationCap, color: 'text-indigo-600' },
    { id: 'alumni', label: 'Alumni Portal', path: '/alumni/dashboard', icon: GraduationCap, color: 'text-amber-600' },
    { id: 'admin', label: 'T&P Admin Portal', path: '/admin', icon: Shield, color: 'text-purple-600' },
    { id: 'recruiter', label: 'Recruiter Portal', path: '/recruiter', icon: Building, color: 'text-emerald-600' },
    { id: 'superadmin', label: 'Super Admin', path: '/super-admin', icon: ShieldAlert, color: 'text-rose-600' },
  ];

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search skills, drives, analytics (Press '/' to search)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Evidence Mode</span>
        </div>

        {/* Portal Switcher Dropdown */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
          >
            <currentRoleObj.icon className={`h-4 w-4 ${currentRoleObj.color}`} />
            <span className="hidden sm:inline">{currentRoleObj.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Portal View
              </div>
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = r.id === role;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setShowRoleSwitcher(false);
                      navigate(r.path);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${r.color}`} />
                      <span>{r.label}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Bell with Slide-over Drawer */}
        <div>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-2xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
              </span>
            )}
          </button>

          <NotificationDrawer
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* User Profile Avatar & Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-indigo-100 transition-all"
            aria-label="User menu"
          >
            <Avatar
              name={role === 'admin' ? 'Rajiv Menon' : role === 'recruiter' ? 'Sarah Jenkins' : role === 'superadmin' ? 'Platform Administrator' : 'Priya Sharma'}
              size="sm"
              status="online"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">
                  {role === 'admin' ? 'Dr. Rajiv Menon' : role === 'recruiter' ? 'Sarah Jenkins' : role === 'superadmin' ? 'Platform Administrator' : 'Priya Sharma'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {role === 'admin' ? 'head.tnp@college.edu' : role === 'recruiter' ? 'sarah.j@techcorp.io' : role === 'superadmin' ? 'superadmin@carrersync.io' : 'priya.cs21@college.edu'}
                </p>
              </div>
              <div className="py-1">
                <Link
                  to={role === 'student' ? '/student/profile' : role === 'admin' ? '/admin/settings' : role === 'recruiter' ? '/recruiter/profile' : '/super-admin/settings'}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link
                  to={role === 'superadmin' ? '/super-admin/settings' : `/${role}/settings`}
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Settings & Privacy</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <Link
                  to="/auth/login"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>Sign out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
