import { NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';
import {
  MatchLiveState,
  InningsData,
  SquadPlayer,
} from '@/types/match.types';
import {
  createInitialInnings,
  recordDelivery,
  undoLastDelivery,
  transitionToInnings2,
  evaluateMatchResult,
  RecordBallParams,
  calculateDlsTarget,
} from '@/lib/matchEngine';
import { MatchFixture, TournamentScheduleState } from '@/app/api/matches/route';

// Helper to bootstrap match state if not yet saved in store
async function bootstrapMatchState(matchId: string): Promise<MatchLiveState> {
  const isGor = matchId.toLowerCase().includes('gor') || matchId.toLowerCase().includes('game-of-run');
  const tournamentSlug = isGor ? 'game-of-run' : 'ddpl';

  // 1. Fetch tournament schedule to find fixture
  const schedule = await getStoreData<TournamentScheduleState | null>(
    `tournament_schedule_${tournamentSlug}`,
    `schedule_${tournamentSlug}.json`,
    null
  );

  let fixture: MatchFixture | undefined = schedule?.matches?.find((m) => m.id === matchId);

  // Fallback if not found in specific tournament
  if (!fixture && isGor) {
    const ddplSchedule = await getStoreData<TournamentScheduleState | null>('tournament_schedule_ddpl', 'schedule_ddpl.json', null);
    fixture = ddplSchedule?.matches?.find((m) => m.id === matchId);
  }

  // 2. Fetch tournament rules
  const rulesContainer = await getStoreData<any>('tournament_rules', 'rules.json', null);
  const tournamentRules = rulesContainer?.tournaments?.[tournamentSlug] || {
    matchOvers: isGor ? 12 : 10,
    maxBowlerOvers: isGor ? 3 : 2,
    wideBallPenalty: '+1 Run & Extra Ball',
    noBallPenalty: '+1 Run + Free Hit',
    pointsPerWin: 2,
  };

  // 3. Fetch auction data for rosters
  const auctionContainer = await getStoreData<any>(`auction_data_${tournamentSlug}`, 'auction_data.json', null);
  const auctionData = auctionContainer?.tournaments?.[tournamentSlug] || auctionContainer;
  const teamsList: any[] = auctionData?.teams || [];
  const soldTxList: any[] = auctionData?.soldTransactions || [];

  const teamAName = fixture?.teamA?.name || 'Teoco Knight Riders';
  const teamAShort = fixture?.teamA?.short || 'TKR';
  const teamBName = fixture?.teamB?.name || 'Aircom Avengers';
  const teamBShort = fixture?.teamB?.short || 'ACA';

  // Build team squads from auction data if available
  const buildSquad = (teamName: string, short: string): SquadPlayer[] => {
    const teamMeta = teamsList.find(
      (t) => t.name?.toLowerCase() === teamName.toLowerCase() || t.shortName?.toLowerCase() === short.toLowerCase()
    );

    const players: SquadPlayer[] = [];
    if (teamMeta) {
      if (teamMeta.captain) {
        players.push({
          id: `p-c-${teamMeta.id}`,
          name: teamMeta.captain,
          isCaptain: true,
          role: 'Captain',
        });
      }
      if (teamMeta.viceCaptain && teamMeta.viceCaptain !== teamMeta.captain) {
        players.push({
          id: `p-vc-${teamMeta.id}`,
          name: teamMeta.viceCaptain,
          role: 'Vice Captain',
        });
      }
    }

    const teamSold = soldTxList.filter((tx) => tx.team?.toLowerCase() === teamName.toLowerCase());
    teamSold.forEach((tx, idx) => {
      if (!players.some((p) => p.name.toLowerCase() === tx.player?.toLowerCase())) {
        players.push({
          id: `p-${idx}-${tx.player}`,
          name: tx.player,
          role: tx.role || 'Player',
          isWicketKeeper: tx.role?.toLowerCase().includes('keeper') || tx.role?.toLowerCase().includes('wk'),
        });
      }
    });

    if (players.length < 2) {
      players.push({ id: `p-${short}-1`, name: `${short} Opener 1`, role: 'Batter' });
      players.push({ id: `p-${short}-2`, name: `${short} Opener 2`, role: 'Batter' });
      players.push({ id: `p-${short}-3`, name: `${short} Bowler 1`, role: 'Bowler' });
    }

    return players;
  };

  const squadA = buildSquad(teamAName, teamAShort);
  const squadB = buildSquad(teamBName, teamBShort);

  const initialInnings1 = createInitialInnings(
    teamAName,
    teamAShort,
    teamBName,
    teamBShort,
    tournamentRules.matchOvers || 10,
    squadA,
    squadB
  );

  const initialState: MatchLiveState = {
    matchId,
    tournament: tournamentSlug,
    matchNumber: fixture?.matchNumber || 1,
    title: fixture?.title || `${teamAName} vs ${teamBName}`,
    stage: fixture?.stage || 'League',
    group: fixture?.group || null,
    venue: fixture?.venue || 'Arena Ground 1',
    matchDate: fixture?.matchDate || null,
    matchTime: fixture?.matchTime || '10:00 AM',
    status: fixture?.status === 'live' ? 'live' : 'upcoming',
    toss: {
      winner: teamAName,
      decision: 'bat',
      text: `${teamAName} won toss & elected to bat first`,
    },
    currentInnings: 1,
    innings1: initialInnings1,
    innings2: null,
    targetRuns: null,
    targetOvers: tournamentRules.matchOvers || 10,
    result: null,
    manOfTheMatch: null,
    officials: {
      scorerName: 'Official Match Referee',
      umpires: ['Field Umpire 1', 'Field Umpire 2'],
      referee: 'Tournament Technical Director',
    },
    rules: {
      matchOvers: tournamentRules.matchOvers || 10,
      maxBowlerOvers: tournamentRules.maxBowlerOvers || 2,
      wideBallPenalty: tournamentRules.wideBallPenalty || '+1 Run & Extra Ball',
      noBallPenalty: tournamentRules.noBallPenalty || '+1 Run + Free Hit',
      pointsPerWin: tournamentRules.pointsPerWin || 2,
    },
    matchNotes: [
      {
        id: `note-init`,
        text: `Match initialized: ${teamAName} vs ${teamBName} (${tournamentRules.matchOvers} overs limit).`,
        timestamp: new Date().toISOString(),
        type: 'info',
      },
    ],
    teamASquad: squadA,
    teamBSquad: squadB,
    lastUpdated: new Date().toISOString(),
  };

  await setStoreData(`match_state_${matchId}`, initialState, `match_state_${matchId}.json`);
  return initialState;
}

// GET /api/matches/[id]/state
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json({ success: false, error: 'Match ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    let state = await getStoreData<MatchLiveState | null>(
      `match_state_${matchId}`,
      `match_state_${matchId}.json`,
      null,
      forceRefresh
    );

    if (!state) {
      state = await bootstrapMatchState(matchId);
    }

    return NextResponse.json(
      { success: true, state },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=3',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/matches/[id]/state
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json({ success: false, error: 'Match ID required' }, { status: 400 });
    }

    const body = await req.json();
    const action = body.action;

    // Server-side Role Verification
    const userEmail = (body.userEmail || req.headers.get('x-user-email') || '').toLowerCase();
    const userRole = (body.userRole || req.headers.get('x-user-role') || '').toLowerCase();

    // Check permissions: Scorer, Organizer, or Super Admin
    if (userEmail) {
      const roles = await getStoreData<Record<string, string>>('user_roles', 'roles.json', {});
      const assignedRole = roles[userEmail] || userRole || 'user';
      const isAuthorized = ['super_admin', 'organizer', 'scorer'].includes(assignedRole);

      // In production, block unauthorized modifications
      if (process.env.NODE_ENV === 'production' && !isAuthorized && action !== 'ping') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Scoring actions require official scorer credentials.' },
          { status: 403 }
        );
      }
    }

    // Load current live state
    let state = await getStoreData<MatchLiveState | null>(
      `match_state_${matchId}`,
      `match_state_${matchId}.json`,
      null
    );

    if (!state) {
      state = await bootstrapMatchState(matchId);
    }

    const currentInnings: InningsData = state.currentInnings === 1 ? state.innings1 : (state.innings2 as InningsData);

    // 1. RECORD BALL
    if (action === 'record_ball') {
      const ballParams: RecordBallParams = body.ball;
      const updatedInnings = recordDelivery(currentInnings, ballParams);

      if (state.currentInnings === 1) {
        state.innings1 = updatedInnings;
      } else {
        state.innings2 = updatedInnings;

        // Check if 2nd innings match is concluded
        const outcome = evaluateMatchResult(state);
        if (outcome.isCompleted) {
          state.status = 'completed';
          state.result = outcome.resultText;
          state.matchNotes.unshift({
            id: `note-result-${Date.now()}`,
            text: `Match completed! ${outcome.resultText}`,
            timestamp: new Date().toISOString(),
            type: 'milestone',
          });
        }
      }

      state.status = state.status === 'upcoming' ? 'live' : state.status;
      state.lastUpdated = new Date().toISOString();
    }

    // 2. UNDO BALL
    else if (action === 'undo_ball') {
      const deliveries = currentInnings.deliveries;
      if (deliveries.length > 0) {
        const replayedInnings = undoLastDelivery(currentInnings, deliveries);
        if (state.currentInnings === 1) {
          state.innings1 = replayedInnings;
        } else {
          state.innings2 = replayedInnings;
          state.status = 'live';
          state.result = null;
        }
        state.lastUpdated = new Date().toISOString();
      }
    }

    // 3. TOSS UPDATE
    else if (action === 'update_toss') {
      const { winner, decision } = body;
      const text = `${winner} won toss & elected to ${decision} first`;
      state.toss = { winner, decision, text };

      // Re-assign batting and bowling teams if before ball 1
      if (state.innings1.deliveries.length === 0) {
        const teamA = state.teamASquad?.[0]?.name ? state.innings1.battingTeam : state.innings1.battingTeam;
        const teamB = state.innings1.bowlingTeam;

        const battingTeam = decision === 'bat' ? winner : (winner === teamA ? teamB : teamA);
        const bowlingTeam = battingTeam === teamA ? teamB : teamA;

        state.innings1.battingTeam = battingTeam;
        state.innings1.bowlingTeam = bowlingTeam;
      }

      state.matchNotes.unshift({
        id: `note-toss-${Date.now()}`,
        text,
        timestamp: new Date().toISOString(),
        type: 'info',
      });
      state.lastUpdated = new Date().toISOString();
    }

    // 4. SWITCH INNINGS (Innings 1 -> Innings 2)
    else if (action === 'switch_innings') {
      if (state.currentInnings === 1) {
        state = transitionToInnings2(state);
      }
    }

    // 5. UPDATE OFFICIALS / SCORER
    else if (action === 'update_officials') {
      state.officials = {
        ...state.officials,
        ...body.officials,
      };
      state.lastUpdated = new Date().toISOString();
    }

    // 6. RESET MATCH
    else if (action === 'reset_match') {
      state = await bootstrapMatchState(matchId);
      invalidateStoreCache(`match_state_${matchId}`);
    }

    // 7. RAIN DISRUPTION & CORPORATE DLS TARGET REVISION
    else if (action === 'revise_target_dls') {
      const { revisedOvers, reason, revisedTarget: customTarget, method } = body;
      const originalOvers = state.rules.matchOvers;
      const inn1Runs = state.innings1.totalRuns;
      const inn2Wickets = state.innings2?.wickets || 0;

      let computedTarget = customTarget;
      if (!computedTarget) {
        const dls = calculateDlsTarget(inn1Runs, originalOvers, revisedOvers, inn2Wickets);
        computedTarget = dls.revisedTarget;
      }

      state.targetOvers = revisedOvers;
      state.targetRuns = computedTarget;
      state.dlsRevision = {
        originalOvers,
        revisedOvers,
        originalTarget: inn1Runs + 1,
        revisedTarget: computedTarget,
        method: method || 'standard_dls',
        reason: reason || 'Rain interruption / reduced match duration',
        appliedAt: new Date().toISOString(),
      };

      if (state.innings2) {
        state.innings2.oversLimit = revisedOvers;
        // Re-evaluate match result with revised target
        const outcome = evaluateMatchResult(state);
        if (outcome.isCompleted) {
          state.status = 'completed';
          state.result = outcome.resultText;
        }
      }

      state.matchNotes.unshift({
        id: `note-dls-${Date.now()}`,
        text: `🌧️ Rain / Overs Disruption: Target revised to ${computedTarget} runs in ${revisedOvers} overs (${reason || 'Standard DLS calculation'}).`,
        timestamp: new Date().toISOString(),
        type: 'milestone',
      });

      state.lastUpdated = new Date().toISOString();
    }

    // Save persisted state
    await setStoreData(`match_state_${matchId}`, state, `match_state_${matchId}.json`);
    invalidateStoreCache(`match_state_${matchId}`);

    return NextResponse.json({
      success: true,
      message: `Action ${action} executed successfully`,
      state,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
