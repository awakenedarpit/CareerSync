import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import Button from '../common/Button';
import BrandLogo from '../ui/BrandLogo';
import { checkSystemHealth } from '../../services/health.service';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ online: false, checking: true });
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = async () => {
      const result = await checkSystemHealth();
      if (isMounted) {
        setHealthStatus({ online: result.online, checking: false, data: result.data });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Problem', href: '#problem' },
    { name: 'Solution', href: '#solution' },
    { name: 'AI Agents', href: '#agents' },
    { name: 'How It Works', href: '#workflow' },
    { name: 'Audiences', href: '#audiences' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <BrandLogo variant="horizontal" theme="dark" size="md" withLink={true} to="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Header Elements: Health Badge & CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Live Backend Indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-slate-800"
              title={
                healthStatus.checking
                  ? 'Verifying API status...'
                  : healthStatus.online
                  ? 'CarrerSync API online'
                  : 'Backend API offline or unreachable'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus.online
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-400 text-[11px]">
                {healthStatus.checking ? 'Checking' : healthStatus.online ? 'API Online' : 'API Standby'}
              </span>
            </div>

            <Button to="/auth/login" variant="ghost" size="sm">
              Sign In
            </Button>
            <Button to="/auth/register" variant="primary" size="sm" icon={ChevronRight}>
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-4 pt-4 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-200 hover:text-indigo-400 px-2 py-1.5 rounded-md hover:bg-slate-900"
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
              <span>System Status:</span>
              <span className={healthStatus.online ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                {healthStatus.online ? 'Backend Connected' : 'API Standby'}
              </span>
            </div>
            <Button to="/auth/login" variant="secondary" size="md" className="w-full">
              Sign In
            </Button>
            <Button to="/auth/register" variant="primary" size="md" className="w-full" icon={ChevronRight}>
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
