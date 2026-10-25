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
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [orgName, setOrgName] = useState('');
  const [orgTagline, setOrgTagline] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCurrencyOption>(GLOBAL_COUNTRIES[0]);
  const [selectedTheme, setSelectedTheme] = useState(THEME_OPTIONS[0]);

  const [tournamentName, setTournamentName] = useState('');
  const [shortName, setShortName] = useState('');
  const [season, setSeason] = useState('2026');
  const [selectedFormat, setSelectedFormat] = useState(FORMAT_OPTIONS[0]);
  const [pursePerTeam, setPursePerTeam] = useState(10000);
  const [ownerBasePrice, setOwnerBasePrice] = useState(500);
  const [maxSquad, setMaxSquad] = useState(11);
  const [minSquad, setMinSquad] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState(user?.email || '');

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
    if (!organizerEmail.trim()) {
      alert('Organizer email is required for administration access');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        action: 'create_tournament',
        name: tournamentName.trim(),
        shortName: shortName.trim() || undefined,
        fullName: `${tournamentName.trim()} Championship`,
        tagline: orgTagline.trim() || `Official ${tournamentName.trim()} Corporate Cricket Tournament`,
        season,
        format: selectedFormat.format,
        overs: selectedFormat.overs,
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
        creatorEmail: organizerEmail.trim(),
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
              <div className="sm:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-gray-200">
                  Match Format &amp; Overs
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFormat(f)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedFormat.id === f.id
                          ? 'border-[#D8AD55] bg-[#D8AD55]/15 text-white shadow-md'
                          : 'border-[#D8AD55]/20 bg-[#08111F] text-[#8793A5] hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-[#F2D69A]">{f.name}</div>
                      <p className="text-[11px] text-[#8793A5] mt-1">{f.desc}</p>
                    </button>
                  ))}
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Organizer Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / Sports Secretary"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-200">
                  Organizer Email (Grants Admin Rights) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. organizer@company.com"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#D8AD55]"
                />
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
                  <b className="text-white">{selectedFormat.overs} Overs / Match</b>
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

            {/* Launchpad Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Link
                href={`/tournaments/${createdResult.slug}`}
                className="p-3.5 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 hover:border-[#D8AD55] transition-all flex items-center justify-between text-white group"
              >
                <div>
                  <div className="font-bold text-[#F2D69A]">Public Tournament Hub</div>
                  <div className="text-[11px] text-[#8793A5]">Roster &amp; Team Details</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#D8AD55] group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`/auction?tournament=${createdResult.slug}`}
                className="p-3.5 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-blue-500/30 hover:border-blue-400 transition-all flex items-center justify-between text-white group"
              >
                <div>
                  <div className="font-bold text-blue-300">Live Auction Room</div>
                  <div className="text-[11px] text-[#8793A5]">Interactive Bidding Console</div>
                </div>
                <Gavel className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href={`/admin?tournament=${createdResult.slug}`}
                className="p-3.5 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-between text-white group sm:col-span-2"
              >
                <div>
                  <div className="font-bold text-purple-300">Admin Control Center</div>
                  <div className="text-[11px] text-[#8793A5]">Manage Teams, Rules, Schedule &amp; Approvals</div>
                </div>
                <Shield className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Public Player Registration Share Bar */}
            <div className="p-3.5 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 space-y-2">
              <div className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                <span>Public Player Registration Link:</span>
                <span className="text-[10px] text-emerald-400">Share with Teams / Employees</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/tournaments/${createdResult.slug}` : `/tournaments/${createdResult.slug}`}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#0D1B2A] border border-[#D8AD55]/20 text-gray-300 font-mono text-[11px] truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/tournaments/${createdResult.slug}`;
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

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => router.push(`/tournaments/${createdResult.slug}`)}
                className="btn-press px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                Go to Tournament Dashboard →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
