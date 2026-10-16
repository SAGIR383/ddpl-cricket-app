'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Activity, Gavel, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function MobileNav() {
  const pathname = usePathname();
  const { user, isOrganizer } = useAuth();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/tournaments', label: 'Events', icon: Trophy },
    { href: '/matches', label: 'Live', icon: Activity, isLive: true },
    { href: '/auction', label: 'Auction', icon: Gavel },
    ...(isOrganizer ? [{ href: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
    {
      href: user ? '/profile' : '/auth/login',
      label: user ? 'Profile' : 'Sign In',
      icon: User,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto pointer-events-auto">
      <div className="glass-island rounded-full px-2 py-1.5 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item-press relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all ${
                isActive
                  ? 'text-cricket-teal font-extrabold'
                  : 'text-gray-400 hover:text-gray-200 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-115 text-cricket-teal drop-shadow-[0_0_8px_rgba(0,245,212,0.8)]' : ''
                  }`}
                />
                {link.isLive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#040814] badge-live-radar" />
                )}
              </div>
              
              <span
                className={`text-[9.5px] mt-0.5 tracking-tight transition-colors ${
                  isActive ? 'text-cricket-teal font-bold' : 'text-gray-400'
                }`}
              >
                {link.label}
              </span>

              {/* Modern Active Indicator Micro-dot */}
              {isActive && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-cricket-teal shadow-[0_0_6px_rgba(0,245,212,0.9)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
