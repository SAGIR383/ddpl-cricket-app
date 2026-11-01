import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Corrections & Retractions Policy | CricPlus24',
  description:
    'Our transparent protocol for handling statistical corrections, factual updates, and editorial clarifications on CricPlus24.',
  alternates: { canonical: 'https://www.cricplus24.in/corrections-policy' },
};

export default function CorrectionsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10 text-gray-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Corrections Policy
        </h1>
        <p className="text-[#8793A5] text-xs">Commitment to accuracy, accountability, and prompt rectification.</p>
      </div>

      <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/20 space-y-6 shadow-xl">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">1. Prompt Rectification</h2>
          <p>
            Despite meticulous research, errors can occasionally occur in rapid sports reporting. CricPlus24 is committed to correcting any factual or statistical error swiftly and transparently.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">2. Transparent Correction Notices</h2>
          <p>
            When a material factual correction is made to an article, we update the piece and append a clear note stating the date and nature of the correction (e.g., &quot;Updated on Nov 1, 2026: Corrected bowling economy figures in the 18th over&quot;).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">3. How Readers Can Report an Error</h2>
          <p>
            If you notice an inaccuracy in any CricPlus24 scorecard, calculator, or article, please email our editorial board at <span className="text-[#F2D69A] font-semibold">corrections@cricplus24.in</span> with the article URL and supporting documentation.
          </p>
        </section>
      </div>
    </div>
  );
}
