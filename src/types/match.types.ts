export type ExtraType = 'none' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'penalty';

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'retired_hurt'
  | 'obstructing_field'
  | 'timed_out';

export interface DeliveryWicketDetails {
  type: WicketType;
  playerOut: string;
  fielder?: string;
  bowlerCredited: boolean;
  description: string;
}

export interface DeliveryEvent {
  id: string;
  innings: 1 | 2;
  over: number; // 0-indexed over number (e.g. 0 is 1st over)
  ball: number; // legal ball number within over (1-6)
  ballDisplay: string; // e.g. "0.1", "1.4"
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  runsBat: number; // runs off the bat
  runsExtras: number; // extra runs
  runsTotal: number; // runsBat + runsExtras
  extraType: ExtraType;
  isLegal: boolean; // false for wide, noBall
  isBoundary: boolean;
  isFour: boolean;
  isSix: boolean;
  isWicket: boolean;
  wicketDetails?: DeliveryWicketDetails | null;
  commentary: string;
  symbol: string; // '0', '1', '2', '3', '4', '6', 'Wd', 'Nb', 'W', 'B1', 'Lb1'
  timestamp: string;
}

export interface BatterRecord {
  id: string;
  name: string;
  avatar?: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal: string | null; // e.g. "c Shakil b Faisal" or "run out (Bhanu)"
  strikeRate: number;
  minutes?: number;
}

export interface BowlerRecord {
  id: string;
  name: string;
  avatar?: string;
  overs: number;
  ballsInOver: number;
  oversStr: string; // e.g. "2.4"
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  dots: number; // 0s
  noBalls: number;
  wides: number;
}

export interface FOWRecord {
  wicketNumber: number;
  batterName: string;
  score: number;
  overStr: string;
}

export interface ExtrasBreakdown {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
  penalty: number;
  total: number;
}

export interface InningsData {
  battingTeam: string;
  battingTeamShort: string;
  bowlingTeam: string;
  bowlingTeamShort: string;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  oversLimit: number;
  extras: ExtrasBreakdown;
  strikerIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
  batters: BatterRecord[];
  bowlers: BowlerRecord[];
  fallOfWickets: FOWRecord[];
  deliveries: DeliveryEvent[];
}

export interface SquadPlayer {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
}

export interface MatchNote {
  id: string;
  text: string;
  timestamp: string;
  type?: 'milestone' | 'info' | 'innings';
}

export interface MatchToss {
  winner: string;
  decision: 'bat' | 'bowl';
  text: string;
}

export interface MatchLiveState {
  matchId: string;
  tournament: string; // e.g. "ddpl" or "game-of-run"
  matchNumber: number;
  title: string;
  stage: string;
  group?: string | null;
  venue: string;
  matchDate?: string | null;
  matchTime?: string | null;
  status: 'upcoming' | 'live' | 'innings_break' | 'completed' | 'abandoned';
  toss: MatchToss | null;
  currentInnings: 1 | 2;
  innings1: InningsData;
  innings2: InningsData | null;
  targetRuns?: number | null;
  targetOvers?: number;
  result?: string | null;
  manOfTheMatch?: string | null;
  officials: {
    scorerName: string;
    umpires: string[];
    referee?: string;
  };
  rules: {
    matchOvers: number;
    maxBowlerOvers: number;
    wideBallPenalty: string;
    noBallPenalty: string;
    pointsPerWin: number;
  };
  matchNotes: MatchNote[];
  teamASquad?: SquadPlayer[];
  teamBSquad?: SquadPlayer[];
  lastUpdated: string;
}
