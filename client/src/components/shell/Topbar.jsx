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
  Shield,
  GraduationCap,
  Building,
  ShieldAlert,
  Check
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import BrandLogo from '../ui/BrandLogo';
import NotificationDrawer from '../notifications/NotificationDrawer';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';

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

  // Close dropdowns on click outside & Escape key
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
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowProfileMenu(false);
        setShowRoleSwitcher(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const roles = [
    { id: 'student', label: 'Student Portal', path: '/student', icon: GraduationCap, color: 'text-[#009669]' },
    { id: 'alumni', label: 'Alumni Portal', path: '/alumni/dashboard', icon: GraduationCap, color: 'text-amber-600' },
    { id: 'admin', label: 'T&P Admin Portal', path: '/admin', icon: Shield, color: 'text-[#009669]' },
    { id: 'college_admin', label: 'College Admin', path: '/college-admin/institutional-intelligence', icon: Building, color: 'text-[#004D36]' },
    { id: 'recruiter', label: 'Recruiter Portal', path: '/recruiter', icon: Building, color: 'text-[#009669]' },
    { id: 'superadmin', label: 'Super Admin', path: '/super-admin', icon: ShieldAlert, color: 'text-rose-600' },
  ];

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#BACBC0]/40 bg-white/95 px-4 backdrop-blur-xs sm:px-6">
      {/* Left: Mobile Toggle & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[#3B4A42] hover:bg-[#BDF9F9]/40 hover:text-[#002020] lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <BrandLogo variant="horizontal" size="sm" withLink={true} to="/" className="lg:hidden" />

        <div className="relative w-full max-w-sm hidden sm:block">
          <label htmlFor="topbar-search" className="sr-only">Quick search</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7B71] pointer-events-none" aria-hidden="true" />
          <input
            id="topbar-search"
            type="text"
            placeholder="Search skills, drives, analytics (Press '/' to search)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#BACBC0] bg-[#BDF9F9]/20 py-1.5 pl-9 pr-3 text-xs text-[#002020] placeholder:text-[#6B7B71]/70 focus:border-[#02E8A7] focus:bg-white focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#02E8A7] transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6FAF4] border border-[#02E8A7]/40 text-[#004D36] text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#02E8A7] animate-pulse" aria-hidden="true" />
          <span>Evidence Mode</span>
        </div>

        {/* Portal Switcher Dropdown */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            aria-expanded={showRoleSwitcher}
            aria-haspopup="menu"
            aria-label="Switch portal role"
            className="flex items-center gap-1.5 rounded-lg border border-[#BACBC0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#002020] hover:bg-[#BDF9F9]/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
          >
            <currentRoleObj.icon className={`h-4 w-4 ${currentRoleObj.color}`} aria-hidden="true" />
            <span className="hidden sm:inline">{currentRoleObj.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#6B7B71]" aria-hidden="true" />
          </button>

          {showRoleSwitcher && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl border border-[#BACBC0]/50 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-semibold text-[#6B7B71] uppercase tracking-wider">
                Switch Role Context
              </div>
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = r.id === role;
                return (
                  <button
                    key={r.id}
                    role="menuitem"
                    onClick={() => {
                      setShowRoleSwitcher(false);
                      navigate(r.path);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7] ${
                      isSelected
                        ? 'bg-[#E6FAF4] text-[#004D36] font-bold border border-[#02E8A7]/30'
                        : 'text-[#002020] hover:bg-[#BDF9F9]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-[#004D36]' : r.color}`} aria-hidden="true" />
                      <span>{r.label}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#004D36]" aria-hidden="true" />}
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
            aria-label={`View notifications, ${unreadCount} unread`}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#02E8A7] px-1 text-[10px] font-bold text-[#002020] shadow-2xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2" aria-hidden="true">
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
          {(() => {
            const currentUser = authService.getCurrentUser();
            const fallbackName = role === 'admin' ? 'Dr. Rajiv Menon' : role === 'college_admin' ? 'Dr. Rajesh Sharma' : role === 'recruiter' ? 'Vikram Mehta' : role === 'superadmin' ? 'Platform Administrator' : role === 'alumni' ? 'Vikram Malhotra' : 'Aditya Sharma';
            const fallbackEmail = role === 'admin' ? 'tpo@apex.edu' : role === 'college_admin' ? 'admin@apex.edu' : role === 'recruiter' ? 'recruiter@cloudscale.example.com' : role === 'superadmin' ? 'admin@carrersync.internal' : role === 'alumni' ? 'alumni@apex.edu' : 'aditya.sharma@apex.edu';
            const displayName = currentUser?.fullName || fallbackName;
            const displayEmail = currentUser?.email || fallbackEmail;

            return (
              <>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  aria-expanded={showProfileMenu}
                  aria-haspopup="menu"
                  aria-label="User profile menu"
                  className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#02E8A7]/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
                >
                  <Avatar
                    name={displayName}
                    size="sm"
                    status="online"
                  />
                </button>

                {showProfileMenu && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-[#BACBC0]/40 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1"
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {displayEmail}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to={role === 'student' ? '/student/profile' : role === 'admin' ? '/admin/settings' : role === 'recruiter' ? '/recruiter/profile' : '/super-admin/settings'}
                        onClick={() => setShowProfileMenu(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
                      >
                        <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to={role === 'superadmin' ? '/super-admin/settings' : `/${role}/settings`}
                        onClick={() => setShowProfileMenu(false)}
                        role="menuitem"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
                      >
                        <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span>Settings & Privacy</span>
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          authService.logout();
                          navigate('/auth/login');
                        }}
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7] cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-rose-500" aria-hidden="true" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </header>
  );
}
