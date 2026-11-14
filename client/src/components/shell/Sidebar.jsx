import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Sparkles,
  LogOut,
  X,
  ChevronRight,
  Shield,
  GraduationCap,
  Building
} from 'lucide-react';
import { studentNavItems, adminNavItems, recruiterNavItems } from '../../config/navigation';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

export default function Sidebar({ role = 'student', isOpen, onClose }) {
  let navItems = studentNavItems;
  let roleLabel = 'Student Portal';
  let roleBadgeVariant = 'indigo';
  let RoleIcon = GraduationCap;
  let userName = 'Priya Sharma';
  let userEmail = 'priya.cs21@college.edu';

  if (role === 'admin') {
    navItems = adminNavItems;
    roleLabel = 'T&P Admin';
    roleBadgeVariant = 'purple';
    RoleIcon = Shield;
    userName = 'Dr. Rajiv Menon';
    userEmail = 'head.tnp@college.edu';
  } else if (role === 'recruiter') {
    navItems = recruiterNavItems;
    roleLabel = 'Recruiter Portal';
    roleBadgeVariant = 'emerald';
    RoleIcon = Building;
    userName = 'Sarah Jenkins';
    userEmail = 'sarah.j@techcorp.io';
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-lg">CarrerSync</span>
                <span className="text-[10px] font-semibold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">AI</span>
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Indicator Banner */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RoleIcon className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">{roleLabel}</span>
          </div>
          <Badge variant={roleBadgeVariant} size="sm">Active</Badge>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/student' || item.path === '/admin' || item.path === '/recruiter'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4.5 w-4.5 transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-indigo-500" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/60">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={userName} size="sm" status="online" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
            <Link
              to="/auth/login"
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
