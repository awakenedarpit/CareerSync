import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Platform', href: '#solution' },
    { label: 'AI Agents', href: '#agents' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Colleges', href: '#colleges' },
    { label: 'For Recruiters', href: '#recruiters' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 tracking-tight text-xl">CarrerSync</span>
            <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              Agentic
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/student"
            className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors"
          >
            Live Demo
          </Link>
          <Button to="/auth/login" variant="outline" size="sm">
            Sign In
          </Button>
          <Button to="/student" variant="primary" size="sm">
            Launch Portal
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-5 md:hidden space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Button to="/student" variant="primary" size="md" className="w-full justify-center">
              Explore Demo Portal
            </Button>
            <Button to="/auth/login" variant="outline" size="md" className="w-full justify-center">
              Sign In
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
