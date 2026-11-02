import type { Metadata } from 'next';
import { HomePageClient } from '@/components/home/HomePageClient';

export const metadata: Metadata = {
  title: 'CricPlus24 — Corporate Cricket Tournament Platform & Sports Analytics',
  description:
    'CricPlus24 Enterprise Cricket Tournament Platform: Live cricket editorials, match reports, calculators, player auctions, and digital scoring.',
  openGraph: {
    title: 'CricPlus24 — Corporate Cricket Tournament Platform & Sports Analytics',
    description:
      'CricPlus24 Enterprise Cricket Tournament Platform: Live cricket editorials, match reports, calculators, player auctions, and digital scoring.',
    url: 'https://www.cricplus24.in/',
    siteName: 'CricPlus24',
    type: 'website',
    images: [
      {
        url: 'https://www.cricplus24.in/images/cricplus-stadium-4k.jpg',
        width: 1200,
        height: 630,
        alt: 'CricPlus24 Enterprise Cricket Tournament Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CricPlus24 — Corporate Cricket Tournament Platform & Sports Analytics',
    description:
      'CricPlus24 Enterprise Cricket Tournament Platform: Live cricket editorials, match reports, calculators, player auctions, and digital scoring.',
    images: ['https://www.cricplus24.in/images/cricplus-stadium-4k.jpg'],
  },
};

export default function HomePage() {
  return (
    <>
      <link rel="canonical" href="https://www.cricplus24.in/" />
      <HomePageClient />
    </>
  );
}
