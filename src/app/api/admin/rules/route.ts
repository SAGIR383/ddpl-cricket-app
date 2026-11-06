import { NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_DDPL_RULES = {
  basePurse: 10000,
  ownerBlockedPrice: 100,
  defaultPlayerBasePrice: 100,
  bidSteps: [50, 100, 200, 500],
  maxSquadSize: 11,
  minSquadSize: 7,
  matchOvers: 10,
  maxBowlerOvers: 2,
  groundName: 'Arena Ground 1',
  venue: 'Arena Ground 1',
  wideBallPenalty: '+1 Run & Extra Ball',
  noBallPenalty: '+1 Run + Free Hit',
  pointsPerWin: 2,
  pointsPerTie: 1,
  pointsPerNR: 1,
  pointsPerLoss: 0,
  knockoutFormat: 'ipl_playoffs',
  pathwayTitle: 'Knockout Pathway: League Stage ➔ Playoffs ➔ Grand Final',
  pathwayBadge: 'Official League Structure',
  stages: [
    {
      title: 'Stage 1: Group League',
      badge: 'Round Robin',
      desc: 'Franchises play round-robin matches. Top teams on points and NRR advance to the Playoffs.',
    },
    {
      title: 'Stage 2: Playoffs',
      badge: 'Top 4 Teams',
      desc: 'Qualifier 1, Eliminator, and Qualifier 2. The 2 victorious teams advance to the Grand Final.',
    },
    {
      title: 'Stage 3: Grand Final',
      badge: 'Championship',
      desc: 'The two playoff champions compete in the Grand Final for the official corporate tournament trophy!',
    },
  ],
  qualificationRule: 'Top 4 franchises secure direct playoff qualification.',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'superadmin@cricplus.com',
};

const DEFAULT_GOR_RULES = {
  basePurse: 10000,
  ownerBlockedPrice: 100,
  defaultPlayerBasePrice: 100,
  bidSteps: [50, 100, 200, 500],
  maxSquadSize: 11,
  minSquadSize: 7,
  matchOvers: 12,
  maxBowlerOvers: 3,
  groundName: 'Park View Oval',
  venue: 'Park View Oval',
  wideBallPenalty: '+1 Run & Extra Ball',
  noBallPenalty: '+1 Run + Free Hit',
  pointsPerWin: 2,
  pointsPerTie: 1,
  pointsPerNR: 1,
  pointsPerLoss: 0,
  knockoutFormat: 'direct_final',
  pathwayTitle: 'Knockout Pathway: League Stage ➔ Grand Final',
  pathwayBadge: 'Top 2 Direct Final',
  stages: [
    {
      title: 'Stage 1: Round Robin League',
      badge: 'All Play All',
      desc: 'Franchises play round-robin fixtures. Points and NRR determine the top 2 teams on the leaderboard.',
    },
    {
      title: 'Stage 2: Grand Final Showdown',
      badge: 'Top 2 Teams',
      desc: 'The top 2 ranked teams clash head-to-head in the Grand Final to claim the championship trophy!',
    },
    {
      title: 'Stage 3: Champion Crowned',
      badge: 'Championship',
      desc: 'Championship Trophy, MVP, Orange Cap, and Purple Cap awards presented to the tournament champions.',
    },
  ],
  qualificationRule: 'Top 2 franchises on the points table secure direct qualification to the Grand Final.',
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
        ownerBlockedPrice: currentConfig.ownerBasePrice || 100,
        defaultPlayerBasePrice: currentConfig.defaultPlayerBasePrice || currentConfig.ownerBasePrice || 100,
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
        groundName: targetRules.groundName || targetRules.venue || currentConfig?.venue || 'Arena Ground',
        venue: targetRules.groundName || targetRules.venue || currentConfig?.venue || 'Arena Ground',
        effectivePurse: (targetRules.basePurse || 10000) - (targetRules.ownerBlockedPrice || 100),
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
      pointsPerTie,
      pointsPerNR,
      pointsPerLoss,
      knockoutFormat,
      pathwayTitle,
      pathwayBadge,
      stages,
      qualificationRule,
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

    const resolvedBasePurse = Number(basePurse) || currentRules.basePurse || Number(currentConfig?.pursePerTeam) || 10000;
    const resolvedOwnerBase = ownerBlockedPrice !== undefined ? Number(ownerBlockedPrice) : (currentRules.ownerBlockedPrice || Number(currentConfig?.ownerBasePrice) || 100);
    const resolvedDefaultBase = defaultPlayerBasePrice !== undefined ? Number(defaultPlayerBasePrice) : (currentRules.defaultPlayerBasePrice || 100);
    const resolvedGround = (body.groundName || body.venue || currentRules.groundName || currentRules.venue || currentConfig?.venue || 'Arena Ground 1').trim();

    const updated = {
      ...currentRules,
      groundName: resolvedGround,
      venue: resolvedGround,
      basePurse: resolvedBasePurse,
      ownerBlockedPrice: resolvedOwnerBase,
      defaultPlayerBasePrice: resolvedDefaultBase,
      bidSteps: Array.isArray(bidSteps) ? bidSteps : currentRules.bidSteps,
      maxSquadSize: Number(maxSquadSize) || currentRules.maxSquadSize || Number(currentConfig?.maxSquad) || 11,
      minSquadSize: Number(minSquadSize) || currentRules.minSquadSize || Number(currentConfig?.minSquad) || 7,
      matchOvers: parsedMatchOvers,
      maxBowlerOvers: parsedMaxBowlerOvers,
      wideBallPenalty: wideBallPenalty || currentRules.wideBallPenalty || '+1 Run & Extra Ball',
      noBallPenalty: noBallPenalty || currentRules.noBallPenalty || '+1 Run + Free Hit',
      pointsPerWin: pointsPerWin !== undefined ? Number(pointsPerWin) : (currentRules.pointsPerWin || 2),
      pointsPerTie: pointsPerTie !== undefined ? Number(pointsPerTie) : (currentRules.pointsPerTie || 1),
      pointsPerNR: pointsPerNR !== undefined ? Number(pointsPerNR) : (currentRules.pointsPerNR || 1),
      pointsPerLoss: pointsPerLoss !== undefined ? Number(pointsPerLoss) : (currentRules.pointsPerLoss || 0),
      knockoutFormat: knockoutFormat || currentRules.knockoutFormat || 'ipl_playoffs',
      pathwayTitle: pathwayTitle !== undefined ? pathwayTitle : currentRules.pathwayTitle,
      pathwayBadge: pathwayBadge !== undefined ? pathwayBadge : currentRules.pathwayBadge,
      stages: Array.isArray(stages) && stages.length > 0 ? stages : currentRules.stages,
      qualificationRule: qualificationRule !== undefined ? qualificationRule : currentRules.qualificationRule,
      lastUpdated: new Date().toISOString(),
      updatedBy: updaterEmail || 'superadmin@cricplus.com',
    };

    container.tournaments[tournament] = updated;

    // BI-DIRECTIONAL AUTO-SYNC: Update tournament_configs with the new rules so front page, cards, and hubs are 100% in sync
    if (configs[tournament]) {
      configs[tournament].overs = parsedMatchOvers;
      configs[tournament].pursePerTeam = updated.basePurse;
      configs[tournament].ownerBasePrice = updated.ownerBlockedPrice;
      configs[tournament].defaultPlayerBasePrice = updated.defaultPlayerBasePrice;
      configs[tournament].maxSquad = updated.maxSquadSize;
      configs[tournament].minSquad = updated.minSquadSize;
      configs[tournament].pointsPerWin = updated.pointsPerWin;
      configs[tournament].knockoutFormat = updated.knockoutFormat;
      configs[tournament].pathwayTitle = updated.pathwayTitle;
      configs[tournament].pathwayBadge = updated.pathwayBadge;
      configs[tournament].stages = updated.stages;
      configs[tournament].qualificationRule = updated.qualificationRule;
      configs[tournament].venue = resolvedGround;
      configs[tournament].groundName = resolvedGround;
    }

    // AUTO-SYNC TO TOURNAMENT SCHEDULE (VENUE / GROUND NAME):
    try {
      const schedule = await getStoreData<any>(`tournament_schedule_${tournament}`, `schedule_${tournament}.json`, null);
      if (schedule && Array.isArray(schedule.matches) && schedule.matches.length > 0) {
        schedule.matches = schedule.matches.map((m: any) => ({
          ...m,
          venue: resolvedGround,
        }));
        await setStoreData(`tournament_schedule_${tournament}`, schedule, `schedule_${tournament}.json`);
        invalidateStoreCache(`tournament_schedule_${tournament}`);
      }
    } catch (schedErr) {
      console.warn('Schedule venue sync warning:', schedErr);
    }

    // AUTO-SYNC TO AUCTION STATE:
    // Update auction_data_ddpl for this tournament so live auction immediately uses the new default player base price
    try {
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      if (allAuction?.tournaments?.[tournament]) {
        const tourneyAuction = allAuction.tournaments[tournament];
        let auctionChanged = false;

        if (Array.isArray(tourneyAuction.playerPool)) {
          tourneyAuction.playerPool = tourneyAuction.playerPool.map((p: any) => {
            if (!p.basePrice || p.basePrice === 500 || p.basePrice === currentRules.defaultPlayerBasePrice) {
              auctionChanged = true;
              return { ...p, basePrice: updated.defaultPlayerBasePrice };
            }
            return p;
          });
        }

        if (tourneyAuction.currentLot && !tourneyAuction.currentLot.leadingTeam) {
          tourneyAuction.currentLot = {
            ...tourneyAuction.currentLot,
            basePrice: updated.defaultPlayerBasePrice,
            currentBid: updated.defaultPlayerBasePrice,
          };
          auctionChanged = true;
        }

        // Auto-sync franchise team purse & owner blocked prices to match new rules
        if (Array.isArray(tourneyAuction.teams)) {
          const ownerMap = new Set(
            (tourneyAuction.teams || [])
              .filter((t: any) => t.owner)
              .map((t: any) => t.owner.toLowerCase().trim())
          );

          tourneyAuction.teams = tourneyAuction.teams.map((t: any) => {
            const hasOwner = Boolean(t.owner);
            const otherPlayers = (t.players || []).filter(
              (p: any) => !p.role?.includes('Franchise Owner') && (!t.owner || p.name?.toLowerCase().trim() !== t.owner.toLowerCase().trim())
            );
            const otherSpent = otherPlayers.reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0);
            const ownerBlocked = hasOwner ? updated.ownerBlockedPrice : 0;
            const newSpent = otherSpent + ownerBlocked;
            const newRemaining = Math.max(0, updated.basePurse - newSpent);

            const updatedPlayers = (t.players || []).map((p: any) => {
              if (p.role?.includes('Franchise Owner') || (t.owner && p.name?.toLowerCase().trim() === t.owner.toLowerCase().trim())) {
                return { ...p, price: updated.ownerBlockedPrice };
              }
              return p;
            });

            auctionChanged = true;
            return {
              ...t,
              allocated: updated.basePurse,
              spent: newSpent,
              remaining: newRemaining,
              maxSquad: updated.maxSquadSize,
              players: updatedPlayers,
            };
          });

          // Sync soldTransactions owner price
          if (Array.isArray(tourneyAuction.soldTransactions)) {
            tourneyAuction.soldTransactions = tourneyAuction.soldTransactions.map((tx: any) => {
              if (tx.role?.includes('Franchise Owner') || ownerMap.has(tx.player?.toLowerCase().trim())) {
                auctionChanged = true;
                return { ...tx, price: updated.ownerBlockedPrice };
              }
              return tx;
            });
          }
        }

        if (auctionChanged) {
          tourneyAuction.lastUpdated = new Date().toISOString();
          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
          invalidateStoreCache('auction_data_ddpl');
        }
      }
    } catch (auctionSyncErr) {
      console.error('Failed to auto-sync auction base prices:', auctionSyncErr);
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
