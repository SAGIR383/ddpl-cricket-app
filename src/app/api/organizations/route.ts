import { NextRequest, NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export interface CorporateOrganization {
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
  adminEmails: string[];
  tournaments: string[];
  createdAt: string;
  updatedAt?: string;
  isVerified?: boolean;
}

const DEFAULT_ORGANIZATIONS: Record<string, CorporateOrganization> = {
  'ddpl-foundation': {
    id: 'org-ddpl',
    slug: 'ddpl-foundation',
    name: 'DDPL Sports Foundation',
    corporateTagline: 'Corporate Cricket & Inter-Departmental Sporting League',
    country: 'India',
    countryCode: 'IN',
    city: 'New Delhi',
    currency: 'INR',
    currencySymbol: '₹',
    logo: '/images/default-tournament.svg',
    bannerGradient: 'from-[#08111F] via-[#0E1F35] to-[#142946]',
    themeColor: 'gold',
    adminEmails: ['admin@cricplus.com'],
    tournaments: ['ddpl'],
    createdAt: '2026-01-01T00:00:00.000Z',
    isVerified: true,
  },
  'gor-sports': {
    id: 'org-gor',
    slug: 'gor-sports',
    name: 'Game of RUN Corporate',
    corporateTagline: 'Annual Invitational Tech & Corporate Cricket Championship',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    city: 'Dubai',
    currency: 'AED',
    currencySymbol: 'د.إ',
    logo: '/images/game-of-run-logo.jpg',
    bannerGradient: 'from-[#1A1006] via-[#2A1808] to-[#120B04]',
    themeColor: 'amber',
    adminEmails: ['organizer@cricplus.com'],
    tournaments: ['game-of-run'],
    createdAt: '2026-01-01T00:00:00.000Z',
    isVerified: true,
  },
};

// GET /api/organizations
// Query params: ?slug=ddpl-foundation (optional)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.toLowerCase();

    const orgs = await getStoreData<Record<string, CorporateOrganization>>(
      'corporate_organizations',
      'organizations.json',
      DEFAULT_ORGANIZATIONS
    );

    if (slug) {
      const org = orgs[slug];
      if (!org) {
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: true, organization: org },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=20',
          },
        }
      );
    }

    const organizationsList = Object.values(orgs).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        count: organizationsList.length,
        organizations: organizationsList,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=20',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, organizations: Object.values(DEFAULT_ORGANIZATIONS) },
      { status: 500 }
    );
  }
}

// POST /api/organizations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug: rawSlug,
      corporateTagline = '',
      country = 'India',
      countryCode = 'IN',
      city = '',
      currency = 'INR',
      currencySymbol = '₹',
      logo = '',
      bannerGradient = '',
      themeColor = 'gold',
      creatorEmail = '',
      tournamentSlug = '',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required.' },
        { status: 400 }
      );
    }

    const orgSlug = (rawSlug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!orgSlug) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization slug.' },
        { status: 400 }
      );
    }

    const orgs = await getStoreData<Record<string, CorporateOrganization>>(
      'corporate_organizations',
      'organizations.json',
      DEFAULT_ORGANIZATIONS
    );

    const existing = orgs[orgSlug];
    const adminEmails = existing?.adminEmails || [];
    if (creatorEmail && !adminEmails.includes(creatorEmail.toLowerCase())) {
      adminEmails.push(creatorEmail.toLowerCase());
    }

    const tournamentList = existing?.tournaments || [];
    if (tournamentSlug && !tournamentList.includes(tournamentSlug.toLowerCase())) {
      tournamentList.push(tournamentSlug.toLowerCase());
    }

    const updatedOrg: CorporateOrganization = {
      id: existing?.id || `org-${Date.now()}`,
      slug: orgSlug,
      name: name.trim(),
      corporateTagline: corporateTagline.trim() || undefined,
      country: country.trim() || 'Global',
      countryCode: countryCode.trim() || undefined,
      city: city.trim() || undefined,
      currency: currency.trim() || 'INR',
      currencySymbol: currencySymbol.trim() || '₹',
      logo: logo.trim() || existing?.logo || undefined,
      bannerGradient: bannerGradient.trim() || existing?.bannerGradient || undefined,
      themeColor: themeColor || existing?.themeColor || 'gold',
      adminEmails,
      tournaments: tournamentList,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: existing?.isVerified !== undefined ? existing.isVerified : false,
    };

    orgs[orgSlug] = updatedOrg;
    await setStoreData('corporate_organizations', orgs, 'organizations.json');
    invalidateStoreCache('corporate_organizations');

    // Also auto-grant organizer role to creator in user_roles if email provided
    if (creatorEmail) {
      try {
        const roles = await getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
        if (!roles[creatorEmail.toLowerCase()] || roles[creatorEmail.toLowerCase()] === 'user') {
          roles[creatorEmail.toLowerCase()] = 'organizer';
          await setStoreData('user_roles', roles, 'roles.json');
        }
      } catch (roleErr) {
        console.warn('Could not auto-promote creator to organizer:', roleErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Organization "${name}" created successfully!`,
      organization: updatedOrg,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
