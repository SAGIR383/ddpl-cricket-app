import { MatchFixture } from '@/app/api/matches/route';
import { MatchLiveState, InningsData } from '@/types/match.types';

export interface TeamStandingRow {
  rank: number;
  name: string;
  short: string;
  owner?: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsFor: number;
  oversFor: number;
  runsAgainst: number;
  oversAgainst: number;
  nrr: number;
  nrrStr: string;
  form: ('W' | 'L' | 'T')[];
  status: 'Q' | 'E' | 'in_contention'; // Q = Qualified, E = Eliminated
  squadCount?: number;
}

export interface OrangeCapBatter {
  rank: number;
  name: string;
  team: string;
  runs: number;
  innings: number;
  balls: number;
  highestScore: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  fifties: number;
  thirties: number;
}

export interface PurpleCapBowler {
  rank: number;
  name: string;
  team: string;
  wickets: number;
  innings: number;
  oversStr: string;
  legalBalls: number;
  runsConceded: number;
  economy: number;
  average: number;
  maidens: number;
  bestBowling: string; // e.g. "3/14"
}

export interface MvpPlayer {
  rank: number;
  name: string;
  team: string;
  totalPoints: number;
  runs: number;
  wickets: number;
  sixes: number;
  fours: number;
  dots: number;
}

export interface HeadToHeadStats {
  teamA: string;
  teamB: string;
  totalPlayed: number;
  teamAWins: number;
  teamBWins: number;
  ties: number;
  teamAHighestScore: number;
  teamBHighestScore: number;
  predictedWinProbA: number; // 0 - 100%
  predictedWinProbB: number; // 0 - 100%
  keyMatchups: string[];
}

/**
 * Calculates decimal overs for NRR computation (e.g. 9.4 overs is 9 + 4/6 = 9.6667)
 */
export function oversToDecimal(legalBalls: number): number {
  const fullOvers = Math.floor(legalBalls / 6);
  const remainder = legalBalls % 6;
  return fullOvers + remainder / 6;
}

/**
 * Aggregates tournament standings from teams list and match states
 */
