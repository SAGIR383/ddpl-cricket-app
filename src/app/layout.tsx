import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { NavigationProgress } from '@/components/common/NavigationProgress';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics';
import { AdSenseScript } from '@/components/ads/AdSlot';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cricplus24.in'),
  title: 'CricPlus24 — Corporate Cricket Tournament Platform & Sports Analytics',
  description: 'CricPlus24 Enterprise Cricket Tournament Platform: Live cricket editorials, match reports, calculators, player auctions, and digital scoring.',
  manifest: '/manifest.json',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: '/icons/cricplus-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/cricplus-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/cricplus-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'CricPlus24',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
  themeColor: '#040814',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icons/cricplus-icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/cricplus-icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .catch(function(err) { console.warn('SW err:', err); });
                });
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Nunito+Sans:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#040814] text-gray-100 flex flex-col min-h-screen antialiased selection:bg-cricket-teal selection:text-cricket-dark">
        <GoogleAnalytics />
        <AdSenseScript />
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <ServiceWorkerRegister />
              {/* Top route change progress bar */}
              <NavigationProgress />

              {/* Full-bleed fixed stadium visual reaching all edges of any display */}
              <div className="stadium-bg-fixed" />
              <div className="stadium-overlay-fixed" />

              {/* Top Floating Header Navbar */}
              <Navbar />

              {/* Main Content Area with fluid entry animation */}
              <main className="flex-1 relative z-10 pb-24 lg:pb-12 page-enter">
                {children}
              </main>

              {/* Footer */}
              <Footer />

              {/* Modern Floating App Dock for Mobile */}
              <MobileNav />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
