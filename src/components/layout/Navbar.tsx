'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Trophy, Calendar, Gavel, BarChart3, Archive, User, Shield, Menu, X, Flame, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isSuperAdmin, isOrganizer } = useAuth();

  const navLinks = [
    { href: '/tournaments', label: 'Tournaments', icon: Trophy },
    { href: '/matches', label: 'Matches', icon: Calendar },
    { href: '/auction', label: 'Auction', icon: Gavel },
    { href: '/standings', label: 'Standings', icon: BarChart3 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Flame },
    { href: '/archive', label: 'Archive', icon: Archive },
    ...(isOrganizer ? [{ href: '/admin', label: isSuperAdmin ? 'Super Admin' : 'Admin', icon: Shield, badge: isSuperAdmin ? 'Master' : 'Organizer' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 pt-safe lg:pt-3 px-3 sm:px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="glass-island rounded-2xl lg:rounded-full px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
          
          {/* Brand Logo & Platform Title */}
          <Link href="/" className="flex items-center gap-3 group btn-press">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 via-cricket-teal to-amber-400 p-[1.5px] shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-[#050a1a] rounded-[10px] sm:rounded-[14px] overflow-hidden relative">
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
              <span className="font-display font-extrabold text-2xl tracking-wide text-white group-hover:text-cricket-teal transition-colors leading-none">
                Cric<span className="text-cricket-teal glow-teal">Plus</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>Enterprise Sports</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Floating Glass Pill Strip) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.06]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-item-press relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/15 text-cricket-teal border border-cricket-teal/40 shadow-[0_0_15px_rgba(0,245,212,0.18)]'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cricket-teal' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cricket-teal shadow-[0_0_6px_rgba(0,245,212,0.9)] ml-0.5" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Super Admin / Organizer Badge */}
            {isSuperAdmin ? (
              <Link
                href="/admin"
                className="btn-press shimmer-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-display font-extrabold text-xs shadow-md"
                title="Super Admin Master Console"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </Link>
            ) : isOrganizer ? (
              <Link
                href="/admin"
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 font-display font-extrabold text-xs shadow-md"
                title="Organizer Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5 text-cricket-teal" />
                <span>Organizer</span>
              </Link>
            ) : null}

            {user ? (
              <Link
                href="/profile"
                className="btn-press flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs font-bold text-white shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 text-cricket-dark flex items-center justify-center font-black text-[11px] shadow-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="max-w-[110px] truncate text-gray-200">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="btn-press shimmer-btn flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 via-teal-400 to-emerald-400 text-cricket-dark font-display font-extrabold text-xs tracking-wide shadow-lg shadow-teal-500/20"
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
                className="btn-press flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-cricket-teal text-xs font-bold shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[70px] truncate">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="btn-press shimmer-btn flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-400 text-cricket-dark font-display font-extrabold text-xs tracking-wide shadow-md"
              >
                <User className="w-3 h-3" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="btn-press p-2 rounded-xl text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 shadow-md flex items-center justify-center shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-amber-400" />
              ) : (
                <Menu className="w-5 h-5 text-cricket-teal" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Mobile Slide-Down Glass Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 mx-3 rounded-2xl glass-island border border-white/10 p-4 space-y-2 shadow-2xl animate-mascot-walk duration-200">
          <div className="text-[10px] font-bold text-cricket-muted uppercase tracking-wider px-2 pb-1 border-b border-white/[0.06]">
            Navigation
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`btn-press flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/10 text-cricket-teal border border-cricket-teal/40'
                      : 'text-gray-300 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cricket-teal' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
            {isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-press w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Console</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