export function calculateTournamentStandings(
  teams: any[],
  fixtures: MatchFixture[] = [],
  matchStates: Record<string, MatchLiveState> = {}
): TeamStandingRow[] {
  const standingsMap: Record<
    string,
    {
      name: string;
      short: string;
      owner?: string;
      played: number;
      won: number;
      lost: number;
      tied: number;
      noResult: number;
      points: number;
      runsFor: number;
      ballsFor: number;
      runsAgainst: number;
      ballsAgainst: number;
      form: ('W' | 'L' | 'T')[];
    }
  > = {};

  // Initialize with all known teams
  teams.forEach((t) => {
    standingsMap[t.name.toLowerCase()] = {
      name: t.name,
      short: t.short || t.shortName || t.name.slice(0, 3).toUpperCase(),
      owner: t.owner,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsFor: 0,
      ballsFor: 0,
      runsAgainst: 0,
      ballsAgainst: 0,
      form: [],
    };
  });

  // Process completed or live fixtures
  fixtures.forEach((fix) => {
    const live = matchStates[fix.id];
    const isCompleted = fix.status === 'completed' || live?.status === 'completed';

    if (live && live.innings1) {
      const inn1 = live.innings1;
      const inn2 = live.innings2;
      const teamAKey = inn1.battingTeam.toLowerCase();
      const teamBKey = inn1.bowlingTeam.toLowerCase();

      if (!standingsMap[teamAKey]) {
        standingsMap[teamAKey] = {
          name: inn1.battingTeam,
          short: inn1.battingTeamShort,
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          runsFor: 0,
          ballsFor: 0,
          runsAgainst: 0,
          ballsAgainst: 0,
          form: [],
        };
      }
      if (!standingsMap[teamBKey]) {
        standingsMap[teamBKey] = {
          name: inn1.bowlingTeam,
          short: inn1.bowlingTeamShort,
          played: 0,
          won: 0,
          lost: 0,
          tied: 0,
          noResult: 0,
          points: 0,
          runsFor: 0,
          ballsFor: 0,
          runsAgainst: 0,
          ballsAgainst: 0,
          form: [],
        };
      }

      if (isCompleted && inn2) {
        standingsMap[teamAKey].played += 1;
        standingsMap[teamBKey].played += 1;

        // Innings 1 batting stats
        standingsMap[teamAKey].runsFor += inn1.totalRuns;
        // If all out, count full overs quota according to ICC NRR rules
        const inn1Balls = inn1.wickets >= 10 ? inn1.oversLimit * 6 : inn1.legalBalls;
        standingsMap[teamAKey].ballsFor += Math.max(1, inn1Balls);

        standingsMap[teamBKey].runsAgainst += inn1.totalRuns;
        standingsMap[teamBKey].ballsAgainst += Math.max(1, inn1Balls);

        // Innings 2 batting stats
        standingsMap[teamBKey].runsFor += inn2.totalRuns;
        const inn2Balls = inn2.wickets >= 10 ? inn2.oversLimit * 6 : inn2.legalBalls;
        standingsMap[teamBKey].ballsFor += Math.max(1, inn2Balls);

        standingsMap[teamAKey].runsAgainst += inn2.totalRuns;
        standingsMap[teamAKey].ballsAgainst += Math.max(1, inn2Balls);

        // Result resolution
        const target = live.targetRuns || inn1.totalRuns + 1;
        if (inn2.totalRuns >= target) {
          // Team B Won
          standingsMap[teamBKey].won += 1;
          standingsMap[teamBKey].points += 2;
          standingsMap[teamBKey].form.unshift('W');

          standingsMap[teamAKey].lost += 1;
          standingsMap[teamAKey].form.unshift('L');
        } else if (inn2.totalRuns === target - 1) {
          // Tie
          standingsMap[teamAKey].tied += 1;
          standingsMap[teamAKey].points += 1;
          standingsMap[teamAKey].form.unshift('T');

          standingsMap[teamBKey].tied += 1;
          standingsMap[teamBKey].points += 1;
          standingsMap[teamBKey].form.unshift('T');
        } else {
          // Team A Won
          standingsMap[teamAKey].won += 1;
          standingsMap[teamAKey].points += 2;
          standingsMap[teamAKey].form.unshift('W');

          standingsMap[teamBKey].lost += 1;
          standingsMap[teamBKey].form.unshift('L');
        }
      }
    }
  });

  // Calculate NRR and map array
  const rows: TeamStandingRow[] = Object.values(standingsMap).map((entry) => {
    const oversForDec = oversToDecimal(entry.ballsFor);
    const oversAgainstDec = oversToDecimal(entry.ballsAgainst);

    const forRate = oversForDec > 0 ? entry.runsFor / oversForDec : 0;
    const againstRate = oversAgainstDec > 0 ? entry.runsAgainst / oversAgainstDec : 0;
    const nrr = parseFloat((forRate - againstRate).toFixed(3));
    const nrrStr = nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3);

    return {
      rank: 1,
      name: entry.name,
      short: entry.short,
      owner: entry.owner,
      played: entry.played,
      won: entry.won,
      lost: entry.lost,
      tied: entry.tied,
      noResult: entry.noResult,
      points: entry.points,
      runsFor: entry.runsFor,
      oversFor: parseFloat(oversForDec.toFixed(1)),
      runsAgainst: entry.runsAgainst,
      oversAgainst: parseFloat(oversAgainstDec.toFixed(1)),
      nrr,
      nrrStr,
      form: entry.form.slice(0, 5),
      status: 'in_contention',
    };
  });

  // Sort by Points descending, then NRR descending
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.nrr - a.nrr;
  });

  // Assign ranks & qualification badges
  return rows.map((row, idx) => ({
    ...row,
    rank: idx + 1,
    status: idx < 4 ? 'Q' : row.played >= 3 && row.points === 0 ? 'E' : 'in_contention',
  }));
}

/**
 * Aggregates player stats for Orange Cap, Purple Cap, and MVP Leaderboards
 */
