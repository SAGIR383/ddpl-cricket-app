'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Building2,
  Trophy,
  Globe2,
  Calendar,
  Users,
  ExternalLink,
  PlusCircle,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Gavel,
} from 'lucide-react';

interface OrganizationData {
  id: string;
  slug: string;
  name: string;
  corporateTagline?: string;
  country: string;
  countryCode?: string;
  city?: string;
  currency: string;
  currencySymbol: string;
  logo?: string;
  bannerGradient?: string;
  themeColor?: string;
  tournaments: string[];
  createdAt: string;
  isVerified?: boolean;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const slug = (params.slug as string) || '';

  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOrgData() {
      try {
        const [orgRes, tourneyRes] = await Promise.all([
          fetch(`/api/organizations?slug=${slug}`),
          fetch('/api/tournaments/register?tournament=ddpl'),
        ]);

        if (!isMounted) return;

        if (orgRes.ok) {
          const oData = await orgRes.json();
          if (oData.organization) setOrg(oData.organization);
        }

        if (tourneyRes.ok) {
          const tData = await tourneyRes.json();
          if (tData.tournamentsList) {
            setTournamentsList(tData.tournamentsList);
          }
        }
      } catch (err) {
        console.error('Failed to load organization profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug) {
      loadOrgData();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#D8AD55] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-[#8793A5] uppercase tracking-wider">
            Loading Organization Hub…
          </span>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-12 h-12 text-[#D8AD55]/60 mx-auto" />
        <h2 className="font-display font-black text-3xl text-white">Organization Not Found</h2>
        <p className="text-sm text-[#8793A5]">
          The organization &ldquo;{slug}&rdquo; does not exist or has been removed.
        </p>
        <Link
          href="/tournaments/create"
          className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create an Organization</span>
        </Link>
      </div>
    );
  }

  // Filter tournaments belonging to this organization
  const matchingTournaments = tournamentsList.filter(
    (t) =>
      t.organizationSlug === org.slug ||
      org.tournaments?.includes(t.slug) ||
      (t.organizationName && t.organizationName.toLowerCase() === org.name.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10 animate-fade-in">
      {/* Editorial Corporate Header Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${
          org.bannerGradient || 'from-[#08111F] via-[#0E1F35] to-[#142946]'
        } border border-[#D8AD55]/30 p-6 sm:p-10 shadow-2xl`}
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#D8AD55]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#08111F] border border-[#D8AD55]/40 flex items-center justify-center p-3 shadow-xl shrink-0 relative overflow-hidden">
              {org.logo ? (
                <Image
                  src={org.logo}
                  alt={org.name}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <Building2 className="w-10 h-10 text-[#D8AD55]" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#D8AD55]/15 border border-[#D8AD55]/40 text-[#F2D69A] text-[11px] font-bold uppercase tracking-wider">
                  <Globe2 className="w-3 h-3 text-[#D8AD55]" />
                  <span>{org.country}</span>
                </span>
                {org.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Corporate Org</span>
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
                {org.name}
              </h1>

              {org.corporateTagline && (
                <p className="text-xs sm:text-sm text-[#8793A5] max-w-xl">
                  {org.corporateTagline}
                </p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#08111F] hover:bg-[#111D2D] border border-[#D8AD55]/30 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#D8AD55]" />}
              <span>{copiedLink ? 'Copied' : 'Share Org Hub'}</span>
            </button>

            <Link
              href={`/tournaments/create`}
              className="btn-press shimmer-btn px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#D8AD55] via-[#F2D69A] to-[#D8AD55] hover:brightness-110 text-[#08111F] font-display font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-[#D8AD55]/20 flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Host Tournament</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#8793A5] font-bold uppercase tracking-wider">Tournaments</span>
            <div className="font-display font-black text-xl sm:text-2xl text-white">
              {matchingTournaments.length}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#8793A5] font-bold uppercase tracking-wider">Currency</span>
            <div className="font-display font-black text-xl sm:text-2xl text-[#F2D69A]">
              {org.currency} ({org.currencySymbol})
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#8793A5] font-bold uppercase tracking-wider">HQ Region</span>
            <div className="font-display font-black text-xl sm:text-2xl text-white truncate">
              {org.city ? `${org.city}, ${org.country}` : org.country}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#8793A5] font-bold uppercase tracking-wider">Platform Status</span>
            <div className="font-display font-bold text-sm sm:text-base text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active Host</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tournaments Hosted by Organization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D8AD55]/15 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#D8AD55]" />
            <h2 className="font-display font-bold text-xl text-white">
              Tournaments Hosted by {org.name}
            </h2>
          </div>
          <span className="text-xs text-[#8793A5]">
            {matchingTournaments.length} Championship{matchingTournaments.length === 1 ? '' : 's'}
          </span>
        </div>

        {matchingTournaments.length === 0 ? (
          <div className="rounded-3xl p-10 bg-[#0D1B2A]/90 border border-[#D8AD55]/20 text-center space-y-4 shadow-xl">
            <Trophy className="w-12 h-12 text-[#D8AD55]/40 mx-auto" />
            <h3 className="font-display font-bold text-lg text-white">No Tournaments Yet</h3>
            <p className="text-xs text-[#8793A5] max-w-sm mx-auto">
              This organization does not have any active tournaments. Create the first tournament now.
            </p>
            <Link
              href="/tournaments/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch First Tournament</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {matchingTournaments.map((t) => (
              <div
                key={t.slug}
                className="group relative overflow-hidden rounded-3xl bg-[#0D1B2A]/90 backdrop-blur-md border border-[#D8AD55]/25 hover:border-[#D8AD55] transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#08111F] border border-[#D8AD55]/30 flex items-center justify-center p-2 shrink-0">
                        <Trophy className="w-6 h-6 text-[#D8AD55]" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-xl text-white group-hover:text-[#F2D69A] transition-colors">
                          {t.name}
                        </h3>
                        <p className="text-xs text-[#8793A5] line-clamp-1">{t.tagline || t.fullName}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase shrink-0">
                      {t.status || 'Active'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[#8793A5] block text-[10px]">Format:</span>
                      <b className="text-white">{t.overs || 10} Overs</b>
                    </div>
                    <div>
                      <span className="text-[#8793A5] block text-[10px]">Team Purse:</span>
                      <b className="text-[#F2D69A]">{org.currencySymbol}{(t.pursePerTeam || 10000).toLocaleString()}</b>
                    </div>
                    <div>
                      <span className="text-[#8793A5] block text-[10px]">Season:</span>
                      <b className="text-white">{t.season || '2026'}</b>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#08111F]/80 border-t border-white/5 flex items-center justify-between gap-2">
                  <Link
                    href={`/auction?tournament=${t.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Auction Room</span>
                  </Link>

                  <Link
                    href={`/tournaments/${t.slug}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D8AD55] to-[#F2D69A] text-[#08111F] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
                  >
                    <span>View Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
