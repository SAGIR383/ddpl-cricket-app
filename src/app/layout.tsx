import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CricPluse — Corporate Cricket Tournament Management Platform',
  description: 'Enterprise Cricket Tournament Platform: DDPL, Game of RUN, live scoring, player auctions, and historical tournament archive.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CricPluse',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Nunito+Sans:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#040814] text-gray-100 flex flex-col min-h-screen antialiased selection:bg-cricket-teal selection:text-cricket-dark">
        <AuthProvider>
          {/* Full-bleed fixed stadium visual reaching all edges of any display (including ultra-wide) */}
          <div className="stadium-bg-fixed" />
          <div className="stadium-overlay-fixed" />

          {/* Top Header Navbar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 relative z-10 pb-24 lg:pb-10">
            {children}
          </main>

          {/* Footer */}
          <Footer />

          {/* Native Mobile App-Style Bottom Bar */}
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
