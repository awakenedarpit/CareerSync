import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shell/Sidebar';
import Topbar from '../components/shell/Topbar';

export default function DashboardLayout({ role = 'student' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#E2FFFE] text-[#002020] overflow-hidden font-sans antialiased">
      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#02E8A7] focus:text-[#002020] focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#002020] font-semibold text-xs transition-all"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          role={role}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 focus:outline-none"
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>

          {/* Footer note inside dashboard */}
          <footer className="mt-12 mb-4 border-t border-[#BACBC0]/40 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#3B4A42] gap-2">
            <div className="flex items-center gap-2">
              <img src="/brand/carrersync-brand-logo.svg" alt="" className="h-4 w-auto opacity-80" aria-hidden="true" />
              <span className="font-semibold text-[#002020]">CarrerSync</span>
              <span className="text-[#3B4A42]">— Learn • Verify • Get Hired</span>
            </div>
            <p className="text-[#3B4A42]">
              Evidence-Based Skills • Human-in-the-Loop Governance
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
