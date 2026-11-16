import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import BrandLogo from '../ui/BrandLogo';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Platform', href: '#solution' },
    { label: 'AI Agents', href: '#agents' },
    { label: 'Student Journey', href: '#student-journey' },
    { label: 'For Colleges', href: '#colleges' },
    { label: 'For Recruiters', href: '#recruiters' },
    { label: 'Trust & Privacy', href: '#trust' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#BACBC0]/40 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo variant="horizontal" size="md" withLink={true} to="/" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#3B4A42] hover:text-[#002020] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/student"
            className="text-xs font-semibold text-[#002020] hover:text-[#009669] px-3 py-2 rounded-lg transition-colors"
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
          className="rounded-lg p-2 text-[#002020] hover:bg-[#BDF9F9]/50 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-[#BACBC0]/40 bg-white px-4 py-5 md:hidden space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#3B4A42] hover:text-[#002020] py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#BACBC0]/30 flex flex-col gap-2">
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
