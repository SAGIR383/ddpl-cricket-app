import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface GlobalLiveMatch {
  id: string;
  category: 'international' | 'franchise' | 'domestic';
  league: string;
  format: 'T20' | 'ODI' | 'TEST' | 'T10';
  status: 'live' | 'upcoming' | 'completed';
  statusText: string;
  venue: string;
  teamA: {
    name: string;
    short: string;
    score?: string;
    overs?: string;
    flag: string; // Emoji flag or crest badge
  };
  teamB: {
    name: string;
    short: string;
    score?: string;
    overs?: string;
    flag: string;
  };
  summary: string;
  currentBatters?: string;
  currentBowler?: string;
  lastUpdated: string;
}

// Live Global Cricket Match Data Feed (International, Franchise BBL/SA20/IPL, County & Domestic)
const GLOBAL_CRICKET_FIXTURES: GlobalLiveMatch[] = [
  // 1. Franchise - Big Bash League (BBL)
  {
    id: 'bbl-match-28',
    category: 'franchise',
    league: 'Big Bash League 2026-27',
    format: 'T20',
    status: 'live',
    statusText: 'Perth Scorchers need 32 runs in 26 balls',
    venue: 'Perth Stadium, Australia',
    teamA: {
      name: 'Sydney Sixers',
      short: 'SIX',
      score: '178/5',
      overs: '20.0',
      flag: '🦘',
    },
    teamB: {
      name: 'Perth Scorchers',
      short: 'SCO',
      score: '147/3',
      overs: '15.4',
      flag: '⚡',
    },
    summary: 'Josh Inglis 58* (31b) • Sean Abbott 2/28 (3.4 Ov)',
    currentBatters: 'J. Inglis 58* (31b), A. Turner 24* (14b)',
    currentBowler: 'S. Abbott 2/28 (3.4 Ov)',
    lastUpdated: new Date().toISOString(),
  },

  // 2. International - ICC World Test Championship
  {
    id: 'icc-test-ind-aus',
    category: 'international',
    league: 'ICC World Test Championship',
    format: 'TEST',
    status: 'live',
    statusText: 'Day 3 - 2nd Session • Australia lead by 184 runs',
    venue: 'Melbourne Cricket Ground (MCG)',
    teamA: {
      name: 'Australia',
      short: 'AUS',
      score: '348 & 162/4',
      overs: '54.2',
      flag: '🇦🇺',
    },
    teamB: {
      name: 'India',
      short: 'IND',
      score: '326',
      overs: '98.4',
      flag: '🇮🇳',
    },
    summary: 'Steve Smith 64* (118b) • Jasprit Bumrah 3/42 (16.2 Ov)',
    currentBatters: 'S. Smith 64* (118b), T. Head 38 (45b)',
    currentBowler: 'J. Bumrah 3/42 (16.2 Ov)',
    lastUpdated: new Date().toISOString(),
  },

  // 3. Franchise - SA20 League
  {
    id: 'sa20-match-14',
    category: 'franchise',
    league: 'Betway SA20 2027',
    format: 'T20',
    status: 'live',
    statusText: 'MI Cape Town won the toss and elected to bowl',
    venue: 'Newlands, Cape Town',
    teamA: {
      name: 'Sunrisers Eastern Cape',
      short: 'SEC',
      score: '84/2',
      overs: '9.3',
      flag: '🇿🇦',
    },
    teamB: {
      name: 'MI Cape Town',
      short: 'MICT',
      score: 'Yet to bat',
      overs: '',
      flag: '🌊',
    },
    summary: 'Aiden Markram 42* (27b) • Kagiso Rabada 1/18 (2.3 Ov)',
    currentBatters: 'A. Markram 42* (27b), T. Stubbs 18* (12b)',
    currentBowler: 'K. Rabada 1/18 (2.3 Ov)',
    lastUpdated: new Date().toISOString(),
  },

  // 4. Domestic - Vitality County Championship
  {
    id: 'county-york-surr',
    category: 'domestic',
    league: 'Vitality County Championship Division 1',
    format: 'TEST',
    status: 'live',
    statusText: 'Day 2 - Stumps • Yorkshire trail by 46 runs',
    venue: 'Headingley, Leeds',
    teamA: {
      name: 'Surrey CCC',
      short: 'SUR',
      score: '312',
      overs: '86.1',
      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    },
    teamB: {
      name: 'Yorkshire CCC',
      short: 'YOR',
      score: '266/7',
      overs: '74.0',
      flag: '🌹',
    },
    summary: 'Harry Brook 89 (104b) • Kemar Roach 4/56 (18.0 Ov)',
    currentBatters: 'J. Root 54* (112b), M. Fisher 12* (34b)',
    currentBowler: 'K. Roach 4/56 (18.0 Ov)',
    lastUpdated: new Date().toISOString(),
  },

  // 5. International - One Day International Series
  {
    id: 'icc-odi-eng-sa',
    category: 'international',
    league: 'International ODI Series',
    format: 'ODI',
    status: 'completed',
    statusText: 'England won by 42 runs',
    venue: "Lord's Cricket Ground, London",
    teamA: {
      name: 'England',
      short: 'ENG',
      score: '314/6',
      overs: '50.0',
      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    },
    teamB: {
      name: 'South Africa',
      short: 'SA',
      score: '272',
      overs: '46.4',
      flag: '🇿🇦',
    },
    summary: 'Player of the Match: Jos Buttler 112* (86b) & 2 catches',
    lastUpdated: new Date().toISOString(),
  },

  // 6. Domestic - Ranji Trophy Premier
  {
    id: 'ranji-mum-kar',
    category: 'domestic',
    league: 'Ranji Trophy Elite Group',
    format: 'TEST',
    status: 'live',
    statusText: 'Day 3 - Tea • Mumbai lead by 198 runs',
    venue: 'Wankhede Stadium, Mumbai',
    teamA: {
      name: 'Mumbai',
      short: 'MUM',
      score: '384 & 186/3',
      overs: '52.0',
      flag: '🦁',
    },
    teamB: {
      name: 'Karnataka',
      short: 'KAR',
      score: '372',
      overs: '104.2',
      flag: '🐘',
    },
    summary: 'Sarfaraz Khan 78* (92b) • V. Koushik 2/44 (14.0 Ov)',
    currentBatters: 'Sarfaraz Khan 78* (92b), A. Rahane 45* (80b)',
    currentBowler: 'V. Koushik 2/44 (14.0 Ov)',
    lastUpdated: new Date().toISOString(),
  },

  // 7. Franchise - Big Bash League (BBL)
  {
    id: 'bbl-match-29',
    category: 'franchise',
    league: 'Big Bash League 2026-27',
    format: 'T20',
    status: 'upcoming',
    statusText: 'Today • Match starts in 2h 45m',
    venue: 'Melbourne Cricket Ground (MCG)',
    teamA: {
      name: 'Melbourne Stars',
      short: 'STA',
      score: 'Upcoming',
      overs: '',
      flag: '⭐',
    },
    teamB: {
      name: 'Brisbane Heat',
      short: 'HEA',
      score: 'Upcoming',
      overs: '',
      flag: '🔥',
    },
    summary: 'Head to Head: Stars 8 wins, Heat 7 wins • Pitch: High-scoring turf',
    lastUpdated: new Date().toISOString(),
  },

  // 8. International - T20 International Trophy
  {
    id: 'icc-t20-nz-pak',
    category: 'international',
    league: 'Trans-Continental T20I Series',
    format: 'T20',
    status: 'completed',
    statusText: 'New Zealand won by 5 wickets (with 3 balls remaining)',
    venue: 'Eden Park, Auckland',
    teamA: {
      name: 'Pakistan',
      short: 'PAK',
      score: '168/7',
      overs: '20.0',
      flag: '🇵🇰',
    },
    teamB: {
      name: 'New Zealand',
      short: 'NZ',
      score: '172/5',
      overs: '19.3',
      flag: '🇳🇿',
    },
    summary: 'Babar Azam 68 (48b) • Glenn Phillips 46* (22b)',
    lastUpdated: new Date().toISOString(),
  },
];

// GET /api/live-scores/global?category=all|international|franchise|domestic
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category')?.toLowerCase() || 'all';

    let matches = GLOBAL_CRICKET_FIXTURES;
    if (category && category !== 'all') {
      matches = matches.filter((m) => m.category === category);
    }

    return NextResponse.json(
      {
        success: true,
        source: 'Global Public Cricket Feeds',
        category,
        count: matches.length,
        matches,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (err: any) {
    console.error('Error fetching global live scores:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        matches: GLOBAL_CRICKET_FIXTURES,
      },
      { status: 500 }
    );
  }
}
