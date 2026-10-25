'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Building2,
  Globe2,
  DollarSign,
  Gavel,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Users,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Layers,
  Sliders,
  Upload,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CountryCurrencyOption {
  country: string;
  code: string;
  flag: string;
  currency: string;
  symbol: string;
}

const GLOBAL_COUNTRIES: CountryCurrencyOption[] = [
  { country: 'India', code: 'IN', flag: '🇮🇳', currency: 'INR', symbol: '₹' },
  { country: 'United States', code: 'US', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { country: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ' },
  { country: 'United Kingdom', code: 'GB', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  { country: 'Australia', code: 'AU', flag: '🇦🇺', currency: 'AUD', symbol: 'A$' },
  { country: 'Canada', code: 'CA', flag: '🇨🇦', currency: 'CAD', symbol: 'C$' },
  { country: 'Bangladesh', code: 'BD', flag: '🇧🇩', currency: 'BDT', symbol: '৳' },
  { country: 'Singapore', code: 'SG', flag: '🇸🇬', currency: 'SGD', symbol: 'S$' },
  { country: 'Global / Points', code: 'GL', flag: '🌍', currency: 'PTS', symbol: 'Pts' },
];

const THEME_OPTIONS = [
  {
    id: 'gold',
    name: 'Midnight & Gold',
    badge: 'border-[#D8AD55]/40 text-[#F2D69A] bg-[#D8AD55]/20',
    banner: 'from-[#08111F] via-[#0E1F35] to-[#142946]',
    accentHex: '#D8AD55',
  },
  {
    id: 'emerald',
    name: 'Cyber Emerald',
    badge: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/20',
    banner: 'from-[#061A14] via-[#0B2C22] to-[#05140F]',
    accentHex: '#10B981',
  },
  {
    id: 'cyan',
    name: 'Sapphire Cyan',
    badge: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/20',
    banner: 'from-[#071728] via-[#0B2744] to-[#05111F]',
    accentHex: '#06B6D4',
  },
  {
    id: 'purple',
    name: 'Neon Violet',
    badge: 'border-purple-500/40 text-purple-300 bg-purple-500/20',
    banner: 'from-[#190C2C] via-[#2A1348] to-[#120820]',
    accentHex: '#A855F7',
  },
  {
    id: 'amber',
    name: 'Fiery Amber',
    badge: 'border-amber-500/40 text-amber-300 bg-amber-500/20',
    banner: 'from-[#1E1107] via-[#321B0B] to-[#160B04]',
    accentHex: '#F59E0B',
  },
];

const FORMAT_OPTIONS = [
  {
    id: 't10',
    name: 'Corporate T10 (10 Overs)',
    overs: 10,
    desc: 'Rapid 90-minute fast match format. Max 2 overs per bowler.',
    format: 'ddpl' as const,
  },
  {
    id: 't12',
    name: 'Premier T12 (12 Overs)',
    overs: 12,
    desc: 'Game of RUN standard format. Max 3 overs per bowler.',
    format: 'game-of-run' as const,
  },
  {
    id: 't20',
    name: 'Championship T20 (20 Overs)',
    overs: 20,
    desc: 'International standard format. Max 4 overs per bowler.',
    format: 'ddpl' as const,
  },
  {
    id: 'box8',
    name: 'Box Cricket (8 Overs)',
    overs: 8,
    desc: 'Indoor turf / turf arena box cricket format.',
    format: 'ddpl' as const,
  },
  {
    id: 'custom',
    name: 'Custom Format & Overs',
    overs: 15,
    desc: 'Self-configure exact match overs (5–50), bowler quota, ball type, & bracket format.',
    format: 'ddpl' as const,
  },
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user, isSuperAdmin, profile } = useAuth();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [orgName, setOrgName] = useState('');
  const [orgTagline, setOrgTagline] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCurrencyOption>(GLOBAL_COUNTRIES[0]);
  const [selectedTheme, setSelectedTheme] = useState(THEME_OPTIONS[0]);
  const [customLogo, setCustomLogo] = useState('');

  const [tournamentName, setTournamentName] = useState('');
  const [shortName, setShortName] = useState('');
  const [season, setSeason] = useState('2026');
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_OPTIONS[0]);

  // Custom Match Format & Overs State
  const [customOvers, setCustomOvers] = useState(15);
  const [customFormatName, setCustomFormatName] = useState('Corporate T15 Super Cup');
  const [customMaxBowlerOvers, setCustomMaxBowlerOvers] = useState(3);
  const [customTournamentStructure, setCustomTournamentStructure] = useState<'round-robin-playoffs' | 'group-stage-playoffs'>('round-robin-playoffs');
  const [customPitchType, setCustomPitchType] = useState('Tennis / Tape Ball (Turf Ground)');
  const [customBallsPerOver, setCustomBallsPerOver] = useState(6);
  const [showAdvancedTuning, setShowAdvancedTuning] = useState(false);

  const [pursePerTeam, setPursePerTeam] = useState(10000);
  const [ownerBasePrice, setOwnerBasePrice] = useState(500);
  const [maxSquad, setMaxSquad] = useState(11);
  const [minSquad, setMinSquad] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Super Admin Credentials
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState(user?.email || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size must be under 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setCustomLogo(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submission & Success
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-generate tournament short name
  const handleTournamentNameChange = (val: string) => {
    setTournamentName(val);
    if (!shortName || shortName.length <= 4) {
      const generated = val
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      setShortName(generated);
    }
  };

  const handleLaunchTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name');
      return;
    }
    const finalEmail = isSuperAdmin ? (user?.email || organizerEmail.trim()) : organizerEmail.trim();
    if (!finalEmail) {
      alert('Organizer email is required for administration access');
      return;
    }
    if (!isSuperAdmin && (!adminPassword.trim() || adminPassword.trim().length < 6)) {
      alert('Please create a Super Admin password (minimum 6 characters) to manage and govern your tournament.');
      return;
    }

    setSubmitting(true);
    try {
      const isCustom = selectedFormat.id === 'custom' || showAdvancedTuning;
      const resolvedOvers = isCustom ? Number(customOvers) || 10 : selectedFormat.overs;
      const resolvedFormat = isCustom
        ? (customTournamentStructure === 'group-stage-playoffs' ? 'game-of-run' : 'ddpl')
        : selectedFormat.format;
      const resolvedMaxBowler = isCustom
        ? Number(customMaxBowlerOvers) || Math.max(1, Math.ceil(resolvedOvers / 5))
        : Math.max(1, Math.ceil(selectedFormat.overs / 5));

      const payload = {
        action: 'create_tournament',
        name: tournamentName.trim(),
        shortName: shortName.trim() || undefined,
        fullName: `${tournamentName.trim()} Championship`,
        tagline: orgTagline.trim() || (isCustom ? `${customFormatName} (${resolvedOvers} Overs)` : `Official ${tournamentName.trim()} Corporate Cricket Tournament`),
        season,
        format: resolvedFormat,
        overs: resolvedOvers,
        maxBowlerOvers: resolvedMaxBowler,
        ballsPerOver: isCustom ? customBallsPerOver : 6,
        pitchType: isCustom ? customPitchType : undefined,
        formatTitle: isCustom ? customFormatName : selectedFormat.name,
        pursePerTeam: Number(pursePerTeam) || 10000,
        ownerBasePrice: Number(ownerBasePrice) || 500,
        maxSquad: Number(maxSquad) || 11,
        minSquad: Number(minSquad) || 7,
        bannerColor: selectedTheme.banner,
        startDate: startDate || null,
        endDate: endDate || null,
        organizationName: orgName.trim() || `${tournamentName.trim()} Sports Committee`,
        country: selectedCountry.country,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.symbol,
        creatorEmail: finalEmail,
        adminPassword: isSuperAdmin ? undefined : adminPassword.trim(),
        adminPin: isSuperAdmin ? undefined : adminPin.trim(),
        logo: customLogo || '/images/default-tournament.svg',
        isPublic: true,
      };

      const res = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.tournament) {
        setCreatedResult(data.tournament);
      } else {
        alert(data.error || 'Failed to create tournament. Please try again.');
      }
    } catch (err: any) {
      alert(`Error creating tournament: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Badge */}
      <div className="flex items-center justify-between">
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-1.5 text-xs text-[#8793A5] hover:text-[#F2D69A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tournaments Directory</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-xs font-bold uppercase tracking-wider">
          <Globe2 className="w-3.5 h-3.5 text-[#D8AD55]" />
          <span>Global Corporate Onboarding</span>
        </span>
      </div>

      {/* Main Header */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
          Host Your Corporate Cricket Tournament
        </h1>
        <p className="text-sm sm:text-base text-[#8793A5] max-w-2xl mx-auto">
          Launch an international-grade cricket tournament with live multiplayer auctions, digital scoring, public player registration, and automated standings.
        </p>
      </div>

      {/* Wizard Step Progress Pills */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {[
          { step: 1, label: 'Organization & Brand', icon: Building2 },
          { step: 2, label: 'Tournament & Rules', icon: Trophy },
          { step: 3, label: 'Host & Launch', icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStep(s.step as any)}
              className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] border-[#D8AD55] shadow-lg shadow-[#D8AD55]/20 font-extrabold'
                  : isDone
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#0D1B2A]/80 text-[#8793A5] border-[#D8AD55]/20 hover:text-white'
              }`}
            >
              {isDone ? <Check className="w-4 h-4 text-emerald-400" /> : <Icon className="w-4 h-4" />}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Wizard Body Card */}
      <div className="rounded-3xl bg-[#0D1B2A]/90 backdrop-blur-xl border border-[#D8AD55]/30 p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* STEP 1: ORGANIZATION & BRAND */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#D8AD55]/15 pb-4">
              <h2 className="font-display font-black text-2xl text-white">
                Step 1: Organization &amp; Brand Profile
              </h2>
              <p className="text-xs text-[#8793A5] mt-1">
                Tell us about your company, club, or tournament organizing committee.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-gray-200">
                  Company / Organization Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#D8AD55] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Cricket Club, Deloitte Sports League, Dubai Techies"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm font-semibold focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-gray-200">
                  Corporate Tagline / Slogan
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inter-Departmental Champions League 2026"
                  value={orgTagline}
                  onChange={(e) => setOrgTagline(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              {/* Tournament Custom Logo Upload */}
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-bold text-gray-200">
                  Tournament / Organization Logo
                </label>
                <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#D8AD55]/40 shrink-0 bg-[#0D1B2A] flex items-center justify-center shadow-lg">
                    {customLogo ? (
                      <img src={customLogo} alt="Tournament Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Trophy className="w-9 h-9 text-[#D8AD55]/60" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] text-xs font-extrabold uppercase tracking-wider cursor-pointer shadow-md hover:brightness-110 transition-all">
                        <Upload className="w-3.5 h-3.5 text-[#08111F]" />
                        <span>Upload Custom Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      {customLogo && (
                        <button
                          type="button"
                          onClick={() => setCustomLogo('')}
                          className="px-3 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8793A5] leading-relaxed">
                      Upload your company / club emblem (PNG, JPG, SVG or WEBP up to 3MB). Displayed across the live auction projector, scoreboards, and match overlays.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Host Country &amp; Currency
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const found = GLOBAL_COUNTRIES.find((c) => c.code === e.target.value);
                      if (found) setSelectedCountry(found);
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                  >
                    {GLOBAL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.country} ({c.currency} - {c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Purse Currency Display
                </label>
                <div className="p-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/20 flex items-center justify-between text-xs">
                  <span className="text-[#8793A5]">Active Currency:</span>
                  <span className="font-bold text-[#F2D69A]">
                    {selectedCountry.flag} {selectedCountry.currency} ({selectedCountry.symbol})
                  </span>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-gray-200">
                  Select Visual Brand Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        selectedTheme.id === theme.id
                          ? 'border-[#D8AD55] bg-[#D8AD55]/20 text-[#F2D69A] shadow-md'
                          : 'border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white'
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-xl mb-2"
                        style={{ backgroundColor: theme.accentHex, opacity: 0.85 }}
                      />
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!orgName.trim()) {
                    alert('Please enter your Company / Organization name.');
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="btn-press px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] font-display font-extrabold text-xs tracking-wider uppercase shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Tournament Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TOURNAMENT & RULES */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-[#D8AD55]/15 pb-4">
              <h2 className="font-display font-black text-2xl text-white">
                Step 2: Tournament Specification &amp; Rules
              </h2>
              <p className="text-xs text-[#8793A5] mt-1">
                Configure match format, team purse budgets, and squad limits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-gray-200">
                  Tournament Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Trophy className="w-4 h-4 text-[#D8AD55] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. DDPL 2027, Tech Champions Cup 2026, Bangalore IT League"
                    value={tournamentName}
                    onChange={(e) => handleTournamentNameChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-sm font-semibold focus:outline-none focus:border-[#D8AD55]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Short Acronym (3-4 Letters)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="e.g. DDPL, TCC, BITL"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55] uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Season
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026, Season 1, Summer 2026"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              {/* Match Format Selector */}
              <div className="sm:col-span-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-bold text-gray-200">
                    Match Format &amp; Overs <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-[#D8AD55] font-semibold">
                    Select a tournament format preset or customize your exact overs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map((f) => {
                    const isSelected = selectedFormat.id === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedFormat(f);
                          if (f.id === 'custom') {
                            setShowAdvancedTuning(true);
                          } else {
                            setCustomOvers(f.overs);
                            setCustomMaxBowlerOvers(Math.max(1, Math.ceil(f.overs / 5)));
                          }
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'border-[#D8AD55] bg-[#D8AD55]/15 text-white shadow-lg shadow-[#D8AD55]/10'
                            : 'border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white hover:border-[#D8AD55]/40'
                        }`}
                      >
                        {f.id === 'custom' && (
                          <div className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-[#D8AD55]/20 border border-[#D8AD55]/40 text-[#F2D69A] text-[9px] font-bold uppercase tracking-wider">
                            ✨ Custom Mode
                          </div>
                        )}
                        <div className="font-bold text-sm text-[#F2D69A] flex items-center justify-between">
                          <span>{f.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#D8AD55]" />}
                        </div>
                        <p className="text-[11px] text-[#8793A5] mt-1 leading-relaxed">{f.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* CUSTOM SECTION / STUDIO FOR ORGANIZATIONS & CLUBS */}
                {(selectedFormat.id === 'custom' || showAdvancedTuning) && (
                  <div className="mt-3 p-5 sm:p-6 rounded-3xl bg-[#08111F] border-2 border-[#D8AD55]/40 shadow-2xl space-y-5 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8AD55]/20 pb-3">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#D8AD55]" />
                        <h4 className="font-display font-bold text-base text-white">
                          Organization Custom Format &amp; Overs Studio
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        Tailored for Clubs &amp; Companies
                      </span>
                    </div>

                    {/* Quick Match Overs Preset Pills */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-gray-300">
                          Select Match Overs (Click to pick quickly):
                        </label>
                        <span className="text-[11px] text-[#F2D69A] font-bold">
                          Selected: {customOvers} Overs
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { overs: 5, label: '5 Overs (Super 6s)' },
                          { overs: 6, label: '6 Overs (Gully Clash)' },
                          { overs: 8, label: '8 Overs (Box Cricket)' },
                          { overs: 10, label: '10 Overs (T10)' },
                          { overs: 12, label: '12 Overs (T12)' },
                          { overs: 15, label: '15 Overs (Corporate T15)' },
                          { overs: 16, label: '16 Overs' },
                          { overs: 20, label: '20 Overs (T20)' },
                          { overs: 25, label: '25 Overs' },
                          { overs: 30, label: '30 Overs' },
                          { overs: 40, label: '40 Overs' },
                          { overs: 50, label: '50 Overs (One Day)' },
                        ].map((opt) => (
                          <button
                            key={opt.overs}
                            type="button"
                            onClick={() => {
                              setCustomOvers(opt.overs);
                              setCustomMaxBowlerOvers(Math.max(1, Math.ceil(opt.overs / 5)));
                              setCustomFormatName(`Corporate T${opt.overs} Cup`);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              customOvers === opt.overs
                                ? 'bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] border-[#D8AD55] shadow-md font-extrabold scale-105'
                                : 'bg-[#0D1B2A] text-[#8793A5] border-[#D8AD55]/20 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Numeric Overs & Custom Title Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-300">
                          Exact Overs Per Innings
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={customOvers}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                            setCustomOvers(val);
                            setCustomMaxBowlerOvers(Math.max(1, Math.ceil(val / 5)));
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                        />
                        <span className="text-[10px] text-[#8793A5]">Type any custom overs (1 to 100)</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-300">
                          Max Overs Per Bowler
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={customOvers}
                          value={customMaxBowlerOvers}
                          onChange={(e) => setCustomMaxBowlerOvers(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                        />
                        <span className="text-[10px] text-[#8793A5]">Standard quota: {Math.max(1, Math.ceil(customOvers / 5))} overs</span>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-300">
                          Custom Format Display Title
                        </label>
                        <input
                          type="text"
                          value={customFormatName}
                          onChange={(e) => setCustomFormatName(e.target.value)}
                          placeholder="e.g. Corporate Super 15s"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                        />
                        <span className="text-[10px] text-[#8793A5]">Shown on scorecards &amp; fixtures</span>
                      </div>
                    </div>

                    {/* Tournament Progression & Ball Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-300">
                          Tournament Bracket &amp; Progression
                        </label>
                        <div className="space-y-2">
                          <label
                            onClick={() => setCustomTournamentStructure('round-robin-playoffs')}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              customTournamentStructure === 'round-robin-playoffs'
                                ? 'border-[#D8AD55] bg-[#D8AD55]/10 text-white'
                                : 'border-[#D8AD55]/20 bg-[#0D1B2A] text-[#8793A5]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="tournament_structure"
                              checked={customTournamentStructure === 'round-robin-playoffs'}
                              onChange={() => setCustomTournamentStructure('round-robin-playoffs')}
                              className="mt-0.5 accent-[#D8AD55]"
                            />
                            <div>
                              <strong className="text-white block">Single League Round-Robin + Page Playoffs</strong>
                              <span className="text-[11px] text-[#8793A5]">All teams in 1 table. Top 4 play Qualifier 1, Eliminator, Qualifier 2, Final.</span>
                            </div>
                          </label>

                          <label
                            onClick={() => setCustomTournamentStructure('group-stage-playoffs')}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              customTournamentStructure === 'group-stage-playoffs'
                                ? 'border-[#D8AD55] bg-[#D8AD55]/10 text-white'
                                : 'border-[#D8AD55]/20 bg-[#0D1B2A] text-[#8793A5]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="tournament_structure"
                              checked={customTournamentStructure === 'group-stage-playoffs'}
                              onChange={() => setCustomTournamentStructure('group-stage-playoffs')}
                              className="mt-0.5 accent-[#D8AD55]"
                            />
                            <div>
                              <strong className="text-white block">Dual Group Stage + Semifinals &amp; Final</strong>
                              <span className="text-[11px] text-[#8793A5]">Teams split into Group A &amp; Group B. Top 2 from each group play cross-over semis.</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-300">
                          Ball Type &amp; Venue Ground
                        </label>
                        <div className="space-y-2">
                          {[
                            { id: 'Tennis / Tape Ball (Turf Ground)', desc: 'Corporate box / outdoor turf with heavy tennis or taped tennis ball.' },
                            { id: 'Leather Ball (Standard Cricket Ground)', desc: 'Official regulation leather cricket ball on standard 22-yard pitch.' },
                            { id: 'Indoor Soft-Ball (Box Cricket Arena)', desc: 'Indoor netted cage box cricket with padded boundary rules.' },
                          ].map((env) => (
                            <label
                              key={env.id}
                              onClick={() => setCustomPitchType(env.id)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                customPitchType === env.id
                                  ? 'border-[#D8AD55] bg-[#D8AD55]/10 text-white'
                                  : 'border-[#D8AD55]/20 bg-[#0D1B2A] text-[#8793A5]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="pitch_type"
                                checked={customPitchType === env.id}
                                onChange={() => setCustomPitchType(env.id)}
                                className="mt-0.5 accent-[#D8AD55]"
                              />
                              <div>
                                <strong className="text-white block">{env.id}</strong>
                                <span className="text-[11px] text-[#8793A5]">{env.desc}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live Config Banner */}
                    <div className="p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">Active Format:</span>
                        <strong className="text-[#F2D69A]">{customFormatName}</strong>
                      </div>
                      <div className="flex items-center gap-2 text-[#8793A5] font-semibold">
                        <span>⚡ {customOvers} Overs / Innings</span>
                        <span>•</span>
                        <span>🎯 Max {customMaxBowlerOvers} Overs / Bowler</span>
                        <span>•</span>
                        <span>🏏 {customPitchType.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Auction & Purse Settings */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Franchise Auction Purse ({selectedCountry.symbol})
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={pursePerTeam}
                  onChange={(e) => setPursePerTeam(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Owner Base Price ({selectedCountry.symbol})
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={ownerBasePrice}
                  onChange={(e) => setOwnerBasePrice(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Min Squad Size
                </label>
                <input
                  type="number"
                  min={5}
                  max={20}
                  value={minSquad}
                  onChange={(e) => setMinSquad(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Max Squad Size
                </label>
                <input
                  type="number"
                  min={7}
                  max={25}
                  value={maxSquad}
                  onChange={(e) => setMaxSquad(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-bold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Target Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-medium focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Target End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-medium focus:outline-none focus:border-[#D8AD55]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 rounded-2xl border border-[#D8AD55]/30 text-xs font-bold text-[#8793A5] hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!tournamentName.trim()) {
                    alert('Please enter a tournament name.');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="btn-press px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] hover:brightness-110 text-[#08111F] font-display font-extrabold text-xs tracking-wider uppercase shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Host &amp; Launch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: HOST & LAUNCH */}
        {currentStep === 3 && (
          <form onSubmit={handleLaunchTournament} className="space-y-6 animate-fade-in">
            <div className="border-b border-[#D8AD55]/15 pb-4">
              <h2 className="font-display font-black text-2xl text-white">
                Step 3: Host Administration &amp; Launch
              </h2>
              <p className="text-xs text-[#8793A5] mt-1">
                Provide organizer contact information to receive master admin control over this tournament.
              </p>
            </div>

            {/* Super Admin Credentials Box */}
            <div className="p-6 rounded-3xl bg-[#08111F] border-2 border-[#D8AD55]/40 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-[#D8AD55]/20 pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#D8AD55]/20 border border-[#D8AD55]/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#D8AD55]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    {isSuperAdmin ? 'Master Super Admin Control' : 'Tournament Super Admin Credentials'}
                  </h3>
                  <p className="text-xs text-[#8793A5]">
                    {isSuperAdmin
                      ? 'Authenticated credentials will be automatically bound to this new tournament. No re-entry required.'
                      : 'Set your exclusive credentials to govern your tournament, approve players, and conduct the auction.'}
                  </p>
                </div>
              </div>

              {isSuperAdmin ? (
                /* Streamlined Credential Binding Card for Existing Super Admin */
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0D1B2A] to-[#08111F] border border-emerald-500/40 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D8AD55] to-[#F2D69A] flex items-center justify-center font-display font-black text-[#08111F] text-lg shadow-md">
                        {(profile?.full_name || user?.user_metadata?.full_name || user?.email || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-black text-sm sm:text-base text-white">
                            {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Master Super Admin'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                            Super Admin Active
                          </span>
                        </div>
                        <p className="text-xs text-[#8793A5] font-mono mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/30 text-[#F2D69A] text-[10px] font-bold">
                      Session Verified
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#08111F] border border-emerald-500/20 text-xs text-gray-300 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong>Automatic Credential Binding:</strong> This tournament will be automatically provisioned under your master profile (<strong>{user?.email}</strong>). You will govern it directly from your existing Admin Console.
                    </span>
                  </div>
                </div>
              ) : (
                /* First-time Account Creation for New Organizations */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-200">
                      Host / Organizer Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sagir Hossain / Sports Head"
                      value={organizerName}
                      onChange={(e) => setOrganizerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-200">
                      Super Admin Email (Login ID) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@company.com"
                      value={organizerEmail}
                      onChange={(e) => setOrganizerEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-200">
                      Super Admin Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Enter secure admin password (min 6 chars)"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#8793A5] hover:text-[#D8AD55] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-200">
                      Tournament Admin PIN (Recovery Code)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={adminPin}
                        className="w-full pl-4 pr-16 py-3 rounded-2xl bg-[#0D1B2A] border border-[#D8AD55]/30 text-[#F2D69A] font-mono text-xs font-bold tracking-widest focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newPin = Math.floor(100000 + Math.random() * 900000).toString();
                          setAdminPin(newPin);
                        }}
                        className="absolute right-3 top-3 text-[#8793A5] hover:text-white text-[11px] font-bold cursor-pointer"
                        title="Generate new PIN"
                      >
                        Regen
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Role Protection:</strong> You will be the sole Super Admin of this tournament. All players, employees, or club members who register via your link will be assigned the <strong>Spectator / Player</strong> role by default.
                </span>
              </div>
            </div>

            {/* Live Summary Preview Card */}
            <div className="p-6 rounded-3xl bg-[#08111F] border border-[#D8AD55]/40 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D8AD55]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F2D69A]">
                    Tournament Summary Preview
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  Ready to Provision
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#8793A5] block">Tournament:</span>
                  <b className="text-white text-sm">{tournamentName || 'Untitled Tournament'}</b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Organization:</span>
                  <b className="text-white">{orgName || 'Corporate League'}</b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Country &amp; Currency:</span>
                  <b className="text-[#F2D69A]">{selectedCountry.flag} {selectedCountry.currency} ({selectedCountry.symbol})</b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Format &amp; Overs:</span>
                  <b className="text-[#F2D69A]">
                    {selectedFormat.id === 'custom' || showAdvancedTuning
                      ? `${customOvers} Overs (${customFormatName})`
                      : `${selectedFormat.overs} Overs (${selectedFormat.name})`}
                  </b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Team Purse:</span>
                  <b className="text-white">{selectedCountry.symbol}{pursePerTeam.toLocaleString()}</b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Squad Limits:</span>
                  <b className="text-white">{minSquad} - {maxSquad} Players</b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Season:</span>
                  <b className="text-white">{season}</b>
                </div>
                <div>
                  <span className="text-[#8793A5] block">Host Email:</span>
                  <b className="text-white font-mono truncate block">{organizerEmail || '—'}</b>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3 rounded-2xl border border-[#D8AD55]/30 text-xs font-bold text-[#8793A5] hover:text-white cursor-pointer"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-press shimmer-btn px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-extrabold text-sm tracking-wider uppercase shadow-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin text-lg">⚙️</span>
                    <span>Provisioning Tournament Platform…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#08111F]" />
                    <span>Launch Tournament Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SUCCESS LAUNCHPAD MODAL */}
      {createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#0D1B2A] to-[#08111F] border border-[#D8AD55]/50 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
                🏏
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
                Tournament Successfully Launched!
              </h3>
              <p className="text-xs sm:text-sm text-[#8793A5]">
                <b className="text-[#F2D69A]">{createdResult.name}</b> is now live on CricPlus with its dedicated auction room, public player registration, and fixtures schedule.
              </p>
            </div>

            {/* Super Admin Credentials Box in Success Modal */}
            <div className="p-4 rounded-2xl bg-[#08111F] border border-[#D8AD55]/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F2D69A] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D8AD55]" />
                  <span>Your Tournament Super Admin Credentials</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Active &amp; Authenticated
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/15">
                  <span className="text-[10px] text-[#8793A5] block">Admin Email:</span>
                  <strong className="text-white font-mono text-[11px] truncate block">{organizerEmail}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/15">
                  <span className="text-[10px] text-[#8793A5] block">Admin Password:</span>
                  <strong className="text-white font-mono text-[11px] block">{adminPassword}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/15">
                  <span className="text-[10px] text-[#8793A5] block">Recovery PIN:</span>
                  <strong className="text-[#F2D69A] font-mono text-[11px] block">{adminPin}</strong>
                </div>
              </div>
              <p className="text-[10px] text-[#8793A5]">
                Save these credentials. You can use them to log into the Super Admin panel anytime at <code className="text-[#F2D69A]">/admin/login</code>.
              </p>
            </div>

            {/* Launchpad Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Link
                href={`/admin?tournament=${createdResult.slug}`}
                className="p-3.5 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-purple-500/40 hover:border-purple-400 transition-all flex items-center justify-between text-white group sm:col-span-2 shadow-lg"
              >
                <div>
                  <div className="font-bold text-purple-300 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Open Super Admin Console</span>
                  </div>
                  <div className="text-[11px] text-[#8793A5]">Manage Teams, Assign Owners, Approvals &amp; Run Live Auction</div>
                </div>
                <ExternalLink className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`/tournaments/${createdResult.slug}`}
                className="p-3 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 hover:border-[#D8AD55] transition-all flex items-center justify-between text-white group"
              >
                <div>
                  <div className="font-bold text-[#F2D69A]">Public Tournament Hub</div>
                  <div className="text-[11px] text-[#8793A5]">Roster &amp; Overview</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#D8AD55] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`/auction?tournament=${createdResult.slug}`}
                className="p-3 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-blue-500/30 hover:border-blue-400 transition-all flex items-center justify-between text-white group"
              >
                <div>
                  <div className="font-bold text-blue-300">Live Auction Room</div>
                  <div className="text-[11px] text-[#8793A5]">Interactive Bidding Console</div>
                </div>
                <Gavel className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Public Player Registration Share Bar */}
            <div className="p-3.5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 space-y-2">
              <div className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                <span>Direct Player Registration Link:</span>
                <span className="text-[10px] text-emerald-400">Share with Teams / Employees</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/tournaments/${createdResult.slug}/register` : `/tournaments/${createdResult.slug}/register`}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/20 text-gray-300 font-mono text-[11px] truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/tournaments/${createdResult.slug}/register`;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#D8AD55]/20 text-[#F2D69A] border border-[#D8AD55]/40 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href={`/tournaments/${createdResult.slug}`}
                className="text-xs text-[#8793A5] hover:text-white font-bold"
              >
                View Public Hub
              </Link>
              <button
                type="button"
                onClick={() => router.push(`/admin?tournament=${createdResult.slug}`)}
                className="btn-press px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Go to Super Admin Console →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
