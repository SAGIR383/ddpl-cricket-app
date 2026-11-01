'use client';

import Script from 'next/script';

interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
  position?: 'top' | 'in_content' | 'bottom' | 'sidebar' | 'mobile';
}

/**
 * Google AdSense Master Script Loader
 * Automatically attaches the official Google AdSense client script only when
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID is provided in environment variables.
 */
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}

/**
 * Universal Responsive Ad Component
 * Ad slots remain safely dormant and invisible until an active AdSense client ID
 * and Slot ID are configured in the environment.
 */
export function AdSlot({
  slotId,
  format = 'auto',
  className = '',
  position = 'top',
}: AdSlotProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const activeSlot = slotId || process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT;

  // Do not render anything if AdSense is not configured
  if (!clientId || !activeSlot) {
    return null;
  }

  return (
    <div
      className={`my-6 mx-auto text-center overflow-hidden transition-all ${className}`}
      data-ad-position={position}
    >
      <div className="text-[9px] uppercase font-bold text-[#556987] tracking-widest mb-1">
        Advertisement
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={activeSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function ArticleTopAd() {
  return <AdSlot position="top" className="max-w-3xl" />;
}

export function InContentAd() {
  return <AdSlot position="in_content" className="max-w-2xl my-8" />;
}

export function ArticleBottomAd() {
  return <AdSlot position="bottom" className="max-w-3xl my-8" />;
}

export function SidebarAd() {
  return <AdSlot position="sidebar" format="rectangle" className="w-[300px]" />;
}

export function MobileAd() {
  return <AdSlot position="mobile" className="block sm:hidden my-4" />;
}
