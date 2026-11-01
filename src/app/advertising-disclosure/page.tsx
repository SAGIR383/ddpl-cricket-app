import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Advertising & Commercial Disclosure | CricPlus24',
  description:
    'Information regarding advertising, sponsored content, affiliate relationships, and our commitment to Google AdSense compliance on CricPlus24.',
  alternates: { canonical: 'https://www.cricplus24.in/advertising-disclosure' },
};

export default function AdvertisingDisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 relative z-10 text-gray-300 text-xs sm:text-sm leading-relaxed">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white">
          Advertising &amp; Monetization Disclosure
        </h1>
        <p className="text-[#8793A5] text-xs">Full transparency regarding platform funding and advertising policies.</p>
      </div>

      <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/20 space-y-6 shadow-xl">
        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">1. Advertising on CricPlus24</h2>
          <p>
            To sustain our digital sports platform and compensate our editorial analysts, CricPlus24 displays programmatic display advertisements through certified ad networks, including Google AdSense.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">2. Clear Separation of Advertising &amp; Editorial Content</h2>
          <p>
            All promotional and advertising banners are clearly separated from editorial content. Advertisements are never camouflaged as news or statistical tables. We strictly follow Google Publisher Policies to ensure ads never obstruct reader usability, navigation buttons, or scorecards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">3. Editorial Independence</h2>
          <p>
            Advertisers have no influence over our editorial decisions, tournament rankings, tactical analyses, or match predictions. Our journalism remains unbiased and objective.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold text-lg text-white">4. Sponsored Content Protocol</h2>
          <p>
            If any content is sponsored by an enterprise partner, it is prominently tagged with a &quot;Sponsored&quot; or &quot;Partner Perspective&quot; badge in accordance with global consumer protection regulations.
          </p>
        </section>
      </div>
    </div>
  );
}
