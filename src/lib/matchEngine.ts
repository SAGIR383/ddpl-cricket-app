import {
  MatchLiveState,
  InningsData,
  DeliveryEvent,
  BatterRecord,
  BowlerRecord,
  FOWRecord,
  ExtraType,
  WicketType,
  DeliveryWicketDetails,
  SquadPlayer,
} from '@/types/match.types';

export function calculateOversString(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const remainder = legalBalls % 6;
  return `${overs}.${remainder}`;
}

export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return parseFloat(((runs / balls) * 100).toFixed(2));
}

export function calculateEconomyRate(runsConceded: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  return parseFloat(((runsConceded * 6) / legalBalls).toFixed(2));
}

export function createInitialInnings(
  battingTeam: string,
  battingTeamShort: string,
  bowlingTeam: string,
  bowlingTeamShort: string,
  oversLimit = 10,
  battingSquad?: SquadPlayer[],
  bowlingSquad?: SquadPlayer[]
): InningsData {
  const defaultBatters: BatterRecord[] = [];
  if (battingSquad && battingSquad.length >= 2) {
    defaultBatters.push({
      id: battingSquad[0].id || 'b-1',
      name: battingSquad[0].name,
      avatar: battingSquad[0].avatar,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: null,
      strikeRate: 0,
    });
    defaultBatters.push({
      id: battingSquad[1].id || 'b-2',
      name: battingSquad[1].name,
      avatar: battingSquad[1].avatar,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: null,
      strikeRate: 0,
    });
  } else {
    defaultBatters.push({
      id: 'b-1',
      name: 'Opening Batter 1',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: null,
      strikeRate: 0,
    });
    defaultBatters.push({
      id: 'b-2',
      name: 'Opening Batter 2',
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: null,
      strikeRate: 0,
    });
  }

  const defaultBowlers: BowlerRecord[] = [];
  if (bowlingSquad && bowlingSquad.length > 0) {
    const openingBowler = bowlingSquad[bowlingSquad.length - 1] || bowlingSquad[0];
    defaultBowlers.push({
      id: openingBowler.id || 'bw-1',
      name: openingBowler.name,
      avatar: openingBowler.avatar,
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
  } else {
    defaultBowlers.push({
      id: 'bw-1',
      name: 'Opening Bowler',
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
  }

  return {
    battingTeam,
    battingTeamShort,
    bowlingTeam,
    bowlingTeamShort,
    totalRuns: 0,
    wickets: 0,
    legalBalls: 0,
    oversLimit,
    extras: {
      wide: 0,
      noBall: 0,
      bye: 0,
      legBye: 0,
      penalty: 0,
      total: 0,
    },
    strikerIndex: 0,
    nonStrikerIndex: 1,
    currentBowlerIndex: 0,
    batters: defaultBatters,
    bowlers: defaultBowlers,
    fallOfWickets: [],
    deliveries: [],
  };
}

export function generateCommentaryText(
  runsBat: number,
  extraType: ExtraType,
  runsExtras: number,
  isWicket: boolean,
  strikerName: string,
  bowlerName: string,
  wicketDetails?: DeliveryWicketDetails | null
): string {
  if (isWicket && wicketDetails) {
    if (wicketDetails.type === 'bowled') {
      return `OUT! Bowled him! ${bowlerName} rattles the stumps with precision. ${strikerName} departs!`;
    }
    if (wicketDetails.type === 'caught') {
      const fielder = wicketDetails.fielder ? `caught by ${wicketDetails.fielder}` : 'caught';
      return `OUT! In the air and taken! ${strikerName} ${fielder} off ${bowlerName}'s delivery. Big wicket!`;
    }
    if (wicketDetails.type === 'lbw') {
      return `OUT! Huge appeal and given! Plumb in front, ${strikerName} is trapped LBW by ${bowlerName}!`;
    }
    if (wicketDetails.type === 'run_out') {
      const fielder = wicketDetails.fielder ? `by ${wicketDetails.fielder}` : '';
      return `OUT! Direct hit! Miscommunication between the wickets and ${wicketDetails.playerOut} is run out ${fielder}!`;
    }
    if (wicketDetails.type === 'stumped') {
      return `OUT! Stumped! Beaten in flight by ${bowlerName}, keeper whips off the bails in a flash. ${strikerName} gone!`;
    }
    return `OUT! ${strikerName} is dismissed (${wicketDetails.type}) off ${bowlerName}.`;
  }

  if (extraType === 'wide') {
    if (runsBat > 0 || runsExtras > 1) {
      return `Wide ball down the leg side, plus they scamper through for ${runsExtras} extra run(s). Conceded by ${bowlerName}.`;
    }
    return `Wide delivery signaled by the umpire. An extra run gifted by ${bowlerName}.`;
  }

  if (extraType === 'noBall') {
    if (runsBat === 6) {
      return `NO BALL AND A SIX! ${bowlerName} oversteps and ${strikerName} deposits it into the stands! Free hit coming up!`;
    }
    if (runsBat === 4) {
      return `NO BALL AND FOUR! ${bowlerName} oversteps and ${strikerName} crashes it to the boundary! Free hit next!`;
    }
    return `No ball called! ${bowlerName} oversteps the bowling crease. 1 run added and Free Hit awarded!`;
  }

  if (extraType === 'bye') {
    return `${runsExtras} Bye(s). Ball beats the batter and keeper, batters sprint through for the extra.`;
  }

  if (extraType === 'legBye') {
    return `${runsExtras} Leg Bye(s). Deflected off the pads into the vacant outfield, sharp single taken.`;
  }

  if (runsBat === 6) {
    return `SIX! High, handsome, and into the pavilion! Glorious strike from ${strikerName} off ${bowlerName}!`;
  }

  if (runsBat === 4) {
    return `FOUR! Pierces the gap with clinical precision. ${strikerName} finds the fence off ${bowlerName}!`;
  }

  if (runsBat === 3) {
    return `Superb placement! ${strikerName} drives into the deep and the pair sprint hard for three runs.`;
  }

  if (runsBat === 2) {
    return `Pushed into the deep cover pocket by ${strikerName}. Good call, sharp turn, comfortably two runs.`;
  }

  if (runsBat === 1) {
    return `Tucked away softly into the on-side by ${strikerName} for a quick single off ${bowlerName}.`;
  }

  return `Solid defense. ${bowlerName} hits a good length on off-stump, ${strikerName} pats it down into the pitch. No run.`;
}

export function generateDeliverySymbol(
  runsBat: number,
  extraType: ExtraType,
  runsExtras: number,
  isWicket: boolean
): string {
  if (isWicket) {
    return runsBat > 0 ? `W+${runsBat}` : 'W';
  }
  if (extraType === 'wide') {
    return runsExtras > 1 ? `Wd+${runsExtras - 1}` : 'Wd';
  }
  if (extraType === 'noBall') {
    return runsBat > 0 ? `Nb+${runsBat}` : 'Nb';
  }
  if (extraType === 'bye') {
    return `B${runsExtras}`;
  }
  if (extraType === 'legBye') {
    return `Lb${runsExtras}`;
  }
  return `${runsBat}`;
}

export interface RecordBallParams {
  runsBat: number;
  extraType: ExtraType;
  runsExtras?: number; // defaults to 1 for wide/noBall, or custom
  isWicket?: boolean;
  wicketDetails?: DeliveryWicketDetails | null;
  newBatterName?: string;
  newBatterAvatar?: string;
  nextBowlerName?: string;
  customCommentary?: string;
}

/**
 * Pure function: records a single delivery onto an innings and returns an updated deep clone.
 */
export function recordDelivery(innings: InningsData, params: RecordBallParams): InningsData {
  const updated: InningsData = JSON.parse(JSON.stringify(innings));

  const runsBat = params.runsBat || 0;
  const extraType = params.extraType || 'none';
  const isLegal = extraType === 'none' || extraType === 'bye' || extraType === 'legBye' || extraType === 'penalty';
  
  let runsExtras = params.runsExtras !== undefined ? params.runsExtras : 0;
  if (runsExtras === 0) {
    if (extraType === 'wide' || extraType === 'noBall') runsExtras = 1;
    if (extraType === 'bye' || extraType === 'legBye') runsExtras = runsBat > 0 ? runsBat : 1;
  }
  
  // Total runs added to score for this ball
  const runsTotal = (extraType === 'none' ? runsBat : 0) + (extraType === 'noBall' ? runsBat + runsExtras : 0) + (extraType === 'wide' ? runsExtras : 0) + (extraType === 'bye' || extraType === 'legBye' ? runsExtras : 0);

  const isWicket = !!params.isWicket;
  const isFour = runsBat === 4;
  const isSix = runsBat === 6;
  const isBoundary = isFour || isSix;

  // Active batter & bowler references
  const striker = updated.batters[updated.strikerIndex] || updated.batters[0];
  const nonStriker = updated.batters[updated.nonStrikerIndex] || updated.batters[1];
  const bowler = updated.bowlers[updated.currentBowlerIndex] || updated.bowlers[0];

  const currentOverIndex = Math.floor(updated.legalBalls / 6);
  const currentBallInOver = isLegal ? (updated.legalBalls % 6) + 1 : (updated.legalBalls % 6);
  const ballDisplay = `${currentOverIndex}.${currentBallInOver}`;

  const commentary = params.customCommentary || generateCommentaryText(
    runsBat,
    extraType,
    runsExtras,
    isWicket,
    striker.name,
    bowler.name,
    params.wicketDetails
  );

  const symbol = generateDeliverySymbol(runsBat, extraType, runsExtras, isWicket);

  const deliveryEvent: DeliveryEvent = {
    id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    innings: 1, // dynamically bound by state
    over: currentOverIndex,
    ball: currentBallInOver,
    ballDisplay,
    strikerName: striker.name,
    nonStrikerName: nonStriker.name,
    bowlerName: bowler.name,
    runsBat,
    runsExtras,
    runsTotal,
    extraType,
    isLegal,
    isBoundary,
    isFour,
    isSix,
    isWicket,
    wicketDetails: params.wicketDetails || null,
    commentary,
    symbol,
    timestamp: new Date().toISOString(),
  };

  updated.deliveries.push(deliveryEvent);

  // 1. Update Innings Score & Extras
  updated.totalRuns += runsTotal;
  if (extraType === 'wide') {
    updated.extras.wide += runsExtras;
    updated.extras.total += runsExtras;
    bowler.wides += 1;
  }
  if (extraType === 'noBall') {
    updated.extras.noBall += runsExtras;
    updated.extras.total += runsExtras;
    bowler.noBalls += 1;
  }
  if (extraType === 'bye') {
    updated.extras.bye += runsExtras;
    updated.extras.total += runsExtras;
  }
  if (extraType === 'legBye') {
    updated.extras.legBye += runsExtras;
    updated.extras.total += runsExtras;
  }

  // 2. Update Batter Stats
  if (extraType === 'none' || extraType === 'noBall') {
    striker.runs += runsBat;
    striker.balls += 1;
    if (isFour) striker.fours += 1;
    if (isSix) striker.sixes += 1;
  } else if (extraType === 'bye' || extraType === 'legBye') {
    striker.balls += 1;
  }
  striker.strikeRate = calculateStrikeRate(striker.runs, striker.balls);

  // 3. Update Bowler Stats
  // Runs charged to bowler = runs off bat + wides + noBalls (byes/legbyes not charged to bowler)
  const bowlerRuns = (extraType === 'none' || extraType === 'noBall' ? runsBat : 0) + (extraType === 'wide' || extraType === 'noBall' ? runsExtras : 0);
  bowler.runsConceded += bowlerRuns;

  if (runsTotal === 0 && isLegal) {
    bowler.dots += 1;
  }

  if (isLegal) {
    bowler.ballsInOver += 1;
    const totalBowlerLegalBalls = bowler.overs * 6 + bowler.ballsInOver;
    if (bowler.ballsInOver === 6) {
      bowler.overs += 1;
      bowler.ballsInOver = 0;
      // Check maiden over
      const thisOverDeliveries = updated.deliveries.filter((d) => d.over === currentOverIndex && d.bowlerName === bowler.name);
      const runsConcededInOver = thisOverDeliveries.reduce((sum, d) => {
        const dRuns = (d.extraType === 'none' || d.extraType === 'noBall' ? d.runsBat : 0) + (d.extraType === 'wide' || d.extraType === 'noBall' ? d.runsExtras : 0);
        return sum + dRuns;
      }, 0);
      if (runsConcededInOver === 0) {
        bowler.maidens += 1;
      }
    }
    bowler.oversStr = `${bowler.overs}.${bowler.ballsInOver}`;
    bowler.economy = calculateEconomyRate(bowler.runsConceded, totalBowlerLegalBalls);
  } else {
    const totalBowlerLegalBalls = bowler.overs * 6 + bowler.ballsInOver;
    bowler.economy = calculateEconomyRate(bowler.runsConceded, totalBowlerLegalBalls);
  }

  // 4. Update Wickets & Fall of Wickets
  if (isWicket) {
    updated.wickets += 1;
    const wicketDetails = params.wicketDetails || {
      type: 'caught' as WicketType,
      playerOut: striker.name,
      bowlerCredited: true,
      description: `c & b ${bowler.name}`,
    };

    if (wicketDetails.bowlerCredited) {
      bowler.wickets += 1;
    }

    const dismissedBatter = wicketDetails.playerOut === nonStriker.name ? nonStriker : striker;
    dismissedBatter.isOut = true;
    dismissedBatter.dismissal = wicketDetails.description || `${wicketDetails.type} b ${bowler.name}`;

    // Append to Fall of Wickets
    const nextBallsDisplay = calculateOversString(updated.legalBalls + (isLegal ? 1 : 0));
    updated.fallOfWickets.push({
      wicketNumber: updated.wickets,
      batterName: dismissedBatter.name,
      score: updated.totalRuns,
      overStr: nextBallsDisplay,
    });

    // Add incoming batter if provided
    const newBatterIndex = updated.batters.length;
    const incomingName = params.newBatterName || `Batter ${newBatterIndex + 1}`;
    updated.batters.push({
      id: `b-${Date.now()}-${newBatterIndex}`,
      name: incomingName,
      avatar: params.newBatterAvatar,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissal: null,
      strikeRate: 0,
    });

    if (wicketDetails.playerOut === nonStriker.name) {
      updated.nonStrikerIndex = newBatterIndex;
    } else {
      updated.strikerIndex = newBatterIndex;
    }
  }

  // 5. Strike Rotation & Legal Ball Count
  const oddRuns = runsBat % 2 !== 0 || (runsExtras % 2 !== 0 && (extraType === 'bye' || extraType === 'legBye'));
  if (oddRuns && !isWicket) {
    const temp = updated.strikerIndex;
    updated.strikerIndex = updated.nonStrikerIndex;
    updated.nonStrikerIndex = temp;
  }

  if (isLegal) {
    updated.legalBalls += 1;
    // Over boundary: if 6 legal balls reached, rotate strike
    if (updated.legalBalls % 6 === 0) {
      const temp = updated.strikerIndex;
      updated.strikerIndex = updated.nonStrikerIndex;
      updated.nonStrikerIndex = temp;

      // Select next bowler if provided
      if (params.nextBowlerName) {
        let existingBowlerIdx = updated.bowlers.findIndex((b) => b.name.toLowerCase() === params.nextBowlerName?.toLowerCase());
        if (existingBowlerIdx === -1) {
          updated.bowlers.push({
            id: `bw-${Date.now()}`,
            name: params.nextBowlerName,
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
          existingBowlerIdx = updated.bowlers.length - 1;
        }
        updated.currentBowlerIndex = existingBowlerIdx;
      }
    }
  }

  return updated;
}

/**
 * Deterministic Undo: takes base squads / empty innings and replays all deliveries except the last one.
 */
export function undoLastDelivery(
  baseInnings: InningsData,
  deliveries: DeliveryEvent[]
): InningsData {
  if (deliveries.length <= 1) {
    // Reset to clean initial innings
    return createInitialInnings(
      baseInnings.battingTeam,
      baseInnings.battingTeamShort,
      baseInnings.bowlingTeam,
      baseInnings.bowlingTeamShort,
      baseInnings.oversLimit
    );
  }

  const remainingDeliveries = deliveries.slice(0, deliveries.length - 1);
  let replay = createInitialInnings(
    baseInnings.battingTeam,
    baseInnings.battingTeamShort,
    baseInnings.bowlingTeam,
    baseInnings.bowlingTeamShort,
    baseInnings.oversLimit
  );

  for (const del of remainingDeliveries) {
    replay = recordDelivery(replay, {
      runsBat: del.runsBat,
      extraType: del.extraType,
      runsExtras: del.runsExtras,
      isWicket: del.isWicket,
      wicketDetails: del.wicketDetails,
      newBatterName: del.isWicket ? replay.batters[replay.batters.length]?.name : undefined,
      customCommentary: del.commentary,
    });
  }

  return replay;
}

/**
 * Transitions from Innings 1 to Innings 2 with target calculation
 */
export function transitionToInnings2(state: MatchLiveState): MatchLiveState {
  const updated: MatchLiveState = JSON.parse(JSON.stringify(state));

  const targetRuns = updated.innings1.totalRuns + 1;
  updated.targetRuns = targetRuns;
  updated.targetOvers = updated.rules.matchOvers;
  updated.currentInnings = 2;
  updated.status = 'live';

  // Innings 2 batting team is Innings 1 bowling team
  const battingTeam = updated.innings1.bowlingTeam;
  const battingTeamShort = updated.innings1.bowlingTeamShort;
  const bowlingTeam = updated.innings1.battingTeam;
  const bowlingTeamShort = updated.innings1.battingTeamShort;

  const battingSquad = updated.teamBSquad && updated.teamBSquad.length > 0 ? updated.teamBSquad : undefined;
  const bowlingSquad = updated.teamASquad && updated.teamASquad.length > 0 ? updated.teamASquad : undefined;

  updated.innings2 = createInitialInnings(
    battingTeam,
    battingTeamShort,
    bowlingTeam,
    bowlingTeamShort,
    updated.rules.matchOvers,
    battingSquad,
    bowlingSquad
  );

  updated.matchNotes.unshift({
    id: `note-${Date.now()}`,
    text: `Innings break: ${updated.innings1.battingTeam} scored ${updated.innings1.totalRuns}/${updated.innings1.wickets}. Target for ${battingTeam} is ${targetRuns} runs in ${updated.rules.matchOvers} overs.`,
    timestamp: new Date().toISOString(),
    type: 'innings',
  });

  updated.lastUpdated = new Date().toISOString();
  return updated;
}

/**
 * Evaluates match outcome during Innings 2
 */
export function evaluateMatchResult(state: MatchLiveState): {
  isCompleted: boolean;
  resultText: string | null;
} {
  if (state.currentInnings !== 2 || !state.innings2 || !state.targetRuns) {
    return { isCompleted: false, resultText: null };
  }

  const inn2 = state.innings2;
  const target = state.targetRuns;
  const maxBalls = state.rules.matchOvers * 6;

  // 1. Chasing team reached the target
  if (inn2.totalRuns >= target) {
    const wicketsInHand = Math.max(1, 10 - inn2.wickets);
    const ballsRemaining = Math.max(0, maxBalls - inn2.legalBalls);
    return {
      isCompleted: true,
      resultText: `${inn2.battingTeam} won by ${wicketsInHand} wicket${wicketsInHand > 1 ? 's' : ''} (${ballsRemaining}b remaining)`,
    };
  }

  // 2. Chasing team is all out (10 wickets) or overs finished
  if (inn2.wickets >= 10 || inn2.legalBalls >= maxBalls) {
    const diff = target - 1 - inn2.totalRuns;
    if (diff > 0) {
      return {
        isCompleted: true,
        resultText: `${state.innings1.battingTeam} won by ${diff} run${diff > 1 ? 's' : ''}`,
      };
    } else if (diff === 0) {
      return {
        isCompleted: true,
        resultText: 'Match Tied! (Super Over Decider)',
      };
    }
  }

  return { isCompleted: false, resultText: null };
}
