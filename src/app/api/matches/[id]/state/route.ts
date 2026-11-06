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
async function bootstrapMatchState(matchId: string, requestedTournament?: string): Promise<MatchLiveState> {
  // 1. Determine tournament slug dynamically
  let tournamentSlug = (requestedTournament || '').toLowerCase().trim();
  if (!tournamentSlug) {
    if (matchId.includes('-m')) {
      tournamentSlug = matchId.substring(0, matchId.lastIndexOf('-m')).toLowerCase();
    } else if (matchId.toLowerCase().includes('gor') || matchId.toLowerCase().includes('game-of-run')) {
      tournamentSlug = 'game-of-run';
    } else {
      tournamentSlug = 'ddpl-3-0';
    }
  }

  // 2. Fetch tournament schedule to find fixture
  const schedule = await getStoreData<TournamentScheduleState | null>(
    `tournament_schedule_${tournamentSlug}`,
    `schedule_${tournamentSlug}.json`,
    null
  );

  let fixture: MatchFixture | undefined = schedule?.matches?.find((m) => m.id === matchId);

  // Fallback if not found in specific tournament
  if (!fixture && tournamentSlug !== 'ddpl-3-0') {
    const altSchedule = await getStoreData<TournamentScheduleState | null>('tournament_schedule_ddpl-3-0', 'schedule_ddpl-3-0.json', null);
    fixture = altSchedule?.matches?.find((m) => m.id === matchId);
    if (fixture) tournamentSlug = 'ddpl-3-0';
  }
  if (!fixture && tournamentSlug !== 'ddpl') {
    const altSchedule = await getStoreData<TournamentScheduleState | null>('tournament_schedule_ddpl', 'schedule_ddpl.json', null);
    fixture = altSchedule?.matches?.find((m) => m.id === matchId);
    if (fixture) tournamentSlug = 'ddpl';
  }

  // 3. Fetch tournament rules, configs, and live auction rosters
  const [rulesContainer, configs, allAuction] = await Promise.all([
    getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
    getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
    getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
  ]);

  const currentRules = rulesContainer?.tournaments?.[tournamentSlug] || rulesContainer?.tournaments?.['ddpl-3-0'] || {};
  const currentConfig = configs?.[tournamentSlug] || configs?.['ddpl-3-0'] || {};
  const tourneyAuction = allAuction?.tournaments?.[tournamentSlug] || allAuction?.tournaments?.['ddpl-3-0'] || {};
  const teamsList: any[] = tourneyAuction?.teams || [];
  const soldTxList: any[] = tourneyAuction?.soldTransactions || [];

  const matchOvers = Number(currentRules.matchOvers || currentConfig?.overs || 10);
  const maxBowlerOvers = Number(currentRules.maxBowlerOvers || Math.max(1, Math.ceil(matchOvers / 5)));
  const resolvedVenue = (fixture?.venue || currentRules.groundName || currentRules.venue || currentConfig?.venue || 'Arena Ground 1').trim();

  // Resolve Team A & Team B strictly from real tournament franchises
  const defaultTeamA = teamsList[0] || { name: 'FALCON', short: 'FA', shortName: 'FA' };
  const defaultTeamB = teamsList[1] || { name: 'MATRIX', short: 'MA', shortName: 'MA' };

  const teamAName = fixture?.teamA?.name || defaultTeamA.name;
  const teamAShort = fixture?.teamA?.short || defaultTeamA.short || defaultTeamA.shortName || teamAName.slice(0, 3).toUpperCase();
  const teamBName = fixture?.teamB?.name || defaultTeamB.name;
  const teamBShort = fixture?.teamB?.short || defaultTeamB.short || defaultTeamB.shortName || teamBName.slice(0, 3).toUpperCase();

  // Build team squads strictly from real tournament data
  const buildSquad = (teamName: string, short: string): SquadPlayer[] => {
    const teamMeta = teamsList.find(
      (t) => t.name?.toLowerCase() === teamName.toLowerCase() || t.short?.toLowerCase() === short.toLowerCase() || t.shortName?.toLowerCase() === short.toLowerCase()
    );

    const players: SquadPlayer[] = [];
    if (teamMeta) {
      if (teamMeta.owner) {
        players.push({
          id: `p-owner-${teamMeta.id || short}`,
          name: teamMeta.owner,
          isCaptain: true,
          role: 'Owner & Player',
        });
      }
      if (teamMeta.captain && teamMeta.captain !== teamMeta.owner) {
        players.push({
          id: `p-c-${teamMeta.id || short}`,
          name: teamMeta.captain,
          isCaptain: true,
          role: 'Captain',
        });
      }
      if (teamMeta.viceCaptain && teamMeta.viceCaptain !== teamMeta.captain && teamMeta.viceCaptain !== teamMeta.owner) {
        players.push({
          id: `p-vc-${teamMeta.id || short}`,
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
      players.push({ id: `p-${short}-1`, name: `${short} Batter 1`, role: 'Batter' });
      players.push({ id: `p-${short}-2`, name: `${short} Batter 2`, role: 'Batter' });
      players.push({ id: `p-${short}-3`, name: `${short} All-Rounder`, role: 'All-Rounder' });
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
    matchOvers,
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
    venue: resolvedVenue,
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
    targetOvers: matchOvers,
    result: null,
    manOfTheMatch: null,
    officials: {
      scorerName: 'Official Match Referee',
      umpires: ['Field Umpire 1', 'Field Umpire 2'],
      referee: 'Tournament Technical Director',
    },
    rules: {
      matchOvers,
      maxBowlerOvers,
      wideBallPenalty: currentRules.wideBallPenalty || '+1 Run & Extra Ball',
      noBallPenalty: currentRules.noBallPenalty || '+1 Run + Free Hit',
      pointsPerWin: currentRules.pointsPerWin || 2,
    },
    matchNotes: [
      {
        id: `note-init`,
        text: `Match initialized: ${teamAName} vs ${teamBName} (${matchOvers} overs limit at ${resolvedVenue}).`,
        timestamp: new Date().toISOString(),
        type: 'info',
      },
    ],
    teamASquad: squadA,
    teamBSquad: squadB,
    lastUpdated: new Date().toISOString(),
  };

  await setStoreData(`match_state_${matchId}`, initialState, `match_state_${matchId}.json`);
  invalidateStoreCache(`match_state_${matchId}`);
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
    const queryTournament = searchParams.get('tournament');

    let state = await getStoreData<MatchLiveState | null>(
      `match_state_${matchId}`,
      `match_state_${matchId}.json`,
      null,
      forceRefresh
    );

    // If state is missing or contains stale legacy mock data, re-bootstrap with live tournament data
    const isLegacyMock =
      state?.title?.includes('Teoco Knight Riders') ||
      state?.title?.includes('Aircom Avengers') ||
      state?.innings1?.battingTeam?.includes('Teoco Knight Riders') ||
      state?.innings1?.battingTeam?.includes('Aircom Avengers');

    if (!state || isLegacyMock) {
      state = await bootstrapMatchState(matchId, queryTournament || undefined);
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
