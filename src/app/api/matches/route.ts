import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

export interface MatchFixture {
  id: string;
  matchNumber: number;
  tournament: string;
  stage: 'League' | 'Group Stage' | 'Qualifier 1' | 'Eliminator' | 'Qualifier 2' | 'Semi-Final' | 'Final';
  group?: 'Group A' | 'Group B' | null;
  title: string;
  teamA: {
    name: string;
    short: string;
    score?: string;
    overs?: string;
  };
  teamB: {
    name: string;
    short: string;
    score?: string;
    overs?: string;
  };
  matchDate?: string | null; // e.g. "2026-11-15"
  matchTime?: string | null; // e.g. "10:00 AM"
  venue: string;
  status: 'upcoming' | 'live' | 'completed' | 'postponed' | 'abandoned';
  summary?: string;
}

export interface TournamentScheduleState {
  tournament: string;
  startDate?: string | null;
  endDate?: string | null;
  format: 'round-robin-playoffs' | 'group-stage-playoffs';
  matches: MatchFixture[];
  lastUpdated: string;
}

// Generate DDPL fixtures: Round-Robin (all teams play each other) + Top 4 Playoffs
function generateDdplFixtures(teams: any[], tournamentOvers = 10, tournamentSlug = 'ddpl'): MatchFixture[] {
  const fixtures: MatchFixture[] = [];
  let matchNum = 1;

  if (teams.length >= 2) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          id: `${tournamentSlug}-m${matchNum}`,
          matchNumber: matchNum,
          tournament: tournamentSlug,
          stage: 'League',
          title: `Match ${matchNum}: ${teams[i].short} vs ${teams[j].short}`,
          teamA: { name: teams[i].name, short: teams[i].short },
          teamB: { name: teams[j].name, short: teams[j].short },
          venue: 'Arena Ground 1',
          matchDate: null,
          matchTime: '10:00 AM',
          status: 'upcoming',
          summary: `Round-robin league match (${tournamentOvers} Overs) between ${teams[i].name} and ${teams[j].name}.`,
        });
        matchNum++;
      }
    }
  }

  // Add standard Top-4 Playoff fixtures
  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Qualifier 1',
    title: `Qualifier 1: Rank #1 vs Rank #2`,
    teamA: { name: 'Rank #1 Team', short: 'T1' },
    teamB: { name: 'Rank #2 Team', short: 'T2' },
    venue: 'Arena Stadium',
    matchDate: null,
    matchTime: '02:00 PM',
    status: 'upcoming',
    summary: 'Winner advances directly to Grand Final. Loser gets second chance in Qualifier 2.',
  });
  matchNum++;

  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Eliminator',
    title: `Eliminator: Rank #3 vs Rank #4`,
    teamA: { name: 'Rank #3 Team', short: 'T3' },
    teamB: { name: 'Rank #4 Team', short: 'T4' },
    venue: 'Arena Stadium',
    matchDate: null,
    matchTime: '06:00 PM',
    status: 'upcoming',
    summary: 'Winner advances to Qualifier 2. Loser is eliminated.',
  });
  matchNum++;

  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Qualifier 2',
    title: `Qualifier 2: Loser Q1 vs Winner Eliminator`,
    teamA: { name: 'Loser of Q1', short: 'LQ1' },
    teamB: { name: 'Winner of Eliminator', short: 'WEL' },
    venue: 'Arena Stadium',
    matchDate: null,
    matchTime: '02:00 PM',
    status: 'upcoming',
    summary: 'High-stakes battle for the final spot in the Grand Championship.',
  });
  matchNum++;

  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Final',
    title: `Grand Final: Winner Q1 vs Winner Q2`,
    teamA: { name: 'Winner of Q1', short: 'WQ1' },
    teamB: { name: 'Winner of Q2', short: 'WQ2' },
    venue: 'Arena Stadium',
    matchDate: null,
    matchTime: '06:30 PM',
    status: 'upcoming',
    summary: 'Championship Trophy Match.',
  });

  return fixtures;
}

