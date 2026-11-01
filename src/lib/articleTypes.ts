export interface ArticleAuthor {
  name: string;
  designation: string;
  avatarUrl: string;
  bio?: string;
  expertise?: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

export interface ArticleSEO {
  seoTitle?: string;
  metaDescription?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCardImage?: string;
  imageAltText?: string;
  robotsIndex?: 'index' | 'noindex';
  robotsFollow?: 'follow' | 'nofollow';
  articleSchema?: 'Article' | 'NewsArticle' | 'BlogPosting';
}

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface CricPlusArticle {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  author: ArticleAuthor;
  featuredImage: {
    url: string;
    altText: string;
    caption?: string;
  };
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: string;
  isFeatured?: boolean;
  viewsCount?: number;
  seo: ArticleSEO;
  faqs?: ArticleFAQ[];
  relatedSlugs?: string[];
}

export const EDITORIAL_CATEGORIES = [
  'International Cricket',
  'Cricket News & Match Reports',
  'Cricket Analysis & Tactical Breakdown',
  'Cricket Statistics & Records',
  'Cricket Rules & Guides',
  'IPL & Franchise Cricket',
  'T20 & Global Leagues',
  'Cricket Auctions',
  'Corporate Cricket',
  'Cricket Technology',
] as const;

export type EditorialCategory = typeof EDITORIAL_CATEGORIES[number];

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'international-cricket': 'In-depth coverage, match analysis, and exclusive insights into ICC Test championships, ODIs, and bilateral series worldwide.',
  'cricket-news-match-reports': 'Comprehensive post-match breakdowns, official score reviews, and player performances from major world cricket fixtures.',
  'cricket-analysis-tactical-breakdown': 'Expert technical analysis of batting techniques, bowling action mechanics, field placements, and winning strategies.',
  'cricket-statistics-records': 'Historic cricket milestones, batting and bowling records, net run rate mechanics, and analytical performance metrics.',
  'cricket-rules-guides': 'Comprehensive playing condition guides, ICC playing rules, DRS protocols, DLS method explanations, and umpiring guidelines.',
  'ipl-franchise-cricket': 'All the action, team strategies, player valuations, and tactical reviews from the Indian Premier League.',
  't20-global-leagues': 'Global coverage of high-octane T20 leagues including BBL, CPL, PSL, SA20, The Hundred, and ILT20.',
  'cricket-auctions': 'Exclusive insider coverage of player bidding dynamics, franchise purse management, auction algorithms, and squad building.',
  'corporate-cricket': 'Spotlight on executive tournaments, workplace cricket leagues, corporate championship culture, and amateur leagues.',
  'cricket-technology': 'Exploring cutting-edge technology in sports: Hawk-Eye, Snicko, Hot Spot, real-time ball tracking, and digital tournament platforms.',
};

export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/[&]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function calculateReadingTime(text: string): string {
  if (!text) return '1 min read';
  const clean = text.replace(/<[^>]+>/g, '').trim();
  const words = clean.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 100);
}