export function calculateTournamentLeaderboards(matchStates: Record<string, MatchLiveState> = {}): {
  orangeCap: OrangeCapBatter[];
  purpleCap: PurpleCapBowler[];
  mvpLeaderboard: MvpPlayer[];
  maxSixesLeaderboard: { rank: number; name: string; team: string; sixes: number; balls: number }[];
} {
  const batterMap: Record<
    string,
    {
      name: string;
      team: string;
      runs: number;
      innings: number;
      balls: number;
      highestScore: number;
      fours: number;
      sixes: number;
      fifties: number;
      thirties: number;
    }
  > = {};

  const bowlerMap: Record<
    string,
    {
      name: string;
      team: string;
      wickets: number;
      innings: number;
      legalBalls: number;
      runsConceded: number;
      maidens: number;
      dots: number;
      bestWickets: number;
      bestRuns: number;
    }
  > = {};

  // Aggregate stats across all matches
  Object.values(matchStates).forEach((match) => {
    const processInnings = (inn: InningsData | null) => {
      if (!inn) return;

      // Batters
      inn.batters.forEach((b) => {
        if (b.balls > 0 || b.runs > 0) {
          const key = b.name.toLowerCase();
          if (!batterMap[key]) {
            batterMap[key] = {
              name: b.name,
              team: inn.battingTeamShort || inn.battingTeam,
              runs: 0,
              innings: 0,
              balls: 0,
              highestScore: 0,
              fours: 0,
              sixes: 0,
              fifties: 0,
              thirties: 0,
            };
          }
          batterMap[key].runs += b.runs;
          batterMap[key].innings += 1;
          batterMap[key].balls += b.balls;
          batterMap[key].fours += b.fours;
          batterMap[key].sixes += b.sixes;
          if (b.runs > batterMap[key].highestScore) batterMap[key].highestScore = b.runs;
          if (b.runs >= 50) batterMap[key].fifties += 1;
          else if (b.runs >= 30) batterMap[key].thirties += 1;
        }
      });

      // Bowlers
      inn.bowlers.forEach((bw) => {
        if (bw.overs > 0 || bw.ballsInOver > 0 || bw.runsConceded > 0) {
          const key = bw.name.toLowerCase();
          if (!bowlerMap[key]) {
            bowlerMap[key] = {
              name: bw.name,
              team: inn.bowlingTeamShort || inn.bowlingTeam,
              wickets: 0,
              innings: 0,
              legalBalls: 0,
              runsConceded: 0,
              maidens: 0,
              dots: 0,
              bestWickets: 0,
              bestRuns: 999,
            };
          }
          const totalBalls = bw.overs * 6 + bw.ballsInOver;
          bowlerMap[key].wickets += bw.wickets;
          bowlerMap[key].innings += 1;
          bowlerMap[key].legalBalls += totalBalls;
          bowlerMap[key].runsConceded += bw.runsConceded;
          bowlerMap[key].maidens += bw.maidens;
          bowlerMap[key].dots += bw.dots;

          // Best Bowling figures check
          if (
            bw.wickets > bowlerMap[key].bestWickets ||
            (bw.wickets === bowlerMap[key].bestWickets && bw.runsConceded < bowlerMap[key].bestRuns)
          ) {
            bowlerMap[key].bestWickets = bw.wickets;
            bowlerMap[key].bestRuns = bw.runsConceded;
          }
        }
      });
    };

    processInnings(match.innings1);
    processInnings(match.innings2);
  });

  // Compile Orange Cap (Runs desc)
  const orangeCap: OrangeCapBatter[] = Object.values(batterMap)
    .sort((a, b) => b.runs - a.runs)
    .map((b, idx) => ({
      rank: idx + 1,
      name: b.name,
      team: b.team,
      runs: b.runs,
      innings: b.innings,
      balls: b.balls,
      highestScore: b.highestScore,
      strikeRate: b.balls > 0 ? parseFloat(((b.runs / b.balls) * 100).toFixed(1)) : 0,
      fours: b.fours,
      sixes: b.sixes,
      fifties: b.fifties,
      thirties: b.thirties,
    }));

  // Compile Purple Cap (Wickets desc, then economy asc)
  const purpleCap: PurpleCapBowler[] = Object.values(bowlerMap)
    .sort((a, b) => {
      if (b.wickets !== a.wickets) return b.wickets - a.wickets;
      const econA = a.legalBalls > 0 ? (a.runsConceded * 6) / a.legalBalls : 99;
      const econB = b.legalBalls > 0 ? (b.runsConceded * 6) / b.legalBalls : 99;
      return econA - econB;
    })
    .map((bw, idx) => {
      const fullOvers = Math.floor(bw.legalBalls / 6);
      const remBalls = bw.legalBalls % 6;
      const economy = bw.legalBalls > 0 ? parseFloat(((bw.runsConceded * 6) / bw.legalBalls).toFixed(2)) : 0;
      const average = bw.wickets > 0 ? parseFloat((bw.runsConceded / bw.wickets).toFixed(2)) : bw.runsConceded;
      const best = bw.bestWickets > 0 ? `${bw.bestWickets}/${bw.bestRuns}` : '-';

      return {
        rank: idx + 1,
        name: bw.name,
        team: bw.team,
        wickets: bw.wickets,
        innings: bw.innings,
        oversStr: `${fullOvers}.${remBalls}`,
        legalBalls: bw.legalBalls,
        runsConceded: bw.runsConceded,
        economy,
        average,
        maidens: bw.maidens,
        bestBowling: best,
      };
    });

  // Maximum Sixes Leaderboard
  const maxSixesLeaderboard = orangeCap
    .filter((b) => b.sixes > 0)
    .sort((a, b) => b.sixes - a.sixes)
    .map((b, idx) => ({
      rank: idx + 1,
      name: b.name,
      team: b.team,
      sixes: b.sixes,
      balls: b.balls,
    }));

  // MVP (Most Valuable Player) Points Ranking
  const allPlayerNames = new Set([
    ...Object.keys(batterMap),
    ...Object.keys(bowlerMap),
  ]);

  const mvpList: MvpPlayer[] = Array.from(allPlayerNames).map((key) => {
    const bat = batterMap[key];
    const bowl = bowlerMap[key];
    const name = bat?.name || bowl?.name || 'Player';
    const team = bat?.team || bowl?.team || 'Franchise';

    const runs = bat?.runs || 0;
    const fours = bat?.fours || 0;
    const sixes = bat?.sixes || 0;
    const wickets = bowl?.wickets || 0;
    const maidens = bowl?.maidens || 0;
    const dots = bowl?.dots || 0;

    // MVP Points Formula:
    // Runs: 1 pt, 4s: +1.5 pts bonus, 6s: +2.5 pts bonus, Wicket: +25 pts, Maiden: +12 pts, Dot: +1 pt
    const totalPoints = Math.round(
      runs * 1 + fours * 1.5 + sixes * 2.5 + wickets * 25 + maidens * 12 + dots * 1
    );

    return {
      rank: 1,
      name,
      team,
      totalPoints,
      runs,
      wickets,
      sixes,
      fours,
      dots,
    };
  });

  mvpList.sort((a, b) => b.totalPoints - a.totalPoints);
  const mvpLeaderboard = mvpList.map((m, idx) => ({ ...m, rank: idx + 1 }));

  return {
    orangeCap,
    purpleCap,
    mvpLeaderboard,
    maxSixesLeaderboard,
  };
}

