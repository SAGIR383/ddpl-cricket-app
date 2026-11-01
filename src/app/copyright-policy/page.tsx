import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Copyright & Content Attribution Policy | CricPlus24',
  description: 'Copyright notices, permissible citation practices, and intellectual property guidelines for CricPlus24.',
  alternates: { canonical: 'https://www.cricplus24.in/copyright-policy' },
};

export default function CopyrightPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10 text-gray-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Copyright &amp; Intellectual Property
        </h1>
        <p className="text-[#8793A5] text-xs">All rights reserved © 2026 CricPlus24</p>
      </div>

      <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/20 space-y-6 shadow-xl">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">1. Ownership of Content</h2>
          <p>
            All original articles, software calculators, match infographics, photographs, and branding on CricPlus24 are protected under international copyright treaties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">2. Permissible Fair Use &amp; Citation</h2>
          <p>
            Journalists, bloggers, and academics may quote short excerpts (up to 75 words) from CricPlus24 articles provided that explicit editorial credit and a direct dofollow hyperlink to the original article canonical URL on CricPlus24 are included.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">3. DMCA &amp; Infringement Notices</h2>
          <p>
            If you believe your copyrighted work has been infringed on our platform, please send a written notification to legal@cricplus24.in with complete evidence of ownership.
          </p>
        </section>
      </div>
    </div>
  );
}
