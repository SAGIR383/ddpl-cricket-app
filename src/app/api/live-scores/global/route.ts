import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface BatterStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
  isStriker: boolean;
}

export interface BowlerStats {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  econ: string;
}

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
    flag: string;
  };
  teamB: {
    name: string;
    short: string;
    score?: string;
    overs?: string;
    flag: string;
  };
  summary: string;
  crr?: string;
  rrr?: string;
  partnership?: string;
  batters?: BatterStats[];
  bowler?: BowlerStats;
  recentBalls?: string[];
  toss?: string;
  lastUpdated: string;
}

// In-memory cache with ultra-short 3s TTL for genuine real-time ball-by-ball precision
let cachedMatches: GlobalLiveMatch[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 3000;

// Individual match details cache (2s TTL)
const matchDetailsCache = new Map<string, { data: Partial<GlobalLiveMatch>; time: number }>();

function getCountryFlag(name: string, short: string): string {
  const n = `${name} ${short}`.toLowerCase();
  if (n.includes('india a') || n.includes('inda')) return '🇮🇳';
  if (n.includes('india') || n.includes('ind')) return '🇮🇳';
  if (n.includes('new zealand a') || n.includes('nza')) return '🇳🇿';
  if (n.includes('new zealand') || n.includes('nz')) return '🇳🇿';
  if (n.includes('australia') || n.includes('aus')) return '🇦🇺';
  if (n.includes('south africa') || n.includes('rsa') || n.includes('sa')) return '🇿🇦';
  if (n.includes('england') || n.includes('eng')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (n.includes('pakistan') || n.includes('pak')) return '🇵🇰';
  if (n.includes('sri lanka') || n.includes('sl')) return '🇱🇰';
  if (n.includes('west indies') || n.includes('wi')) return '🌴';
  if (n.includes('afghanistan') || n.includes('afg')) return '🇦🇫';
  if (n.includes('zimbabwe') || n.includes('zim')) return '🇿🇼';
  if (n.includes('bangladesh') || n.includes('ban')) return '🇧🇩';
  if (n.includes('ireland') || n.includes('ire')) return '🇮🇪';
  if (n.includes('netherlands') || n.includes('ned')) return '🇳🇱';
  if (n.includes('oman') || n.includes('oma')) return '🇴🇲';
  if (n.includes('namibia') || n.includes('nam')) return '🇳🇦';
  if (n.includes('scotland') || n.includes('sco')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  if (n.includes('delhi') || n.includes('del')) return '🏛️';
  if (n.includes('tamil nadu') || n.includes('tn')) return '🦁';
  if (n.includes('mumbai') || n.includes('mum')) return '🏙️';
  if (n.includes('railways') || n.includes('rlw') || n.includes('rlys')) return '🚂';
  if (n.includes('madhya pradesh') || n.includes('mp')) return '🐅';
  if (n.includes('gujarat') || n.includes('guj')) return '🦁';
  if (n.includes('maharashtra') || n.includes('mah')) return '🛡️';
  if (n.includes('punjab') || n.includes('pun')) return '🦁';
  if (n.includes('bengal') || n.includes('ben')) return '🐯';
  if (n.includes('karnataka') || n.includes('kar')) return '🐘';
  if (n.includes('services') || n.includes('ser')) return '⚔️';
  if (n.includes('jharkhand') || n.includes('jhkd')) return '🏹';
  if (n.includes('odisha') || n.includes('odsa')) return '🌊';
  if (n.includes('baroda') || n.includes('brd')) return '👑';
  if (n.includes('rajasthan') || n.includes('raj')) return '🏰';
  if (n.includes('uttarakhand') || n.includes('utk')) return '🏔️';
  if (n.includes('chandigarh') || n.includes('cdg')) return '🌿';
  if (n.includes('himachal') || n.includes('hp')) return '❄️';
  if (n.includes('haryana') || n.includes('har')) return '🌾';
  if (n.includes('assam') || n.includes('asm')) return '🦏';
  if (n.includes('saurashtra') || n.includes('saur')) return '🦁';
  if (n.includes('andhra') || n.includes('ap')) return '🏹';
  if (n.includes('chhattisgarh') || n.includes('cg')) return '⚡';
  if (n.includes('kerala') || n.includes('ker')) return '🌴';
  if (n.includes('tripura') || n.includes('tri')) return '🌅';
  if (n.includes('hyderabad') || n.includes('hyd')) return '💎';
  if (n.includes('vidarbha') || n.includes('vid')) return '🐅';
  if (n.includes('goa')) return '🏖️';
  if (n.includes('bihar')) return '🌳';
  if (n.includes('puducherry') || n.includes('pdc')) return '🌊';
  if (n.includes('jammu') || n.includes('jk')) return '🏔️';
  if (n.includes('uttar pradesh') || n.includes('up')) return '🏹';
  return '🏏';
}

function getCategory(seriesName: string, matchType: string): 'international' | 'franchise' | 'domestic' {
  const s = (seriesName || '').toLowerCase();
  const t = (matchType || '').toLowerCase();
  if (
    s.includes('bbl') ||
    s.includes('big bash') ||
    s.includes('wbbl') ||
    s.includes('sa20') ||
    s.includes('ipl') ||
    s.includes('psl') ||
    s.includes('cpl') ||
    s.includes('league two') ||
    s.includes('challenge league') ||
    s.includes('t10')
  ) {
    return 'franchise';
  }
  if (
    s.includes('ranji') ||
    s.includes('county') ||
    s.includes('sheffield') ||
    s.includes('ford trophy') ||
    s.includes('plunket') ||
    s.includes('plate') ||
    s.includes('unofficial') ||
    t === 'domestic'
  ) {
    return 'domestic';
  }
  return 'international';
}

function extractJSONObject(str: string, startIndex: number): { jsonStr: string; endIndex: number } | null {
  let open = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') open++;
    else if (str[i] === '}') {
      open--;
      if (open === 0) {
        return { jsonStr: str.substring(startIndex, i + 1), endIndex: i + 1 };
      }
    }
  }
  return null;
}

// Fetch deep ball-by-ball details (batters, bowler, partnership, recent balls) for a specific match
async function fetchMatchLiveDetails(numericId: string): Promise<Partial<GlobalLiveMatch> | null> {
  const cached = matchDetailsCache.get(numericId);
  const now = Date.now();
  if (cached && now - cached.time < 2000) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = `https://m.cricbuzz.com/live-cricket-scores/${numericId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();
    const clean = html.replace(/\\\"/g, '"').replace(/\\\\/g, '\\');

    const miniIdx = clean.indexOf('"miniscore":{');
    if (miniIdx === -1) return null;

    const extracted = extractJSONObject(clean, miniIdx + '"miniscore":'.length);
    if (!extracted) return null;

    const mini = JSON.parse(extracted.jsonStr);

    const batters: BatterStats[] = [];
    if (mini.batsmanStriker?.name) {
      batters.push({
        name: mini.batsmanStriker.name,
        runs: mini.batsmanStriker.runs || 0,
        balls: mini.batsmanStriker.balls || 0,
        fours: mini.batsmanStriker.fours || 0,
        sixes: mini.batsmanStriker.sixes || 0,
        sr: `${mini.batsmanStriker.strikeRate || '0.00'}`,
        isStriker: true,
      });
    }
    if (mini.batsmanNonStriker?.name) {
      batters.push({
        name: mini.batsmanNonStriker.name,
        runs: mini.batsmanNonStriker.runs || 0,
        balls: mini.batsmanNonStriker.balls || 0,
        fours: mini.batsmanNonStriker.fours || 0,
        sixes: mini.batsmanNonStriker.sixes || 0,
        sr: `${mini.batsmanNonStriker.strikeRate || '0.00'}`,
        isStriker: false,
      });
    }

    let bowler: BowlerStats | undefined = undefined;
    if (mini.bowlerStriker?.name) {
      bowler = {
        name: mini.bowlerStriker.name,
        overs: `${mini.bowlerStriker.overs || 0}`,
        maidens: mini.bowlerStriker.maidens || 0,
        runs: mini.bowlerStriker.runs || 0,
        wickets: mini.bowlerStriker.wickets || 0,
        econ: `${mini.bowlerStriker.economy || '0.00'}`,
      };
    }

    const details: Partial<GlobalLiveMatch> = {
      batters: batters.length > 0 ? batters : undefined,
      bowler,
      crr: mini.currentRunRate ? `${mini.currentRunRate}` : undefined,
      rrr: mini.requiredRunRate && mini.requiredRunRate > 0 ? `${mini.requiredRunRate}` : undefined,
      partnership: mini.partnerShip ? `${mini.partnerShip.runs || 0} runs (${mini.partnerShip.balls || 0} balls)` : undefined,
      recentBalls: mini.recentOvsStats ? mini.recentOvsStats.trim().split(/\s+/).slice(-6) : undefined,
      statusText: mini.status || mini.customStatus || undefined,
    };

    matchDetailsCache.set(numericId, { data: details, time: now });
    return details;
  } catch (err) {
    console.warn(`Failed to fetch deep details for match ${numericId}:`, err);
    return null;
  }
}

async function fetchRealTimeMatches(): Promise<GlobalLiveMatch[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://m.cricbuzz.com/cricket-match/live-scores', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const html = await res.text();
    const cleanHtml = html.replace(/\\\"/g, '"').replace(/\\\\/g, '\\');

    const parsedList: GlobalLiveMatch[] = [];
    const seen = new Set<number>();
    let pos = 0;

    while (true) {
      const matchIdx = cleanHtml.indexOf('"matchInfo":{', pos);
      if (matchIdx === -1) break;

      const infoStart = matchIdx + '"matchInfo":'.length;
      const extractedInfo = extractJSONObject(cleanHtml, infoStart);
      if (extractedInfo) {
        try {
          const info = JSON.parse(extractedInfo.jsonStr);
          if (info.matchId && !seen.has(info.matchId)) {
            seen.add(info.matchId);

            let scoreObj: any = null;
            const afterPos = extractedInfo.endIndex;
            const scoreIdx = cleanHtml.indexOf('"matchScore":{', afterPos);
            if (scoreIdx !== -1 && scoreIdx - afterPos < 15) {
              const scoreStart = scoreIdx + '"matchScore":'.length;
              const extractedScore = extractJSONObject(cleanHtml, scoreStart);
              if (extractedScore) {
                try {
                  scoreObj = JSON.parse(extractedScore.jsonStr);
                } catch (e) {}
              }
            }

            const stateStr = (info.state || '').toLowerCase();
            const statusRaw = info.status || info.shortStatus || info.stateTitle || '';

            // Compute Team Scores
            let teamAScore = '';
            let teamAOvers = '';
            if (scoreObj?.team1Score?.inngs2) {
              teamAScore = `${scoreObj.team1Score.inngs1?.runs || 0}/${scoreObj.team1Score.inngs1?.wickets || 0} & ${scoreObj.team1Score.inngs2?.runs || 0}/${scoreObj.team1Score.inngs2?.wickets || 0}`;
              teamAOvers = scoreObj.team1Score.inngs2.overs ? `${scoreObj.team1Score.inngs2.overs}` : '';
            } else if (scoreObj?.team1Score?.inngs1) {
              teamAScore = `${scoreObj.team1Score.inngs1.runs}/${scoreObj.team1Score.inngs1.wickets || 0}`;
              teamAOvers = scoreObj.team1Score.inngs1.overs ? `${scoreObj.team1Score.inngs1.overs}` : '';
            }

            let teamBScore = '';
            let teamBOvers = '';
            if (scoreObj?.team2Score?.inngs2) {
              teamBScore = `${scoreObj.team2Score.inngs1?.runs || 0}/${scoreObj.team2Score.inngs1?.wickets || 0} & ${scoreObj.team2Score.inngs2?.runs || 0}/${scoreObj.team2Score.inngs2?.wickets || 0}`;
              teamBOvers = scoreObj.team2Score.inngs2.overs ? `${scoreObj.team2Score.inngs2.overs}` : '';
            } else if (scoreObj?.team2Score?.inngs1) {
              teamBScore = `${scoreObj.team2Score.inngs1.runs}/${scoreObj.team2Score.inngs1.wickets || 0}`;
              teamBOvers = scoreObj.team2Score.inngs1.overs ? `${scoreObj.team2Score.inngs1.overs}` : '';
            }

            // Determine Status Flag
            let matchStatus: 'live' | 'upcoming' | 'completed' = 'upcoming';
            const hasBallsPlayed = Boolean(teamAScore || teamBScore);

            if (stateStr === 'complete' || stateStr === 'result') {
              matchStatus = 'completed';
            } else if (
              stateStr === 'in progress' ||
              stateStr === 'live' ||
              (hasBallsPlayed && (stateStr === 'lunch' || stateStr === 'tea' || stateStr === 'badlight' || stateStr === 'rain' || stateStr === 'break'))
            ) {
              matchStatus = 'live';
            } else if (stateStr === 'toss') {
              matchStatus = 'upcoming';
            } else {
              matchStatus = 'upcoming';
            }

            // High-precision situation summary
            let statusText = statusRaw;
            let tossText = '';
            if (stateStr === 'toss') {
              statusText = `🪙 Toss: ${statusRaw || 'Toss Completed'} • Match starting shortly`;
              tossText = `${info.team2?.teamName || 'Bowling team'} won the toss and elected to bowl`;
              if (!teamAScore) teamAScore = 'Yet to bat';
              if (!teamBScore) teamBScore = 'Yet to bat';
            } else if (stateStr === 'preview') {
              statusText = statusRaw || `Scheduled: ${info.matchDesc || 'Upcoming Match'}`;
              if (!teamAScore) teamAScore = 'Scheduled';
              if (!teamBScore) teamBScore = 'Scheduled';
            } else if (!statusText) {
              statusText = info.stateTitle || 'Match in progress';
            }

            const teamAName = info.team1?.teamName || 'Team A';
            const teamAShort = info.team1?.teamSName || 'TMA';
            const teamBName = info.team2?.teamName || 'Team B';
            const teamBShort = info.team2?.teamSName || 'TMB';

            const matchItem: GlobalLiveMatch = {
              id: `cric-${info.matchId}`,
              category: getCategory(info.seriesName, info.matchType),
              league: info.seriesName ? `${info.seriesName} (${info.matchDesc || ''})` : 'Global Cricket Championship',
              format: (info.matchFormat?.toUpperCase() as any) || 'T20',
              status: matchStatus,
              statusText,
              venue: info.venueInfo ? `${info.venueInfo.ground || 'Arena'}, ${info.venueInfo.city || ''}` : 'Official Arena',
              teamA: {
                name: teamAName,
                short: teamAShort,
                score: teamAScore || 'Yet to bat',
                overs: teamAOvers,
                flag: getCountryFlag(teamAName, teamAShort),
              },
              teamB: {
                name: teamBName,
                short: teamBShort,
                score: teamBScore || 'Yet to bat',
                overs: teamBOvers,
                flag: getCountryFlag(teamBName, teamBShort),
              },
              summary: `${info.seriesName || ''} • ${statusText}`,
              toss: tossText || (stateStr === 'toss' ? statusRaw : undefined),
              lastUpdated: new Date().toISOString(),
            };

            parsedList.push(matchItem);
          }
        } catch (e) {}
        pos = extractedInfo.endIndex;
      } else {
        pos = matchIdx + 12;
      }
    }

    if (parsedList.length > 0) {
      return parsedList;
    }
  } catch (err) {
    console.warn('Real-time cricket feed network fetch failed, using fallback:', err);
  }

  return cachedMatches.length > 0 ? cachedMatches : [];
}

// GET /api/live-scores/global?category=all|live|upcoming|international|franchise|domestic&matchId=cric-12345
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category')?.toLowerCase() || 'all';
    const matchId = searchParams.get('matchId');

    const now = Date.now();
    if (!cachedMatches.length || now - lastFetchTime > CACHE_TTL_MS) {
      const fresh = await fetchRealTimeMatches();
      if (fresh.length > 0) {
        cachedMatches = fresh;
        lastFetchTime = now;
      }
    }

    // If specific match details are requested (for popup modal)
    if (matchId) {
      const numericId = matchId.replace(/^cric-/, '');
      const baseMatch = cachedMatches.find((m) => m.id === matchId) || {
        id: matchId,
        category: 'international',
        league: 'Live Match',
        format: 'T20',
        status: 'live',
        statusText: 'In Progress',
        venue: 'Stadium',
        teamA: { name: 'Team A', short: 'TMA', flag: '🏏' },
        teamB: { name: 'Team B', short: 'TMB', flag: '🏏' },
        summary: 'Live Match',
        lastUpdated: new Date().toISOString(),
      } as GlobalLiveMatch;

      const deepDetails = await fetchMatchLiveDetails(numericId);
      const enrichedMatch: GlobalLiveMatch = {
        ...baseMatch,
        ...(deepDetails || {}),
        statusText: deepDetails?.statusText || baseMatch.statusText,
      };

      return NextResponse.json(
        {
          success: true,
          match: enrichedMatch,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=1, stale-while-revalidate=3',
          },
        }
      );
    }

    let matches = cachedMatches;

    // Filter by status or category
    if (category === 'live') {
      matches = matches.filter((m) => m.status === 'live');
    } else if (category === 'upcoming') {
      matches = matches.filter((m) => m.status === 'upcoming');
    } else if (category && category !== 'all') {
      matches = matches.filter((m) => m.category === category);
    }

    return NextResponse.json(
      {
        success: true,
        source: 'Real-Time Global Cricket Feed (Ball-by-Ball Live)',
        category,
        count: matches.length,
        matches,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=2, stale-while-revalidate=5',
        },
      }
    );
  } catch (err: any) {
    console.error('Error in global live scores API:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        matches: cachedMatches,
      },
      { status: 500 }
    );
  }
}
