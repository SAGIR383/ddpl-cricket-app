import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Shield, Trophy, Users, Award, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Global Sports Platform & Editorial Standards | CricPlus24',
  description:
    'Learn about CricPlus24, our editorial mission, tournament technology, sports analysts, and our commitment to original cricket journalism.',
  alternates: { canonical: 'https://www.cricplus24.in/about' },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10 text-gray-200">
      
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#D8AD55]" />
          <span>Our Vision &amp; Mission</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          About CricPlus24
        </h1>
        <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          CricPlus24 is an enterprise sports technology platform and dedicated cricket publishing publication delivering original tactical analysis, real-time match operations, and player auctions.
        </p>
      </div>

      {/* Main Content */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 space-y-8 shadow-2xl">
        <section className="space-y-3">
          <h2 className="font-display font-black text-2xl text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D8AD55]" />
            <span>Elevating Cricket from Grassroots to Global Arenas</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Founded with a passion for precision and athletic excellence, CricPlus24 bridges the divide between premier international cricket broadcasts and amateur/corporate tournament management. We provide full digital scoring systems, auction gavel rooms, wagon wheel analytics, and executive dossiers to cricket leagues worldwide.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="font-display font-black text-2xl text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D8AD55]" />
            <span>Editorial Integrity &amp; Original Analysis</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            In our editorial desk, we adhere to strict standards of journalism. Every article, tactical review, and statistical breakdown published on CricPlus24 is 100% original, authored by verified sports analysts, and fact-checked against official match records. We do not aggregate or copy content from third-party news services.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="font-display font-black text-2xl text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#D8AD55]" />
            <span>Global Reach &amp; Community Trust</span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            With readers across India, the United States, the United Kingdom, Australia, South Africa, Pakistan, and Bangladesh, CricPlus24 is committed to transparency, reader privacy, and technological innovation.
          </p>
        </section>

        <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4 text-xs font-bold">
          <Link href="/editorial-policy" className="text-[#D8AD55] hover:underline">
            Read our Editorial Policy →
          </Link>
          <Link href="/corrections-policy" className="text-[#D8AD55] hover:underline">
            Corrections Policy →
          </Link>
          <Link href="/contact" className="text-[#D8AD55] hover:underline">
            Contact Editorial Board →
          </Link>
        </div>
      </div>
    </div>
  );
}