// Generate Game of RUN fixtures: Group Stage (Group A and Group B) + Playoffs + Final
function generateGameOfRunFixtures(teams: any[], tournamentOvers = 12, tournamentSlug = 'game-of-run'): MatchFixture[] {
  const fixtures: MatchFixture[] = [];
  let matchNum = 1;

  // Split teams into Group A and Group B
  const groupA = teams.filter((_, idx) => idx % 2 === 0);
  const groupB = teams.filter((_, idx) => idx % 2 !== 0);

  // Group A round-robin
  for (let i = 0; i < groupA.length; i++) {
    for (let j = i + 1; j < groupA.length; j++) {
      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Group Stage',
        group: 'Group A',
        title: `Group A: ${groupA[i].short} vs ${groupA[j].short}`,
        teamA: { name: groupA[i].name, short: groupA[i].short },
        teamB: { name: groupA[j].name, short: groupA[j].short },
        venue: 'Park View Oval',
        matchDate: null,
        matchTime: '10:00 AM',
        status: 'upcoming',
        summary: `Group A clash (${tournamentOvers} Overs) between ${groupA[i].name} and ${groupA[j].name}.`,
      });
      matchNum++;
    }
  }

  // Group B round-robin
  for (let i = 0; i < groupB.length; i++) {
    for (let j = i + 1; j < groupB.length; j++) {
      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Group Stage',
        group: 'Group B',
        title: `Group B: ${groupB[i].short} vs ${groupB[j].short}`,
        teamA: { name: groupB[i].name, short: groupB[i].short },
        teamB: { name: groupB[j].name, short: groupB[j].short },
        venue: 'Park View Oval',
        matchDate: null,
        matchTime: '02:00 PM',
        status: 'upcoming',
        summary: `Group B clash (${tournamentOvers} Overs) between ${groupB[i].name} and ${groupB[j].name}.`,
      });
      matchNum++;
    }
  }

  // Semi-Final 1: Group A #1 vs Group B #2
  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Semi-Final',
    title: `Semi-Final 1: Group A #1 vs Group B #2`,
    teamA: { name: 'Group A Winner', short: 'GA1' },
    teamB: { name: 'Group B Runner-Up', short: 'GB2' },
    venue: 'Corporate Sports Complex',
    matchDate: null,
    matchTime: '10:00 AM',
    status: 'upcoming',
    summary: 'Winner advances to Championship Grand Final.',
  });
  matchNum++;

  // Semi-Final 2: Group B #1 vs Group A #2
  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Semi-Final',
    title: `Semi-Final 2: Group B #1 vs Group A #2`,
    teamA: { name: 'Group B Winner', short: 'GB1' },
    teamB: { name: 'Group A Runner-Up', short: 'GA2' },
    venue: 'Corporate Sports Complex',
    matchDate: null,
    matchTime: '02:30 PM',
    status: 'upcoming',
    summary: 'Winner advances to Championship Grand Final.',
  });
  matchNum++;

  // Final: Winner SF1 vs Winner SF2
  fixtures.push({
    id: `${tournamentSlug}-m${matchNum}`,
    matchNumber: matchNum,
    tournament: tournamentSlug,
    stage: 'Final',
    title: `Grand Championship Final: Winner SF1 vs Winner SF2`,
    teamA: { name: 'Winner SF1', short: 'WSF1' },
    teamB: { name: 'Winner SF2', short: 'WSF2' },
    venue: 'Corporate Sports Complex',
    matchDate: null,
    matchTime: '06:00 PM',
    status: 'upcoming',
    summary: 'Grand Championship Trophy Decider.',
  });

  return fixtures;
}

// GET /api/matches?tournament=ddpl
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();

  const defaultSchedule: TournamentScheduleState = {
    tournament,
    startDate: null,
    endDate: null,
    format: tournament.includes('game-of-run') || tournament.includes('gor') ? 'group-stage-playoffs' : 'round-robin-playoffs',
    matches: [],
    lastUpdated: new Date().toISOString(),
  };

  const schedule = await getStoreData<TournamentScheduleState>(
    `tournament_schedule_${tournament}`,
    `schedule_${tournament}.json`,
    defaultSchedule
  );

  return NextResponse.json({
    success: true,
    tournament,
    schedule,
  });
}

