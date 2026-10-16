'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Activity, Gavel, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MobileNav() {
  const pathname = usePathname();
  const { user, isOrganizer, isSuperAdmin } = useAuth();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/tournaments', label: 'Events', icon: Trophy },
    { href: '/matches', label: 'Matches', icon: Activity, isLive: true },
    { href: '/auction', label: 'Auction', icon: Gavel },
    ...(isOrganizer ? [{ href: '/admin', label: isSuperAdmin ? 'Master' : 'Admin', icon: ShieldCheck }] : []),
    {
      href: user ? '/profile' : '/auth/login',
      label: user ? 'Profile' : 'Sign In',
      icon: User,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto pointer-events-auto">
      <div className="bg-[#08111F]/95 backdrop-blur-2xl rounded-full px-2 py-1.5 border border-[#D8AD55]/40 shadow-[0_12px_40px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(242,214,154,0.3),0_0_20px_rgba(216,173,85,0.15)] ring-1 ring-[#D8AD55]/20 flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item-press relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#D8AD55]/25 via-[#F2D69A]/15 to-[#D8AD55]/25 text-[#FFF] border border-[#D8AD55]/50 shadow-[0_0_14px_rgba(216,173,85,0.3)] font-extrabold'
                  : 'text-[#C2CBD8] hover:text-white font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-[#D8AD55] drop-shadow-[0_0_8px_rgba(216,173,85,0.8)]' : 'text-[#D8AD55]/70'
                  }`}
                />
                {link.isLive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#08111F] badge-live-radar" />
                )}
              </div>
              
              <span
                className={`text-[9.5px] mt-0.5 tracking-tight transition-colors ${
                  isActive ? 'text-[#F2D69A] font-bold' : 'text-[#C2CBD8]'
                }`}
              >
                {link.label}
              </span>

              {/* Modern Active Indicator Micro-dot in Gold */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#D8AD55] shadow-[0_0_6px_rgba(216,173,85,0.9)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
