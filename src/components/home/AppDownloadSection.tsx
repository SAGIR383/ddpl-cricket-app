'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  QrCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

export function AppDownloadSection({
  className = '',
  forceShow = false,
}: {
  className?: string;
  forceShow?: boolean;
}) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [isAppMode, setIsAppMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        window.location.search.includes('source=app') ||
        window.location.search.includes('mode=app');
      setIsAppMode(isStandalone);
    }
  }, []);

  if (isAppMode && !forceShow) {
    return null;
  }

  const downloadUrl = '/downloads/CricPlus24.apk';
  const directLink = typeof window !== 'undefined' ? `${window.location.origin}/downloads/CricPlus24.apk` : 'https://cricplus24.vercel.app/downloads/CricPlus24.apk';
  // Standard Google Chart QR URL for instant, crisp mobile camera scanning
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(directLink)}&color=08111f&bgcolor=f2d69a&margin=10`;

  return (
    <section id="download-app" className={`relative my-12 rounded-3xl overflow-hidden border border-[#D8AD55]/30 bg-gradient-to-br from-[#08111F] via-[#0D1B2A] to-[#08111F] shadow-2xl p-6 sm:p-10 lg:p-12 ${className}`}>
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D8AD55]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Information & Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Badge */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-black uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5 text-[#D8AD55]" />
              <span>Official Android App</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct APK v2.0 • 5.9 MB</span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
              Get <span className="text-gradient-gold">CricPlus24</span> on Your Android Phone
            </h2>
            <p className="text-sm sm:text-base text-[#8793A5] leading-relaxed">
              Experience the full power of CricPlus24 on mobile. Track real-time ball-by-ball commentary, participate in live multiplayer auctions, view wagon wheels, and receive instant match notifications.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <Zap className="w-4 h-4 text-[#D8AD55] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Live Match Feed</strong>
                <span className="text-[#8793A5] text-[11px]">Millisecond latency commentary &amp; live wagon wheels.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <Sparkles className="w-4 h-4 text-[#D8AD55] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Auction Bid Buzzer</strong>
                <span className="text-[#8793A5] text-[11px]">Real-time interactive paddle bidding with purse tracking.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">No Store Sign-In</strong>
                <span className="text-[#8793A5] text-[11px]">Direct install without waiting for store reviews.</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">100% Safe &amp; Verified</strong>
                <span className="text-[#8793A5] text-[11px]">Digitally signed package with zero ads or tracking.</span>
              </div>
            </div>
          </div>

          {/* Download & QR Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <a
              href={downloadUrl}
              download="CricPlus24.apk"
              className="btn-press shimmer-btn inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] text-[#08111F] font-display font-black text-sm uppercase tracking-wider shadow-xl hover:brightness-110 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 text-[#08111F]" />
              <span>Download Android APK (5.9 MB)</span>
            </a>

            <button
              type="button"
              onClick={() => setShowQrModal(!showQrModal)}
              className="btn-press inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#0D1B2A] hover:bg-[#111D2D] border border-[#D8AD55]/40 text-[#F2D69A] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#D8AD55]" />
              <span>{showQrModal ? 'Hide QR Code' : 'Scan QR for Mobile'}</span>
            </button>
          </div>

          {/* Quick Specs Footnote */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-[#8793A5] pt-1">
            <span>• Compatible with Android 8.0 &amp; Above</span>
            <span>• Package: <code className="text-[#F2D69A] font-bold">app.vercel.cricplus24</code></span>
            <span>• Release: <strong className="text-emerald-400">v2.0 (Stable)</strong></span>
          </div>
        </div>

        {/* Right Column: Visual Mockup & QR Code Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          {showQrModal ? (
            /* QR Scan Box */
            <div className="w-full max-w-sm p-6 rounded-3xl bg-[#0D1B2A] border-2 border-[#D8AD55]/50 shadow-2xl text-center space-y-4 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#F2D69A] uppercase tracking-wider">
                <QrCode className="w-4 h-4 text-[#D8AD55]" />
                <span>Scan with Phone Camera</span>
              </div>

              <div className="bg-gradient-to-br from-[#D8AD55] to-[#F2D69A] p-3 rounded-2xl inline-block shadow-inner">
                <img
                  src={qrCodeImgSrc}
                  alt="Scan to Download CricPlus24 APK"
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              </div>

              <p className="text-xs text-[#8793A5] leading-relaxed">
                Point your smartphone camera at this QR code to download the APK directly on your device.
              </p>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-xs text-[#D8AD55] hover:underline font-bold"
              >
                ← Back to Phone Preview
              </button>
            </div>
          ) : (
            /* Mobile App Mockup Preview */
            <div className="relative w-full max-w-xs sm:max-w-sm group flex justify-center">
              {/* Outer Glow Halo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#D8AD55]/30 via-amber-500/20 to-[#D8AD55]/30 rounded-3xl blur-2xl opacity-40 group-hover:opacity-75 transition duration-500" />
              
              <div className="relative rounded-3xl overflow-hidden border border-[#D8AD55]/40 shadow-2xl bg-[#08111F]/90 backdrop-blur-sm">
                <Image
                  src="/images/mobile-app-preview.png"
                  alt="CricPlus24 Mobile App - Live Match Center"
                  width={571}
                  height={1024}
                  className="w-full h-auto object-contain rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
                  priority
                />

                {/* Floating App Badge */}
                <div className="absolute bottom-3 inset-x-3 p-3 rounded-2xl bg-[#08111F]/90 backdrop-blur-md border border-[#D8AD55]/40 flex items-center justify-between text-xs shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#D8AD55]/50 shrink-0 bg-[#0D1B2A] p-0.5">
                      <Image
                        src="/images/cricplus-logo.jpg"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px]">CricPlus24 Mobile</div>
                      <div className="text-[9px] text-[#D8AD55] font-semibold">Official Android APK v2.0</div>
                    </div>
                  </div>
                  <a
                    href={downloadUrl}
                    download="CricPlus24.apk"
                    className="btn-press px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-black text-[10px] uppercase tracking-wider hover:brightness-110 shadow"
                  >
                    Install APK
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3-Step Simple Installation Guide */}
      <div className="mt-10 pt-8 border-t border-[#D8AD55]/20">
        <div className="text-center mb-6">
          <span className="text-xs uppercase font-extrabold text-[#D8AD55] tracking-wider">
            Quick Setup Guide
          </span>
          <h3 className="text-lg sm:text-xl font-display font-black text-white mt-1">
            How to Install the APK on Your Android Device in 30 Seconds
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-[#0D1B2A]/70 border border-[#D8AD55]/20 space-y-2 relative">
            <div className="w-7 h-7 rounded-xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 text-[#F2D69A] font-black flex items-center justify-center text-xs">
              1
            </div>
            <strong className="text-white text-sm block font-bold">Download the APK</strong>
            <p className="text-[#8793A5] text-[11px] leading-relaxed">
              Click the <span className="text-[#F2D69A] font-bold">Download Android APK</span> button above. If Chrome prompts with <em>"File might be harmful"</em>, tap <strong>Download anyway</strong> (standard notice for direct downloads).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-[#0D1B2A]/70 border border-[#D8AD55]/20 space-y-2 relative">
            <div className="w-7 h-7 rounded-xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 text-[#F2D69A] font-black flex items-center justify-center text-xs">
              2
            </div>
            <strong className="text-white text-sm block font-bold">Allow Installation</strong>
            <p className="text-[#8793A5] text-[11px] leading-relaxed">
              Open the downloaded file from your notification bar. If prompted, toggle <strong>"Allow from this source"</strong> in your device settings to permit installation.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-[#0D1B2A]/70 border border-[#D8AD55]/20 space-y-2 relative">
            <div className="w-7 h-7 rounded-xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 text-[#F2D69A] font-black flex items-center justify-center text-xs">
              3
            </div>
            <strong className="text-white text-sm block font-bold">Open CricPlus24</strong>
            <p className="text-[#8793A5] text-[11px] leading-relaxed">
              Tap <strong>Install</strong>. Once completed, tap <strong>Open</strong> to start experiencing live cricket match feeds, auctions, and tournament analytics on your phone!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
