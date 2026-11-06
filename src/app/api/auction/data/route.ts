import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

const DEFAULT_STATE = {
  teams: [],
  playerPool: [],
  soldTransactions: [],
  unsoldPlayers: [],
  currentLotIndex: 0,
  lastUpdated: new Date().toISOString(),
  auctionStatus: 'stopped',
  biddingAccessEnabled: false,
  teamBiddingAccess: {},
  timerSeconds: 30,
  timerRunning: false,
  timerLastReset: new Date().toISOString(),
  autoBoardingEnabled: true,
  currentLot: null,
};

const EMPTY_TOURNAMENT_STATE = {
  teams: [],
  playerPool: [],
  soldTransactions: [],
  unsoldPlayers: [],
  currentLotIndex: 0,
  lastUpdated: new Date().toISOString(),
  auctionStatus: 'stopped',
  biddingAccessEnabled: false,
  teamBiddingAccess: {},
  timerSeconds: 30,
  timerRunning: false,
  timerLastReset: new Date().toISOString(),
  autoBoardingEnabled: true,
  currentLot: null,
};

async function readAllAuctionData(): Promise<any> {
  const parsed = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
    tournaments: {},
  });

  if (parsed?.tournaments) {
    return parsed;
  }
  return {
    tournaments: parsed || {},
  };
}

async function saveAllAuctionData(data: any) {
  return setStoreData('auction_data_ddpl', data, 'auction_data.json');
}

// GET /api/auction/data?tournament=ddpl
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();

  const allData = await readAllAuctionData();
  const rawTournamentData = allData.tournaments?.[tournament] || EMPTY_TOURNAMENT_STATE;
  const tournamentData = { ...rawTournamentData };

  // Enrich player pool, currentLot, and transactions with player photos from registrations
  try {
    const registrations = await getStoreData<any[]>(
      `tournament_registrations_${tournament}`,
      `registrations_${tournament}.json`,
      []
    );
    const photoMap = new Map<string, string>();
    if (Array.isArray(registrations)) {
      for (const r of registrations) {
        const photo = r.avatarUrl || r.photo;
        if (r.name && photo) {
          photoMap.set(r.name.trim().toLowerCase(), photo);
        }
      }
    }

    if (tournamentData.currentLot?.name) {
      const lotName = tournamentData.currentLot.name.trim().toLowerCase();
      if (!tournamentData.currentLot.avatarUrl && photoMap.has(lotName)) {
        tournamentData.currentLot = {
          ...tournamentData.currentLot,
          avatarUrl: photoMap.get(lotName),
        };
      }
    }

    if (Array.isArray(tournamentData.playerPool)) {
      tournamentData.playerPool = tournamentData.playerPool.map((p: any) => {
        const pName = p.name?.trim().toLowerCase();
        if (!p.avatarUrl && pName && photoMap.has(pName)) {
          return { ...p, avatarUrl: photoMap.get(pName) };
        }
        return p;
      });
    }

    if (Array.isArray(tournamentData.soldTransactions)) {
      tournamentData.soldTransactions = tournamentData.soldTransactions.map((tx: any) => {
        const txName = (tx.player || tx.name)?.trim().toLowerCase();
        if (!tx.avatarUrl && txName && photoMap.has(txName)) {
          return { ...tx, avatarUrl: photoMap.get(txName) };
        }
        return tx;
      });
    }
  } catch (enrichErr) {
    console.warn('Could not enrich auction photos:', enrichErr);
  }

  return NextResponse.json(
    {
      success: true,
      tournament,
      data: tournamentData,
      allTournaments: allData.tournaments,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=6',
      },
    }
  );
}

// POST /api/auction/data?tournament=ddpl
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const tournament = (body.tournament || searchParams.get('tournament') || 'ddpl').toLowerCase();

    const allData = await readAllAuctionData();
    if (!allData.tournaments) {
      allData.tournaments = {};
    }

    const currentTournamentData = allData.tournaments[tournament] || DEFAULT_STATE;

    // Check if body contains explicit team updates or transactions update
    let updatedTeams = body.teams || currentTournamentData.teams;
    let updatedSold = body.soldTransactions || currentTournamentData.soldTransactions;

    // Deduplicate player pool by trimmed lowercase name
    let updatedPlayerPool = body.playerPool !== undefined ? body.playerPool : currentTournamentData.playerPool;
    if (Array.isArray(updatedPlayerPool)) {
      const seenNames = new Set<string>();
      updatedPlayerPool = updatedPlayerPool.filter((p: any) => {
        const key = p.name?.trim().toLowerCase();
        if (!key || seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });
    }

    let updatedUnsold = body.unsoldPlayers !== undefined ? body.unsoldPlayers : currentTournamentData.unsoldPlayers;
    if (Array.isArray(updatedUnsold)) {
      const seenUnsold = new Set<string>();
      updatedUnsold = updatedUnsold.filter((name: any) => {
        const key = String(name).trim().toLowerCase();
        if (!key || seenUnsold.has(key)) return false;
        seenUnsold.add(key);
        return true;
      });
    }

    if (body.updateTeamLeadership) {
      const { teamId, captain, viceCaptain } = body.updateTeamLeadership;
      updatedTeams = (currentTournamentData.teams || []).map((t: any) =>
        t.id === teamId || t.name === teamId
          ? { ...t, captain, viceCaptain }
          : t
      );
    }

    if (body.updatePlayerRole) {
      const { playerName, newRole } = body.updatePlayerRole;
      updatedSold = (currentTournamentData.soldTransactions || []).map((tx: any) =>
        tx.player.toLowerCase() === playerName.toLowerCase()
          ? { ...tx, role: newRole }
          : tx
      );
    }

    const updatedTournamentData = {
      ...currentTournamentData,
      ...body,
      teams: updatedTeams,
      playerPool: updatedPlayerPool,
      soldTransactions: updatedSold,
      unsoldPlayers: updatedUnsold,
      lastUpdated: new Date().toISOString(),
    };

    allData.tournaments[tournament] = updatedTournamentData;

    await saveAllAuctionData(allData);

    return NextResponse.json({
      success: true,
      message: `Auction state for ${tournament.toUpperCase()} synchronized successfully`,
      tournament,
      data: updatedTournamentData,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
