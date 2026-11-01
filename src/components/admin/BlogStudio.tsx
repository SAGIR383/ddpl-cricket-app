'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Image as ImageIcon,
  Share2,
  Save,
  X,
  FileText,
  Search,
  Check,
  Link as LinkIcon,
  HelpCircle,
  BarChart2,
  Globe,
  Settings,
  Heading2,
  Heading3,
  Heading4,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Video,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  CricPlusArticle,
  EDITORIAL_CATEGORIES,
  calculateReadingTime,
  slugifyTitle,
} from '@/lib/articleTypes';

const PRESET_COVERS = [
  { label: 'Stadium Floodlights 4K', url: '/images/cricplus-stadium-4k.jpg' },
  { label: 'Cricket Ball Blast', url: '/images/cricket-ball-blast.jpg' },
  { label: 'Tournament Hero Action', url: '/images/cricket-hero.jpg' },
  {
    label: 'International Arena',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Cricket Pitch & Stumps',
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
  },
];

const INTERNAL_LINK_PRESETS = [
  { label: 'Live Matches & Scorecards', url: '/matches' },
  { label: 'Tournaments & Leagues', url: '/tournaments' },
  { label: 'Live Player Auction Room', url: '/auction' },
  { label: 'Championship Points Table', url: '/standings' },
  { label: 'Player Leaderboards & Caps', url: '/leaderboard' },
  { label: 'Net Run Rate Calculator', url: '/tools/net-run-rate-calculator' },
  { label: 'Batting Average Calculator', url: '/tools/batting-average-calculator' },
  { label: 'Bowling Economy Calculator', url: '/tools/bowling-economy-calculator' },
  { label: 'Auction Budget Calculator', url: '/tools/auction-budget-calculator' },
];

