import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Shield, MessageSquare } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us — Editorial Desk & Enterprise Support | CricPlus24',
  description:
    'Contact CricPlus24 editorial team, submit tournament inquiries, report errors, or request advertising partnerships.',
  alternates: { canonical: 'https://www.cricplus24.in/contact' },
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10 text-gray-200">
      <div className="space-y-4 text-center">
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          Contact CricPlus24
        </h1>
        <p className="text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
          Have an editorial inquiry, statistical correction, or tournament hosting question? Our global desk is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="p-8 rounded-3xl bg-[#08111F] border border-[#D8AD55]/30 space-y-6 shadow-2xl">
          <h2 className="font-display font-bold text-xl text-white">Direct Contacts</h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#D8AD55] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Editorial Inquiries</div>
                <div className="text-[#8793A5]">editor@cricplus24.in</div>
                <div className="text-[#556987]">Fact-checks, article submissions, and corrections</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#D8AD55] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Platform &amp; League Support</div>
                <div className="text-[#8793A5]">support@cricplus24.in</div>
                <div className="text-[#556987]">Live scoring, auction setups, and Super Admin accounts</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-[#D8AD55] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Advertising &amp; Partnerships</div>
                <div className="text-[#8793A5]">ads@cricplus24.in</div>
                <div className="text-[#556987]">Sponsorships and brand placements</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-[#8793A5]">
            Operating response window: Within 24–48 hours across global business days.
          </div>
        </div>

        {/* Client-Side Inquiries Form */}
        <ContactForm />
      </div>
    </div>
  );
}
