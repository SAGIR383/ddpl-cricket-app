import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Editorial Policy & Standards | CricPlus24',
  description:
    'Our commitment to original cricket journalism, fact-checking, author attribution, and ethical sports reporting standards.',
  alternates: { canonical: 'https://www.cricplus24.in/editorial-policy' },
};

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10 text-gray-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8AD55]/15 text-[#F2D69A] border border-[#D8AD55]/30 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D8AD55]" />
          <span>E-E-A-T Editorial Guidelines</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          CricPlus24 Editorial Policy
        </h1>
        <p className="text-[#8793A5] text-xs">Upholding honesty, original analysis, and statistical precision.</p>
      </div>

      <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/20 space-y-6 shadow-xl">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">1. Strict Commitment to Original Content</h2>
          <p>
            CricPlus24 does not aggregate, scrape, or syndicate articles from external third-party news websites such as ESPNcricinfo or Cricbuzz. Every match review, analytical feature, and tactical editorial is conceived, researched, and authored by our genuine in-house sports analysts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">2. Fact-Checking &amp; Data Verification</h2>
          <p>
            All cricket statistics, net run rates, player records, and match conditions cited in our publications are verified against official ICC, board, and league scorecards before publication.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">3. Author Transparency &amp; Expertise</h2>
          <p>
            Every published piece carries an individual author attribution, including the writer&apos;s real name, professional sports journalism background, and domain specialisms. We do not publish automated, unverified content.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">4. Independence &amp; Objectivity</h2>
          <p>
            Our tactical assessments, tournament rankings, and player reviews are conducted with complete editorial independence. Commercial partnerships never dictate our journalistic evaluations or match predictions.
          </p>
        </section>
      </div>
    </div>
  );
}
