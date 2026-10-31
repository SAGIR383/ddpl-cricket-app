'use client';

import { useState, useEffect } from 'react';
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
  Flame,
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  summary?: string;
  content: string;
  cover_image_url?: string;
  category: string;
  status: 'draft' | 'published';
  is_featured: boolean;
  author_name: string;
  published_at: string;
  views_count?: number;
}

const CATEGORY_OPTIONS = [
  'Editorial',
  'Tactical Analysis',
  'Opinions',
  'Match Previews',
  'Corporate Cricket Spotlight',
  'Technology & Debates',
];

const PRESET_COVERS = [
  { label: 'Stadium Floodlights 4K', url: '/images/cricplus-stadium-4k.jpg' },
  { label: 'Cricket Ball Blast', url: '/images/cricket-ball-blast.jpg' },
  { label: 'Tournament Hero Action', url: '/images/cricket-hero.jpg' },
  { label: 'International Arena', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80' },
];

export function BlogStudio() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Editorial');
  const [coverImageUrl, setCoverImageUrl] = useState('/images/cricplus-stadium-4k.jpg');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch('/api/blogs?includeDrafts=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to load blogs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function handleOpenCreate() {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setCategory('Editorial');
    setCoverImageUrl('/images/cricplus-stadium-4k.jpg');
    setStatus('published');
    setIsFeatured(false);
    setContent(
      '### Introduction\nWrite your insights on current cricket events, player performances, or tactical breakdowns here...\n\n> "Add an inspiring quote or key match statistic."\n\n### Strategic Takeaways\n1. Key lesson from the match\n2. Bowling discipline under pressure\n3. Fielding energy and team culture'
    );
    setPreviewMode(false);
    setStatusMessage(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(post: BlogPost) {
    setEditingId(post.id);
    setTitle(post.title);
    setSubtitle(post.subtitle || '');
    setCategory(post.category);
    setCoverImageUrl(post.cover_image_url || '/images/cricplus-stadium-4k.jpg');
    setStatus(post.status);
    setIsFeatured(Boolean(post.is_featured));
    setContent(post.content);
    setPreviewMode(false);
    setStatusMessage(null);
    setIsModalOpen(true);
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMessage({ type: 'error', text: 'Title and content cannot be empty.' });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        id: editingId || undefined,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        summary: subtitle.trim() || title.trim(),
        content: content.trim(),
        cover_image_url: coverImageUrl,
        category,
        status,
        is_featured: isFeatured,
      };

      const res = await fetch('/api/blogs', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save article.');
      }

      setStatusMessage({
        type: 'success',
        text: editingId ? 'Article updated successfully!' : 'Article published globally!',
      });

      await loadPosts();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 900);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePost(id: string, title: string) {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blogs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Network error while deleting');
    }
  }

  // Quick formatting buttons for markdown content
  function insertFormat(prefix: string, suffix = '') {
    setContent((prev) => `${prev}\n${prefix} ${suffix}`);
  }

  return (
    <div className="space-y-6">
      
      {/* Studio Header Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#08111F] via-[#0E1F35] to-[#142946] border border-[#D8AD55]/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#D8AD55] text-black text-[10px] font-black uppercase tracking-wider">
              Master Admin Exclusive
            </span>
            <span className="text-xs text-[#D8AD55] font-bold">• Global Publishing</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide flex items-center gap-2.5">
            <span>✍️ CricPlus Editorial &amp; Blog Studio</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            Write and publish exclusive match analysis, tournament spotlight reports, and cricket opinions. Your published stories appear instantly on the live news portal across the world!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-press flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#D8AD55]/20 hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Write New Article</span>
          </button>
        </div>
      </div>

      {/* Articles Management Table */}
      <div className="rounded-2xl border border-gray-800 bg-[#08111F] overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D8AD55]" />
            <h3 className="font-display font-bold text-white text-base">Your Editorial Articles ({posts.length})</h3>
          </div>
          <span className="text-xs text-gray-400">Only accessible by website owner</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 space-y-2">
            <Sparkles className="w-6 h-6 text-[#D8AD55] animate-spin mx-auto" />
            <p className="text-xs">Loading articles…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center px-4 space-y-3">
            <BookOpen className="w-10 h-10 text-[#D8AD55]/50 mx-auto" />
            <h4 className="text-white font-bold text-sm">No articles published yet</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Start by writing your first tournament recap or cricket insights article.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#D8AD55] text-black text-xs font-bold hover:bg-[#F2D69A]"
            >
              Write First Article
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/80">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#0D1B2A]/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        post.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      ● {post.status.toUpperCase()}
                    </span>
                    {post.is_featured && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-[#D8AD55]" />
                        <span>Pinned Hero</span>
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#D8AD55] uppercase">{post.category}</span>
                  </div>

                  <h4 className="font-display font-bold text-white text-base truncate">{post.title}</h4>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D8AD55]" />
                      {new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      {post.views_count || 0} views
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/news/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-xs flex items-center gap-1 font-semibold"
                    title="View live article"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View Live</span>
                  </a>

                  <button
                    onClick={() => handleOpenEdit(post)}
                    className="p-2 rounded-xl bg-[#D8AD55]/20 text-[#F2D69A] hover:bg-[#D8AD55]/30 transition-colors text-xs flex items-center gap-1 font-semibold"
                    title="Edit article"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeletePost(post.id, post.title)}
                    className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors text-xs"
                    title="Delete article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#08111F] border border-[#D8AD55]/40 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 flex items-center justify-center text-[#D8AD55]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-white">
                    {editingId ? 'Edit Editorial Article' : 'Write New Editorial Article'}
                  </h3>
                  <p className="text-xs text-gray-400">Master Super Admin Publishing Studio</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification alert */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : 'bg-red-500/20 border border-red-500/40 text-red-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-5">
              
              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Article Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cummins Masterclass: How Field Placements Won the Decider"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#0D1B2A] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Subtitle / Summary Teaser
                  </label>
                  <input
                    type="text"
                    placeholder="Brief 1-2 sentence overview shown in feeds and search results"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-[#0D1B2A] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              {/* Category, Status, & Featured Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0D1B2A] border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D8AD55]"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                    Publishing Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#0D1B2A] border border-gray-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-[#D8AD55]"
                  >
                    <option value="published">🟢 Published (Live to World)</option>
                    <option value="draft">🟡 Draft (Admin Only)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0D1B2A] border border-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-gray-700 text-[#D8AD55] focus:ring-0"
                    />
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#D8AD55]" />
                      Pin to Top Hero Banner
                    </span>
                  </label>
                </div>
              </div>

              {/* Cover Image Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://... or select preset below"
                    className="flex-1 bg-[#0D1B2A] border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Presets:</span>
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCoverImageUrl(preset.url)}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Markdown Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Article Body (Markdown Supported) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-xs text-[#D8AD55] font-bold hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{previewMode ? 'Back to Edit' : 'Live Preview'}</span>
                  </button>
                </div>

                {/* Quick Toolbar */}
                {!previewMode && (
                  <div className="flex items-center gap-1.5 p-2 rounded-t-xl bg-[#0D1B2A] border-x border-t border-gray-800 text-xs">
                    <button
                      type="button"
                      onClick={() => insertFormat('##', '')}
                      className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat('###', '')}
                      className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold"
                    >
                      H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat('>', '')}
                      className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 italic"
                    >
                      Quote
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormat('- ', '')}
                      className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300"
                    >
                      List
                    </button>
                  </div>
                )}

                {previewMode ? (
                  <div className="p-4 rounded-xl bg-[#0D1B2A] border border-gray-800 text-gray-200 min-h-[220px] max-h-72 overflow-y-auto text-sm space-y-2">
                    {content.split('\n').map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={9}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your article here..."
                    className="w-full bg-[#0D1B2A] border border-gray-800 rounded-b-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#D8AD55]"
                  />
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-press flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Publishing…' : editingId ? 'Save Changes' : 'Publish Article'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
