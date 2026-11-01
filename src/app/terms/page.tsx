import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms and Conditions | CricPlus24',
  description: 'Terms and conditions governing the use of the CricPlus24 cricket platform, calculators, and content.',
  alternates: { canonical: 'https://www.cricplus24.in/terms' },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10 text-gray-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Terms &amp; Conditions
        </h1>
        <p className="text-[#8793A5] text-xs">Effective Date: November 2026</p>
      </div>

      <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/20 space-y-6 shadow-xl">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using CricPlus24 (https://www.cricplus24.in), you agree to be bound by these Terms and Conditions and all applicable laws and regulations governing online services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">2. Platform Usage &amp; Intellectual Property</h2>
          <p>
            All editorial articles, tactical diagrams, tournament schedules, calculators, software code, and visual designs published on CricPlus24 are the intellectual property of CricPlus24. Reproduction without written consent is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">3. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            While we strive for 100% accuracy in our live scorecards, calculators, and articles, CricPlus24 provides information on an &quot;as-is&quot; basis without warranties of any kind. We are not liable for any strategic or fantasy sports outcomes resulting from calculator usage.
          </p>
        </section>
      </div>
    </div>
  );
}
