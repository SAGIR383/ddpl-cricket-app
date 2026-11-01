import { NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    tournaments: {},
  });

  if (container?.tournaments) {
    return container;
  }
  return {
    tournaments: container || {},
  };
}

async function saveAllRules(rulesContainer: any) {
  return setStoreData('tournament_rules', rulesContainer, 'rules.json');
}

// GET /api/admin/rules?tournament=slug
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tournament = (searchParams.get('tournament') || 'default').toLowerCase();

  const [container, configs, separateRules] = await Promise.all([
    readAllRules(),
    getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
    getStoreData<any>(`tournament_rules_${tournament}`, `rules_${tournament}.json`, null),
  ]);

  const rulesMap = container.tournaments || {};
  const currentConfig = configs[tournament];

  // If this tournament has its own config or separate rules, prioritize live custom values
  let targetRules = rulesMap[tournament] || separateRules;
  if (!targetRules) {
    if (currentConfig) {
      targetRules = {
        ...DEFAULT_DDPL_RULES,
        matchOvers: currentConfig.overs || 10,
        basePurse: currentConfig.pursePerTeam || 10000,
        ownerBlockedPrice: currentConfig.ownerBasePrice || 500,
        maxSquadSize: currentConfig.maxSquad || 11,
        minSquadSize: currentConfig.minSquad || 7,
      };
      // Persist into rulesMap so all pages stay 100% in sync
      rulesMap[tournament] = targetRules;
      container.tournaments = rulesMap;
      saveAllRules(container).catch(() => {});
    } else {
      targetRules = DEFAULT_DDPL_RULES;
    }
  }

  const matchOvers = Number(targetRules.matchOvers) || Number(currentConfig?.overs) || 10;
  const defaultBowlerLimit = targetRules.maxBowlerOvers !== undefined
    ? Number(targetRules.maxBowlerOvers)
    : Math.max(1, Math.ceil(matchOvers / 5));

  return NextResponse.json(
    {
      success: true,
      tournament,
      tournaments: rulesMap,
      rules: {
        ...targetRules,
        matchOvers,
        maxBowlerOvers: defaultBowlerLimit,
        effectivePurse: (targetRules.basePurse || 10000) - (targetRules.ownerBlockedPrice || 500),
      },
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
      },
    }
  );
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

    const [container, configs] = await Promise.all([
      readAllRules(),
      getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
    ]);

    if (!container.tournaments) {
      container.tournaments = {};
    }

    const currentConfig = configs[tournament];
    const currentRules = container.tournaments[tournament] ||
      (tournament === 'game-of-run' ? DEFAULT_GOR_RULES : DEFAULT_DDPL_RULES);

    const parsedMatchOvers = Number(matchOvers) || currentRules.matchOvers || Number(currentConfig?.overs) || 10;
    const parsedMaxBowlerOvers = maxBowlerOvers !== undefined
      ? Number(maxBowlerOvers)
      : (currentRules.maxBowlerOvers || Math.max(1, Math.ceil(parsedMatchOvers / 5)));

    const updated = {
      ...currentRules,
      basePurse: Number(basePurse) || currentRules.basePurse || Number(currentConfig?.pursePerTeam) || 10000,
      ownerBlockedPrice: Number(ownerBlockedPrice) || currentRules.ownerBlockedPrice || Number(currentConfig?.ownerBasePrice) || 500,
      defaultPlayerBasePrice: Number(defaultPlayerBasePrice) || currentRules.defaultPlayerBasePrice || 500,
      bidSteps: Array.isArray(bidSteps) ? bidSteps : currentRules.bidSteps,
      maxSquadSize: Number(maxSquadSize) || currentRules.maxSquadSize || Number(currentConfig?.maxSquad) || 11,
      minSquadSize: Number(minSquadSize) || currentRules.minSquadSize || Number(currentConfig?.minSquad) || 7,
      matchOvers: parsedMatchOvers,
      maxBowlerOvers: parsedMaxBowlerOvers,
      wideBallPenalty: wideBallPenalty || currentRules.wideBallPenalty || '+1 Run & Extra Ball',
      noBallPenalty: noBallPenalty || currentRules.noBallPenalty || '+1 Run + Free Hit',
      pointsPerWin: pointsPerWin !== undefined ? Number(pointsPerWin) : (currentRules.pointsPerWin || 2),
      lastUpdated: new Date().toISOString(),
      updatedBy: updaterEmail || 'superadmin@cricplus.com',
    };

    container.tournaments[tournament] = updated;

    // BI-DIRECTIONAL AUTO-SYNC: Update tournament_configs with the new rules so front page, cards, and hubs are 100% in sync
    if (configs[tournament]) {
      configs[tournament].overs = parsedMatchOvers;
      configs[tournament].pursePerTeam = updated.basePurse;
      configs[tournament].ownerBasePrice = updated.ownerBlockedPrice;
      configs[tournament].maxSquad = updated.maxSquadSize;
      configs[tournament].minSquad = updated.minSquadSize;
    }

    // Persist all data simultaneously
    await Promise.all([
      saveAllRules(container),
      setStoreData(`tournament_rules_${tournament}`, updated, `rules_${tournament}.json`),
      setStoreData('tournament_configs', configs, 'tournament_configs.json'),
    ]);

    // Invalidate in-memory caches across all stores
    invalidateStoreCache('tournament_rules');
    invalidateStoreCache('tournament_configs');
    invalidateStoreCache(`tournament_rules_${tournament}`);

    return NextResponse.json(
      {
        success: true,
        message: `Tournament rules for "${tournament.toUpperCase()}" updated successfully`,
        tournament,
        rules: {
          ...updated,
          effectivePurse: updated.basePurse - updated.ownerBlockedPrice,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
