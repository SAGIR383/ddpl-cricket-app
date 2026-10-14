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
    { href: '/tournaments', label: 'Tournaments', icon: Trophy },
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#040814]/98 backdrop-blur-2xl border-t border-cricket-border/80 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.6rem)] shadow-[0_-10px_30px_rgba(0,0,0,0.85)]">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 ${
                isActive
                  ? 'text-cricket-teal font-extrabold'
                  : 'text-gray-400 hover:text-gray-200 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-cricket-teal drop-shadow-[0_0_8px_rgba(0,245,212,0.6)]' : ''
                  }`}
                />
                {link.isLive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#040814] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight ${
                  isActive ? 'text-cricket-teal font-bold' : 'text-gray-400'
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
