import { NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

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
  invalidateStoreCache('auction_data_ddpl');
  return setStoreData('auction_data_ddpl', data, 'auction_data.json');
}

// GET /api/auction/data?tournament=ddpl
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();

  const allData = await readAllAuctionData();
  let rawTournamentData = allData.tournaments?.[tournament];
  if ((!rawTournamentData || (!rawTournamentData.teams?.length && !rawTournamentData.playerPool?.length)) && (tournament === 'ddpl' || tournament === 'ddpl-3-0')) {
    const alt = tournament === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
    if (allData.tournaments?.[alt]) {
      rawTournamentData = allData.tournaments[alt];
    }
  }
  const tournamentData = { ...(rawTournamentData || EMPTY_TOURNAMENT_STATE) };

  // Enrich player pool, currentLot, and transactions with player photos from registrations
  // Also auto-reconcile any franchise owner present in registrations that may be missing from teams
  try {
    let registrations = await getStoreData<any[]>(
      `tournament_registrations_${tournament}`,
      `registrations_${tournament}.json`,
      []
    );
    if ((!Array.isArray(registrations) || registrations.length === 0) && (tournament === 'ddpl' || tournament === 'ddpl-3-0')) {
      const alt = tournament === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
      registrations = await getStoreData<any[]>(
        `tournament_registrations_${alt}`,
        `registrations_${alt}.json`,
        []
      );
    }
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

    // Auto-reconciliation: Ensure every registered franchise owner is present in teams & soldTransactions
    if (Array.isArray(registrations) && registrations.length > 0) {
      let needsAutoReconcile = false;
      if (!tournamentData.teams) tournamentData.teams = [];
      if (!tournamentData.soldTransactions) tournamentData.soldTransactions = [];

      const existingTeamNames = new Set(
        tournamentData.teams.map((t: any) => (t.name || '').trim().toLowerCase())
      );

      const registeredOwners = registrations.filter((r: any) => r.isOwner && r.franchiseTeam);
      for (const reg of registeredOwners) {
        const teamName = reg.franchiseTeam.trim();
        const normName = teamName.toLowerCase();

        if (!existingTeamNames.has(normName)) {
          const short = (reg.franchiseTeam.slice(0, 3) || 'TM').toUpperCase();
          const ownerPhoto = reg.avatarUrl || reg.photo || null;
          const newReconciledTeam = {
            id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: teamName,
            short,
            owner: reg.name,
            ownerEmail: reg.email,
            allocated: 7000,
            spent: 100,
            remaining: 6900,
            playersBought: 1,
            maxSquad: 11,
            captain: `${reg.name} (C)`,
            viceCaptain: 'To be assigned',
            players: [
              {
                name: reg.name,
                role: `${reg.role || 'All-rounder'} (Franchise Owner)`,
                price: 100,
                avatarUrl: ownerPhoto,
              },
            ],
          };

          tournamentData.teams.push(newReconciledTeam);
          existingTeamNames.add(normName);
          needsAutoReconcile = true;

          // Check if soldTransactions has owner entry
          if (!tournamentData.soldTransactions.some((tx: any) => (tx.player || '').toLowerCase() === reg.name.toLowerCase())) {
            tournamentData.soldTransactions.push({
              id: `tx-owner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              player: reg.name,
              team: teamName,
              price: 100,
              role: `${reg.role || 'All-rounder'} (Franchise Owner)`,
              avatarUrl: ownerPhoto,
            });
          }

          // Remove owner from open pool if present
          if (Array.isArray(tournamentData.playerPool)) {
            tournamentData.playerPool = tournamentData.playerPool.filter(
              (p: any) => (p.name || '').toLowerCase() !== reg.name.toLowerCase()
            );
          }
        }
      }

      if (needsAutoReconcile) {
        if (!allData.tournaments) allData.tournaments = {};
        allData.tournaments[tournament] = tournamentData;
        await saveAllAuctionData(allData);
      }
    }
  } catch (enrichErr) {
    console.warn('Could not enrich auction photos or reconcile franchises:', enrichErr);
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
    let updatedTeams = currentTournamentData.teams || [];
    if (Array.isArray(body.teams)) {
      if (body.allowTeamDeletion) {
        updatedTeams = body.teams;
      } else {
        // Merge teams to preserve all created franchises and prevent stale overwrites
        const bodyTeamMap = new Map<string, any>(body.teams.map((t: any) => [(t.name || '').toLowerCase(), t]));
        updatedTeams = (currentTournamentData.teams || []).map((t: any) => {
          const matching = bodyTeamMap.get((t.name || '').toLowerCase());
          return matching ? { ...t, ...matching } : t;
        });
        for (const bt of body.teams) {
          if (!updatedTeams.some((t: any) => (t.name || '').toLowerCase() === (bt.name || '').toLowerCase())) {
            updatedTeams.push(bt);
          }
        }
      }
    }
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
    if (tournament === 'ddpl' || tournament === 'ddpl-3-0') {
      const alt = tournament === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
      allData.tournaments[alt] = { ...updatedTournamentData };
    }

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
