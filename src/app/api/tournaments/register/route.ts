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
  status: 'upcoming' | 'open' | 'closed' | 'auction' | 'ongoing' | 'completed';
  pursePerTeam: number;
  ownerBasePrice: number;
  maxSquad: number;
  minSquad: number;
}

const DEFAULT_CONFIGS: Record<string, TournamentConfig> = {
  ddpl: {
    slug: 'ddpl',
    name: 'Desk to Dugout Premier League (DDPL)',
    status: 'open', // Open for DDPL registration
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 9,
  },
  'game-of-run': {
    slug: 'game-of-run',
    name: 'Game of RUN Championship',
    status: 'upcoming', // Upcoming tournament
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 9,
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
    status: tournament === 'ddpl' ? 'open' : 'upcoming',
    pursePerTeam: 10000,
    ownerBasePrice: 500,
    maxSquad: 11,
    minSquad: 9,
  };

  const registrations = await getStoreData<TournamentPlayerRegistration[]>(
    `tournament_registrations_${tournament}`,
    `registrations_${tournament}.json`,
    []
  );

  return NextResponse.json({
    success: true,
    tournament,
    config,
    allConfigs: configs,
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

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API tournament/register] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