// POST /api/matches
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tournament = (body.tournament || 'ddpl').toLowerCase();
    const action = body.action;

    let schedule = await getStoreData<TournamentScheduleState>(
      `tournament_schedule_${tournament}`,
      `schedule_${tournament}.json`,
      {
        tournament,
        startDate: null,
        endDate: null,
        format: tournament.includes('game-of-run') || tournament.includes('gor') ? 'group-stage-playoffs' : 'round-robin-playoffs',
        matches: [],
        lastUpdated: new Date().toISOString(),
      }
    );

    // 1. GENERATE SCHEDULE ACCORDING TO TOURNAMENT FORMAT
    if (action === 'generate_schedule') {
      const teams = body.teams || [];
      const format = body.format || (tournament.includes('game-of-run') || tournament.includes('gor') ? 'game-of-run' : 'ddpl');
      const overs = body.overs || (format === 'game-of-run' ? 12 : 10);

      let generatedMatches: MatchFixture[];
      if (format === 'game-of-run' || format === 'group-stage-playoffs') {
        generatedMatches = generateGameOfRunFixtures(teams, overs, tournament);
      } else {
        generatedMatches = generateDdplFixtures(teams, overs, tournament);
      }

      schedule = {
        ...schedule,
        format: format === 'game-of-run' || format === 'group-stage-playoffs' ? 'group-stage-playoffs' : 'round-robin-playoffs',
        matches: generatedMatches,
        lastUpdated: new Date().toISOString(),
      };

      await setStoreData(`tournament_schedule_${tournament}`, schedule, `schedule_${tournament}.json`);

      return NextResponse.json({
        success: true,
        message: `Successfully generated ${generatedMatches.length} fixtures for ${tournament.toUpperCase()}`,
        schedule,
      });
    }

    // 2. UPDATE INDIVIDUAL MATCH (Date, Time, Venue, Status, etc.)
    if (action === 'update_match') {
      const { matchId, updates } = body;
      const updatedMatches = (schedule.matches || []).map((m) =>
        m.id === matchId ? { ...m, ...updates } : m
      );

      schedule = {
        ...schedule,
        matches: updatedMatches,
        lastUpdated: new Date().toISOString(),
      };

      await setStoreData(`tournament_schedule_${tournament}`, schedule, `schedule_${tournament}.json`);

      return NextResponse.json({
        success: true,
        message: `Match ${matchId} updated successfully`,
        schedule,
      });
    }

    // 3. UPDATE TOURNAMENT DATES (Start Date, End Date)
    if (action === 'update_tournament_dates') {
      const { startDate, endDate } = body;
      schedule = {
        ...schedule,
        startDate: startDate !== undefined ? startDate : schedule.startDate,
        endDate: endDate !== undefined ? endDate : schedule.endDate,
        lastUpdated: new Date().toISOString(),
      };

      await setStoreData(`tournament_schedule_${tournament}`, schedule, `schedule_${tournament}.json`);

      return NextResponse.json({
        success: true,
        message: 'Tournament dates updated successfully',
        schedule,
      });
    }

    // 4. BULK OVERWRITE ALL MATCHES
    if (action === 'save_all_matches') {
      schedule = {
        ...schedule,
        matches: body.matches || [],
        startDate: body.startDate !== undefined ? body.startDate : schedule.startDate,
        endDate: body.endDate !== undefined ? body.endDate : schedule.endDate,
        lastUpdated: new Date().toISOString(),
      };

      await setStoreData(`tournament_schedule_${tournament}`, schedule, `schedule_${tournament}.json`);

      return NextResponse.json({
        success: true,
        message: 'Matches schedule saved successfully',
        schedule,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
