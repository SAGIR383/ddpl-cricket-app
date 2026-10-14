import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Gavel, Calendar, ArrowRight, Activity, Flame, Award, Users, ChevronRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 sm:space-y-12 relative z-10">
      {/* Hero Header with Stadium & Players Blast Background */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-cricket-teal/30 shadow-2xl shadow-blue-950/60 min-h-[420px] sm:min-h-[460px] flex items-center">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/cricket-hero.jpg"
            alt="Cricket Stadium Hero Blast"
            fill
            priority
            className="object-cover object-center filter brightness-[0.78] contrast-[1.15] scale-105"
          />
          {/* Multi-layered Vignette & Floodlight Lighting Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040814] via-[#040814]/85 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040814] via-transparent to-[#040814]/60 z-10" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#040814]/40 to-[#040814] z-10" />
        </div>

        {/* Content Over the Stadium */}
        <div className="relative z-20 max-w-2xl p-5 sm:p-12 lg:p-16 space-y-5 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-cricket-teal text-[11px] sm:text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-lg shadow-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-cricket-teal animate-ping" />
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cricket-teal shrink-0" />
            <span>Official Corporate Sports Tournament Platform</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-cricket-teal/60 shadow-2xl shadow-teal-500/30 shrink-0 bg-[#070d1e]">
                <Image
                  src="/images/cricplus-logo.jpg"
                  alt="CricPlus Championship Logo"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
              <h1 className="font-display font-black text-4xl sm:text-7xl text-white tracking-tight leading-[0.95] drop-shadow-2xl">
                Cric<span className="text-cricket-teal glow-teal">Plus</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-amber-300">
                  Tournament Hub
                </span>
              </h1>
            </div>
            <p className="text-sm sm:text-lg text-gray-200 font-medium leading-relaxed drop-shadow max-w-xl pt-1 sm:pt-2">
              The high-energy battleground for corporate cricket tournaments. Experience real-time ball-by-ball scoring, live franchise player auctions, dynamic team rosters, and historical championship records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/matches"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-cricket-dark font-display font-extrabold text-base tracking-wide shadow-xl shadow-emerald-500/30 transition-all active:scale-95"
            >
              <Activity className="w-5 h-5" />
              <span>Live Match Center</span>
            </Link>

            <Link
              href="/auction"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-cricket-card/90 hover:bg-cricket-cardHover border border-cricket-border hover:border-cricket-gold/60 text-white font-display font-bold text-base tracking-wide backdrop-blur-md transition-all active:scale-95 shadow-lg"
            >
              <Gavel className="w-5 h-5 text-cricket-gold" />
              <span>Live Auction Room</span>
            </Link>
          </div>
        </div>

        {/* Floating Quick Tournament Status Badge (Desktop Only) */}
        <div className="hidden lg:block absolute right-10 bottom-10 z-20 max-w-sm">
          <div className="glass-card p-5 border border-cricket-teal/50 shadow-2xl backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black text-cricket-gold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-cricket-gold animate-pulse" />
                Live Tournament Hub
              </span>
              <span className="text-[11px] font-bold text-cricket-muted">Season 2026</span>
            </div>
            <div className="space-y-1">
              <div className="font-display font-bold text-xl text-white">DDPL &amp; Game of RUN</div>
              <p className="text-xs text-cricket-muted">
                Auctions live with franchise squads and purse deductions. Standings update automatically.
              </p>
            </div>
            <Link
              href="/auction"
              className="block w-full text-center py-2.5 rounded-lg bg-cricket-teal/20 hover:bg-cricket-teal/30 text-cricket-teal font-bold text-xs border border-cricket-teal/40 transition-all"
            >
              Enter Live Auction Center →
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Live Tournament Status Bar */}
      <div className="lg:hidden glass-card p-4 border border-cricket-teal/40 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-black text-cricket-gold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cricket-gold animate-pulse" />
            Season 2026 Active
          </span>
          <span className="font-display font-bold text-xs text-cricket-teal">Live Auction Room</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-300 font-semibold truncate">DDPL &amp; Game of RUN Franchises</span>
          <Link
            href="/auction"
            className="text-cricket-teal font-extrabold hover:underline shrink-0 ml-2"
          >
            Open Auction →
          </Link>
        </div>
      </div>

      {/* Flagship Tournaments Showcase */}
      <section className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-cricket-gold">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
                Flagship Tournaments
              </h2>
              <p className="text-[11px] sm:text-xs text-cricket-muted">Independent multi-edition leagues running on CricPlus</p>
            </div>
          </div>
          <Link href="/tournaments" className="text-xs sm:text-sm font-bold text-cricket-teal hover:underline flex items-center gap-1">
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {/* DDPL Card with Ball Blast Visual */}
          <div className="glass-card glass-card-hover overflow-hidden flex flex-col justify-between border-t-4 border-t-cricket-teal shadow-2xl relative">
            {/* Background Texture Overlay */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none overflow-hidden">
              <Image
                src="/images/cricket-ball-blast.jpg"
                alt="Cricket Ball Blast"
                fill
                className="object-cover object-right"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cricket-card to-transparent" />
            </div>

            <div className="p-5 sm:p-8 space-y-4 sm:space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[11px] sm:text-xs font-black uppercase tracking-wider">
                  DDPL 2026 Edition
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Tournament
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-xl shadow-blue-500/20 shrink-0 bg-[#070d1e]">
                  <Image
                    src="/images/ddpl-logo.jpg"
                    alt="DDPL Logo"
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div>
                  <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
                    DDPL
                  </h3>
                  <div className="text-[11px] sm:text-xs font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                    Desk to Dugout Premier League (DDPL)
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                High-tempo 10-over matches, aggressive powerplays, and company-wide department rivalry. Features 4 premier franchises battling for glory.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-2.5 sm:p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border/80">
                  <div className="text-[10px] sm:text-[11px] text-cricket-muted font-bold">Overs</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">10 Overs</div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border/80">
                  <div className="text-[10px] sm:text-[11px] text-cricket-muted font-bold">Squad Limit</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">8 - 11</div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border/80">
                  <div className="text-[10px] sm:text-[11px] text-cricket-muted font-bold">Franchises</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">4 Teams</div>
                </div>
              </div>
            </div>

          <div className="p-5 sm:p-6 pt-0 relative z-10">
            <Link
              href="/tournaments/ddpl"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-display font-bold text-base tracking-wide shadow-lg transition-all active:scale-95"
            >
              <span>Enter DDPL Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Game of RUN Card */}
        <div className="glass-card glass-card-hover overflow-hidden flex flex-col justify-between border-t-4 border-t-cricket-gold shadow-2xl relative">
          <div className="p-5 sm:p-8 space-y-4 sm:space-y-5 relative z-10">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-cricket-gold text-[11px] sm:text-xs font-black uppercase tracking-wider">
                Game of RUN 2026
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                Registrations Open
              </span>
            </div>

              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-xl shadow-amber-500/20 shrink-0 bg-[#070d1e]">
                  <Image
                    src="/images/game-of-run-logo.jpg"
                    alt="Game of RUN Logo"
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div>
                  <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
                    Game of RUN
                  </h3>
                  <div className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                    Official Corporate Championship
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                The marquee annual corporate cricket championship. Features 12-over innings, full team purse allocations, and the crowning of the undisputed Corporate Champion.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-2.5 sm:p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border/80">
                  <div className="text-[10px] sm:text-[11px] text-cricket-muted font-bold">Overs</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">12 Overs</div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border/80">
                  <div className="text-[10px] sm:text-[11px] text-cricket-muted font-bold">Squad Limit</div>
                  <div className="font-display font-bold text-base sm:text-lg text-white">9 - 12</div>
                </div>
                <div className="p-2.5 sm:p-3 rounded-xl bg-cricket-dark/80 border border-cricket-border/80">
                  <div className="text-[10px] sm:text-[11px] text-cricket-muted font-bold">Auction Purse</div>
                  <div className="font-display font-bold text-base sm:text-lg text-cricket-gold">₹10K / Team</div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 pt-0 relative z-10">
              <Link
                href="/tournaments/game-of-run"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-cricket-dark font-display font-extrabold text-base tracking-wide shadow-lg transition-all active:scale-95"
              >
                <span>Enter Game of RUN Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Link href="/teams" className="glass-card glass-card-hover p-4 sm:p-6 space-y-2 sm:space-y-3 group active:scale-95 transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-2xl text-white group-hover:text-cricket-teal transition-colors">
            Teams &amp; Squads
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed hidden sm:block">
            Manage franchise owners, assign Captains and Vice-Captains, and configure flexible team sizes.
          </p>
        </Link>

        <Link href="/auction" className="glass-card glass-card-hover p-4 sm:p-6 space-y-2 sm:space-y-3 group active:scale-95 transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 text-cricket-gold flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Gavel className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-2xl text-white group-hover:text-cricket-gold transition-colors">
            Auction Engine
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed hidden sm:block">
            Live bidding console with team purses, bid increments, squad limits, and 1-tap undo rollback.
          </p>
        </Link>

        <Link href="/matches" className="glass-card glass-card-hover p-4 sm:p-6 space-y-2 sm:space-y-3 group active:scale-95 transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-2xl text-white group-hover:text-emerald-400 transition-colors">
            Scoring &amp; Fixtures
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed hidden sm:block">
            Mobile live scorer console, ball-by-ball deliveries, extras, wickets, and official NRR points table.
          </p>
        </Link>

        <Link href="/archive" className="glass-card glass-card-hover p-4 sm:p-6 space-y-2 sm:space-y-3 group active:scale-95 transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h4 className="font-display font-black text-lg sm:text-2xl text-white group-hover:text-purple-400 transition-colors">
            Historical Archive
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed hidden sm:block">
            Complete multi-season records, past champions, awards, and verified all-time player career leaderboards.
          </p>
        </Link>
      </section>
    </div>
  );
}
