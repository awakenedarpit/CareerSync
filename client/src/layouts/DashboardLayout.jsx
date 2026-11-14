import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/shell/Sidebar';
import Topbar from '../components/shell/Topbar';

export default function DashboardLayout({ role = 'student' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
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

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>

          {/* Footer note inside dashboard */}
          <footer className="mt-12 mb-4 border-t border-slate-200/60 pt-4 text-center text-xs text-slate-400">
            <p>
              CarrerSync Agentic Placement Intelligence Platform • Evidence-Based Skills • Human-in-the-Loop Governance
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
