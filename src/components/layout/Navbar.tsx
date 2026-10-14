'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Trophy, Calendar, Gavel, BarChart3, Archive, User, Shield, Menu, X, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, isSuperAdmin, isOrganizer } = useAuth();

  const navLinks = [
    { href: '/tournaments', label: 'Tournaments', icon: Trophy },
    { href: '/matches', label: 'Matches', icon: Calendar },
    { href: '/auction', label: 'Auctions', icon: Gavel },
    { href: '/standings', label: 'Standings', icon: BarChart3 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Flame },
    { href: '/archive', label: 'Archive', icon: Archive },
    ...(isOrganizer ? [{ href: '/admin', label: isSuperAdmin ? 'Super Admin' : 'Admin', icon: Shield, badge: isSuperAdmin ? 'Master' : 'Organizer' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#040814]/98 backdrop-blur-xl border-b border-cricket-border/80 shadow-2xl pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-2">
          {/* Brand Logo & Organization Tag */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 via-cricket-teal to-amber-400 p-0.5 shadow-xl shadow-teal-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-[#070d1e] rounded-2xl overflow-hidden relative">
                  <Image
                    src="/images/cricpluse-logo.jpg"
                    alt="CricPluse Logo"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl tracking-wide text-white group-hover:text-cricket-teal transition-colors leading-none">
                  Cric<span className="text-cricket-teal glow-teal">Pluse</span>
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                  Corporate Sports Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/40 shadow-lg shadow-teal-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-cricket-card/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cricket-teal' : 'text-cricket-muted'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Auth & Role Pill */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Super Admin / Organizer Badge or Portal Link */}
            {isSuperAdmin ? (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-display font-extrabold text-xs shadow-md transition-all"
                title="Super Admin Master Console"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </Link>
            ) : isOrganizer ? (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-display font-extrabold text-xs shadow-md transition-all"
                title="Organizer Admin Dashboard"
              >
                <Shield className="w-3.5 h-3.5 text-cricket-teal" />
                <span>Organizer</span>
              </Link>
            ) : (
              <Link
                href="/admin/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cricket-card/90 hover:bg-cricket-cardHover border border-cricket-border text-gray-300 hover:text-amber-300 text-xs font-bold transition-all"
                title="Super Admin Governance Portal"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </Link>
            )}

            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-cricket-card hover:bg-cricket-cardHover border border-cricket-border text-sm font-bold text-white transition-all shadow-md"
              >
                <div className="w-6 h-6 rounded-full bg-cricket-teal/20 text-cricket-teal flex items-center justify-center font-bold text-xs">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-sm tracking-wide shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Sign In / Profile Quick Button + 3-line Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cricket-card/90 border border-cricket-teal/30 text-cricket-teal text-xs font-bold shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="max-w-[70px] truncate">{user.email?.split('@')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-400 text-cricket-dark font-display font-extrabold text-xs tracking-wide shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2.5 rounded-xl text-white bg-cricket-card/95 hover:bg-cricket-card border border-cricket-border/90 shadow-md active:scale-95 transition-all flex items-center justify-center shrink-0"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-amber-400" />
              ) : (
                <Menu className="w-6 h-6 text-cricket-teal" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-cricket-border bg-[#050916]/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-bold ${
                  isActive
                    ? 'bg-cricket-card text-cricket-teal border border-cricket-teal/40'
                    : 'text-gray-300 hover:bg-cricket-card/50'
                }`}
              >
                <Icon className="w-5 h-5 text-cricket-muted" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-cricket-border">
            {user ? (
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-cricket-card text-white text-base font-bold"
              >
                <User className="w-5 h-5 text-cricket-teal" />
                <span>My Profile ({user.email?.split('@')[0]})</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-cricket-dark font-display font-extrabold text-base shadow-lg"
              >
                <User className="w-5 h-5" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
