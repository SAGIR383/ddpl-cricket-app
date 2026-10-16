import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

const DEFAULT_STATE = {
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

const EMPTY_TOURNAMENT_STATE = {
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

async function readAllAuctionData(): Promise<any> {
  const parsed = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
    tournaments: {
      ddpl: DEFAULT_STATE,
      'game-of-run': EMPTY_TOURNAMENT_STATE,
    },
  });

  if (parsed?.tournaments) {
    return parsed;
  }
  return {
    tournaments: {
      ddpl: parsed || DEFAULT_STATE,
      'game-of-run': EMPTY_TOURNAMENT_STATE,
    },
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
  const tournamentData = allData.tournaments?.[tournament] || (tournament === 'ddpl' ? DEFAULT_STATE : EMPTY_TOURNAMENT_STATE);

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
      soldTransactions: updatedSold,
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
