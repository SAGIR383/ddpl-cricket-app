import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Smartphone, ShieldCheck, Download, HelpCircle, CheckCircle } from 'lucide-react';
import { AppDownloadSection } from '@/components/home/AppDownloadSection';

export const metadata: Metadata = {
  title: 'Download CricPlus24 Android APK | Official Mobile App',
  description: 'Download the official CricPlus24 Android APK (v2.0). Experience live cricket scoring, real-time multiplayer auctions, wagon wheel analytics, and tournament management on your mobile device.',
};

export default function DownloadPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8793A5] hover:text-[#F2D69A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold uppercase tracking-wider">
          <Smartphone className="w-3.5 h-3.5 text-[#D8AD55]" />
          <span>Android Mobile Distribution</span>
        </span>
      </div>

      {/* Main Download Section Component */}
      <AppDownloadSection />

      {/* Frequently Asked Questions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#08111F]/90 border border-[#D8AD55]/20 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#D8AD55]" />
          <h3 className="font-display font-black text-xl text-white">Frequently Asked Questions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-white/5 space-y-1.5">
            <strong className="text-white text-sm block font-bold">Why do I see a "File might be harmful" warning?</strong>
            <p className="text-[#8793A5] leading-relaxed">
              Google Chrome and Android display this warning whenever you download any <code>.apk</code> file outside the Google Play Store. Our APK is 100% digitally signed, virus-free, and safe. Tap <strong>Download anyway</strong> to proceed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-white/5 space-y-1.5">
            <strong className="text-white text-sm block font-bold">Do I need to create a new account in the app?</strong>
            <p className="text-[#8793A5] leading-relaxed">
              No. You can sign in with the exact same credentials (email/password or guest player access) you use on <code>cricplus24.in</code>. All your tournament data and player stats sync seamlessly in real time.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-white/5 space-y-1.5">
            <strong className="text-white text-sm block font-bold">What Android versions are supported?</strong>
            <p className="text-[#8793A5] leading-relaxed">
              CricPlus24 is optimized for Android 8.0 (Oreo) and all subsequent versions up to Android 15. It runs smoothly on Samsung, Xiaomi, OnePlus, Vivo, Realme, Motorola, Google Pixel, and all standard Android devices.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-white/5 space-y-1.5">
            <strong className="text-white text-sm block font-bold">How do I update to future versions?</strong>
            <p className="text-[#8793A5] leading-relaxed">
              When an update is released, CricPlus24 will notify you inside the app or you can simply revisit this page to download the latest version. Installing over your existing app will keep all your preferences and login sessions intact.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
