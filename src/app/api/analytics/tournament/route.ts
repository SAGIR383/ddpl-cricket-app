import { NextResponse } from 'next/server';
import { getStoreData } from '@/lib/supabase/store';
import { TournamentScheduleState, MatchFixture } from '@/app/api/matches/route';
import { MatchLiveState } from '@/types/match.types';
import {
  calculateTournamentStandings,
  calculateTournamentLeaderboards,
} from '@/lib/tournamentAnalytics';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();

    // 1. Fetch auction data for teams
    const auctionContainer = await getStoreData<any>(
      `auction_data_${tournament}`,
      'auction_data.json',
      null
    );
    const auctionData = auctionContainer?.tournaments?.[tournament] || auctionContainer;
    const teams: any[] = auctionData?.teams || [];

    // 2. Fetch tournament schedule fixtures
    const schedule = await getStoreData<TournamentScheduleState | null>(
      `tournament_schedule_${tournament}`,
      `schedule_${tournament}.json`,
      null
    );
    const fixtures: MatchFixture[] = schedule?.matches || [];

    // 3. Fetch match states for all fixtures
    const matchStates: Record<string, MatchLiveState> = {};
    for (const fix of fixtures) {
      const state = await getStoreData<MatchLiveState | null>(
        `match_state_${fix.id}`,
        `match_state_${fix.id}.json`,
        null
      );
      if (state) {
        matchStates[fix.id] = state;
      }
    }

    // 4. Compute Dynamic Standings & Leaderboards
    const standings = calculateTournamentStandings(teams, fixtures, matchStates);
    const leaderboards = calculateTournamentLeaderboards(matchStates);

    const completedMatches = fixtures.filter(
      (f) => f.status === 'completed' || matchStates[f.id]?.status === 'completed'
    ).length;

    return NextResponse.json({
      success: true,
      tournament,
      totalTeams: teams.length,
      totalMatches: fixtures.length,
      completedMatches,
      standings,
      leaderboards,
      lastCalculated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