export function BlogStudio() {
  const [articles, setArticles] = useState<CricPlusArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Tab in Editor
  const [editorTab, setEditorTab] = useState<'content' | 'seo' | 'preview'>('content');

  // Form State
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>(EDITORIAL_CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState('Cricket, International, Match Analysis');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published' | 'archived'>('published');
  const [isFeatured, setIsFeatured] = useState(false);

  // Author details
  const [authorName, setAuthorName] = useState('CricPlus24 Chief Editor');
  const [authorDesignation, setAuthorDesignation] = useState('Senior Cricket Analyst & Sports Columnist');
  const [authorAvatar, setAuthorAvatar] = useState('/images/editorial-author.jpg');
  const [authorBio, setAuthorBio] = useState('Senior cricket journalist and analyst covering international tournaments, tactical player development, and global leagues.');

  // Featured Image
  const [imageUrl, setImageUrl] = useState('/images/cricplus-stadium-4k.jpg');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // FAQs
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);

  // SEO Fields
  const [seoTitle, setSeoTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [robotsIndex, setRobotsIndex] = useState<'index' | 'noindex'>('index');
  const [robotsFollow, setRobotsFollow] = useState<'follow' | 'nofollow'>('follow');
  const [articleSchema, setArticleSchema] = useState<'Article' | 'NewsArticle' | 'BlogPosting'>('Article');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load articles
  async function loadArticles() {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs?includeDrafts=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.posts) {
        setArticles(data.posts);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  // Auto-generate slug and SEO defaults from title if creating new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingSlug) {
      const autoSlug = slugifyTitle(val);
      setSlug(autoSlug);
      setSeoTitle(`${val.trim()} | CricPlus24`);
      if (!imageAlt) {
        setImageAlt(`${val.trim()} - CricPlus24 Editorial`);
      }
      setCanonicalUrl(`https://www.cricplus24.in/news/${autoSlug}`);
    }
  };

  const handleSummaryChange = (val: string) => {
    setSummary(val);
    if (!metaDescription || metaDescription === summary) {
      setMetaDescription(val.slice(0, 160));
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingSlug(null);
    setTitle('');
    setSlug('');
    setSubtitle('');
    setSummary('');
    setContent('');
    setCategory(EDITORIAL_CATEGORIES[0]);
    setTagsInput('Cricket, Analysis, Global Leagues');
    setStatus('published');
    setIsFeatured(false);
    setAuthorName('CricPlus24 Chief Editor');
    setAuthorDesignation('Senior Cricket Analyst & Sports Columnist');
    setAuthorAvatar('/images/editorial-author.jpg');
    setAuthorBio('Senior cricket journalist and analyst covering international tournaments, tactical player development, and global leagues.');
    setImageUrl('/images/cricplus-stadium-4k.jpg');
    setImageAlt('');
    setImageCaption('');
    setFaqs([]);
    setSeoTitle('');
    setMetaDescription('');
    setPrimaryKeyword('Cricket');
    setSecondaryKeywords('');
    setCanonicalUrl('');
    setOgTitle('');
    setOgDescription('');
    setRobotsIndex('index');
    setRobotsFollow('follow');
    setArticleSchema('Article');
    setEditorTab('content');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (art: CricPlusArticle) => {
    setEditingSlug(art.slug);
    setTitle(art.title);
    setSlug(art.slug);
    setSubtitle(art.subtitle || '');
    setSummary(art.summary || '');
    setContent(art.content || '');
    setCategory(art.category || EDITORIAL_CATEGORIES[0]);
    setTagsInput(art.tags ? art.tags.join(', ') : 'Cricket');
    setStatus(art.status || 'published');
    setIsFeatured(Boolean(art.isFeatured));
    setAuthorName(art.author?.name || 'CricPlus24 Chief Editor');
    setAuthorDesignation(art.author?.designation || 'Senior Cricket Analyst');
    setAuthorAvatar(art.author?.avatarUrl || '/images/editorial-author.jpg');
    setAuthorBio(art.author?.bio || '');
    setImageUrl(art.featuredImage?.url || '/images/cricplus-stadium-4k.jpg');
    setImageAlt(art.featuredImage?.altText || '');
    setImageCaption(art.featuredImage?.caption || '');
    setFaqs(art.faqs || []);
    setSeoTitle(art.seo?.seoTitle || `${art.title} | CricPlus24`);
    setMetaDescription(art.seo?.metaDescription || art.summary?.slice(0, 160) || '');
    setPrimaryKeyword(art.seo?.primaryKeyword || 'Cricket');
    setSecondaryKeywords(art.seo?.secondaryKeywords?.join(', ') || '');
    setCanonicalUrl(art.seo?.canonicalUrl || `https://www.cricplus24.in/news/${art.slug}`);
    setOgTitle(art.seo?.ogTitle || art.title);
    setOgDescription(art.seo?.ogDescription || art.summary?.slice(0, 160) || '');
    setRobotsIndex(art.seo?.robotsIndex || 'index');
    setRobotsFollow(art.seo?.robotsFollow || 'follow');
    setArticleSchema(art.seo?.articleSchema || 'Article');
    setEditorTab('content');
    setIsModalOpen(true);
  };

  // Toolbar Insert Helpers
  const insertTextAtCursor = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => prev + prefix + defaultText + suffix);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || defaultText;
    const replacement = prefix + selected + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // FAQ handlers
  const addFaqItem = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };
  const updateFaqItem = (index: number, field: 'question' | 'answer', val: string) => {
    const next = [...faqs];
    next[index][field] = val;
    setFaqs(next);
  };
  const removeFaqItem = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // SEO Automated Validation Checks
  const seoAudit = useMemo(() => {
    const checks: { label: string; status: 'passed' | 'warning' | 'needs_attention'; note: string }[] = [];

    // 1. Single H1 rule: Article title is the page H1, check if body has illegal # H1 tags
    const hasBodyH1 = /(^|\n)#[^#\n]+/.test(content);
    if (hasBodyH1) {
      checks.push({
        label: 'Single H1 Rule',
        status: 'needs_attention',
        note: 'Body contains "# Heading 1". Page title serves as the single primary H1. Please use ## H2 or ### H3 in the body.',
      });
    } else {
      checks.push({
        label: 'Single H1 Rule',
        status: 'passed',
        note: 'Valid. Page title is the unique primary H1.',
      });
    }

    // 2. Headings hierarchy
    const hasH2 = /(^|\n)##[^#\n]+/.test(content);
    if (!hasH2) {
      checks.push({
        label: 'Heading Hierarchy (H2/H3)',
        status: 'warning',
        note: 'Consider adding "## Section Heading" (H2) to structure long-form analysis.',
      });
    } else {
      checks.push({
        label: 'Heading Hierarchy (H2/H3)',
        status: 'passed',
        note: 'Article contains clear subheadings for readability and indexation.',
      });
    }

    // 3. SEO Title length
    const sTitle = seoTitle || title;
    if (!sTitle) {
      checks.push({ label: 'SEO Title', status: 'needs_attention', note: 'SEO Title is missing.' });
    } else if (sTitle.length < 30 || sTitle.length > 65) {
      checks.push({
        label: 'SEO Title Length',
        status: 'warning',
        note: `Current length: ${sTitle.length} characters (Recommended: 45–60).`,
      });
    } else {
      checks.push({ label: 'SEO Title', status: 'passed', note: `Optimal length (${sTitle.length} chars).` });
    }

    // 4. Meta Description
    const mDesc = metaDescription || summary;
    if (!mDesc) {
      checks.push({ label: 'Meta Description', status: 'needs_attention', note: 'Meta description is missing.' });
    } else if (mDesc.length < 80 || mDesc.length > 165) {
      checks.push({
        label: 'Meta Description Length',
        status: 'warning',
        note: `Current length: ${mDesc.length} characters (Recommended: 120–160).`,
      });
    } else {
      checks.push({ label: 'Meta Description', status: 'passed', note: `Optimal length (${mDesc.length} chars).` });
    }

    // 5. Featured Image & ALT
    if (!imageUrl) {
      checks.push({ label: 'Featured Image', status: 'needs_attention', note: 'Featured image is missing.' });
    } else if (!imageAlt) {
      checks.push({
        label: 'Image ALT Text',
        status: 'warning',
        note: 'Add descriptive ALT text for accessibility and Google Image search.',
      });
    } else {
      checks.push({ label: 'Featured Image & ALT', status: 'passed', note: 'Image and descriptive ALT text configured.' });
    }

    // 6. Content Depth / Word count
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    if (words < 150) {
      checks.push({
        label: 'Content Depth',
        status: 'warning',
        note: `Article contains ${words} words. Comprehensive cricket guides usually perform best with 400+ words.`,
      });
    } else {
      checks.push({
        label: 'Content Depth',
        status: 'passed',
        note: `Good article length: ${words} words (${calculateReadingTime(content)}).`,
      });
    }

    // 7. Internal Links
    const hasInternalLinks = /\[.*?\]\(((\/|https?:\/\/www\.cricplus24\.in).*?)\)/.test(content);
    if (!hasInternalLinks) {
      checks.push({
        label: 'Internal Links',
        status: 'warning',
        note: 'Add internal links to relevant matches, tournament hubs, or cricket calculators.',
      });
    } else {
      checks.push({ label: 'Internal Links', status: 'passed', note: 'Internal cross-linking detected.' });
    }

    // 8. Canonical URL
    if (canonicalUrl && !canonicalUrl.startsWith('https://')) {
      checks.push({
        label: 'Canonical URL',
        status: 'warning',
        note: 'Canonical URL should use https:// protocol.',
      });
    } else {
      checks.push({ label: 'Canonical URL', status: 'passed', note: 'Valid canonical tag specified.' });
    }

    return checks;
  }, [title, content, seoTitle, metaDescription, summary, imageUrl, imageAlt, canonicalUrl]);

  // Save Article
  const handleSaveArticle = async () => {
    if (!title.trim()) {
      alert('Please enter an article title.');
      return;
    }
    if (!content.trim()) {
      alert('Please write article content.');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const secondary = secondaryKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugifyTitle(title),
      subtitle: subtitle.trim(),
      summary: summary.trim() || subtitle.trim() || title.trim(),
      content,
      category,
      tags,
      author: {
        name: authorName.trim(),
        designation: authorDesignation.trim(),
        avatarUrl: authorAvatar,
        bio: authorBio.trim(),
      },
      featuredImage: {
        url: imageUrl,
        altText: imageAlt.trim() || `${title.trim()} - CricPlus24 Editorial`,
        caption: imageCaption.trim(),
      },
      status,
      isFeatured,
      seo: {
        seoTitle: seoTitle.trim() || `${title.trim()} | CricPlus24`,
        metaDescription: metaDescription.trim() || summary.trim().slice(0, 160),
        primaryKeyword: primaryKeyword.trim(),
        secondaryKeywords: secondary,
        canonicalUrl: canonicalUrl.trim() || `https://www.cricplus24.in/news/${slug.trim() || slugifyTitle(title)}`,
        ogTitle: ogTitle.trim() || seoTitle.trim() || title.trim(),
        ogDescription: ogDescription.trim() || metaDescription.trim() || summary.trim().slice(0, 160),
        ogImage: imageUrl,
        twitterCardImage: imageUrl,
        imageAltText: imageAlt.trim() || title.trim(),
        robotsIndex,
        robotsFollow,
        articleSchema,
      },
      faqs,
    };

    try {
      const url = '/api/blogs';
      const method = editingSlug ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: `Article "${data.post?.title || title}" ${editingSlug ? 'updated' : 'published'} successfully!`,
        });
        setIsModalOpen(false);
        loadArticles();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save article.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error saving article.' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (delSlug: string, artTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${artTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blogs?slug=${encodeURIComponent(delSlug)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setArticles(articles.filter((a) => a.slug !== delSlug));
        alert('Article deleted successfully.');
      } else {
        alert(data.error || 'Failed to delete article.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error deleting article.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#08111F] via-[#0D1B2A] to-[#111D2D] border border-[#D8AD55]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D8AD55]" />
            <h2 className="font-display font-black text-2xl text-white tracking-wide">
              Editorial Studio &amp; Advanced SEO Manager
            </h2>
          </div>
          <p className="text-xs text-[#8793A5] max-w-2xl">
            Author and publish 100% original CricPlus24 cricket editorials, tactical breakdowns, and news with live Google Search previews, automated SEO checks, and rich schema markup.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-press self-start md:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-lg shadow-[#D8AD55]/20"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Article</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Articles Management Table */}
      <div className="bg-[#08111F] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
            <BookOpen className="w-4 h-4 text-[#D8AD55]" />
            <span>Published &amp; Draft Editorials ({articles.length})</span>
          </div>
          <span className="text-[11px] text-[#8793A5]">Exclusive CricPlus24 Original Content</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#8793A5]">
            <Clock className="w-6 h-6 animate-spin mx-auto text-[#D8AD55] mb-2" />
            Loading editorial vault...
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8793A5] space-y-2">
            <FileText className="w-8 h-8 mx-auto text-[#D8AD55]/60 mb-2" />
            <div className="font-bold text-white text-sm">No articles published yet</div>
            <p>Click &quot;Write New Article&quot; to author your first high-ranking cricket analysis piece.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {articles.map((art) => (
              <div
                key={art.slug}
                className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-[#0D1B2A]">
                    <img
                      src={art.featuredImage?.url || '/images/cricplus-stadium-4k.jpg'}
                      alt={art.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30">
                        {art.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          art.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        }`}
                      >
                        {art.status.toUpperCase()}
                      </span>
                      {art.isFeatured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40">
                          FEATURED
                        </span>
                      )}
                      <span className="text-[11px] text-[#8793A5]">{art.readingTime}</span>
                    </div>

                    <h3 className="font-display font-bold text-base text-white hover:text-[#D8AD55] transition-colors line-clamp-1">
                      {art.title}
                    </h3>
                    <p className="text-xs text-[#8793A5] line-clamp-1">{art.summary}</p>
                    <div className="text-[10px] text-[#556987]">
                      By {art.author?.name} • Published {new Date(art.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={`/news/${art.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8793A5] hover:text-white transition-colors"
                    title="View Public Article"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleOpenEdit(art)}
                    className="p-2 rounded-lg bg-[#D8AD55]/20 hover:bg-[#D8AD55]/30 text-[#F2D69A] transition-colors"
                    title="Edit Article &amp; SEO"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(art.slug, art.title)}
                    className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FULL ARTICLE & SEO MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-[#08111F] rounded-3xl border border-[#D8AD55]/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0D1B2A]/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    {editingSlug ? 'Edit CricPlus24 Editorial' : 'Compose Original Cricket Article'}
                  </h3>
                  <p className="text-[11px] text-[#8793A5]">
                    Equipped with automated Google SEO validation, custom metadata, and rich media tools.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8793A5] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-[#08111F] shrink-0">
              <button
                onClick={() => setEditorTab('content')}
                className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  editorTab === 'content'
                    ? 'border-[#D8AD55] text-[#F2D69A]'
                    : 'border-transparent text-[#8793A5] hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Article &amp; Rich Editor</span>
              </button>

              <button
                onClick={() => setEditorTab('seo')}
                className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  editorTab === 'seo'
                    ? 'border-[#D8AD55] text-[#F2D69A]'
                    : 'border-transparent text-[#8793A5] hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Advanced SEO &amp; Schema</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#D8AD55]/30 text-[#F2D69A]">
                  Live
                </span>
              </button>

              <button
                onClick={() => setEditorTab('preview')}
                className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  editorTab === 'preview'
                    ? 'border-[#D8AD55] text-[#F2D69A]'
                    : 'border-transparent text-[#8793A5] hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Google &amp; Reader Preview</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* TAB 1: CONTENT & RICH TEXT */}
              {editorTab === 'content' && (
                <div className="space-y-6">
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="font-semibold text-gray-300 flex items-center justify-between">
                        <span>Article Primary Title (H1) *</span>
                        <span className="text-[10px] text-[#8793A5]">Serves as unique page H1</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Masterclass: Decoding Modern Death Overs Bowling Dynamics"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-semibold focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">URL Slug *</label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="masterclass-decoding-modern-death-overs"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-[#F2D69A] font-mono text-[11px] focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Subtitle & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="font-semibold text-gray-300">Subtitle / Editorial Deck</label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Key tactical adjustments franchises use to defend low totals."
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-[#F2D69A] font-bold focus:border-[#D8AD55] focus:outline-none"
                      >
                        {EDITORIAL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Excerpt / Summary */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-300 flex items-center justify-between">
                      <span>Short Description / Excerpt *</span>
                      <span className="text-[10px] text-[#8793A5]">{summary.length} characters</span>
                    </label>
                    <textarea
                      rows={2}
                      value={summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      placeholder="Brief 2-3 sentence overview highlighting the article's core takeaway."
                      className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white focus:border-[#D8AD55] focus:outline-none"
                    />
                  </div>

                  {/* RICH TEXT FORMATTING TOOLBAR */}
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-300 flex items-center justify-between">
                      <span>Article Content (Markdown &amp; HTML Supported) *</span>
                      <span className="text-[10px] text-[#D8AD55]">
                        {content.trim().split(/\s+/).filter(Boolean).length} words • {calculateReadingTime(content)}
                      </span>
                    </label>

                    {/* Toolbar buttons */}
                    <div className="p-2 rounded-t-xl bg-[#0D1B2A] border border-white/10 border-b-0 flex flex-wrap items-center gap-1.5 text-gray-300">
                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('\n## ', '\n', 'Section Subheading')}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-white font-bold flex items-center gap-1"
                        title="Insert H2 (Section Subheading)"
                      >
                        <Heading2 className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>H2</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('\n### ', '\n', 'Subsection Title')}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-white font-bold flex items-center gap-1"
                        title="Insert H3 (Subsection Title)"
                      >
                        <Heading3 className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>H3</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('\n#### ', '\n', 'Minor Subheading')}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-white font-bold flex items-center gap-1"
                        title="Insert H4"
                      >
                        <Heading4 className="w-3.5 h-3.5 text-[#D8AD55]" />
                        <span>H4</span>
                      </button>

                      <div className="w-px h-4 bg-white/15 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('**', '**', 'bold text')}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('*', '*', 'italic text')}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('\n> *"', '"*\n', 'Insightful quote or statement')}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white"
                        title="Blockquote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('\n- ', '\n- Item 2\n- Item 3\n', 'Bullet point 1')}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertTextAtCursor('\n1. ', '\n2. Step 2\n3. Step 3\n', 'Step 1')}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-4 bg-white/15 mx-1" />

                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor(
                            '\n| Player / Metric | Statistic | Impact Ratio |\n|---|---|---|\n| Jasprit Bumrah | 6.25 ER | 94.2% |\n| Rashid Khan | 6.60 ER | 91.0% |\n\n'
                          )
                        }
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-white font-bold flex items-center gap-1"
                        title="Insert Cricket Comparison Table"
                      >
                        <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Table</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor(
                            '\n![Image Description](/images/cricplus-stadium-4k.jpg)\n*Caption: ICC World Championship Arena in full capacity*\n\n'
                          )
                        }
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-white font-bold flex items-center gap-1"
                        title="Insert Image with Caption"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          insertTextAtCursor(
                            '\n<div className="my-6 rounded-2xl overflow-hidden aspect-video">\n  <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="Match Highlights" className="w-full h-full border-0" allowFullScreen></iframe>\n</div>\n\n'
                          )
                        }
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-white font-bold flex items-center gap-1"
                        title="Insert Embedded Video"
                      >
                        <Video className="w-3.5 h-3.5 text-rose-400" />
                        <span>Video Embed</span>
                      </button>

                      <div className="w-px h-4 bg-white/15 mx-1" />

                      {/* Internal link inserter */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const [u, lbl] = e.target.value.split('|');
                            insertTextAtCursor(`[${lbl}](${u})`);
                            e.target.value = '';
                          }
                        }}
                        className="px-2 py-1 rounded bg-[#08111F] border border-white/20 text-[#D8AD55] font-semibold text-[11px]"
                      >
                        <option value="">+ Internal CricPlus Link...</option>
                        {INTERNAL_LINK_PRESETS.map((p) => (
                          <option key={p.url} value={`${p.url}|${p.label}`}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={14}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your in-depth analysis here using standard markdown..."
                      className="w-full p-4 rounded-b-xl bg-[#040814] border border-white/10 text-gray-100 font-mono text-xs leading-relaxed focus:border-[#D8AD55] focus:outline-none"
                    />
                  </div>

                  {/* Featured Image & Presets */}
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0D1B2A] border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#D8AD55]" />
                        <span>Featured Image &amp; ALT Text *</span>
                      </span>
                      <span className="text-[10px] text-[#8793A5]">Required for Google News &amp; Social Previews</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-400 text-[11px]">Image URL</label>
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="/images/cricplus-stadium-4k.jpg"
                          className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-mono text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 text-[11px]">Image ALT Text (Accessibility &amp; SEO) *</label>
                        <input
                          type="text"
                          value={imageAlt}
                          onChange={(e) => setImageAlt(e.target.value)}
                          placeholder="Tactical pitch layout during cricket death overs"
                          className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 text-[11px]">Caption (Optional)</label>
                        <input
                          type="text"
                          value={imageCaption}
                          onChange={(e) => setImageCaption(e.target.value)}
                          placeholder="Photo courtesy of CricPlus24 Sports Desk"
                          className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white"
                        />
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[10px] text-[#8793A5]">Quick Presets:</span>
                      {PRESET_COVERS.map((p) => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() => setImageUrl(p.url)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            imageUrl === p.url
                              ? 'bg-[#D8AD55]/20 text-[#F2D69A] border-[#D8AD55]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Author Information */}
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0D1B2A] border border-white/5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D8AD55]" />
                      <span>Author &amp; Editorial Attribution (E-E-A-T)</span>
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-gray-400 text-[11px]">Author Name *</label>
                        <input
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 text-[11px]">Designation / Title</label>
                        <input
                          type="text"
                          value={authorDesignation}
                          onChange={(e) => setAuthorDesignation(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-gray-400 text-[11px]">Author Avatar URL</label>
                        <input
                          type="text"
                          value={authorAvatar}
                          onChange={(e) => setAuthorAvatar(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-gray-400 text-[11px]">Author Professional Biography</label>
                      <textarea
                        rows={2}
                        value={authorBio}
                        onChange={(e) => setAuthorBio(e.target.value)}
                        placeholder="Professional background, sporting journalism experience, and domain expertise..."
                        className="w-full px-3 py-2 rounded-xl bg-[#08111F] border border-white/10 text-white"
                      />
                    </div>
                  </div>

                  {/* Tags & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="font-semibold text-gray-300">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="Cricket, IPL, Bowling Tactics, ICC, World Cup"
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Article Status</label>
                      <select
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-[#F2D69A] font-bold focus:border-[#D8AD55] focus:outline-none"
                      >
                        <option value="published">Published (Live &amp; Crawlable)</option>
                        <option value="draft">Draft (Admin Only)</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0D1B2A] border border-white/5">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D8AD55] focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="isFeatured" className="font-semibold text-white cursor-pointer">
                      Pin as Featured Lead Story (Prominently highlighted at top of News page)
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: ADVANCED SEO SETTINGS */}
              {editorTab === 'seo' && (
                <div className="space-y-6">
                  {/* SEO Guidance Header */}
                  <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 space-y-2">
                    <div className="flex items-center gap-2 font-display font-bold text-white text-sm">
                      <Globe className="w-4 h-4 text-[#D8AD55]" />
                      <span>Dedicated Search Engine Optimization Panel</span>
                    </div>
                    <p className="text-[#8793A5] text-[11px]">
                      Fine-tune search titles, meta descriptions, canonical URLs, and schema markup for Google, Bing, and major international search engines.
                    </p>
                  </div>

                  {/* SEO Title & Meta Description */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-gray-300">
                        <span>SEO Title Tag</span>
                        <span className={`text-[11px] ${seoTitle.length > 60 ? 'text-amber-400 font-bold' : 'text-[#8793A5]'}`}>
                          {seoTitle.length} / 60 characters
                        </span>
                      </div>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={`${title || 'Article Title'} | CricPlus24`}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-semibold focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-gray-300">
                        <span>Meta Description</span>
                        <span className={`text-[11px] ${metaDescription.length > 160 ? 'text-amber-400 font-bold' : 'text-[#8793A5]'}`}>
                          {metaDescription.length} / 160 characters
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="Concise, compelling snippet that summarizes the article to searchers..."
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-white focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Keywords & Canonical */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Primary Keyword (Editorial Guidance)</label>
                      <input
                        type="text"
                        value={primaryKeyword}
                        onChange={(e) => setPrimaryKeyword(e.target.value)}
                        placeholder="e.g. Death Overs Bowling"
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Secondary Keywords</label>
                      <input
                        type="text"
                        value={secondaryKeywords}
                        onChange={(e) => setSecondaryKeywords(e.target.value)}
                        placeholder="Yorker technique, T20 cricket, Cricket strategy"
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white focus:border-[#D8AD55] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-gray-300">Canonical URL</label>
                    <input
                      type="text"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder={`https://www.cricplus24.in/news/${slug || 'article-slug'}`}
                      className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-[#F2D69A] font-mono text-[11px] focus:border-[#D8AD55] focus:outline-none"
                    />
                  </div>

                  {/* Social & Robots Directives */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Robots Indexation</label>
                      <select
                        value={robotsIndex}
                        onChange={(e: any) => setRobotsIndex(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
                      >
                        <option value="index">index (Allow search engines)</option>
                        <option value="noindex">noindex (Do not show in search)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Robots Follow</label>
                      <select
                        value={robotsFollow}
                        onChange={(e: any) => setRobotsFollow(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-white font-bold"
                      >
                        <option value="follow">follow (Crawl outbound links)</option>
                        <option value="nofollow">nofollow</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-gray-300">Schema JSON-LD Type</label>
                      <select
                        value={articleSchema}
                        onChange={(e: any) => setArticleSchema(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-[#0D1B2A] border border-white/10 text-[#F2D69A] font-bold"
                      >
                        <option value="Article">Article (Standard)</option>
                        <option value="NewsArticle">NewsArticle (Time-sensitive)</option>
                        <option value="BlogPosting">BlogPosting (Editorial analysis)</option>
                      </select>
                    </div>
                  </div>

                  {/* FAQ Section Builder */}
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0D1B2A] border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-[#D8AD55]" />
                          <span>Structured FAQ Section ({faqs.length})</span>
                        </div>
                        <p className="text-[10px] text-[#8793A5]">Generates eligible FAQPage schema markup where appropriate.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addFaqItem}
                        className="px-3 py-1.5 rounded-lg bg-[#D8AD55]/20 text-[#F2D69A] hover:bg-[#D8AD55]/30 font-bold text-[10px] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Question</span>
                      </button>
                    </div>

                    {faqs.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-[#08111F] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#F2D69A] text-[11px]">FAQ #{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFaqItem(i)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={f.question}
                          onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                          placeholder="e.g. What is the most effective ball to bowl in the 20th over?"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0D1B2A] border border-white/10 text-white text-xs"
                        />
                        <textarea
                          rows={2}
                          value={f.answer}
                          onChange={(e) => updateFaqItem(i, 'answer', e.target.value)}
                          placeholder="Direct, comprehensive answer..."
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0D1B2A] border border-white/10 text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  {/* AUTOMATED SEO VALIDATION AUDIT CHECKLIST */}
                  <div className="space-y-3 p-4 rounded-2xl bg-[#0D1B2A] border border-white/5">
                    <div className="flex items-center gap-2 font-display font-bold text-white text-sm">
                      <BarChart2 className="w-4 h-4 text-[#D8AD55]" />
                      <span>Automated Editorial &amp; SEO Checks</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {seoAudit.map((check, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#08111F] border border-white/5 flex items-start gap-2.5"
                        >
                          {check.status === 'passed' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {check.status === 'warning' && (
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          {check.status === 'needs_attention' && (
                            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-[11px]">{check.label}</span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                  check.status === 'passed'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : check.status === 'warning'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {check.status.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#8793A5] leading-tight">{check.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LIVE PREVIEW */}
              {editorTab === 'preview' && (
                <div className="space-y-6">
                  {/* Google Search Live Preview */}
                  <div className="p-5 rounded-2xl bg-[#0D1B2A] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>Google Search SERP Result Preview</span>
                      </span>
                      <span className="text-[10px] text-[#8793A5]">Desktop &amp; Mobile Search Display</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1F1F1F] border border-[#333] space-y-1.5 max-w-2xl font-sans text-left">
                      <div className="flex items-center gap-2 text-xs text-[#bdc1c6]">
                        <div className="w-4 h-4 rounded-full bg-[#08111F] border border-[#D8AD55]/40 flex items-center justify-center text-[9px] text-[#D8AD55] font-black">
                          CP
                        </div>
                        <div className="truncate">
                          <span className="text-white font-medium">CricPlus24</span>
                          <span className="text-gray-400 mx-1">›</span>
                          <span className="text-gray-400">news</span>
                          <span className="text-gray-400 mx-1">›</span>
                          <span className="text-gray-400">{slug || 'article-slug'}</span>
                        </div>
                      </div>

                      <h4 className="text-lg text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-snug">
                        {seoTitle || `${title || 'Article Title'} | CricPlus24`}
                      </h4>

                      <p className="text-xs text-[#bdc1c6] leading-relaxed line-clamp-2">
                        {metaDescription || summary || 'Article summary will appear in Google search snippets...'}
                      </p>
                    </div>
                  </div>

                  {/* Article Reader Quick Preview */}
                  <div className="p-6 rounded-2xl bg-[#040814] border border-white/10 space-y-4">
                    <div className="text-[10px] uppercase font-bold text-[#D8AD55] tracking-wider">
                      Live Reader Preview
                    </div>

                    <div className="space-y-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40">
                        {category}
                      </span>

                      <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                        {title || 'Article Title'}
                      </h1>

                      {subtitle && <p className="text-sm font-semibold text-[#D8AD55]">{subtitle}</p>}

                      <div className="flex items-center gap-3 text-xs text-[#8793A5] border-y border-white/5 py-2">
                        <span>By {authorName}</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{calculateReadingTime(content)}</span>
                      </div>

                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/10 bg-[#0D1B2A]">
                        <img src={imageUrl} alt={imageAlt || title} className="w-full h-full object-cover" />
                      </div>

                      <div className="prose prose-invert max-w-none text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                        {content || 'Article paragraphs will render here...'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#0D1B2A]/90 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#8793A5]">Status:</span>
                <span className="text-[11px] font-bold text-[#F2D69A] uppercase">{status}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveArticle}
                  disabled={saving}
                  className="btn-press flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingSlug ? 'Update Article & SEO' : 'Publish Article'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
