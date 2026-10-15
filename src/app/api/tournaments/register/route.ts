import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

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

  return NextResponse.json({
    success: true,
    tournament,
    config,
    allConfigs: configs,
    tournamentsList,
    registrations,
    count: registrations.length,
  });
}

// POST /api/tournaments/register
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, tournament = 'ddpl' } = body;
    const tSlug = tournament.toLowerCase();

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
    if (action === 'register') {
      const { registration } = body;
      if (!registration || !registration.name || !registration.email) {
        return NextResponse.json(
          { success: false, error: 'Player name and email are required' },
          { status: 400 }
        );
      }

      // Check current registration status
      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        DEFAULT_CONFIGS
      );
      const currentConfig = configs[tSlug] || DEFAULT_CONFIGS[tSlug];
      if (currentConfig && currentConfig.status !== 'open') {
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

    // 5. CREATE CUSTOM TOURNAMENT (Super Admin)
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
      };

      configs[generatedSlug] = newTournamentConfig;
      await setStoreData('tournament_configs', configs, 'tournament_configs.json');

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

    // 6. DELETE CUSTOM TOURNAMENT (Super Admin)
    if (action === 'delete_tournament') {
      const targetSlug = body.slug || tSlug;
      if (targetSlug === 'ddpl' || targetSlug === 'game-of-run') {
        return NextResponse.json({ success: false, error: 'Cannot delete default flagship tournaments.' }, { status: 400 });
      }

      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        DEFAULT_CONFIGS
      );

      delete configs[targetSlug];
      await setStoreData('tournament_configs', configs, 'tournament_configs.json');

      return NextResponse.json({
        success: true,
        message: `Tournament ${targetSlug} removed successfully.`,
        allConfigs: configs,
        tournamentsList: Object.values(configs),
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API tournament/register] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
