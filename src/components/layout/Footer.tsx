import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Shield, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#D8AD55]/15 bg-[#08111F]/90 text-[#8793A5] py-12 mt-20 relative z-10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#D8AD55]/10">
          
          {/* Brand Column */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#D8AD55]/40 p-0.5 bg-[#0D1B2A] shrink-0">
              <Image
                src="/images/cricplus-logo.jpg"
                alt="CricPlus Logo"
                fill
                className="object-cover object-center"
              />
            </div>
            <div>
              <div className="font-display font-black text-xl text-white tracking-wide">
                Cric<span className="text-[#D8AD55]">Plus</span>
              </div>
              <div className="text-[10px] text-[#D8AD55] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-[#D8AD55]" />
                <span>Premier League Sports Platform</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs font-semibold">
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Tournaments</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/tournaments" className="hover:text-white transition-colors">
                  Explore Leagues
                </Link>
                <Link href="/tournaments/create" className="hover:text-white transition-colors">
                  Host a Tournament
                </Link>
                <Link href="/archive" className="hover:text-white transition-colors">
                  Championship Vault
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Competition</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/matches" className="hover:text-white transition-colors">
                  Live Matches
                </Link>
                <Link href="/auction" className="hover:text-white transition-colors">
                  Auction Room
                </Link>
                <Link href="/standings" className="hover:text-white transition-colors">
                  Points Table
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Stats &amp; History</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Leaderboards
                </Link>
                <Link href="/archive" className="hover:text-white transition-colors">
                  Championship Vault
                </Link>
                <Link href="/teams" className="hover:text-white transition-colors">
                  Franchise Teams
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Platform</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/admin" className="hover:text-[#F2D69A] transition-colors flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#D8AD55]" />
                  <span>Super Admin</span>
                </Link>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Player Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Rights Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8793A5]">
          <div>
            © {new Date().getFullYear()} CricPlus. All rights reserved. Professional Corporate Cricket League Infrastructure.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#D8AD55] font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>Official League Standard</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
