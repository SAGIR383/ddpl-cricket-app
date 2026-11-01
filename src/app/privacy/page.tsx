import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | CricPlus24',
  description: 'CricPlus24 Privacy Policy details our data collection, cookie usage, reader rights, and GDPR/CCPA compliance.',
  alternates: { canonical: 'https://www.cricplus24.in/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10 text-gray-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Privacy Policy
        </h1>
        <p className="text-[#8793A5] text-xs">Last updated: November 2026</p>
      </div>

      <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/20 space-y-6 shadow-xl">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">1. Information We Collect</h2>
          <p>
            When you visit CricPlus24, we may collect anonymous device information, IP addresses, browser types, and usage data via standard analytical cookies to optimize performance and prevent malicious abuse. If you register as a player or administrator, we collect your name, email, and authentication credentials securely.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">2. Use of Information</h2>
          <p>
            We use your data solely to operate tournament registrations, facilitate live auction bidding, deliver real-time match score updates, and serve relevant editorial content. We never sell, rent, or trade your personal information to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">3. Cookies &amp; Advertising</h2>
          <p>
            CricPlus24 uses standard HTTP cookies to maintain login sessions and measure aggregate audience engagement. Third-party partners such as Google AdSense and Google Analytics may place cookies on your browser to serve contextual advertisements. You can opt out of personalized advertising by visiting Google&apos;s Ad Settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">4. User Rights &amp; Data Deletion</h2>
          <p>
            You have the right to request access to, correction of, or permanent deletion of your profile data. To exercise these rights, please contact privacy@cricplus24.in.
          </p>
        </section>
      </div>
    </div>
  );
}