/**
 * Computes Head-to-Head and pre-match win prediction between two teams
 */
export function calculateHeadToHead(
  teamAName: string,
  teamBName: string,
  fixtures: MatchFixture[] = [],
  matchStates: Record<string, MatchLiveState> = {}
): HeadToHeadStats {
  const normA = teamAName.toLowerCase();
  const normB = teamBName.toLowerCase();

  let totalPlayed = 0;
  let teamAWins = 0;
  let teamBWins = 0;
  let ties = 0;
  let teamAHighestScore = 0;
  let teamBHighestScore = 0;

  fixtures.forEach((fix) => {
    const tA = fix.teamA.name.toLowerCase();
    const tB = fix.teamB.name.toLowerCase();

    const isMatchup =
      (tA.includes(normA) && tB.includes(normB)) ||
      (tA.includes(normB) && tB.includes(normA));

    if (isMatchup) {
      const live = matchStates[fix.id];
      if (live && live.innings1 && live.innings2 && live.status === 'completed') {
        totalPlayed += 1;
        const target = live.targetRuns || live.innings1.totalRuns + 1;
        const isTeamAFirst = live.innings1.battingTeam.toLowerCase().includes(normA);

        const scoreA = isTeamAFirst ? live.innings1.totalRuns : live.innings2.totalRuns;
        const scoreB = isTeamAFirst ? live.innings2.totalRuns : live.innings1.totalRuns;

        if (scoreA > teamAHighestScore) teamAHighestScore = scoreA;
        if (scoreB > teamBHighestScore) teamBHighestScore = scoreB;

        if (live.innings2.totalRuns >= target) {
          // 2nd innings won
          if (isTeamAFirst) teamBWins += 1;
          else teamAWins += 1;
        } else if (live.innings2.totalRuns === target - 1) {
          ties += 1;
        } else {
          // 1st innings won
          if (isTeamAFirst) teamAWins += 1;
          else teamBWins += 1;
        }
      }
    }
  });

  // Calculate pre-match prediction probability
  let probA = 50;
  if (totalPlayed > 0) {
    probA = Math.round((teamAWins / totalPlayed) * 70 + 15);
    probA = Math.max(25, Math.min(75, probA));
  }
  const probB = 100 - probA;

  return {
    teamA: teamAName,
    teamB: teamBName,
    totalPlayed,
    teamAWins,
    teamBWins,
    ties,
    teamAHighestScore: teamAHighestScore || 110,
    teamBHighestScore: teamBHighestScore || 105,
    predictedWinProbA: probA,
    predictedWinProbB: probB,
    keyMatchups: [
      `Historical meetings: ${totalPlayed} (${teamAName}: ${teamAWins} wins, ${teamBName}: ${teamBWins} wins)`,
      `Powerplay scoring battle: Off-side boundary conversion will dictate pace`,
      `Death-overs control: Bowling economy in final 3 overs proves decisive`,
    ],
  };
}

