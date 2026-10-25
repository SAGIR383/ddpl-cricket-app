import { NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export interface TournamentPlayerRegistration {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  avatarUrl?: string;
  employeeId?: string;
  registeredAt: string;
  isOwner?: boolean;
  franchiseTeam?: string;
}

export interface TournamentConfig {
  slug: string;
  name: string;
  shortName?: string;
  fullName?: string;
  tagline?: string;
  season?: string;
  totalSeasons?: number;
  overs?: number;
  format?: 'ddpl' | 'game-of-run' | 'round-robin-playoffs' | 'group-stage-playoffs';
  bannerColor?: string;
  badgeColor?: string;
  logo?: string;
  status: 'upcoming' | 'open' | 'closed' | 'auction' | 'ongoing' | 'completed';
  pursePerTeam: number;
  ownerBasePrice: number;
  maxSquad: number;
  minSquad: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  organizationSlug?: string;
  organizationName?: string;
  country?: string;
  currency?: string;
  currencySymbol?: string;
  creatorEmail?: string;
  isPublic?: boolean;
}

const DEFAULT_CONFIGS: Record<string, TournamentConfig> = {
  ddpl: {
    slug: 'ddpl',
    name: 'DDPL',
    shortName: 'DDPL',
    fullName: 'Desk to Dugout Premier League (DDPL)',
    tagline: 'High-octane inter-departmental corporate cricket tournament',
    season: '2026',
    totalSeasons: 2,
    overs: 10,
    format: 'ddpl',
    bannerColor: 'from-blue-900 via-indigo-950 to-cricket-dark',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse',
    logo: '/images/ddpl-logo.jpg',
    status: 'open',
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 7,
    startDate: null,
    endDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    organizationSlug: 'ddpl-foundation',
    organizationName: 'DDPL Sports Foundation',
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    isPublic: true,
  },
  'game-of-run': {
    slug: 'game-of-run',
    name: 'Game of RUN',
    shortName: 'GOR',
    fullName: 'Game of RUN Championship',
    tagline: 'The official annual corporate cricket championship',
    season: '2026',
    totalSeasons: 2,
    overs: 12,
    format: 'game-of-run',
    bannerColor: 'from-amber-950 via-orange-950 to-cricket-dark',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    logo: '/images/game-of-run-logo.jpg',
    status: 'upcoming',
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 7,
    startDate: null,
    endDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    organizationSlug: 'gor-sports',
    organizationName: 'Game of RUN Corporate',
    country: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    isPublic: true,
  },
};

// GET /api/tournaments/register?tournament=ddpl
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();

  const configs = await getStoreData<Record<string, TournamentConfig>>(
    'tournament_configs',
    'tournament_configs.json',
    DEFAULT_CONFIGS
  );

  const config = configs[tournament] || {
    slug: tournament,
    name: tournament.toUpperCase(),
    shortName: tournament.slice(0, 4).toUpperCase(),
    fullName: tournament.toUpperCase(),
    tagline: `${tournament.toUpperCase()} Cricket Tournament`,
    season: '2026',
    totalSeasons: 1,
    overs: 10,
    format: 'ddpl',
    bannerColor: 'from-blue-900 via-indigo-950 to-cricket-dark',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
    logo: '/images/ddpl-logo.jpg',
    status: 'upcoming',
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 7,
    startDate: null,
    endDate: null,
    createdAt: new Date().toISOString(),
  };

  const registrations = await getStoreData<TournamentPlayerRegistration[]>(
    `tournament_registrations_${tournament}`,
    `registrations_${tournament}.json`,
    []
  );

  const tournamentsList = Object.values(configs);

  return NextResponse.json(
    {
      success: true,
      tournament,
      config,
      allConfigs: configs,
      tournamentsList,
      registrations,
      count: registrations.length,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=20',
      },
    }
  );
}

