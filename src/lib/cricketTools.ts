/**
 * CricPlus24 Interactive Cricket Calculators & SEO Tools Engine
 * Implements precise ICC overs mathematics: 19.5 overs = 19 + (5 / 6) = 19.8333 decimal overs.
 */

export interface CricketToolMeta {
  slug: string;
  name: string;
  shortDescription: string;
  formula: string;
  formulaExplanation: string;
  exampleScenario: string;
  metaTitle: string;
  metaDescription: string;
}

export const CRICKET_TOOLS: CricketToolMeta[] = [
  {
    slug: 'net-run-rate-calculator',
    name: 'Net Run Rate (NRR) Calculator',
    shortDescription: 'Calculate tournament Net Run Rate (NRR) with official ICC tournament rules and fractional ball precision.',
    formula: 'NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)',
    formulaExplanation: 'Under official ICC & IPL regulations, Net Run Rate measures the difference between a team\'s average run-rate scored versus conceded. Critical rule: If a team is bowled out (all out) before completing their allocated overs, the full maximum quota of innings overs (e.g. 20.0 in T20 or 50.0 in ODI) is credited in the calculation.',
    exampleScenario: 'Team A scores 180 runs in 20.0 overs (RR = 9.00) and bowls out Team B for 150 in 18.4 overs. Because Team B was bowled out, Team A conceded 150 runs across the full 20.0 overs (RR = 7.50). Team A\'s NRR is 9.00 - 7.50 = +1.500.',
    metaTitle: 'Net Run Rate (NRR) Calculator — ICC & IPL Tournament Formula | CricPlus24',
    metaDescription: 'Free online Net Run Rate (NRR) calculator with official ICC all-out rules, fractional ball conversions, and step-by-step tournament tiebreaker examples.',
  },
  {
    slug: 'batting-average-calculator',
    name: 'Batting Average Calculator',
    shortDescription: 'Compute cricket batting averages across Tests, ODIs, T20s, and leagues with not-out adjustments.',
    formula: 'Batting Average = Total Runs Scored / (Total Innings - Not Outs)',
    formulaExplanation: 'In cricket statistics, batting average represents the average number of runs a batter scores before being dismissed. When a batter remains "not out", those innings do not count as dismissals, elevating their overall average.',
    exampleScenario: 'A player has batted in 12 innings, scoring 450 total runs, and was not out in 3 innings. Total dismissals = 12 - 3 = 9. Batting average = 450 / 9 = 50.00.',
    metaTitle: 'Cricket Batting Average Calculator — Real-time Stats Engine | CricPlus24',
    metaDescription: 'Instant cricket batting average calculator. Computes career and tournament batting averages with accurate not-out innings deductions.',
  },
  {
    slug: 'bowling-average-calculator',
    name: 'Bowling Average Calculator',
    shortDescription: 'Determine bowling average per dismissal across limited-overs and multi-day cricket.',
    formula: 'Bowling Average = Total Runs Conceded / Total Wickets Taken',
    formulaExplanation: 'The bowling average quantifies how many runs a bowler concedes for each wicket taken. A lower bowling average indicates higher efficiency and lethal wicket-taking ability.',
    exampleScenario: 'A bowler concedes 240 runs across a series and takes 12 wickets. Bowling Average = 240 / 12 = 20.00 runs per wicket.',
    metaTitle: 'Cricket Bowling Average Calculator — Performance Metrics | CricPlus24',
    metaDescription: 'Calculate bowling average instantly. Learn how cricket bowling averages are scored and compared across international and domestic competitions.',
  },
  {
    slug: 'bowling-economy-calculator',
    name: 'Bowling Economy Rate Calculator',
    shortDescription: 'Calculate bowling economy per 6-ball over with exact ball-by-ball fractional conversions.',
    formula: 'Economy Rate = Total Runs Conceded / Decimal Overs Bowled',
    formulaExplanation: 'Economy rate measures the average number of runs conceded per over. Crucial note: 3.4 overs means 3 complete overs and 4 legal deliveries, converted to 3 + 4/6 = 3.6667 decimal overs.',
    exampleScenario: 'A bowler concedes 26 runs in 3.4 overs. Decimal overs = 3 + (4 / 6) = 3.6667. Economy Rate = 26 / 3.6667 = 7.09 runs per over.',
    metaTitle: 'Bowling Economy Rate Calculator — Exact Fractional Overs | CricPlus24',
    metaDescription: 'Free bowling economy rate calculator. Accurate fractional overs conversion (e.g. 3.4 ov = 3.666 ov) with examples and tactical insights.',
  },
  {
    slug: 'strike-rate-calculator',
    name: 'Batting Strike Rate Calculator',
    shortDescription: 'Compute batting strike rate (runs scored per 100 legal deliveries faced).',
    formula: 'Batting Strike Rate = (Runs Scored / Balls Faced) * 100',
    formulaExplanation: 'Batting strike rate evaluates scoring velocity and aggressive intent in limited-overs matches. A strike rate of 150 means the batter averages 1.5 runs per ball faced.',
    exampleScenario: 'A batter scores 64 runs off 38 deliveries. Strike rate = (64 / 38) * 100 = 168.42.',
    metaTitle: 'Batting Strike Rate Calculator — T20 & ODI Pace Metrics | CricPlus24',
    metaDescription: 'Calculate batting strike rate online. Evaluate scoring acceleration, T20 death-overs performance, and boundary efficiency.',
  },
  {
    slug: 'required-run-rate-calculator',
    name: 'Required Run Rate (RRR) Calculator',
    shortDescription: 'Calculate target run rate needed to win during live run chases.',
    formula: 'RRR = Runs Required to Win / Decimal Overs Remaining',
    formulaExplanation: 'Required Run Rate indicates how many runs a chasing team must score per remaining 6-ball over to secure victory. Live matches calculate this ball by ball.',
    exampleScenario: 'A chasing side needs 48 runs to win from 4.2 overs remaining. Remaining overs = 4 + 2/6 = 4.333. Required Run Rate = 48 / 4.333 = 11.08 runs/over.',
    metaTitle: 'Required Run Rate (RRR) Calculator — Live Chase Target Engine | CricPlus24',
    metaDescription: 'Calculate Required Run Rate (RRR) for any cricket chase. Live ball-by-ball target calculations and pressure analysis.',
  },
  {
    slug: 'points-table-calculator',
    name: 'Tournament Points Table & Standings Calculator',
    shortDescription: 'Simulate group stage standings, wins, ties, bonus points, and qualification scenarios.',
    formula: 'Total Points = (Wins * Points Per Win) + (Ties/No Result * Points Per Tie)',
    formulaExplanation: 'Used by tournament directors and fantasy players to model qualification pathways, required margins of victory, and playoff seedings.',
    exampleScenario: 'Team plays 7 matches, winning 5, losing 1, with 1 wash-out (NR). Under a 2-pts per win format: Points = (5 * 2) + (1 * 1) = 11 points.',
    metaTitle: 'Cricket Points Table Calculator — League Standings Simulator | CricPlus24',
    metaDescription: 'Interactive cricket points table calculator. Simulate tournament scenarios, group qualification mathematics, and tiebreakers.',
  },
  {
    slug: 'auction-budget-calculator',
    name: 'Auction Budget & Maximum Bid Calculator',
    shortDescription: 'Calculate maximum permissible player bids while reserving mandatory squad purse minimums.',
    formula: 'Max Bid = Available Purse - ((Remaining Slots - 1) * Base Price)',
    formulaExplanation: 'In franchise auctions (such as CricPlus24, IPL, and corporate leagues), teams must maintain enough remaining budget to fill their mandatory squad roster at base price.',
    exampleScenario: 'A franchise has ₹4,500 remaining purse and must buy 4 more players at ₹500 base price. They must keep 3 * ₹500 = ₹1,500 in reserve. Maximum bid for current player = ₹4,500 - ₹1,500 = ₹3,000.',
    metaTitle: 'Cricket Auction Budget Calculator — Max Bid & Purse Engine | CricPlus24',
    metaDescription: 'Calculate maximum player bids in cricket auctions. Prevents purse penalties and models reserve squad allowances.',
  },
];

/**
 * Converts cricket overs notation (e.g. 19.5 or 4.2) into exact decimal overs.
 * Note: .1 through .5 represent balls out of 6.
 */
export function parseCricketOversToDecimal(oversInput: number | string): number {
  const num = typeof oversInput === 'string' ? parseFloat(oversInput) : oversInput;
  if (isNaN(num) || num <= 0) return 0;

  const completedOvers = Math.floor(num);
  const fractionalPart = Math.round((num - completedOvers) * 10); // extracts the ball count

  if (fractionalPart >= 6) {
    // Edge case: if someone wrote 19.6, that equals 20.0
    return completedOvers + 1;
  }

  return completedOvers + fractionalPart / 6;
}

/**
 * Format decimal overs back into cricket standard notation e.g. 19.8333 -> 19.5 ov
 */
export function formatDecimalToCricketOvers(decimalOvers: number): string {
  if (decimalOvers <= 0) return '0.0';
  const fullOvers = Math.floor(decimalOvers);
  const remainingBalls = Math.round((decimalOvers - fullOvers) * 6);
  if (remainingBalls === 6) {
    return `${fullOvers + 1}.0`;
  }
  return `${fullOvers}.${remainingBalls}`;
}
