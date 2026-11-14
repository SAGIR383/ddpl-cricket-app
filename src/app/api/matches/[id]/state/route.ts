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

const cleanPlayerName = (n: string) => (n || '').replace(/\s*\((?:c|vc|captain|owner|wk)\)/gi, '').trim();

const isPlaceholderName = (n: string) => {
  const lower = (n || '').toLowerCase().trim();
  if (!lower) return true;
  if (lower.includes('to be assigned')) return true;
  if (/^(?:[a-z]{1,4}\s+)?player\s+\d+$/i.test(lower)) return true;
  if (/^(?:[a-z]{1,4}\s+)?batter\s+\d+$/i.test(lower)) return true;
  if (/^(?:[a-z]{1,4}\s+)?bowler\s+\d+$/i.test(lower)) return true;
  return false;
};

function reconcileSquadWithAuction(
  existingSquad: SquadPlayer[] | undefined,
  teamName: string,
  teamShort: string,
  teamsList: any[],
  soldTxList: any[],
  registrations: any[]
): SquadPlayer[] {
  const findPhoto = (playerName: string): string | undefined => {
    if (!playerName || !Array.isArray(registrations)) return undefined;
    const clean = cleanPlayerName(playerName).toLowerCase();
    const reg = registrations.find((r: any) => cleanPlayerName(r.name || '').toLowerCase() === clean);
    return reg?.avatarUrl || reg?.photo || undefined;
  };

  const teamMeta = (teamsList || []).find(
    (t: any) =>
      t.name?.toLowerCase() === teamName?.toLowerCase() ||
      t.short?.toLowerCase() === teamShort?.toLowerCase() ||
      t.shortName?.toLowerCase() === teamShort?.toLowerCase()
  );

  const cleanOwner = cleanPlayerName(teamMeta?.owner || '');
  const resultSquad: SquadPlayer[] = [];

  // 1. Owner MUST ALWAYS be slot 1 (Owner & Captain)
  if (cleanOwner && !isPlaceholderName(cleanOwner)) {
    const existingOwner = existingSquad?.find(
      (p) => cleanPlayerName(p.name).toLowerCase() === cleanOwner.toLowerCase()
    );
    const photo = existingOwner?.photo || existingOwner?.avatar || findPhoto(cleanOwner);
    resultSquad.push({
      id: existingOwner?.id || `p-owner-${teamMeta?.id || teamShort}`,
      name: cleanOwner,
      isCaptain: true,
      role: 'Owner & Captain',
      avatar: photo,
      photo: photo,
    });
  }

  // 2. Fetch all sold transactions for this franchise
  const teamSold = (soldTxList || []).filter((tx: any) => {
    const txTeam = (tx.team || '').trim().toLowerCase();
    return (
      txTeam === teamName?.toLowerCase() ||
      txTeam === teamShort?.toLowerCase() ||
      (teamMeta && txTeam === (teamMeta.name || '').toLowerCase())
    );
  });

  const soldPlayersMap = new Map<string, any>();
  for (const tx of teamSold) {
    const pName = cleanPlayerName(tx.player || '');
    if (!pName || isPlaceholderName(pName)) continue;
    if (cleanOwner && pName.toLowerCase() === cleanOwner.toLowerCase()) continue;
    if (tx.role?.toLowerCase()?.includes('owner')) continue;
    soldPlayersMap.set(pName.toLowerCase(), { tx, cleanName: pName });
  }

  // Preserve existing squad players if they are legitimate sold players
  if (Array.isArray(existingSquad)) {
    for (const p of existingSquad) {
      const cName = cleanPlayerName(p.name);
      if (!cName || isPlaceholderName(cName)) continue;
      if (cleanOwner && cName.toLowerCase() === cleanOwner.toLowerCase()) continue;

      const soldEntry = soldPlayersMap.get(cName.toLowerCase());
      if (soldEntry) {
        if (!resultSquad.some((rp) => cleanPlayerName(rp.name).toLowerCase() === cName.toLowerCase())) {
          if (resultSquad.length < 8) {
            const photo = p.photo || p.avatar || soldEntry.tx.photo || soldEntry.tx.avatarUrl || findPhoto(cName);
            resultSquad.push({
              ...p,
              name: cName,
              role: p.role && !p.role.includes('Player') ? p.role : (soldEntry.tx.role || 'Player'),
              avatar: photo,
              photo: photo,
              isWicketKeeper: p.isWicketKeeper || soldEntry.tx.role?.toLowerCase().includes('keeper') || soldEntry.tx.role?.toLowerCase().includes('wk'),
            });
          }
        }
        soldPlayersMap.delete(cName.toLowerCase());
      }
    }
  }

  // Add remaining newly sold players from auction (up to 8 total players)
  Array.from(soldPlayersMap.values()).forEach(({ tx, cleanName }) => {
    if (resultSquad.length >= 8) return;
    if (!resultSquad.some((rp) => cleanPlayerName(rp.name).toLowerCase() === cleanName.toLowerCase())) {
      const photo = tx.photo || tx.avatarUrl || findPhoto(cleanName);
      resultSquad.push({
        id: tx.id ? `p-${tx.id}` : `p-sold-${cleanName.replace(/\s+/g, '-').toLowerCase()}`,
        name: cleanName,
        role: tx.role || 'Player',
        avatar: photo,
        photo: photo,
        isWicketKeeper: tx.role?.toLowerCase().includes('keeper') || tx.role?.toLowerCase().includes('wk'),
      });
    }
  });

  return resultSquad;
}

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
  const [rulesContainer, configs, allAuction, registrations] = await Promise.all([
    getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
    getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
    getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
    getStoreData<any[]>(`tournament_registrations_${tournamentSlug}`, `registrations_${tournamentSlug}.json`, []),
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

  const squadA = reconcileSquadWithAuction(
    undefined,
    teamAName,
    teamAShort,
    teamsList,
    soldTxList,
    registrations
  );
  const squadB = reconcileSquadWithAuction(
    undefined,
    teamBName,
    teamBShort,
    teamsList,
    soldTxList,
    registrations
  );

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
      maxSquadSize: currentRules.maxSquadSize || 8,
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
    } else if (state) {
      let tournamentSlug = state.tournament || queryTournament || 'ddpl-3-0';
      if (matchId.includes('-m')) {
        tournamentSlug = matchId.substring(0, matchId.lastIndexOf('-m')).toLowerCase();
      }

      const [allAuction, registrations, schedule] = await Promise.all([
        getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
        getStoreData<any[]>(`tournament_registrations_${tournamentSlug}`, `registrations_${tournamentSlug}.json`, []),
        getStoreData<TournamentScheduleState | null>(`tournament_schedule_${tournamentSlug}`, `schedule_${tournamentSlug}.json`, null),
      ]);

      let regList = registrations;
      if ((!Array.isArray(regList) || regList.length === 0) && (tournamentSlug === 'ddpl' || tournamentSlug === 'ddpl-3-0')) {
        const altSlug = tournamentSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
        regList = await getStoreData<any[]>(`tournament_registrations_${altSlug}`, `registrations_${altSlug}.json`, []);
      }

      const tourneyAuction =
        allAuction?.tournaments?.[tournamentSlug] ||
        allAuction?.tournaments?.[tournamentSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl'] ||
        allAuction?.tournaments?.['ddpl-3-0'] ||
        allAuction?.tournaments?.['ddpl'] ||
        {};
      const teamsList: any[] = tourneyAuction?.teams || [];
      const soldTxList: any[] = tourneyAuction?.soldTransactions || [];

      const fixture = schedule?.matches?.find((m) => m.id === matchId);
      const teamAName = fixture?.teamA?.name || state.innings1?.battingTeam || teamsList[0]?.name || 'MATRIX';
      const teamAShort = fixture?.teamA?.short || state.innings1?.battingTeamShort || teamsList[0]?.short || 'MA';
      const teamBName = fixture?.teamB?.name || state.innings1?.bowlingTeam || teamsList[1]?.name || 'APEX';
      const teamBShort = fixture?.teamB?.short || state.innings1?.bowlingTeamShort || teamsList[1]?.short || 'AP';

      const reconciledSquadA = reconcileSquadWithAuction(
        state.teamASquad,
        teamAName,
        teamAShort,
        teamsList,
        soldTxList,
        regList
      );
      const reconciledSquadB = reconcileSquadWithAuction(
        state.teamBSquad,
        teamBName,
        teamBShort,
        teamsList,
        soldTxList,
        regList
      );

      const squadAChanged = JSON.stringify(reconciledSquadA) !== JSON.stringify(state.teamASquad);
      const squadBChanged = JSON.stringify(reconciledSquadB) !== JSON.stringify(state.teamBSquad);

      if (squadAChanged || squadBChanged) {
        state.teamASquad = reconciledSquadA;
        state.teamBSquad = reconciledSquadB;
        state.lastUpdated = new Date().toISOString();

        await setStoreData(`match_state_${matchId}`, state, `match_state_${matchId}.json`);
        invalidateStoreCache(`match_state_${matchId}`);
      }
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

    // 8. CHANGE CREASE PLAYERS (Striker, Non-Striker, Bowler, Swap Strike, Custom Player Search)
    else if (action === 'change_crease_players') {
      const { strikerName, nonStrikerName, bowlerName, swapStrike } = body;
      const currentInn = state.currentInnings === 1 ? state.innings1 : (state.innings2 || state.innings1);
      const battingSquad = state.currentInnings === 1 ? state.teamASquad : state.teamBSquad;
      const bowlingSquad = state.currentInnings === 1 ? state.teamBSquad : state.teamASquad;

      const findAvatar = (pName: string, squad?: any[]) => {
        const found = squad?.find((p: any) => p.name?.toLowerCase() === pName.toLowerCase());
        return found?.avatar || found?.photo || undefined;
      };

      // 1. Swap Strike if requested
      if (swapStrike) {
        const temp = currentInn.strikerIndex;
        currentInn.strikerIndex = currentInn.nonStrikerIndex;
        currentInn.nonStrikerIndex = temp;
      }

      // 2. Update Striker
      if (strikerName && strikerName.trim()) {
        const cleanStriker = strikerName.trim();
        const existingIdx = currentInn.batters.findIndex(
          (b) => b.name.toLowerCase() === cleanStriker.toLowerCase()
        );
        if (existingIdx !== -1) {
          currentInn.strikerIndex = existingIdx;
        } else {
          // If current striker has faced 0 balls and scored 0, update in place
          const currentStriker = currentInn.batters[currentInn.strikerIndex];
          if (currentStriker && currentStriker.balls === 0 && currentStriker.runs === 0) {
            currentStriker.name = cleanStriker;
            currentStriker.avatar = findAvatar(cleanStriker, battingSquad);
          } else {
            currentInn.batters.push({
              id: `b-${Date.now()}`,
              name: cleanStriker,
              avatar: findAvatar(cleanStriker, battingSquad),
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              isOut: false,
              dismissal: null,
              strikeRate: 0,
            });
            currentInn.strikerIndex = currentInn.batters.length - 1;
          }
        }
      }

      // 3. Update Non-Striker
      if (nonStrikerName && nonStrikerName.trim()) {
        const cleanNonStriker = nonStrikerName.trim();
        const existingIdx = currentInn.batters.findIndex(
          (b) => b.name.toLowerCase() === cleanNonStriker.toLowerCase()
        );
        if (existingIdx !== -1) {
          currentInn.nonStrikerIndex = existingIdx;
        } else {
          // If current non-striker has faced 0 balls and scored 0, update in place
          const currentNon = currentInn.batters[currentInn.nonStrikerIndex];
          if (currentNon && currentNon.balls === 0 && currentNon.runs === 0) {
            currentNon.name = cleanNonStriker;
            currentNon.avatar = findAvatar(cleanNonStriker, battingSquad);
          } else {
            currentInn.batters.push({
              id: `b-${Date.now()}-non`,
              name: cleanNonStriker,
              avatar: findAvatar(cleanNonStriker, battingSquad),
              runs: 0,
              balls: 0,
              fours: 0,
              sixes: 0,
              isOut: false,
              dismissal: null,
              strikeRate: 0,
            });
            currentInn.nonStrikerIndex = currentInn.batters.length - 1;
          }
        }
      }

      // 4. Update Current Bowler
      if (bowlerName && bowlerName.trim()) {
        const cleanBowler = bowlerName.trim();
        const existingIdx = currentInn.bowlers.findIndex(
          (bw) => bw.name.toLowerCase() === cleanBowler.toLowerCase()
        );
        if (existingIdx !== -1) {
          currentInn.currentBowlerIndex = existingIdx;
        } else {
          const currentBw = currentInn.bowlers[currentInn.currentBowlerIndex];
          if (currentBw && (currentBw.name === 'To be assigned' || (currentBw.ballsInOver === 0 && currentBw.overs === 0))) {
            currentBw.name = cleanBowler;
            currentBw.avatar = findAvatar(cleanBowler, bowlingSquad);
          } else {
            currentInn.bowlers.push({
              id: `bw-${Date.now()}`,
              name: cleanBowler,
              avatar: findAvatar(cleanBowler, bowlingSquad),
              overs: 0,
              ballsInOver: 0,
              oversStr: '0.0',
              maidens: 0,
              runsConceded: 0,
              wickets: 0,
              economy: 0,
              dots: 0,
              noBalls: 0,
              wides: 0,
            });
            currentInn.currentBowlerIndex = currentInn.bowlers.length - 1;
          }
        }
      }

      // 5. Update Full Batting Order Shuffle if provided
      if (Array.isArray(body.battingOrder) && body.battingOrder.length > 0) {
        const orderNames: string[] = body.battingOrder.map((n: string) => n.trim()).filter(Boolean);
        const targetSquad = state.currentInnings === 1 ? state.teamASquad : state.teamBSquad;
        if (targetSquad) {
          const squadMap = new Map(targetSquad.map((p) => [p.name.toLowerCase(), p]));
          const reorderedSquad: SquadPlayer[] = [];
          for (const name of orderNames) {
            const found = squadMap.get(name.toLowerCase());
            if (found) reorderedSquad.push(found);
          }
          for (const p of targetSquad) {
            if (!reorderedSquad.some((sp) => sp.name.toLowerCase() === p.name.toLowerCase())) {
              reorderedSquad.push(p);
            }
          }
          if (state.currentInnings === 1) {
            state.teamASquad = reorderedSquad;
          } else {
            state.teamBSquad = reorderedSquad;
          }
        }
      }

      state.matchNotes.unshift({
        id: `note-crease-${Date.now()}`,
        text: `Crease updated: Striker [${currentInn.batters[currentInn.strikerIndex]?.name}], Non-Striker [${currentInn.batters[currentInn.nonStrikerIndex]?.name}], Bowler: [${currentInn.bowlers[currentInn.currentBowlerIndex]?.name}].`,
        timestamp: new Date().toISOString(),
        type: 'info',
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
