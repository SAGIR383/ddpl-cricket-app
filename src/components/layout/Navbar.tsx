'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Trophy, Calendar, Gavel, BarChart3, Archive, User, Shield, Menu, X, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isSuperAdmin, isOrganizer } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Sparkles, exact: true },
    { href: '/tournaments', label: 'Tournaments', icon: Trophy },
    { href: '/matches', label: 'Matches', icon: Calendar },
    { href: '/auction', label: 'Auction', icon: Gavel },
    { href: '/standings', label: 'Standings', icon: BarChart3 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Flame },
    { href: '/archive', label: 'Archive', icon: Archive },
    ...(isOrganizer ? [{ href: '/admin', label: isSuperAdmin ? 'Super Admin' : 'Admin', icon: Shield, badge: isSuperAdmin ? 'Master' : 'Organizer' }] : []),
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#08111F]/90 backdrop-blur-xl border-b border-[#D8AD55]/25 shadow-[0_12px_40px_rgba(0,0,0,0.85)] py-2 sm:py-2.5'
          : 'bg-transparent border-b border-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo & Platform Title */}
          <Link href="/" className="flex items-center gap-3 group btn-press">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-gradient-to-tr from-[#D8AD55] via-[#F2D69A] to-[#0D1B2A] p-[1.5px] shadow-lg shadow-[#D8AD55]/15 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-[#08111F] rounded-[10px] overflow-hidden relative">
                <Image
                  src="/images/cricplus-logo.jpg"
                  alt="CricPlus Logo"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-2xl tracking-tight text-white group-hover:text-[#F2D69A] transition-colors leading-none">
                  Cric<span className="text-[#D8AD55] drop-shadow-[0_0_12px_rgba(216,173,85,0.4)]">Plus</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] font-bold uppercase tracking-wider">
                  Pro
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#D8AD55] uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#D8AD55]" />
                <span>Enterprise Sports</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Floating League Glass Pill Strip - Premium Highlighting) */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-[#0D1B2A]/95 via-[#111D2D]/90 to-[#0D1B2A]/95 backdrop-blur-2xl px-2.5 py-1.5 rounded-full border border-[#D8AD55]/35 shadow-[0_8px_32px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(242,214,154,0.3),0_0_24px_rgba(216,173,85,0.15)] ring-1 ring-[#D8AD55]/20">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact ? pathname === link.href : (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-item-press group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D8AD55]/30 via-[#F2D69A]/20 to-[#D8AD55]/30 text-[#F2D69A] border border-[#D8AD55]/60 shadow-[0_0_18px_rgba(216,173,85,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] font-extrabold'
                      : 'text-[#C2CBD8] hover:text-white hover:bg-white/[0.08] hover:border-[#D8AD55]/30 border border-transparent hover:shadow-[0_0_12px_rgba(216,173,85,0.15)]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-all ${
                    isActive 
                      ? 'text-[#D8AD55] drop-shadow-[0_0_8px_rgba(216,173,85,0.8)] scale-110' 
                      : 'text-[#D8AD55]/70 group-hover:text-[#F2D69A] group-hover:scale-110'
                  }`} />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D8AD55] shadow-[0_0_8px_rgba(216,173,85,1)] ml-0.5 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Super Admin / Organizer Badge */}
            {isSuperAdmin ? (
              <Link
                href="/admin"
                className="btn-press shimmer-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D8AD55]/15 hover:bg-[#D8AD55]/25 border border-[#D8AD55]/40 text-[#F2D69A] font-display font-extrabold text-xs shadow-md"
                title="Super Admin Master Console"
              >
                <Shield className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>Super Admin</span>
              </Link>
            ) : isOrganizer ? (
              <Link
                href="/admin"
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-display font-extrabold text-xs shadow-md"
                title="Organizer Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Organizer</span>
              </Link>
            ) : null}

            {user ? (
              <Link
                href="/profile"
                className="btn-press flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#111D2D] hover:bg-[#111D2D]/80 border border-[#D8AD55]/30 text-xs font-bold text-white shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#D8AD55] to-[#F2D69A] text-[#08111F] flex items-center justify-center font-black text-[11px] shadow-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="max-w-[110px] truncate text-gray-200">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="btn-press shimmer-btn flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-[#D8AD55]/20 hover:brightness-110"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <Link
                href="/profile"
                className="btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#111D2D] border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span className="max-w-[70px] truncate">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="btn-press shimmer-btn flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-display font-extrabold text-xs tracking-wide shadow-md"
              >
                <User className="w-3 h-3" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="btn-press p-2 rounded-xl text-white bg-[#111D2D] hover:bg-[#111D2D]/80 border border-[#D8AD55]/30 shadow-md flex items-center justify-center shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#D8AD55]" />
              ) : (
                <Menu className="w-5 h-5 text-[#F2D69A]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Mobile Slide-Down Glass Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 mx-3 rounded-2xl bg-[#0D1B2A]/95 backdrop-blur-2xl border border-[#D8AD55]/30 p-4 space-y-2 shadow-2xl animate-mascot-walk duration-200">
          <div className="text-[10px] font-bold text-[#D8AD55] uppercase tracking-widest px-2 pb-1.5 border-b border-[#D8AD55]/15 flex items-center justify-between">
            <span>Navigation Directory</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact ? pathname === link.href : (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`btn-press flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D8AD55]/30 to-[#F2D69A]/20 text-[#F2D69A] border border-[#D8AD55]/60 shadow-[0_0_14px_rgba(216,173,85,0.3)]'
                      : 'text-gray-200 hover:bg-white/[0.08] hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#D8AD55]' : 'text-[#D8AD55]/70'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#D8AD55]/15 flex items-center justify-between">
            {isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-press w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#D8AD55]/15 border border-[#D8AD55]/40 text-[#F2D69A] text-xs font-bold"
              >
                <Shield className="w-3.5 h-3.5 text-[#D8AD55]" />
                <span>Super Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
