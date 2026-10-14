import { NextResponse } from 'next/server';
import { getStoreData, setStoreData } from '@/lib/supabase/store';

const DEFAULT_DDPL_RULES = {
  basePurse: 10000,
  ownerBlockedPrice: 500,
  defaultPlayerBasePrice: 500,
  bidSteps: [50, 100, 200, 500],
  maxSquadSize: 11,
  minSquadSize: 7,
  matchOvers: 10,
  maxBowlerOvers: 2,
  wideBallPenalty: '+1 Run & Extra Ball',
  noBallPenalty: '+1 Run + Free Hit',
  pointsPerWin: 2,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'superadmin@cricplus.com',
};

const DEFAULT_GOR_RULES = {
  basePurse: 10000,
  ownerBlockedPrice: 500,
  defaultPlayerBasePrice: 500,
  bidSteps: [50, 100, 200, 500],
  maxSquadSize: 11,
  minSquadSize: 7,
  matchOvers: 12,
  maxBowlerOvers: 3,
  wideBallPenalty: '+1 Run & Extra Ball',
  noBallPenalty: '+1 Run + Free Hit',
  pointsPerWin: 2,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'superadmin@cricplus.com',
};

async function readAllRules(): Promise<Record<string, any>> {
  const container = await getStoreData<any>('tournament_rules', 'rules.json', {
    tournaments: {
      ddpl: DEFAULT_DDPL_RULES,
      'game-of-run': DEFAULT_GOR_RULES,
    },
  });

  if (container?.tournaments) {
    return container;
  }
  return {
    tournaments: {
      ddpl: { ...DEFAULT_DDPL_RULES, ...(container || {}) },
      'game-of-run': { ...DEFAULT_GOR_RULES, ...(container?.['game-of-run'] || {}) },
    },
  };
}

async function saveAllRules(rulesContainer: any) {
  return setStoreData('tournament_rules', rulesContainer, 'rules.json');
}

// GET /api/admin/rules?tournament=ddpl (or game-of-run)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournament = (searchParams.get('tournament') || 'ddpl').toLowerCase();

  const container = await readAllRules();
  const rulesMap = container.tournaments || {};

  // If requesting tournament-specific rule
  const targetRules = rulesMap[tournament] || (tournament === 'game-of-run' ? DEFAULT_GOR_RULES : DEFAULT_DDPL_RULES);
  const matchOvers = Number(targetRules.matchOvers) || (tournament === 'game-of-run' ? 12 : 10);
  const defaultBowlerLimit = targetRules.maxBowlerOvers !== undefined
    ? Number(targetRules.maxBowlerOvers)
    : Math.max(1, Math.ceil(matchOvers / 5));

  return NextResponse.json({
    success: true,
    tournament,
    tournaments: rulesMap,
    rules: {
      ...targetRules,
      matchOvers,
      maxBowlerOvers: defaultBowlerLimit,
      effectivePurse: (targetRules.basePurse || 10000) - (targetRules.ownerBlockedPrice || 500),
    },
  });
}

// POST /api/admin/rules - Update rules for selected tournament
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const tournament = (body.tournament || searchParams.get('tournament') || 'ddpl').toLowerCase();

    const {
      basePurse,
      ownerBlockedPrice,
      defaultPlayerBasePrice,
      bidSteps,
      maxSquadSize,
      minSquadSize,
      matchOvers,
      maxBowlerOvers,
      wideBallPenalty,
      noBallPenalty,
      pointsPerWin,
      updaterEmail,
    } = body;

    const container = await readAllRules();
    if (!container.tournaments) {
      container.tournaments = {};
    }

    const currentRules = container.tournaments[tournament] ||
      (tournament === 'game-of-run' ? DEFAULT_GOR_RULES : DEFAULT_DDPL_RULES);

    const parsedMatchOvers = Number(matchOvers) || currentRules.matchOvers || (tournament === 'game-of-run' ? 12 : 10);
    const parsedMaxBowlerOvers = maxBowlerOvers !== undefined
      ? Number(maxBowlerOvers)
      : (currentRules.maxBowlerOvers || Math.max(1, Math.ceil(parsedMatchOvers / 5)));

    const updated = {
      ...currentRules,
      basePurse: Number(basePurse) || currentRules.basePurse || 10000,
      ownerBlockedPrice: Number(ownerBlockedPrice) || currentRules.ownerBlockedPrice || 500,
      defaultPlayerBasePrice: Number(defaultPlayerBasePrice) || currentRules.defaultPlayerBasePrice || 500,
      bidSteps: Array.isArray(bidSteps) ? bidSteps : currentRules.bidSteps,
      maxSquadSize: Number(maxSquadSize) || currentRules.maxSquadSize || 11,
      minSquadSize: Number(minSquadSize) || currentRules.minSquadSize || 7,
      matchOvers: parsedMatchOvers,
      maxBowlerOvers: parsedMaxBowlerOvers,
      wideBallPenalty: wideBallPenalty || currentRules.wideBallPenalty || '+1 Run & Extra Ball',
      noBallPenalty: noBallPenalty || currentRules.noBallPenalty || '+1 Run + Free Hit',
      pointsPerWin: pointsPerWin !== undefined ? Number(pointsPerWin) : (currentRules.pointsPerWin || 2),
      lastUpdated: new Date().toISOString(),
      updatedBy: updaterEmail || 'superadmin@cricplus.com',
    };

    container.tournaments[tournament] = updated;
    await saveAllRules(container);

    return NextResponse.json({
      success: true,
      message: `Tournament rules for "${tournament.toUpperCase()}" updated successfully`,
      tournament,
      rules: {
        ...updated,
        effectivePurse: updated.basePurse - updated.ownerBlockedPrice,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
