import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Shield, Sparkles, Smartphone } from 'lucide-react';

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
                alt="CricPlus24 Logo"
                fill
                className="object-cover object-center"
              />
            </div>
            <div>
              <div className="font-display font-black text-xl text-white tracking-wide flex items-center gap-1.5">
                <span>Cric<span className="text-[#D8AD55]">Plus</span></span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D8AD55]/20 border border-[#D8AD55]/40 text-[#F2D69A] font-black uppercase tracking-wider">
                  24
                </span>
              </div>
              <div className="text-[10px] text-[#D8AD55] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-[#D8AD55]" />
                <span>Premier League Sports Platform</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-xs font-semibold">
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
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Calculators</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/tools" className="hover:text-white transition-colors font-bold text-gray-200">
                  All Cricket Tools
                </Link>
                <Link href="/tools/net-run-rate-calculator" className="hover:text-white transition-colors">
                  Net Run Rate (NRR)
                </Link>
                <Link href="/tools/batting-average-calculator" className="hover:text-white transition-colors">
                  Batting Average
                </Link>
                <Link href="/tools/bowling-economy-calculator" className="hover:text-white transition-colors">
                  Bowling Economy
                </Link>
                <Link href="/tools/auction-budget-calculator" className="hover:text-white transition-colors">
                  Auction Budget
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Editorial &amp; Trust</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/news" className="hover:text-white transition-colors">
                  News &amp; Editorials
                </Link>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
                <Link href="/editorial-policy" className="hover:text-white transition-colors">
                  Editorial Policy
                </Link>
                <Link href="/corrections-policy" className="hover:text-white transition-colors">
                  Corrections Policy
                </Link>
                <Link href="/advertising-disclosure" className="hover:text-white transition-colors">
                  Advertising Policy
                </Link>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">Platform</div>
              <div className="flex flex-col space-y-1.5">
                <Link href="/download" className="hover:text-[#F2D69A] transition-colors flex items-center gap-1 font-bold text-gray-200">
                  <Smartphone className="w-3 h-3 text-[#D8AD55]" />
                  <span>Download App (.APK)</span>
                </Link>
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Leaderboards
                </Link>
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
            © {new Date().getFullYear()} CricPlus24. All rights reserved. Enterprise Sports &amp; Global Cricket Platform.
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <span>•</span>
            <Link href="/copyright-policy" className="hover:text-white transition-colors">
              Copyright
            </Link>
            <span>•</span>
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