/**
 * Generates an automated corporate match summary / executive press bulletin
 */
export function generateMatchPressBulletin(state: MatchLiveState): {
  headline: string;
  executiveSummary: string;
  slackMarkdown: string;
  topPerformers: string[];
} {
  const inn1 = state.innings1;
  const inn2 = state.innings2;

  const topBatter = [...(inn1.batters || []), ...(inn2?.batters || [])].sort(
    (a, b) => b.runs - a.runs
  )[0];

  const topBowler = [...(inn1.bowlers || []), ...(inn2?.bowlers || [])].sort(
    (a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded
  )[0];

  const resultText = state.result || `${inn1.battingTeam} vs ${inn1.bowlingTeam} in progress`;
  const headline = `🏆 ${state.title}: ${resultText}`;

  const executiveSummary = [
    `In an electric ${state.stage} clash at ${state.venue}, ${state.title} delivered thrilling corporate cricket action.`,
    `${inn1.battingTeam} set the pace with ${inn1.totalRuns}/${inn1.wickets} in ${inn1.oversLimit} overs.`,
    inn2
      ? `In response, ${inn2.battingTeam} registered ${inn2.totalRuns}/${inn2.wickets}.`
      : 'Innings 2 underway.',
    topBatter ? `Batting standout: ${topBatter.name} with ${topBatter.runs} runs (${topBatter.balls} balls).` : '',
    topBowler ? `Bowling spearhead: ${topBowler.name} with ${topBowler.wickets} wickets conceded ${topBowler.runsConceded} runs.` : '',
    state.result ? `Final outcome: ${state.result}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const slackMarkdown = `🏏 *CRICPLUS TOURNAMENT MATCH REPORT* 🏏\n*${state.title}* (${state.tournament.toUpperCase()})\n📍 *Venue:* ${state.venue} | *Stage:* ${state.stage}\n\n*RESULT:* ${resultText}\n\n📊 *Innings Summary:*\n• *${inn1.battingTeam}:* ${inn1.totalRuns}/${inn1.wickets} (${inn1.oversLimit} ov)\n${inn2 ? `• *${inn2.battingTeam}:* ${inn2.totalRuns}/${inn2.wickets} (${state.targetOvers || inn1.oversLimit} ov)\n` : ''}\n🌟 *Key Impact Players:*\n${topBatter ? `• 🏏 *${topBatter.name}* - ${topBatter.runs} (${topBatter.balls}b, ${topBatter.fours}x4, ${topBatter.sixes}x6)\n` : ''}${topBowler ? `• 🎯 *${topBowler.name}* - ${topBowler.wickets}/${topBowler.runsConceded} (${topBowler.oversStr} ov)\n` : ''}\n🔗 *Full Interactive Scorecard:* https://ddpl-cricket-app.vercel.app/matches/${state.matchId}`;

  const topPerformers = [
    topBatter ? `${topBatter.name} (${topBatter.runs} runs)` : '',
    topBowler ? `${topBowler.name} (${topBowler.wickets} wkts)` : '',
  ].filter(Boolean);

  return {
    headline,
    executiveSummary,
    slackMarkdown,
    topPerformers,
  };
}
