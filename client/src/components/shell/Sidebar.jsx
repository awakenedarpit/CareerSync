import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Sparkles,
  LogOut,
  X,
  ChevronRight,
  Shield,
  GraduationCap,
  Building,
  ShieldAlert
} from 'lucide-react';
import { studentNavItems, adminNavItems, recruiterNavItems, superAdminNavItems, alumniNavItems, collegeAdminNavItems } from '../../config/navigation';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import BrandLogo from '../ui/BrandLogo';

export default function Sidebar({ role = 'student', isOpen, onClose }) {
  let navItems = studentNavItems;
  let roleLabel = 'Student Portal';
  let roleBadgeVariant = 'aqua';
  let RoleIcon = GraduationCap;
  let userName = 'Priya Sharma';
  let userEmail = 'priya.cs21@college.edu';

  if (role === 'admin') {
    navItems = adminNavItems;
    roleLabel = 'T&P Admin';
    roleBadgeVariant = 'mint';
    RoleIcon = Shield;
    userName = 'Dr. Rajiv Menon';
    userEmail = 'head.tnp@college.edu';
  } else if (role === 'college_admin' || role === 'college-admin') {
    navItems = collegeAdminNavItems;
    roleLabel = 'College Admin';
    roleBadgeVariant = 'aqua';
    RoleIcon = Building;
    userName = 'Prof. S. Ramakrishnan';
    userEmail = 'principal@college.edu';
  } else if (role === 'alumni') {
    navItems = alumniNavItems;
    roleLabel = 'Alumni Portal';
    roleBadgeVariant = 'emerald';
    RoleIcon = GraduationCap;
    userName = 'Ananya Deshmukh';
    userEmail = 'ananya.deshmukh@alumni.edu';
  } else if (role === 'recruiter') {
    navItems = recruiterNavItems;
    roleLabel = 'Recruiter Portal';
    roleBadgeVariant = 'emerald';
    RoleIcon = Building;
    userName = 'Sarah Jenkins';
    userEmail = 'sarah.j@techcorp.io';
  } else if (role === 'superadmin') {
    navItems = superAdminNavItems;
    roleLabel = 'Super Admin';
    roleBadgeVariant = 'rose';
    RoleIcon = ShieldAlert;
    userName = 'Platform Administrator';
    userEmail = 'superadmin@carrersync.io';
  }

  // Handle Escape key to close sidebar on mobile
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        id="app-sidebar"
        aria-label="Main navigation sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-[#BACBC0]/40 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#BACBC0]/30 px-5">
          <BrandLogo variant="horizontal" size="md" withLink={true} to="/" />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B7B71] hover:bg-[#BDF9F9]/30 hover:text-[#002020] lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
            aria-label="Close navigation sidebar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Role Indicator Banner */}
        <div className="px-5 py-3 border-b border-[#BACBC0]/30 bg-[#BDF9F9]/25 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RoleIcon className="h-4 w-4 text-[#3B4A42]" aria-hidden="true" />
            <span className="text-xs font-semibold text-[#002020]">{roleLabel}</span>
          </div>
          <Badge variant="mint" size="sm">Active</Badge>
        </div>

        {/* Navigation Links */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1 focus:outline-none"
          aria-label="Main menu"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/student' || item.path === '/admin' || item.path === '/recruiter' || item.path === '/super-admin' || item.path === '/alumni' || item.path === '/college-admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7] ${
                    isActive
                      ? 'bg-[#02E8A7]/20 text-[#002020] font-bold border-l-3 border-[#02E8A7]'
                      : 'text-[#3B4A42] hover:bg-[#BDF9F9]/30 hover:text-[#002020]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4.5 w-4.5 transition-colors ${
                          isActive ? 'text-[#004D36]' : 'text-[#6B7B71] group-hover:text-[#002020]'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-[#004D36]" aria-hidden="true" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="border-t border-[#BACBC0]/30 p-3 bg-[#BDF9F9]/20">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={userName} size="sm" status="online" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#002020] truncate">{userName}</p>
                <p className="text-[11px] text-[#5E7266] truncate">{userEmail}</p>
              </div>
            </div>
            <Link
              to="/auth/login"
              title="Sign out"
              aria-label="Sign out of CarrerSync"
              className="p-1.5 text-[#6B7B71] hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02E8A7]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
