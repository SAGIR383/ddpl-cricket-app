/**
 * CricPlus24 Real-time Global Cricket News Fetcher & Aggregator
 * Ingests live stories from ESPN Cricinfo, ICC, and cricket feeds.
 */

export interface CricketNewsItem {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  image_url: string;
  source: 'ESPN Cricinfo' | 'Cricbuzz' | 'ICC' | 'CricPlus24';
  source_url: string;
  category: string;
  published_at: string;
}

function cleanCdata(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 120);
}

// Fallback high-res cricket match images if a feed item doesn't provide an explicit thumbnail
const FALLBACK_CRICKET_IMAGES = [
  '/images/cricket-hero.jpg',
  '/images/cricket-ball-blast.jpg',
  '/images/cricplus-stadium-4k.jpg',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80',
];

export async function fetchLiveCricketNews(): Promise<CricketNewsItem[]> {
  const newsItems: CricketNewsItem[] = [];

  const feeds = [
    {
      source: 'ESPN Cricinfo' as const,
      category: 'International',
      url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml',
    },
    {
      source: 'ESPN Cricinfo' as const,
      category: 'Match Reports',
      url: 'https://www.espncricinfo.com/rss/content/story/feeds/6.xml',
    },
    {
      source: 'Cricbuzz' as const,
      category: 'Trending',
      url: 'https://news.google.com/rss/search?q=cricket+cricbuzz+espncricinfo+match&hl=en-IN&gl=IN&ceid=IN:en',
    },
  ];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        next: { revalidate: 900 }, // 15 mins cache in Next.js
      });

      if (!res.ok) continue;

      const xml = await res.text();
      const rawItems = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

      for (let i = 0; i < Math.min(rawItems.length, 12); i++) {
        const itemXml = rawItems[i];

        // Title
        const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
        const title = cleanCdata(titleMatch ? titleMatch[1] : '');
        if (!title || title.length < 5) continue;

        // Link
        const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
        const link = cleanCdata(linkMatch ? linkMatch[1] : '');

        // Description / Summary
        const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
        let summary = cleanCdata(descMatch ? descMatch[1] : '');
        if (summary.length > 280) summary = summary.slice(0, 277) + '...';

        // Published Date
        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const rawDate = dateMatch ? cleanCdata(dateMatch[1]) : '';
        const published_at = rawDate && !isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : new Date().toISOString();

        // Image URL: check enclosure, media:content, or media:thumbnail
        let imageUrl = '';
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
        if (enclosureMatch) {
          imageUrl = enclosureMatch[1];
        } else {
          const mediaMatch = itemXml.match(/<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i);
          if (mediaMatch) imageUrl = mediaMatch[1];
        }

        // If no image in RSS tags, try to extract first <img src="..."> from description
        if (!imageUrl && descMatch) {
          const imgTagMatch = descMatch[1].match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgTagMatch) imageUrl = imgTagMatch[1];
        }

        // Fallback image if none discovered
        if (!imageUrl) {
          imageUrl = FALLBACK_CRICKET_IMAGES[newsItems.length % FALLBACK_CRICKET_IMAGES.length];
        }

        // Categorize based on title keywords if generic
        let category = feed.category;
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('test') || lowerTitle.includes('wtc')) {
          category = 'Test & WTC';
        } else if (lowerTitle.includes('t20') || lowerTitle.includes('ipl') || lowerTitle.includes('bbl') || lowerTitle.includes('psl')) {
          category = 'T20 & Leagues';
        } else if (lowerTitle.includes('odi') || lowerTitle.includes('world cup')) {
          category = 'ODIs & Cups';
        } else if (lowerTitle.includes('controversy') || lowerTitle.includes('ban') || lowerTitle.includes('tampering')) {
          category = 'Analysis & Debates';
        }

        const slug = `${slugify(title)}-${Date.parse(published_at) || Date.now()}`;

        // Avoid duplicates
        if (!newsItems.some((n) => n.title.toLowerCase() === title.toLowerCase())) {
          newsItems.push({
            title,
            slug,
            summary: summary || title,
            image_url: imageUrl,
            source: feed.source,
            source_url: link,
            category,
            published_at,
          });
        }
      }
    } catch (err) {
      console.warn(`[CricketNewsFetcher] Error fetching ${feed.source}:`, err);
    }
  }

  // Sort descending by published_at
  newsItems.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  return newsItems;
}