// POST /api/tournaments/register
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const tSlug = (body.slug || body.tournament || 'ddpl').toLowerCase();

    // 1. UPDATE TOURNAMENT STATUS (Super Admin)
    if (action === 'update_status') {
      const { status } = body;
      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        DEFAULT_CONFIGS
      );

      const current = configs[tSlug] || {
        slug: tSlug,
        name: tSlug.toUpperCase(),
        status: 'upcoming',
        pursePerTeam: 10000,
        ownerBasePrice: 500,
        maxSquad: 11,
        minSquad: 9,
      };

      configs[tSlug] = {
        ...current,
        status,
      };

      await setStoreData('tournament_configs', configs, 'tournament_configs.json');
      return NextResponse.json({ success: true, config: configs[tSlug] });
    }

    // 2. PLAYER REGISTRATION (Player)
    if (action === 'register' || action === 'register_player') {
      const registration = body.registration || body.player;
      if (!registration || !registration.name) {
        return NextResponse.json(
          { success: false, error: 'Player name is required' },
          { status: 400 }
        );
      }
      if (!registration.email) {
        registration.email = `${registration.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@player.local`;
      }

      // Check current registration status
      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        DEFAULT_CONFIGS
      );
      const currentConfig = configs[tSlug] || DEFAULT_CONFIGS[tSlug];
      if (currentConfig && (currentConfig.status === 'closed' || currentConfig.status === 'completed')) {
        return NextResponse.json(
          {
            success: false,
            error: `Registration for ${currentConfig.name} is currently ${currentConfig.status.toUpperCase()}.`,
          },
          { status: 403 }
        );
      }

      const existingRegistrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      // Check for duplicate registration by email
      const isAlreadyRegistered = existingRegistrations.some(
        (r) => r.email.toLowerCase() === registration.email.toLowerCase()
      );

      let updatedRegistrations: TournamentPlayerRegistration[];

      if (isAlreadyRegistered) {
        // Update existing registration details (e.g. updated photo or role)
        updatedRegistrations = existingRegistrations.map((r) =>
          r.email.toLowerCase() === registration.email.toLowerCase()
            ? { ...r, ...registration, registeredAt: r.registeredAt || new Date().toISOString() }
            : r
        );
      } else {
        const newEntry: TournamentPlayerRegistration = {
          id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: registration.userId,
          name: registration.name.trim(),
          email: registration.email.trim(),
          phone: registration.phone || '',
          role: registration.role || 'All Rounder',
          battingStyle: registration.battingStyle || 'Right-hand bat',
          bowlingStyle: registration.bowlingStyle || 'Right-arm medium',
          avatarUrl: registration.avatarUrl || null,
          employeeId: registration.employeeId || '',
          registeredAt: new Date().toISOString(),
          isOwner: false,
        };
        updatedRegistrations = [...existingRegistrations, newEntry];
      }

      await setStoreData(
        `tournament_registrations_${tSlug}`,
        updatedRegistrations,
        `registrations_${tSlug}.json`
      );

      // Automatically keep the Live Auction Pool in sync with tournament registrations
      try {
        const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
          tournaments: {},
        });

        const currentTourneyData = allAuction.tournaments?.[tSlug] || {
          teams: [],
          playerPool: [],
          soldTransactions: [],
          unsoldPlayers: [],
        };

        const existingPool: any[] = currentTourneyData.playerPool || [];
        const targetReg = updatedRegistrations.find(
          (r) => r.email.toLowerCase() === registration.email.toLowerCase()
        );
        const isOwner = targetReg?.isOwner || false;

        // If not an assigned franchise owner, auto-add or update in auction player pool
        if (!isOwner) {
          const playerIdx = existingPool.findIndex(
            (p: any) => p.name?.toLowerCase() === registration.name.trim().toLowerCase()
          );

          const playerEntry = {
            id: playerIdx >= 0 ? existingPool[playerIdx].id : `p-reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: registration.name.trim(),
            role: registration.role || 'All Rounder',
            basePrice: 500,
            avatarUrl: registration.avatarUrl || null,
            battingStyle: registration.battingStyle || 'Right-hand bat',
            bowlingStyle: registration.bowlingStyle || 'Right-arm medium',
            phone: registration.phone || '',
          };

          if (playerIdx >= 0) {
            existingPool[playerIdx] = { ...existingPool[playerIdx], ...playerEntry };
          } else {
            existingPool.push(playerEntry);
          }

          currentTourneyData.playerPool = existingPool;

          // If there is currently no active lot on the auction block, board this first player
          if (!currentTourneyData.currentLot && existingPool.length > 0) {
            currentTourneyData.currentLot = {
              ...existingPool[0],
              currentBid: existingPool[0].basePrice || 500,
              leadingTeam: null,
              history: [],
            };
          }

          currentTourneyData.lastUpdated = new Date().toISOString();

          allAuction.tournaments = {
            ...allAuction.tournaments,
            [tSlug]: currentTourneyData,
          };

          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
        }
      } catch (syncErr) {
        console.error('Auto-sync to auction pool failed during registration:', syncErr);
      }

      return NextResponse.json({
        success: true,
        message: isAlreadyRegistered
          ? 'Registration details updated successfully!'
          : 'Successfully registered for tournament!',
        registrations: updatedRegistrations,
      });
    }

    // 3. ASSIGN FRANCHISE OWNER & CREATE TEAM (Super Admin)
    if (action === 'assign_franchise') {
      const { teamName, shortName, ownerEmail, ownerName } = body;
      if (!teamName || !ownerEmail) {
        return NextResponse.json(
          { success: false, error: 'Team Name and Owner Email are required' },
          { status: 400 }
        );
      }

      // Mark player as owner in registrations
      const registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      const ownerPlayer = registrations.find(
        (r) => r.email.toLowerCase() === ownerEmail.toLowerCase()
      );

      const resolvedOwnerName = ownerName || ownerPlayer?.name || ownerEmail.split('@')[0];
      const ownerRole = ownerPlayer?.role || 'All Rounder';

      const updatedRegistrations = registrations.map((r) => {
        if (r.email.toLowerCase() === ownerEmail.toLowerCase()) {
          return { ...r, isOwner: true, franchiseTeam: teamName };
        }
        return r;
      });

      await setStoreData(
        `tournament_registrations_${tSlug}`,
        updatedRegistrations,
        `registrations_${tSlug}.json`
      );

      // Read current auction data and add/update franchise team with owner
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
        tournaments: {},
      });

      const currentTourneyData = allAuction.tournaments?.[tSlug] || {
        teams: [],
        playerPool: [],
        soldTransactions: [],
        unsoldPlayers: [],
        currentLotIndex: 0,
      };

      const existingTeams = currentTourneyData.teams || [];
      const teamId = `t-${Date.now()}`;
      const short = shortName || teamName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);

      const newTeam = {
        id: teamId,
        name: teamName,
        short,
        owner: resolvedOwnerName,
        ownerEmail,
        allocated: 10000,
        spent: 500, // 500 points blocked for owner
        remaining: 9500, // 9500 remaining purse
        playersBought: 1, // Owner is player #1
        maxSquad: 11,
        players: [
          {
            name: resolvedOwnerName,
            role: `${ownerRole} (Franchise Owner)`,
            price: 500,
          },
        ],
      };

      const newTeamsList = [...existingTeams.filter((t: any) => t.name !== teamName), newTeam];

      // Also ensure soldTransactions has owner entry
      const existingTx = currentTourneyData.soldTransactions || [];
      const ownerTx = {
        id: `tx-owner-${Date.now()}`,
        player: resolvedOwnerName,
        team: teamName,
        price: 500,
        role: `${ownerRole} (Franchise Owner)`,
      };
      const newTxList = [...existingTx.filter((tx: any) => tx.player !== resolvedOwnerName), ownerTx];

      // Remove owner from open auction pool (since owner is already assigned to their team)
      currentTourneyData.playerPool = (currentTourneyData.playerPool || []).filter(
        (p: any) => p.name?.toLowerCase() !== resolvedOwnerName.toLowerCase()
      );
      if (currentTourneyData.currentLot?.name?.toLowerCase() === resolvedOwnerName.toLowerCase()) {
        currentTourneyData.currentLot = currentTourneyData.playerPool.length > 0 ? {
          ...currentTourneyData.playerPool[0],
          currentBid: currentTourneyData.playerPool[0].basePrice || 500,
          leadingTeam: null,
          history: [],
        } : null;
      }

      currentTourneyData.teams = newTeamsList;
      currentTourneyData.soldTransactions = newTxList;
      currentTourneyData.lastUpdated = new Date().toISOString();

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: currentTourneyData,
      };

      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      return NextResponse.json({
        success: true,
        message: `Franchise ${teamName} created! ${resolvedOwnerName} assigned as Owner & Player #1 (₹500 blocked, ₹9,500 remaining purse).`,
        teams: newTeamsList,
      });
    }

    // 3.1 DELETE INDIVIDUAL FRANCHISE (Super Admin)
    if (action === 'delete_franchise') {
      const { teamId, teamName } = body;
      if (!teamId && !teamName) {
        return NextResponse.json({ success: false, error: 'Team ID or Name is required' }, { status: 400 });
      }

      // 1. Update Auction Data
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      const currentTourneyData = allAuction.tournaments?.[tSlug] || { teams: [], soldTransactions: [] };

      const targetTeam = (currentTourneyData.teams || []).find(
        (t: any) => t.id === teamId || (teamName && t.name.toLowerCase() === teamName.toLowerCase())
      );
      const resolvedName = targetTeam?.name || teamName;

      // Remove team
      const updatedTeams = (currentTourneyData.teams || []).filter(
        (t: any) => t.id !== teamId && t.name.toLowerCase() !== (resolvedName || '').toLowerCase()
      );

      // Remove team sold transactions
      const updatedSold = (currentTourneyData.soldTransactions || []).filter(
        (tx: any) => tx.team.toLowerCase() !== (resolvedName || '').toLowerCase()
      );

      // If current lot is leading by this team, reset leading
      if (currentTourneyData.currentLot?.leadingTeam?.toLowerCase() === (resolvedName || '').toLowerCase()) {
        currentTourneyData.currentLot.leadingTeam = null;
        currentTourneyData.currentLot.currentBid = currentTourneyData.currentLot.basePrice;
      }

      currentTourneyData.teams = updatedTeams;
      currentTourneyData.soldTransactions = updatedSold;
      currentTourneyData.lastUpdated = new Date().toISOString();

      if (currentTourneyData.teamBiddingAccess && teamId) {
        delete currentTourneyData.teamBiddingAccess[teamId];
      }

      // Restore freed owner back into auction playerPool if registered
      const freedReg = (await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      )).find(
        (r) =>
          (resolvedName && r.franchiseTeam?.toLowerCase() === resolvedName.toLowerCase()) ||
          (targetTeam?.ownerEmail && r.email.toLowerCase() === targetTeam.ownerEmail.toLowerCase()) ||
          (targetTeam?.owner && r.name.toLowerCase() === targetTeam.owner.toLowerCase())
      );

      if (freedReg) {
        const alreadyInPool = (currentTourneyData.playerPool || []).some(
          (p: any) => p.name?.toLowerCase() === freedReg.name.toLowerCase()
        );
        if (!alreadyInPool) {
          currentTourneyData.playerPool = [
            ...(currentTourneyData.playerPool || []),
            {
              id: `p-reg-${Date.now()}`,
              name: freedReg.name,
              role: freedReg.role || 'All Rounder',
              basePrice: 500,
              avatarUrl: freedReg.avatarUrl || null,
              battingStyle: freedReg.battingStyle || 'Right-hand bat',
              bowlingStyle: freedReg.bowlingStyle || 'Right-arm medium',
              phone: freedReg.phone || '',
            },
          ];
        }
      }

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: currentTourneyData,
      };
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      // 2. Free up owner in registrations
      const registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );
      const updatedRegs = registrations.map((r) => {
        if (
          (resolvedName && r.franchiseTeam?.toLowerCase() === resolvedName.toLowerCase()) ||
          (targetTeam?.ownerEmail && r.email.toLowerCase() === targetTeam.ownerEmail.toLowerCase())
        ) {
          return { ...r, isOwner: false, franchiseTeam: undefined };
        }
        return r;
      });
      await setStoreData(`tournament_registrations_${tSlug}`, updatedRegs, `registrations_${tSlug}.json`);

      // 3. Clean up matches involving this team
      const schedule = await getStoreData<any>(`tournament_schedule_${tSlug}`, `schedule_${tSlug}.json`, { matches: [] });
      if (schedule.matches) {
        schedule.matches = schedule.matches.filter(
          (m: any) =>
            m.teamA?.name?.toLowerCase() !== (resolvedName || '').toLowerCase() &&
            m.teamB?.name?.toLowerCase() !== (resolvedName || '').toLowerCase() &&
            (typeof m.teamA === 'string' ? m.teamA.toLowerCase() !== (resolvedName || '').toLowerCase() : true) &&
            (typeof m.teamB === 'string' ? m.teamB.toLowerCase() !== (resolvedName || '').toLowerCase() : true)
        );
        schedule.lastUpdated = new Date().toISOString();
        await setStoreData(`tournament_schedule_${tSlug}`, schedule, `schedule_${tSlug}.json`);
      }

      return NextResponse.json({
        success: true,
        message: `Franchise "${resolvedName}" deleted successfully. Owner freed to player pool.`,
        teams: updatedTeams,
        registrations: updatedRegs,
      });
    }

    // 3.2 RESET ALL TOURNAMENT DATA (Super Admin Clean Slate)
    if (action === 'reset_tournament_data') {
      const { resetRegistrations = false } = body;

      // 1. Wipe Auction Data for this tournament
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: {
          teams: [],
          playerPool: [],
          soldTransactions: [],
          unsoldPlayers: [],
          currentLot: null,
          currentLotIndex: 0,
          auctionStatus: 'live',
          timerSeconds: 30,
          timerRunning: true,
          timerLastReset: new Date().toISOString(),
          biddingAccessEnabled: true,
          teamBiddingAccess: {},
          lastUpdated: new Date().toISOString(),
        },
      };
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      // 2. Wipe Matches & Schedule
      const cleanSchedule = {
        tournament: tSlug,
        startDate: null,
        endDate: null,
        format: 'round-robin-playoffs',
        matches: [],
        lastUpdated: new Date().toISOString(),
      };
      await setStoreData(`tournament_schedule_${tSlug}`, cleanSchedule, `schedule_${tSlug}.json`);

      // 3. Reset Registrations (either clear all or reset isOwner)
      let finalRegistrations: TournamentPlayerRegistration[] = [];
      if (!resetRegistrations) {
        const existingRegs = await getStoreData<TournamentPlayerRegistration[]>(
          `tournament_registrations_${tSlug}`,
          `registrations_${tSlug}.json`,
          []
        );
        finalRegistrations = existingRegs.map((r) => ({
          ...r,
          isOwner: false,
          franchiseTeam: undefined,
        }));
      }
      await setStoreData(`tournament_registrations_${tSlug}`, finalRegistrations, `registrations_${tSlug}.json`);

      return NextResponse.json({
        success: true,
        message: `Tournament ${tSlug.toUpperCase()} data has been completely wiped and reset to a clean slate!`,
        teams: [],
        matches: [],
        registrations: finalRegistrations,
      });
    }

    // 4. SYNC REGISTERED PLAYERS TO LIVE AUCTION POOL
    if (action === 'sync_to_auction') {
      const registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
        tournaments: {},
      });

      const currentTourneyData = allAuction.tournaments?.[tSlug] || {
        teams: [],
        playerPool: [],
        soldTransactions: [],
        unsoldPlayers: [],
      };

      // Filter out franchise owners (they are already in their teams)
      const nonOwners = registrations.filter((r) => !r.isOwner);

      const newPool = nonOwners.map((r, idx) => ({
        id: `p-reg-${idx + 1}`,
        name: r.name,
        role: r.role,
        basePrice: 500,
        avatarUrl: r.avatarUrl,
        battingStyle: r.battingStyle,
        bowlingStyle: r.bowlingStyle,
        phone: r.phone,
      }));

      currentTourneyData.playerPool = newPool;
      if (newPool.length > 0 && !currentTourneyData.currentLot) {
        currentTourneyData.currentLot = {
          ...newPool[0],
          currentBid: 500,
          leadingTeam: null,
          history: [],
        };
      }

      currentTourneyData.lastUpdated = new Date().toISOString();

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: currentTourneyData,
      };

      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      return NextResponse.json({
        success: true,
        message: `Synced ${newPool.length} registered players into ${tSlug.toUpperCase()} auction pool!`,
        count: newPool.length,
      });
    }

    // 5. CREATE CUSTOM TOURNAMENT (Super Admin & Global Tournament Organizers)
    if (action === 'create_tournament') {
      const { 
        name, 
        slug: rawSlug, 
        shortName, 
        fullName, 
        tagline, 
        season = '2027', 
        format = 'ddpl', 
        overs = 10,
        pursePerTeam = 10000,
        ownerBasePrice = 500,
        maxSquad = 11,
        minSquad = 7,
        logo,
        bannerColor,
        status = 'open',
        startDate = null,
        endDate = null,
        organizationName,
        organizationSlug: rawOrgSlug,
        country = 'India',
        currency = 'INR',
        currencySymbol = '₹',
        creatorEmail = '',
        isPublic = true,
      } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Tournament name is required' }, { status: 400 });
      }

      const generatedSlug = (rawSlug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!generatedSlug) {
        return NextResponse.json({ success: false, error: 'Invalid tournament slug' }, { status: 400 });
      }

      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        DEFAULT_CONFIGS
      );

      const resolvedShort = (shortName || name.split(' ').map((w: string) => w[0]).join('').slice(0, 4)).toUpperCase();
      const resolvedFormat = format === 'game-of-run' ? 'game-of-run' : 'ddpl';
      const resolvedOvers = Number(overs) || (resolvedFormat === 'game-of-run' ? 12 : 10);
      const resolvedBanner = bannerColor || (resolvedFormat === 'game-of-run' ? 'from-amber-950 via-orange-950 to-cricket-dark' : 'from-blue-900 via-indigo-950 to-cricket-dark');
      const resolvedLogo = logo || (resolvedFormat === 'game-of-run' ? '/images/game-of-run-logo.jpg' : '/images/ddpl-logo.jpg');

      const resolvedOrgName = (organizationName || `${name.trim()} League Org`).trim();
      const finalOrgSlug = (rawOrgSlug || resolvedOrgName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'global-leagues';

      const newTournamentConfig: TournamentConfig = {
        slug: generatedSlug,
        name: name.trim(),
        shortName: resolvedShort,
        fullName: fullName?.trim() || `${name.trim()} Championship`,
        tagline: tagline?.trim() || `Official ${name.trim()} Corporate Cricket Tournament`,
        season: String(season),
        totalSeasons: 1,
        overs: resolvedOvers,
        format: resolvedFormat,
        bannerColor: resolvedBanner,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse',
        logo: resolvedLogo,
        status: status || 'open',
        pursePerTeam: Number(pursePerTeam) || 10000,
        ownerBasePrice: Number(ownerBasePrice) || 500,
        maxSquad: Number(maxSquad) || 11,
        minSquad: Number(minSquad) || 7,
        startDate: startDate || null,
        endDate: endDate || null,
        createdAt: new Date().toISOString(),
        organizationSlug: finalOrgSlug,
        organizationName: resolvedOrgName,
        country: country?.trim() || 'Global',
        currency: currency?.trim() || 'INR',
        currencySymbol: currencySymbol?.trim() || '₹',
        creatorEmail: creatorEmail?.trim() || undefined,
        isPublic: Boolean(isPublic),
      };

      configs[generatedSlug] = newTournamentConfig;
      await setStoreData('tournament_configs', configs, 'tournament_configs.json');

      // Auto-register / link with Corporate Organizations store
      try {
        const orgs = await getStoreData<Record<string, any>>(
          'corporate_organizations',
          'organizations.json',
          {}
        );
        const currentOrg = orgs[finalOrgSlug] || {
          id: `org-${Date.now()}`,
          slug: finalOrgSlug,
          name: resolvedOrgName,
          country: country?.trim() || 'Global',
          currency: currency?.trim() || 'INR',
          currencySymbol: currencySymbol?.trim() || '₹',
          adminEmails: [],
          tournaments: [],
          createdAt: new Date().toISOString(),
          isVerified: false,
        };

        if (creatorEmail && !currentOrg.adminEmails?.includes(creatorEmail.toLowerCase())) {
          currentOrg.adminEmails = [...(currentOrg.adminEmails || []), creatorEmail.toLowerCase()];
        }
        if (!currentOrg.tournaments?.includes(generatedSlug)) {
          currentOrg.tournaments = [...(currentOrg.tournaments || []), generatedSlug];
        }

        orgs[finalOrgSlug] = currentOrg;
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      } catch (orgErr) {
        console.warn('Could not auto-sync organization:', orgErr);
      }

      // Auto-promote tournament creator to Organizer role
      if (creatorEmail) {
        try {
          const roles = await getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
          if (!roles[creatorEmail.toLowerCase()] || roles[creatorEmail.toLowerCase()] === 'user') {
            roles[creatorEmail.toLowerCase()] = 'organizer';
            await setStoreData('user_roles', roles, 'roles.json');
          }
        } catch (rErr) {
          console.warn('Could not auto-promote creator to organizer:', rErr);
        }
      }

      // 1. Initialize Auction State for this tournament
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      if (!allAuction.tournaments) allAuction.tournaments = {};
      if (!allAuction.tournaments[generatedSlug]) {
        allAuction.tournaments[generatedSlug] = {
          teams: [],
          playerPool: [],
          soldTransactions: [],
          unsoldPlayers: [],
          currentLotIndex: 0,
          lastUpdated: new Date().toISOString(),
          auctionStatus: 'live',
          biddingAccessEnabled: true,
          teamBiddingAccess: {},
          timerSeconds: 30,
          timerRunning: true,
          timerLastReset: new Date().toISOString(),
          autoBoardingEnabled: true,
          currentLot: null,
        };
        await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
      }

      // 2. Initialize Tournament Rules
      const rules = {
        basePurse: newTournamentConfig.pursePerTeam,
        ownerBlockedPrice: newTournamentConfig.ownerBasePrice,
        defaultPlayerBasePrice: newTournamentConfig.ownerBasePrice,
        maxSquadSize: newTournamentConfig.maxSquad,
        minSquadSize: newTournamentConfig.minSquad,
        matchOvers: newTournamentConfig.overs,
        maxBowlerOvers: Math.max(1, Math.ceil(newTournamentConfig.overs! / 5)),
        wideBallPenalty: '+1 Run & Extra Ball',
        noBallPenalty: '+1 Run + Free Hit',
        pointsPerWin: 2,
        bidSteps: [50, 100, 200, 500],
      };
      await setStoreData(`tournament_rules_${generatedSlug}`, rules, `rules_${generatedSlug}.json`);

      // 3. Initialize Tournament Schedule
      const schedule = {
        tournament: generatedSlug,
        startDate: newTournamentConfig.startDate,
        endDate: newTournamentConfig.endDate,
        format: resolvedFormat === 'game-of-run' ? 'group-stage-playoffs' : 'round-robin-playoffs',
        matches: [],
        lastUpdated: new Date().toISOString(),
      };
      await setStoreData(`tournament_schedule_${generatedSlug}`, schedule, `schedule_${generatedSlug}.json`);

      return NextResponse.json({
        success: true,
        message: `Tournament "${newTournamentConfig.name}" created successfully!`,
        tournament: newTournamentConfig,
        allConfigs: configs,
        tournamentsList: Object.values(configs),
      });
    }

    // 6. DELETE TOURNAMENT (Super Admin - Any created or previous tournament)
    if (action === 'delete_tournament') {
      const targetSlug = (body.slug || tSlug).toLowerCase();

      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        {}
      );

      const deletedTournamentName = configs[targetSlug]?.name || targetSlug;
      delete configs[targetSlug];
      await setStoreData('tournament_configs', configs, 'tournament_configs.json');

      // 1. Clean up Auction Data for this tournament
      try {
        const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
        if (allAuction?.tournaments?.[targetSlug]) {
          delete allAuction.tournaments[targetSlug];
          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
        }
      } catch (e) {
        console.warn('Auction cleanup skipped for deleted tournament:', e);
      }

      // 2. Clean up Schedule
      try {
        await setStoreData(`tournament_schedule_${targetSlug}`, { tournament: targetSlug, matches: [] }, `schedule_${targetSlug}.json`);
      } catch (e) {
        console.warn('Schedule cleanup skipped for deleted tournament:', e);
      }

      // 3. Clean up Registrations
      try {
        await setStoreData(`tournament_registrations_${targetSlug}`, [], `registrations_${targetSlug}.json`);
      } catch (e) {
        console.warn('Registrations cleanup skipped for deleted tournament:', e);
      }

      // 3.1 Clean up from corporate_organizations
      try {
        const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
        let modified = false;
        Object.keys(orgs).forEach((oSlug) => {
          if (orgs[oSlug].tournaments?.includes(targetSlug)) {
            orgs[oSlug].tournaments = orgs[oSlug].tournaments.filter((t: string) => t !== targetSlug);
            modified = true;
          }
        });
        if (modified) {
          await setStoreData('corporate_organizations', orgs, 'organizations.json');
        }
      } catch (e) {
        console.warn('Organization tournament reference cleanup skipped:', e);
      }

      // 4. Invalidate server cache so all consumers see the deletion immediately
      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: `Tournament "${deletedTournamentName}" deleted successfully.`,
        deletedSlug: targetSlug,
        allConfigs: configs,
        tournamentsList: Object.values(configs),
      });
    }

    // 7. WIPE ALL TOURNAMENTS & CLEAN SLATE
    if (action === 'wipe_all_tournaments') {
      await setStoreData('tournament_configs', {}, 'tournament_configs.json');

      try {
        const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
        Object.keys(orgs).forEach((oSlug) => {
          orgs[oSlug].tournaments = [];
        });
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      } catch (e) {
        console.warn('Orgs cleanup skipped:', e);
      }

      try {
        await setStoreData('auction_data_ddpl', { tournaments: {} }, 'auction_data.json');
      } catch (e) {
        console.warn('Auction wipe skipped:', e);
      }

      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: 'All test tournaments and data have been wiped clean. Ready for clean testing!',
        allConfigs: {},
        tournamentsList: [],
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API tournament/register] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/tournaments/register?slug=ddpl OR ?wipeAll=true
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get('slug')?.toLowerCase();
    const wipeAll = url.searchParams.get('wipeAll') === 'true';

    if (!slug && !wipeAll) {
      try {
        const body = await req.json();
        slug = body.slug?.toLowerCase();
      } catch {}
    }

    if (wipeAll) {
      await setStoreData('tournament_configs', {}, 'tournament_configs.json');

      try {
        const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
        Object.keys(orgs).forEach((oSlug) => {
          orgs[oSlug].tournaments = [];
        });
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      } catch (e) {}

      try {
        await setStoreData('auction_data_ddpl', { tournaments: {} }, 'auction_data.json');
      } catch (e) {}

      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: 'All test tournaments have been wiped clean.',
        tournamentsList: [],
      });
    }

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Tournament slug is required' }, { status: 400 });
    }

    const configs = await getStoreData<Record<string, TournamentConfig>>(
      'tournament_configs',
      'tournament_configs.json',
      {}
    );

    const deletedTournamentName = configs[slug]?.name || slug;
    delete configs[slug];
    await setStoreData('tournament_configs', configs, 'tournament_configs.json');

    try {
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      if (allAuction?.tournaments?.[slug]) {
        delete allAuction.tournaments[slug];
        await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
      }
    } catch (e) {}

    try {
      await setStoreData(`tournament_schedule_${slug}`, { tournament: slug, matches: [] }, `schedule_${slug}.json`);
    } catch (e) {}

    try {
      await setStoreData(`tournament_registrations_${slug}`, [], `registrations_${slug}.json`);
    } catch (e) {}

    try {
      const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
      let modified = false;
      Object.keys(orgs).forEach((oSlug) => {
        if (orgs[oSlug].tournaments?.includes(slug)) {
          orgs[oSlug].tournaments = orgs[oSlug].tournaments.filter((t: string) => t !== slug);
          modified = true;
        }
      });
      if (modified) {
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      }
    } catch (e) {}

    invalidateStoreCache();

    return NextResponse.json({
      success: true,
      message: `Tournament "${deletedTournamentName}" deleted successfully.`,
      deletedSlug: slug,
      tournamentsList: Object.values(configs),
    });
  } catch (err: any) {
    console.error('[API DELETE tournament/register] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
