import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

export interface MatchFixture {
  id: string;
  matchNumber: number;
  tournament: string;
  stage: 'League' | 'Group Stage' | 'Quarter-Final' | 'Qualifier 1' | 'Eliminator' | 'Qualifier 2' | 'Semi-Final' | 'Final';
  group?: string | null;
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

// Generate Flexible Multi-Group Fixtures (Supports 1 pool up to 8 groups: A, B, C, D, E, F, G, H)
export function generateMultiGroupFixtures(
  teams: any[],
  customGroupNames: string[] = ['Group A', 'Group B'],
  tournamentOvers = 10,
  tournamentSlug = 'league'
): MatchFixture[] {
  const fixtures: MatchFixture[] = [];
  let matchNum = 1;

  if (!teams || teams.length === 0) {
    return fixtures;
  }

  const groupNames = customGroupNames && customGroupNames.length > 0
    ? customGroupNames
    : ['Group A', 'Group B'];

  // Map teams to their assigned groups
  const groupMap: Record<string, any[]> = {};
  groupNames.forEach((g) => {
    groupMap[g] = [];
  });

  // If teams already have a .group property matching one of our groups, use it
  const unassignedTeams: any[] = [];
  teams.forEach((t) => {
    if (t.group && groupMap[t.group]) {
      groupMap[t.group].push(t);
    } else {
      unassignedTeams.push(t);
    }
  });

  // Distribute remaining unassigned teams round-robin across groups
  unassignedTeams.forEach((t, idx) => {
    const targetGroup = groupNames[idx % groupNames.length];
    groupMap[targetGroup].push(t);
  });

  // 1. Group Stage Matches (Round-Robin within each group)
  groupNames.forEach((groupName, gIdx) => {
    const grpTeams = groupMap[groupName] || [];
    const timeSlots = ['09:30 AM', '11:45 AM', '02:00 PM', '04:15 PM', '06:30 PM'];

    for (let i = 0; i < grpTeams.length; i++) {
      for (let j = i + 1; j < grpTeams.length; j++) {
        const teamA = grpTeams[i];
        const teamB = grpTeams[j];
        const shortA = teamA.short || teamA.name?.slice(0, 3).toUpperCase() || `T${i + 1}`;
        const shortB = teamB.short || teamB.name?.slice(0, 3).toUpperCase() || `T${j + 1}`;
        const timeSlot = timeSlots[(matchNum - 1) % timeSlots.length];

        fixtures.push({
          id: `${tournamentSlug}-m${matchNum}`,
          matchNumber: matchNum,
          tournament: tournamentSlug,
          stage: 'Group Stage',
          group: groupName,
          title: `${groupName}: ${shortA} vs ${shortB}`,
          teamA: { name: teamA.name, short: shortA },
          teamB: { name: teamB.name, short: shortB },
          venue: 'Sports Arena / Stadium Grounds',
          matchDate: null,
          matchTime: timeSlot,
          status: 'upcoming',
          summary: `${groupName} Match: ${teamA.name} vs ${teamB.name} (${tournamentOvers} Overs per side).`,
        });
        matchNum++;
      }
    }
  });

  // 2. Playoff / Knockout Matches based on number of groups
  const numGroups = groupNames.length;

  if (numGroups === 1) {
    // Single Pool: IPL style 4-team playoffs or top-2 final
    if (teams.length >= 4) {
      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Qualifier 1',
        title: 'Qualifier 1: Rank #1 vs Rank #2',
        teamA: { name: 'Rank #1 Team', short: 'R1' },
        teamB: { name: 'Rank #2 Team', short: 'R2' },
        venue: 'Sports Arena / Stadium Grounds',
        matchDate: null,
        matchTime: '02:00 PM',
        status: 'upcoming',
        summary: 'Winner advances straight to the Grand Final.',
      });
      matchNum++;

      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Eliminator',
        title: 'Eliminator: Rank #3 vs Rank #4',
        teamA: { name: 'Rank #3 Team', short: 'R3' },
        teamB: { name: 'Rank #4 Team', short: 'R4' },
        venue: 'Sports Arena / Stadium Grounds',
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
        title: 'Qualifier 2: Loser Q1 vs Winner Eliminator',
        teamA: { name: 'Loser of Q1', short: 'LQ1' },
        teamB: { name: 'Winner of Eliminator', short: 'WEL' },
        venue: 'Sports Arena / Stadium Grounds',
        matchDate: null,
        matchTime: '02:00 PM',
        status: 'upcoming',
        summary: 'Winner secures the 2nd Grand Final spot.',
      });
      matchNum++;

      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Final',
        title: 'Grand Championship Final: Winner Q1 vs Winner Q2',
        teamA: { name: 'Winner of Q1', short: 'WQ1' },
        teamB: { name: 'Winner of Q2', short: 'WQ2' },
        venue: 'Sports Arena / Stadium Grounds',
        matchDate: null,
        matchTime: '06:30 PM',
        status: 'upcoming',
        summary: 'Championship Trophy Match.',
      });
    } else {
      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Final',
        title: 'Grand Final: Rank #1 vs Rank #2',
        teamA: { name: 'Rank #1 Team', short: 'R1' },
        teamB: { name: 'Rank #2 Team', short: 'R2' },
        venue: 'Sports Arena / Stadium Grounds',
        matchDate: null,
        matchTime: '06:00 PM',
        status: 'upcoming',
        summary: 'Grand Final Decider.',
      });
    }
  } else if (numGroups === 2) {
    // 2 Groups (e.g. Group A & Group B): SF1 (A1 vs B2), SF2 (B1 vs A2), Final
    const gA = groupNames[0];
    const gB = groupNames[1];

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: `Semi-Final 1: ${gA} Winner vs ${gB} Runner-Up`,
      teamA: { name: `${gA} Winner`, short: `${gA.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}1` },
      teamB: { name: `${gB} Runner-Up`, short: `${gB.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}2` },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '10:00 AM',
      status: 'upcoming',
      summary: `First Semi-Final: ${gA} #1 vs ${gB} #2 for a ticket to the Grand Final.`,
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: `Semi-Final 2: ${gB} Winner vs ${gA} Runner-Up`,
      teamA: { name: `${gB} Winner`, short: `${gB.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}1` },
      teamB: { name: `${gA} Runner-Up`, short: `${gA.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3)}2` },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '02:30 PM',
      status: 'upcoming',
      summary: `Second Semi-Final: ${gB} #1 vs ${gA} #2 for the remaining Grand Final spot.`,
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Final',
      title: 'Grand Championship Final: Winner SF1 vs Winner SF2',
      teamA: { name: 'Winner SF1', short: 'WSF1' },
      teamB: { name: 'Winner SF2', short: 'WSF2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '06:00 PM',
      status: 'upcoming',
      summary: 'Grand Championship Decider.',
    });
  } else if (numGroups === 3) {
    // 3 Groups (Group A, B, C): Top team each + best 2nd place
    const gA = groupNames[0];
    const gB = groupNames[1];
    const gC = groupNames[2];

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: `Semi-Final 1: ${gA} Winner vs Best Runner-Up`,
      teamA: { name: `${gA} Winner`, short: 'GA1' },
      teamB: { name: 'Best Runner-Up (Wildcard)', short: 'WCR' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '10:00 AM',
      status: 'upcoming',
      summary: 'Semi-Final 1 to reach Grand Final.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: `Semi-Final 2: ${gB} Winner vs ${gC} Winner`,
      teamA: { name: `${gB} Winner`, short: 'GB1' },
      teamB: { name: `${gC} Winner`, short: 'GC1' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '02:30 PM',
      status: 'upcoming',
      summary: 'Semi-Final 2 clash of group champions.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Final',
      title: 'Grand Championship Final: Winner SF1 vs Winner SF2',
      teamA: { name: 'Winner SF1', short: 'WSF1' },
      teamB: { name: 'Winner SF2', short: 'WSF2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '06:00 PM',
      status: 'upcoming',
      summary: 'Grand Championship Decider.',
    });
  } else if (numGroups === 4) {
    // 4 Groups (Group A, B, C, D): 4 Quarter-Finals, 2 Semi-Finals, 1 Final
    const [gA, gB, gC, gD] = groupNames;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Quarter-Final',
      title: `Quarter-Final 1: ${gA} #1 vs ${gB} #2`,
      teamA: { name: `${gA} Winner`, short: 'GA1' },
      teamB: { name: `${gB} Runner-Up`, short: 'GB2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '09:00 AM',
      status: 'upcoming',
      summary: 'Quarter-Final 1: Winner advances to Semi-Final 1.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Quarter-Final',
      title: `Quarter-Final 2: ${gC} #1 vs ${gD} #2`,
      teamA: { name: `${gC} Winner`, short: 'GC1' },
      teamB: { name: `${gD} Runner-Up`, short: 'GD2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '11:30 AM',
      status: 'upcoming',
      summary: 'Quarter-Final 2: Winner advances to Semi-Final 1.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Quarter-Final',
      title: `Quarter-Final 3: ${gB} #1 vs ${gA} #2`,
      teamA: { name: `${gB} Winner`, short: 'GB1' },
      teamB: { name: `${gA} Runner-Up`, short: 'GA2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '02:00 PM',
      status: 'upcoming',
      summary: 'Quarter-Final 3: Winner advances to Semi-Final 2.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Quarter-Final',
      title: `Quarter-Final 4: ${gD} #1 vs ${gC} #2`,
      teamA: { name: `${gD} Winner`, short: 'GD1' },
      teamB: { name: `${gC} Runner-Up`, short: 'GC2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '04:30 PM',
      status: 'upcoming',
      summary: 'Quarter-Final 4: Winner advances to Semi-Final 2.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: 'Semi-Final 1: Winner QF1 vs Winner QF2',
      teamA: { name: 'Winner QF1', short: 'WQF1' },
      teamB: { name: 'Winner QF2', short: 'WQF2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '10:00 AM',
      status: 'upcoming',
      summary: 'Semi-Final 1 battle for the Championship Final.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: 'Semi-Final 2: Winner QF3 vs Winner QF4',
      teamA: { name: 'Winner QF3', short: 'WQF3' },
      teamB: { name: 'Winner QF4', short: 'WQF4' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '02:30 PM',
      status: 'upcoming',
      summary: 'Semi-Final 2 battle for the Championship Final.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Final',
      title: 'Grand Championship Final: Winner SF1 vs Winner SF2',
      teamA: { name: 'Winner SF1', short: 'WSF1' },
      teamB: { name: 'Winner SF2', short: 'WSF2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '06:00 PM',
      status: 'upcoming',
      summary: 'Grand Championship Decider.',
    });
  } else {
    // 5 to 8 Groups (Group A to H): Top team of each group advances to Quarter-Finals, then SF, Final
    for (let k = 0; k < Math.min(numGroups, 8); k += 2) {
      const gFirst = groupNames[k];
      const gSecond = groupNames[k + 1] || groupNames[0];
      const qfNum = Math.floor(k / 2) + 1;

      fixtures.push({
        id: `${tournamentSlug}-m${matchNum}`,
        matchNumber: matchNum,
        tournament: tournamentSlug,
        stage: 'Quarter-Final',
        title: `Quarter-Final ${qfNum}: ${gFirst} #1 vs ${gSecond} #1`,
        teamA: { name: `${gFirst} Winner`, short: `${gFirst.slice(-1)}1` },
        teamB: { name: `${gSecond} Winner`, short: `${gSecond.slice(-1)}1` },
        venue: 'Sports Arena / Stadium Grounds',
        matchDate: null,
        matchTime: `${10 + (qfNum * 2)}:00 ${qfNum >= 2 ? 'PM' : 'AM'}`,
        status: 'upcoming',
        summary: `Quarter-Final ${qfNum} knockout match.`,
      });
      matchNum++;
    }

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: 'Semi-Final 1: Winner QF1 vs Winner QF2',
      teamA: { name: 'Winner QF1', short: 'WQF1' },
      teamB: { name: 'Winner QF2', short: 'WQF2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '11:00 AM',
      status: 'upcoming',
      summary: 'Semi-Final 1 knockout.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Semi-Final',
      title: 'Semi-Final 2: Winner QF3 vs Winner QF4',
      teamA: { name: 'Winner QF3', short: 'WQF3' },
      teamB: { name: 'Winner QF4', short: 'WQF4' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '03:00 PM',
      status: 'upcoming',
      summary: 'Semi-Final 2 knockout.',
    });
    matchNum++;

    fixtures.push({
      id: `${tournamentSlug}-m${matchNum}`,
      matchNumber: matchNum,
      tournament: tournamentSlug,
      stage: 'Final',
      title: 'Grand Championship Final: Winner SF1 vs Winner SF2',
      teamA: { name: 'Winner SF1', short: 'WSF1' },
      teamB: { name: 'Winner SF2', short: 'WSF2' },
      venue: 'Sports Arena / Stadium Grounds',
      matchDate: null,
      matchTime: '06:30 PM',
      status: 'upcoming',
      summary: 'Grand Championship Decider.',
    });
  }

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

  return NextResponse.json(
    {
      success: true,
      tournament,
      schedule,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=12',
      },
    }
  );
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

    // 1. GENERATE SCHEDULE ACCORDING TO TOURNAMENT FORMAT (Supports 1 pool up to 8 Groups: A to H)
    if (action === 'generate_schedule') {
      const teams = body.teams || [];
      const format = body.format || (tournament.includes('game-of-run') || tournament.includes('gor') ? 'game-of-run' : 'ddpl');
      const overs = body.overs || (format === 'game-of-run' ? 12 : 10);
      const groupNames: string[] = body.groupNames || (body.groupsCount ? Array.from({ length: body.groupsCount }, (_, i) => `Group ${String.fromCharCode(65 + i)}`) : null);

      let generatedMatches: MatchFixture[];
      if (groupNames && groupNames.length > 0) {
        generatedMatches = generateMultiGroupFixtures(teams, groupNames, overs, tournament);
      } else if (format === 'game-of-run' || format === 'group-stage-playoffs') {
        generatedMatches = generateGameOfRunFixtures(teams, overs, tournament);
      } else {
        generatedMatches = generateDdplFixtures(teams, overs, tournament);
      }

      schedule = {
        ...schedule,
        format: (groupNames && groupNames.length > 1) || format === 'game-of-run' || format === 'group-stage-playoffs' ? 'group-stage-playoffs' : 'round-robin-playoffs',
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
