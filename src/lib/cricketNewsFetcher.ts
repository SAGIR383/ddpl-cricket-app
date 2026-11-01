/**
 * CricPlus24 Editorial Desk
 * NOTE: Third-party news aggregation (ESPN Cricinfo, Cricbuzz, scrapers) has been
 * completely discontinued per project requirements.
 * CricPlus24 now exclusively serves genuine, original editorial articles.
 */

export interface CricketNewsItem {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content?: string;
  image_url: string;
  source: string;
  source_url?: string;
  category: string;
  published_at: string;
}

export function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .trim();
}

/**
 * Retained for legacy signature compatibility: Always returns empty array.
 * No external HTTP requests are made.
 */
export async function fetchLiveCricketNews(): Promise<CricketNewsItem[]> {
  return [];
}

export async function extractArticleContent(_url: string): Promise<string | null> {
  return null;
}
