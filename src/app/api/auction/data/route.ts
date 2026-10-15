import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

const DEFAULT_STATE = {
  teams: [
    { id: 't-1', name: 'Teoco Knight Riders', short: 'TKR', owner: 'Gour Singha Roy', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
    { id: 't-2', name: 'Aircom Avengers', short: 'AA', owner: 'Yubaraj Roy', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
    { id: 't-3', name: 'Teoco Blues', short: 'TB', owner: 'Sunam Banerjee', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
    { id: 't-4', name: 'Aircom Superstar', short: 'AS', owner: 'Surojit Das', allocated: 10000, spent: 500, playersBought: 1, maxSquad: 11 },
  ],
  playerPool: [
    { id: 'p-1', name: 'Arindam Roy', role: 'Bowler', basePrice: 500 },
    { id: 'p-2', name: 'Md Sagir Hossain', role: 'All Rounder', basePrice: 500 },
    { id: 'p-3', name: 'Akash Chakraborty', role: 'Batsman', basePrice: 500 },
    { id: 'p-4', name: 'Aman Manna', role: 'Bowler', basePrice: 500 },
    { id: 'p-5', name: 'Apurba Mukherjee', role: 'All Rounder', basePrice: 500 },
    { id: 'p-6', name: 'Chanchal Chakraborty', role: 'Batsman', basePrice: 500 },
    { id: 'p-7', name: 'Mritin Ghosh', role: 'Batsman', basePrice: 500 },
    { id: 'p-8', name: 'Partha Roy', role: 'Batsman', basePrice: 500 },
    { id: 'p-9', name: 'Prantik Bose', role: 'Batsman', basePrice: 500 },
    { id: 'p-10', name: 'Samaresh Das', role: 'Bowler', basePrice: 500 },
    { id: 'p-11', name: 'Sudipto Chowdhury', role: 'Batsman', basePrice: 500 },
    { id: 'p-12', name: 'Wali Haider', role: 'Bowler', basePrice: 500 },
    { id: 'p-13', name: 'Zeeshan', role: 'Bowler', basePrice: 500 },
    { id: 'p-14', name: 'Saikat Das', role: 'Batsman', basePrice: 500 },
    { id: 'p-15', name: 'Ranjit', role: 'Batsman', basePrice: 500 },
    { id: 'p-16', name: 'Aditya Ghosh', role: 'Batsman', basePrice: 500 },
    { id: 'p-17', name: 'Ajaz MD Galib', role: 'Batsman', basePrice: 500 },
    { id: 'p-18', name: 'Jaydeep Roy', role: 'Bowler', basePrice: 500 },
    { id: 'p-19', name: 'Niladri Sekhar Ghosh', role: 'All Rounder', basePrice: 500 },
  ],
  soldTransactions: [
    { id: 'tx-owner-1', player: 'Gour Singha Roy', team: 'Teoco Knight Riders', price: 500, role: 'All Rounder (Franchise Owner)' },
    { id: 'tx-owner-2', player: 'Yubaraj Roy', team: 'Aircom Avengers', price: 500, role: 'Batsman (Franchise Owner)' },
    { id: 'tx-owner-3', player: 'Sunam Banerjee', team: 'Teoco Blues', price: 500, role: 'Batsman/Wicket Keeper (Franchise Owner)' },
    { id: 'tx-owner-4', player: 'Surojit Das', team: 'Aircom Superstar', price: 500, role: 'Batsman (Franchise Owner)' },
  ],
  unsoldPlayers: [],
  currentLotIndex: 0,
  lastUpdated: new Date().toISOString(),
  auctionStatus: 'live',
  biddingAccessEnabled: true,
  teamBiddingAccess: {
    't-1': true,
    't-2': true,
    't-3': true,
    't-4': true,
  },
  timerSeconds: 30,
  timerRunning: true,
  timerLastReset: new Date().toISOString(),
  autoBoardingEnabled: true,
  currentLot: {
    id: 'p-1',
    name: 'Arindam Roy',
    role: 'Bowler',
    basePrice: 500,
    currentBid: 500,
    leadingTeam: null,
    history: [],
  },
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
  const tournamentData = allData.tournaments?.[tournament] || allData.tournaments?.ddpl || DEFAULT_STATE;

  return NextResponse.json({
    success: true,
    tournament,
    data: tournamentData,
    allTournaments: allData.tournaments,
  });
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
