import { NextResponse } from 'next/server';
import { getStoreData, setStoreData, invalidateStoreCache } from '@/lib/supabase/store';
import { generateMultiGroupFixtures } from '@/app/api/matches/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface TournamentPlayerRegistration {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  avatarUrl?: string;
  employeeId?: string;
  registeredAt: string;
  isOwner?: boolean;
  franchiseTeam?: string;
  basePrice?: number;
}

export interface TournamentConfig {
  slug: string;
  name: string;
  shortName?: string;
  fullName?: string;
  tagline?: string;
  season?: string;
  totalSeasons?: number;
  overs?: number;
  format?: 'ddpl' | 'game-of-run' | 'round-robin-playoffs' | 'group-stage-playoffs';
  tournamentType?: 'direct_groups' | 'auction_league';
  groupsCount?: number;
  groupNames?: string[];
  bannerColor?: string;
  badgeColor?: string;
  logo?: string;
  status: 'upcoming' | 'open' | 'closed' | 'auction' | 'ongoing' | 'completed';
  pursePerTeam: number;
  ownerBasePrice: number;
  defaultPlayerBasePrice?: number;
  maxSquad: number;
  minSquad: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  organizationSlug?: string;
  organizationName?: string;
  country?: string;
  currency?: string;
  currencySymbol?: string;
  creatorEmail?: string;
  creatorName?: string;
  isPublic?: boolean;
  maxBowlerOvers?: number;
  ballsPerOver?: number;
  pitchType?: string;
  formatTitle?: string;
  adminPassword?: string;
  adminPin?: string;
}

const DEFAULT_CONFIGS: Record<string, TournamentConfig> = {};

// GET /api/tournaments/register?tournament=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawRequested = (searchParams.get('tournament') || searchParams.get('slug'))?.toLowerCase();
  const requestedSlug = rawRequested === 'ddpl' ? 'ddpl-3-0' : rawRequested;

  const [storedConfigs, rulesContainer] = await Promise.all([
    getStoreData<Record<string, TournamentConfig>>(
      'tournament_configs',
      'tournament_configs.json',
      {}
    ),
    getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
  ]);

  const configs: Record<string, TournamentConfig> = storedConfigs || {};
  const rulesMap = rulesContainer?.tournaments || rulesContainer || {};

  // Cross-synchronize rules and configs so overs, purse, squad size are 100% consistent across all views
  Object.keys(configs).forEach((key) => {
    const cfg = configs[key];
    const r = rulesMap[key];
    if (r) {
      if (r.matchOvers !== undefined) cfg.overs = Number(r.matchOvers);
      if (r.basePurse !== undefined) cfg.pursePerTeam = Number(r.basePurse);
      if (r.ownerBlockedPrice !== undefined) cfg.ownerBasePrice = Number(r.ownerBlockedPrice);
      if (r.maxSquadSize !== undefined) cfg.maxSquad = Number(r.maxSquadSize);
      if (r.minSquadSize !== undefined) cfg.minSquad = Number(r.minSquadSize);
    }
  });

  const tournamentsList = Object.values(configs);
  const requestedConfig = requestedSlug ? (configs[requestedSlug] || null) : null;
  const isFound = requestedSlug ? Boolean(configs[requestedSlug]) : true;

  const activeSlug = requestedSlug && configs[requestedSlug]
    ? requestedSlug
    : (requestedSlug ? requestedSlug : (tournamentsList.length > 0 ? tournamentsList[0].slug : ''));

  const config = requestedSlug ? requestedConfig : (tournamentsList.length > 0 ? tournamentsList[0] : null);

  const registrations = (activeSlug && isFound) ? await getStoreData<TournamentPlayerRegistration[]>(
    `tournament_registrations_${activeSlug}`,
    `registrations_${activeSlug}.json`,
    []
  ) : [];

  // Compute live registrations count for all active tournaments
  const regCounts: Record<string, number> = {};
  let totalRegistrations = 0;

  await Promise.all(
    tournamentsList.map(async (t) => {
      if (t.slug === activeSlug) {
        const c = Array.isArray(registrations) ? registrations.length : 0;
        regCounts[t.slug] = c;
        totalRegistrations += c;
      } else {
        const tRegs = await getStoreData<TournamentPlayerRegistration[]>(
          `tournament_registrations_${t.slug}`,
          `registrations_${t.slug}.json`,
          []
        );
        const c = Array.isArray(tRegs) ? tRegs.length : 0;
        regCounts[t.slug] = c;
        totalRegistrations += c;
      }
    })
  );

  return NextResponse.json(
    {
      success: true,
      found: isFound,
      tournament: activeSlug,
      config,
      allConfigs: configs,
      tournamentsList,
      rulesMap,
      registrations,
      count: registrations.length,
      totalRegistrationsCount: totalRegistrations,
      registrationsCounts: regCounts,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

// POST /api/tournaments/register
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;
    const rawSlug = (body.slug || body.tournament || 'ddpl-3-0').toLowerCase();
    const tSlug = (rawSlug === 'ddpl' && action !== 'delete_tournament') ? 'ddpl-3-0' : rawSlug;

    // 1. UPDATE TOURNAMENT STATUS (Super Admin)
    if (action === 'update_status') {
      const { status } = body;
      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        {}
      );

      const current = configs[tSlug] || {
        slug: tSlug,
        name: tSlug.toUpperCase(),
        status: 'upcoming',
        pursePerTeam: 10000,
        ownerBasePrice: 500,
        maxSquad: 11,
        minSquad: 9,
      };

      configs[tSlug] = {
        ...current,
        status,
      };

      await setStoreData('tournament_configs', configs, 'tournament_configs.json');
      return NextResponse.json({ success: true, config: configs[tSlug] });
    }

    // 1.1 UPDATE TOURNAMENT DATES (Super Admin / Organizer)
    if (action === 'update_tournament_dates' || action === 'update_dates') {
      const { startDate, endDate } = body;
      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        {}
      );

      if (configs[tSlug]) {
        configs[tSlug] = {
          ...configs[tSlug],
          startDate: startDate !== undefined ? startDate : configs[tSlug].startDate,
          endDate: endDate !== undefined ? endDate : configs[tSlug].endDate,
        };
        await setStoreData('tournament_configs', configs, 'tournament_configs.json');
      }

      return NextResponse.json({ success: true, config: configs[tSlug] });
    }

    // 2. PLAYER REGISTRATION (Player)
    if (action === 'register' || action === 'register_player') {
      const registration = body.registration || body.player;
      if (!registration || !registration.name) {
        return NextResponse.json(
          { success: false, error: 'Player name is required' },
          { status: 400 }
        );
      }
      if (!registration.email) {
        registration.email = `${registration.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@player.local`;
      }

      // Check current registration status
      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        {}
      );
      const currentConfig = configs[tSlug];
      if (currentConfig && (currentConfig.status === 'closed' || currentConfig.status === 'completed')) {
        return NextResponse.json(
          {
            success: false,
            error: `Registration for ${currentConfig.name} is currently ${currentConfig.status.toUpperCase()}.`,
          },
          { status: 403 }
        );
      }

      const existingRegistrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      // Check for duplicate registration by email or player name
      const isAlreadyRegistered = existingRegistrations.some(
        (r) =>
          (registration.email && r.email?.toLowerCase() === registration.email.toLowerCase()) ||
          r.name?.trim().toLowerCase() === registration.name?.trim().toLowerCase()
      );

      let updatedRegistrations: TournamentPlayerRegistration[];

      if (isAlreadyRegistered) {
        // Update existing registration details (e.g. updated photo or role)
        updatedRegistrations = existingRegistrations.map((r) =>
          (registration.email && r.email?.toLowerCase() === registration.email.toLowerCase()) ||
          r.name?.trim().toLowerCase() === registration.name?.trim().toLowerCase()
            ? { ...r, ...registration, registeredAt: r.registeredAt || new Date().toISOString() }
            : r
        );
      } else {
        const newEntry: TournamentPlayerRegistration = {
          id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: registration.userId,
          name: registration.name.trim(),
          email: registration.email.trim(),
          phone: registration.phone || '',
          role: registration.role || 'All Rounder',
          battingStyle: registration.battingStyle || 'Right-hand bat',
          bowlingStyle: registration.bowlingStyle || 'Right-arm medium',
          avatarUrl: registration.avatarUrl || null,
          employeeId: registration.employeeId || '',
          registeredAt: new Date().toISOString(),
          isOwner: false,
        };
        updatedRegistrations = [...existingRegistrations, newEntry];
      }

      await setStoreData(
        `tournament_registrations_${tSlug}`,
        updatedRegistrations,
        `registrations_${tSlug}.json`
      );

      // Automatically keep the Live Auction Pool in sync with tournament registrations
      try {
        const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
          tournaments: {},
        });

        const currentTourneyData = allAuction.tournaments?.[tSlug] || {
          teams: [],
          playerPool: [],
          soldTransactions: [],
          unsoldPlayers: [],
        };

        const existingPool: any[] = currentTourneyData.playerPool || [];
        const targetReg = updatedRegistrations.find(
          (r) => r.email.toLowerCase() === registration.email.toLowerCase()
        );
        const isOwner = targetReg?.isOwner || false;

        // If not an assigned franchise owner, auto-add or update in auction player pool
        if (!isOwner) {
          const [rulesContainer, configs] = await Promise.all([
            getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
            getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
          ]);
          const currentRules = rulesContainer?.tournaments?.[tSlug] || {};
          const currentConf = configs?.[tSlug] || {};
          const defaultBase = currentRules.defaultPlayerBasePrice || currentConf.defaultPlayerBasePrice || currentRules.ownerBlockedPrice || currentConf.ownerBasePrice || 100;

          const playerIdx = existingPool.findIndex(
            (p: any) => p.name?.toLowerCase() === registration.name.trim().toLowerCase()
          );

          const playerEntry = {
            id: playerIdx >= 0 ? existingPool[playerIdx].id : `p-reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: registration.name.trim(),
            role: registration.role || 'All Rounder',
            basePrice: registration.basePrice || defaultBase,
            avatarUrl: registration.avatarUrl || null,
            battingStyle: registration.battingStyle || 'Right-hand bat',
            bowlingStyle: registration.bowlingStyle || 'Right-arm medium',
            phone: registration.phone || '',
          };

          if (playerIdx >= 0) {
            existingPool[playerIdx] = { ...existingPool[playerIdx], ...playerEntry };
          } else {
            existingPool.push(playerEntry);
          }

          // Deduplicate pool by name
          const seenPoolNames = new Set<string>();
          const dedupedPool = existingPool.filter((p: any) => {
            const key = p.name?.trim().toLowerCase();
            if (!key || seenPoolNames.has(key)) return false;
            seenPoolNames.add(key);
            return true;
          });

          currentTourneyData.playerPool = dedupedPool;

          // If there is currently no active lot on the auction block, board this first player
          if (!currentTourneyData.currentLot && dedupedPool.length > 0) {
            currentTourneyData.currentLot = {
              ...dedupedPool[0],
              currentBid: dedupedPool[0].basePrice || defaultBase,
              leadingTeam: null,
              history: [],
            };
          }

          currentTourneyData.lastUpdated = new Date().toISOString();

          allAuction.tournaments = {
            ...allAuction.tournaments,
            [tSlug]: currentTourneyData,
          };

          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
        }
      } catch (syncErr) {
        console.error('Auto-sync to auction pool failed during registration:', syncErr);
      }

      return NextResponse.json({
        success: true,
        message: isAlreadyRegistered
          ? 'Registration details updated successfully!'
          : 'Successfully registered for tournament!',
        registrations: updatedRegistrations,
      });
    }

    // 3. ASSIGN FRANCHISE OWNER & CREATE TEAM (Super Admin - Supports 4 to 20 Teams)
    if (action === 'assign_franchise') {
      const { teamName, shortName, ownerEmail, ownerName } = body;
      if (!teamName || !teamName.trim()) {
        return NextResponse.json(
          { success: false, error: 'Franchise team name is required.' },
          { status: 400 }
        );
      }

      const cleanTeamName = teamName.trim();
      const cleanOwnerName = (ownerName || '').trim();
      const cleanOwnerEmail = (
        ownerEmail ||
        (cleanOwnerName ? `${cleanOwnerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cricplus.com` : 'teammanagement@cricplus.com')
      ).trim().toLowerCase();

      // Read current registrations
      const registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      const ownerPlayer = registrations.find(
        (r) =>
          (cleanOwnerEmail && r.email?.toLowerCase() === cleanOwnerEmail) ||
          (cleanOwnerName && r.name?.toLowerCase() === cleanOwnerName.toLowerCase())
      );

      const resolvedOwnerName = cleanOwnerName || ownerPlayer?.name || cleanOwnerEmail.split('@')[0] || 'Franchise Owner';
      const resolvedOwnerEmail = ownerPlayer?.email || cleanOwnerEmail;
      const ownerRole = ownerPlayer?.role || 'All-rounder';
      const ownerPhoto = ownerPlayer?.avatarUrl || (ownerPlayer as any)?.photo || null;

      // Update or add owner in tournament player registrations
      let updatedRegistrations = [...registrations];
      const existingOwnerIdx = updatedRegistrations.findIndex(
        (r) =>
          r.email?.toLowerCase() === resolvedOwnerEmail.toLowerCase() ||
          r.name?.toLowerCase() === resolvedOwnerName.toLowerCase()
      );

      if (existingOwnerIdx >= 0) {
        updatedRegistrations[existingOwnerIdx] = {
          ...updatedRegistrations[existingOwnerIdx],
          isOwner: true,
          franchiseTeam: cleanTeamName,
        };
      } else {
        // Enforce owner registration as Player #1 of the franchise
        updatedRegistrations.push({
          id: `reg-owner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: resolvedOwnerName,
          email: resolvedOwnerEmail,
          phone: '',
          role: ownerRole,
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm medium',
          isOwner: true,
          franchiseTeam: cleanTeamName,
          registeredAt: new Date().toISOString(),
        });
      }

      await setStoreData(
        `tournament_registrations_${tSlug}`,
        updatedRegistrations,
        `registrations_${tSlug}.json`
      );

      // Read current auction data and add/update franchise team with owner
      const [allAuction, rulesContainer, configs] = await Promise.all([
        getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
        getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
        getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
      ]);

      const currentRules = rulesContainer?.tournaments?.[tSlug] || rulesContainer?.[tSlug] || {};
      const currentConfig = configs?.[tSlug] || {};

      const basePurse = Number(currentRules.basePurse || currentConfig.pursePerTeam || 7000);
      const ownerBlockedPrice = Number(
        currentRules.ownerBlockedPrice !== undefined
          ? currentRules.ownerBlockedPrice
          : (currentConfig.ownerBasePrice !== undefined ? currentConfig.ownerBasePrice : 100)
      );
      const maxSquad = Number(currentRules.maxSquadSize || currentConfig.maxSquad || 11);
      const remainingPurse = Math.max(0, basePurse - ownerBlockedPrice);

      const currentTourneyData = allAuction.tournaments?.[tSlug] || {
        teams: [],
        playerPool: [],
        soldTransactions: [],
        unsoldPlayers: [],
        currentLotIndex: 0,
      };

      const existingTeams = currentTourneyData.teams || [];

      // Enforce franchise limit: up to 20 teams supported
      if (existingTeams.length >= 20 && !existingTeams.some((t: any) => t.name?.toLowerCase() === cleanTeamName.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Maximum franchise limit reached (up to 20 teams supported).' },
          { status: 400 }
        );
      }

      // Check duplicate franchise name or short code
      const short = (
        shortName ||
        cleanTeamName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 4) ||
        cleanTeamName.slice(0, 3).toUpperCase()
      ).trim().toUpperCase();

      const duplicateName = existingTeams.find(
        (t: any) => t.name?.toLowerCase() === cleanTeamName.toLowerCase() && t.id !== body.teamId
      );
      if (duplicateName) {
        return NextResponse.json(
          { success: false, error: `A franchise named "${cleanTeamName}" already exists in this tournament.` },
          { status: 400 }
        );
      }

      const teamId = body.teamId || `t-${Date.now()}`;
      const newTeam = {
        id: teamId,
        name: cleanTeamName,
        short,
        owner: resolvedOwnerName,
        ownerEmail: resolvedOwnerEmail,
        allocated: basePurse,
        spent: ownerBlockedPrice,
        remaining: remainingPurse,
        playersBought: 1, // Owner is player #1
        maxSquad,
        captain: `${resolvedOwnerName} (C)`,
        viceCaptain: 'To be assigned',
        players: [
          {
            name: resolvedOwnerName,
            role: `${ownerRole} (Franchise Owner)`,
            price: ownerBlockedPrice,
            avatarUrl: ownerPhoto,
          },
        ],
      };

      const newTeamsList = [...existingTeams.filter((t: any) => t.name?.toLowerCase() !== cleanTeamName.toLowerCase()), newTeam];

      // Also ensure soldTransactions has owner entry
      const existingTx = currentTourneyData.soldTransactions || [];
      const ownerTx = {
        id: `tx-owner-${Date.now()}`,
        player: resolvedOwnerName,
        team: cleanTeamName,
        price: ownerBlockedPrice,
        role: `${ownerRole} (Franchise Owner)`,
        avatarUrl: ownerPhoto,
      };
      const newTxList = [...existingTx.filter((tx: any) => tx.player?.toLowerCase() !== resolvedOwnerName.toLowerCase()), ownerTx];

      // Remove owner from open auction pool (since owner is already assigned to their team)
      currentTourneyData.playerPool = (currentTourneyData.playerPool || []).filter(
        (p: any) => p.name?.toLowerCase() !== resolvedOwnerName.toLowerCase()
      );
      if (currentTourneyData.currentLot?.name?.toLowerCase() === resolvedOwnerName.toLowerCase()) {
        currentTourneyData.currentLot = currentTourneyData.playerPool.length > 0 ? {
          ...currentTourneyData.playerPool[0],
          currentBid: currentTourneyData.playerPool[0].basePrice || 100,
          leadingTeam: null,
          history: [],
        } : null;
      }

      currentTourneyData.teams = newTeamsList;
      currentTourneyData.soldTransactions = newTxList;
      currentTourneyData.lastUpdated = new Date().toISOString();

      if (!allAuction.tournaments) allAuction.tournaments = {};
      allAuction.tournaments[tSlug] = currentTourneyData;

      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
      invalidateStoreCache('auction_data_ddpl');
      invalidateStoreCache(`tournament_registrations_${tSlug}`);
      invalidateStoreCache('tournament_configs');

      return NextResponse.json({
        success: true,
        message: `Franchise "${cleanTeamName}" created successfully! ${resolvedOwnerName} assigned as Owner & Player #1 (₹${ownerBlockedPrice} blocked, ₹${remainingPurse.toLocaleString('en-IN')} remaining purse). Total franchises: ${newTeamsList.length}.`,
        teams: newTeamsList,
      });
    }

    // 3.1 DELETE INDIVIDUAL FRANCHISE (Super Admin)
    if (action === 'delete_franchise') {
      const { teamId, teamName } = body;
      if (!teamId && !teamName) {
        return NextResponse.json({ success: false, error: 'Team ID or Name is required' }, { status: 400 });
      }

      // 1. Update Auction Data
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      const currentTourneyData = allAuction.tournaments?.[tSlug] || { teams: [], soldTransactions: [] };

      const targetTeam = (currentTourneyData.teams || []).find(
        (t: any) => t.id === teamId || (teamName && t.name.toLowerCase() === teamName.toLowerCase())
      );
      const resolvedName = targetTeam?.name || teamName;

      // Remove team
      const updatedTeams = (currentTourneyData.teams || []).filter(
        (t: any) => t.id !== teamId && t.name.toLowerCase() !== (resolvedName || '').toLowerCase()
      );

      // Remove team sold transactions
      const updatedSold = (currentTourneyData.soldTransactions || []).filter(
        (tx: any) => tx.team.toLowerCase() !== (resolvedName || '').toLowerCase()
      );

      // If current lot is leading by this team, reset leading
      if (currentTourneyData.currentLot?.leadingTeam?.toLowerCase() === (resolvedName || '').toLowerCase()) {
        currentTourneyData.currentLot.leadingTeam = null;
        currentTourneyData.currentLot.currentBid = currentTourneyData.currentLot.basePrice;
      }

      currentTourneyData.teams = updatedTeams;
      currentTourneyData.soldTransactions = updatedSold;
      currentTourneyData.lastUpdated = new Date().toISOString();

      if (currentTourneyData.teamBiddingAccess && teamId) {
        delete currentTourneyData.teamBiddingAccess[teamId];
      }

      // Restore freed owner back into auction playerPool if registered
      const freedReg = (await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      )).find(
        (r) =>
          (resolvedName && r.franchiseTeam?.toLowerCase() === resolvedName.toLowerCase()) ||
          (targetTeam?.ownerEmail && r.email.toLowerCase() === targetTeam.ownerEmail.toLowerCase()) ||
          (targetTeam?.owner && r.name.toLowerCase() === targetTeam.owner.toLowerCase())
      );

      if (freedReg) {
        const alreadyInPool = (currentTourneyData.playerPool || []).some(
          (p: any) => p.name?.toLowerCase() === freedReg.name.toLowerCase()
        );
        if (!alreadyInPool) {
          currentTourneyData.playerPool = [
            ...(currentTourneyData.playerPool || []),
            {
              id: `p-reg-${Date.now()}`,
              name: freedReg.name,
              role: freedReg.role || 'All Rounder',
              basePrice: 500,
              avatarUrl: freedReg.avatarUrl || null,
              battingStyle: freedReg.battingStyle || 'Right-hand bat',
              bowlingStyle: freedReg.bowlingStyle || 'Right-arm medium',
              phone: freedReg.phone || '',
            },
          ];
        }
      }

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: currentTourneyData,
      };
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      // 2. Free up owner in registrations
      const registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );
      const updatedRegs = registrations.map((r) => {
        if (
          (resolvedName && r.franchiseTeam?.toLowerCase() === resolvedName.toLowerCase()) ||
          (targetTeam?.ownerEmail && r.email.toLowerCase() === targetTeam.ownerEmail.toLowerCase())
        ) {
          return { ...r, isOwner: false, franchiseTeam: undefined };
        }
        return r;
      });
      await setStoreData(`tournament_registrations_${tSlug}`, updatedRegs, `registrations_${tSlug}.json`);

      // 3. Clean up matches involving this team
      const schedule = await getStoreData<any>(`tournament_schedule_${tSlug}`, `schedule_${tSlug}.json`, { matches: [] });
      if (schedule.matches) {
        schedule.matches = schedule.matches.filter(
          (m: any) =>
            m.teamA?.name?.toLowerCase() !== (resolvedName || '').toLowerCase() &&
            m.teamB?.name?.toLowerCase() !== (resolvedName || '').toLowerCase() &&
            (typeof m.teamA === 'string' ? m.teamA.toLowerCase() !== (resolvedName || '').toLowerCase() : true) &&
            (typeof m.teamB === 'string' ? m.teamB.toLowerCase() !== (resolvedName || '').toLowerCase() : true)
        );
        schedule.lastUpdated = new Date().toISOString();
        await setStoreData(`tournament_schedule_${tSlug}`, schedule, `schedule_${tSlug}.json`);
      }

      invalidateStoreCache('auction_data_ddpl');
      invalidateStoreCache(`tournament_registrations_${tSlug}`);
      invalidateStoreCache(`tournament_schedule_${tSlug}`);
      invalidateStoreCache('tournament_configs');

      return NextResponse.json({
        success: true,
        message: `Franchise "${resolvedName}" deleted successfully. Owner freed to player pool.`,
        teams: updatedTeams,
        registrations: updatedRegs,
      });
    }

    // 3.2 UPDATE FRANCHISE OWNER (Super Admin)
    if (action === 'update_franchise_owner' || action === 'update_owner') {
      const { teamId, teamName, newOwnerName, newOwnerEmail } = body;
      if (!teamId && !teamName) {
        return NextResponse.json({ success: false, error: 'Team ID or Name is required' }, { status: 400 });
      }
      if (!newOwnerName || !newOwnerName.trim()) {
        return NextResponse.json({ success: false, error: 'New owner name is required' }, { status: 400 });
      }

      const cleanOwnerName = newOwnerName.trim();
      const cleanOwnerEmail = (newOwnerEmail || '').trim().toLowerCase();

      // 1. Fetch current auction data, rules, registrations
      const [allAuction, rulesContainer, configs, registrations] = await Promise.all([
        getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
        getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
        getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
        getStoreData<TournamentPlayerRegistration[]>(
          `tournament_registrations_${tSlug}`,
          `registrations_${tSlug}.json`,
          []
        ),
      ]);

      const currentTourneyData = allAuction.tournaments?.[tSlug] || { teams: [], soldTransactions: [] };
      const currentRules = rulesContainer?.tournaments?.[tSlug] || rulesContainer?.[tSlug] || {};
      const currentConf = configs?.[tSlug] || {};
      const ownerBlockedPrice = Number(currentRules.ownerBlockedPrice !== undefined ? currentRules.ownerBlockedPrice : (currentConf.ownerBasePrice || 100));

      const targetTeam = (currentTourneyData.teams || []).find(
        (t: any) => t.id === teamId || (teamName && t.name.toLowerCase() === teamName.toLowerCase())
      );

      if (!targetTeam) {
        return NextResponse.json({ success: false, error: 'Franchise team not found' }, { status: 404 });
      }

      const oldOwnerName = targetTeam.owner;
      const oldOwnerEmail = targetTeam.ownerEmail;

      // Find new owner profile / registration to get avatar and details
      const newOwnerReg = registrations.find(
        (r) =>
          (cleanOwnerEmail && r.email?.toLowerCase() === cleanOwnerEmail) ||
          (cleanOwnerName && r.name?.toLowerCase() === cleanOwnerName.toLowerCase())
      );

      const resolvedOwnerEmail = newOwnerReg?.email || cleanOwnerEmail || (cleanOwnerName ? `${cleanOwnerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@cricplus.com` : 'owner@cricplus.com');
      const resolvedOwnerPhoto = newOwnerReg?.avatarUrl || (newOwnerReg as any)?.photo || null;

      // 2. Update Registrations: Release old owner, assign new owner
      const updatedRegs = registrations.map((r) => {
        if (oldOwnerEmail && r.email?.toLowerCase() === oldOwnerEmail.toLowerCase()) {
          return { ...r, isOwner: false, franchiseTeam: undefined };
        }
        if (oldOwnerName && r.name?.toLowerCase() === oldOwnerName.toLowerCase()) {
          return { ...r, isOwner: false, franchiseTeam: undefined };
        }
        if (resolvedOwnerEmail && r.email?.toLowerCase() === resolvedOwnerEmail.toLowerCase()) {
          return { ...r, isOwner: true, franchiseTeam: targetTeam.name };
        }
        if (cleanOwnerName && r.name?.toLowerCase() === cleanOwnerName.toLowerCase()) {
          return { ...r, isOwner: true, franchiseTeam: targetTeam.name };
        }
        return r;
      });

      // If new owner wasn't in registrations, add them as registered owner player
      if (!newOwnerReg) {
        updatedRegs.push({
          id: `reg-owner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: cleanOwnerName,
          email: resolvedOwnerEmail,
          phone: '',
          role: 'All-rounder (Franchise Owner)',
          battingStyle: 'Right-hand bat',
          bowlingStyle: 'Right-arm medium',
          isOwner: true,
          franchiseTeam: targetTeam.name,
          registeredAt: new Date().toISOString(),
        });
      }

      // 3. Update Auction Team Data
      targetTeam.owner = cleanOwnerName;
      targetTeam.ownerEmail = resolvedOwnerEmail;

      // Update team.players (replace old owner retention player with new owner)
      const nonOwnerPlayers = (targetTeam.players || []).filter(
        (p: any) =>
          !p.role?.includes('Franchise Owner') &&
          (!oldOwnerName || p.name?.toLowerCase().trim() !== oldOwnerName.toLowerCase().trim())
      );

      const newOwnerPlayerItem = {
        name: cleanOwnerName,
        role: 'All-rounder (Franchise Owner)',
        price: ownerBlockedPrice,
        avatarUrl: resolvedOwnerPhoto,
      };

      targetTeam.players = [newOwnerPlayerItem, ...nonOwnerPlayers];
      targetTeam.captain = `${cleanOwnerName} (C)`;

      // Recalculate spent & remaining
      const totalSpent = (targetTeam.players || []).reduce((sum: number, p: any) => sum + (Number(p.price) || 0), 0);
      targetTeam.spent = totalSpent;
      targetTeam.remaining = Math.max(0, Number(targetTeam.allocated || targetTeam.budget || 7000) - totalSpent);
      targetTeam.playersBought = targetTeam.players.length;

      // 4. Update soldTransactions in Auction Data
      const otherTransactions = (currentTourneyData.soldTransactions || []).filter(
        (tx: any) =>
          !(
            tx.team?.toLowerCase() === targetTeam.name.toLowerCase() &&
            (tx.isOwner || tx.role?.includes('Franchise Owner') || (oldOwnerName && tx.player?.toLowerCase() === oldOwnerName.toLowerCase()))
          )
      );

      const newOwnerTx = {
        id: `tx-owner-${targetTeam.id}`,
        player: cleanOwnerName,
        team: targetTeam.name,
        price: ownerBlockedPrice,
        role: 'Franchise Owner',
        isOwner: true,
        basePrice: ownerBlockedPrice,
        avatarUrl: resolvedOwnerPhoto,
      };

      currentTourneyData.soldTransactions = [newOwnerTx, ...otherTransactions];
      currentTourneyData.lastUpdated = new Date().toISOString();

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: currentTourneyData,
      };

      // 5. Update user_roles in Supabase Pro
      try {
        const rolesRow = await getStoreData<Record<string, string>>('user_roles', 'user_roles.json', {});
        rolesRow[resolvedOwnerEmail] = 'organizer';
        await setStoreData('user_roles', rolesRow, 'user_roles.json');
        invalidateStoreCache('user_roles');
      } catch (roleErr) {
        console.warn('Role assignment warning for new owner:', roleErr);
      }

      // Persist registrations and auction data
      await Promise.all([
        setStoreData(`tournament_registrations_${tSlug}`, updatedRegs, `registrations_${tSlug}.json`),
        setStoreData('auction_data_ddpl', allAuction, 'auction_data.json'),
      ]);

      invalidateStoreCache('auction_data_ddpl');
      invalidateStoreCache(`tournament_registrations_${tSlug}`);

      return NextResponse.json({
        success: true,
        message: `Franchise "${targetTeam.name}" owner updated to ${cleanOwnerName} (${resolvedOwnerEmail}) successfully! Synced across Auction, Player Pool, and Permissions.`,
        teams: currentTourneyData.teams,
        registrations: updatedRegs,
      });
    }

    // 3.1 DELETE PLAYER FROM TOURNAMENT (Super Admin / Organizer)
    if (action === 'delete_player' || action === 'remove_player') {
      const { playerId, playerName, email: playerEmail } = body;
      const normName = (playerName || '').trim().toLowerCase();
      const normEmail = (playerEmail || '').trim().toLowerCase();
      const pId = playerId || '';

      const registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        [],
        true
      );

      const updatedRegistrations = registrations.filter((r) => {
        if (pId && r.id === pId) return false;
        if (normEmail && r.email?.toLowerCase() === normEmail) return false;
        if (normName && r.name?.trim().toLowerCase() === normName) return false;
        return true;
      });

      await setStoreData(
        `tournament_registrations_${tSlug}`,
        updatedRegistrations,
        `registrations_${tSlug}.json`
      );
      invalidateStoreCache(`tournament_registrations_${tSlug}`);

      // Also clean up from Auction Data (playerPool, unsoldPlayers, and currentLot if matching)
      try {
        const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }, true);
        if (allAuction.tournaments?.[tSlug]) {
          const tAuction = allAuction.tournaments[tSlug];
          if (Array.isArray(tAuction.playerPool)) {
            tAuction.playerPool = tAuction.playerPool.filter((p: any) => {
              if (pId && p.id === pId) return false;
              if (normName && p.name?.trim().toLowerCase() === normName) return false;
              return true;
            });
          }
          if (Array.isArray(tAuction.unsoldPlayers)) {
            tAuction.unsoldPlayers = tAuction.unsoldPlayers.filter((p: any) => {
              if (pId && p.id === pId) return false;
              if (normName && p.name?.trim().toLowerCase() === normName) return false;
              return true;
            });
          }
          if (tAuction.currentLot && normName && tAuction.currentLot.name?.trim().toLowerCase() === normName) {
            tAuction.currentLot = null;
          }
          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
          invalidateStoreCache('auction_data_ddpl');
        }
      } catch (auctionErr) {
        console.warn('Auction cleanup skipped for deleted player:', auctionErr);
      }

      return NextResponse.json({
        success: true,
        message: `Player "${playerName || playerId}" removed from tournament registrations and auction pool.`,
        registrations: updatedRegistrations,
        count: updatedRegistrations.length,
      });
    }

    // 3.2 RESET ALL TOURNAMENT DATA (Super Admin Clean Slate)
    if (action === 'reset_tournament_data') {
      const { resetRegistrations = false } = body;

      // 1. Wipe Auction Data for this tournament
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: {
          teams: [],
          playerPool: [],
          soldTransactions: [],
          unsoldPlayers: [],
          currentLot: null,
          currentLotIndex: 0,
          auctionStatus: 'live',
          timerSeconds: 120,
          timerRunning: true,
          timerLastReset: new Date().toISOString(),
          biddingAccessEnabled: true,
          teamBiddingAccess: {},
          lastUpdated: new Date().toISOString(),
        },
      };
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      // 2. Wipe Matches & Schedule
      const cleanSchedule = {
        tournament: tSlug,
        startDate: null,
        endDate: null,
        format: 'round-robin-playoffs',
        matches: [],
        lastUpdated: new Date().toISOString(),
      };
      await setStoreData(`tournament_schedule_${tSlug}`, cleanSchedule, `schedule_${tSlug}.json`);

      // 3. Reset Registrations (either clear all or reset isOwner)
      let finalRegistrations: TournamentPlayerRegistration[] = [];
      if (!resetRegistrations) {
        const existingRegs = await getStoreData<TournamentPlayerRegistration[]>(
          `tournament_registrations_${tSlug}`,
          `registrations_${tSlug}.json`,
          []
        );
        finalRegistrations = existingRegs.map((r) => ({
          ...r,
          isOwner: false,
          franchiseTeam: undefined,
        }));
      }
      await setStoreData(`tournament_registrations_${tSlug}`, finalRegistrations, `registrations_${tSlug}.json`);

      return NextResponse.json({
        success: true,
        message: `Tournament ${tSlug.toUpperCase()} data has been completely wiped and reset to a clean slate!`,
        teams: [],
        matches: [],
        registrations: finalRegistrations,
      });
    }

    // 4. SYNC REGISTERED PLAYERS TO LIVE AUCTION POOL
    if (action === 'sync_to_auction') {
      let registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      // If registrations empty for 'ddpl' or 'ddpl-3-0', cross-check alternative slug
      if ((!Array.isArray(registrations) || registrations.length === 0) && (tSlug === 'ddpl' || tSlug === 'ddpl-3-0')) {
        const altSlug = tSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
        const altRegs = await getStoreData<TournamentPlayerRegistration[]>(
          `tournament_registrations_${altSlug}`,
          `registrations_${altSlug}.json`,
          []
        );
        if (Array.isArray(altRegs) && altRegs.length > 0) {
          registrations = altRegs;
        }
      }

      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
        tournaments: {},
      });

      const currentTourneyData = allAuction.tournaments?.[tSlug] || 
        ((tSlug === 'ddpl' || tSlug === 'ddpl-3-0') ? allAuction.tournaments?.[tSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl'] : null) || {
        teams: [],
        playerPool: [],
        soldTransactions: [],
        unsoldPlayers: [],
      };

      // Filter out franchise owners (they are already retained in their teams)
      const nonOwners = (registrations || []).filter((r) => !r.isOwner);

      // Deduplicate non-owners by name to prevent duplicate player cards in the auction pool
      const seenRegNames = new Set<string>();
      const uniqueNonOwners = nonOwners.filter((r) => {
        const norm = r.name?.trim().toLowerCase();
        if (!norm || seenRegNames.has(norm)) return false;
        seenRegNames.add(norm);
        return true;
      });

      // Get default base price from tournament rules or configs
      const [allRulesContainer, allConfigs] = await Promise.all([
        getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
        getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
      ]);
      const currentRules = allRulesContainer?.tournaments?.[tSlug] || allRulesContainer?.tournaments?.['ddpl'] || {};
      const currentConf = allConfigs?.[tSlug] || allConfigs?.['ddpl'] || {};
      const defaultBase = currentRules.defaultPlayerBasePrice || currentConf.defaultPlayerBasePrice || currentRules.ownerBlockedPrice || currentConf.ownerBasePrice || 100;

      const newPool = uniqueNonOwners.map((r, idx) => ({
        id: `p-reg-${idx + 1}`,
        name: r.name.trim(),
        role: r.role || 'All-rounder',
        basePrice: r.basePrice || defaultBase,
        avatarUrl: r.avatarUrl,
        battingStyle: r.battingStyle,
        bowlingStyle: r.bowlingStyle,
        phone: r.phone,
      }));

      currentTourneyData.playerPool = newPool;
      if (newPool.length > 0 && !currentTourneyData.currentLot) {
        currentTourneyData.currentLot = {
          ...newPool[0],
          currentBid: newPool[0].basePrice || defaultBase,
          leadingTeam: null,
          history: [],
        };
      }

      currentTourneyData.lastUpdated = new Date().toISOString();

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: currentTourneyData,
      };

      // If 'ddpl' or 'ddpl-3-0', mirror into both tournament keys so live bidding is 100% synchronized
      if (tSlug === 'ddpl' || tSlug === 'ddpl-3-0') {
        const mirrorKey = tSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
        allAuction.tournaments[mirrorKey] = {
          ...currentTourneyData,
        };
      }

      invalidateStoreCache('auction_data_ddpl');
      invalidateStoreCache(`tournament_registrations_${tSlug}`);
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      return NextResponse.json({
        success: true,
        message: `Synced ${newPool.length} registered players into ${tSlug.toUpperCase()} auction pool!`,
        count: newPool.length,
      });
    }

    // 4B. COMPLETE RESET OF AUCTION TO FRESH CLEAN SLATE
    if (action === 'reset_auction') {
      let registrations = await getStoreData<TournamentPlayerRegistration[]>(
        `tournament_registrations_${tSlug}`,
        `registrations_${tSlug}.json`,
        []
      );

      if ((!Array.isArray(registrations) || registrations.length === 0) && (tSlug === 'ddpl' || tSlug === 'ddpl-3-0')) {
        const altSlug = tSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
        const altRegs = await getStoreData<TournamentPlayerRegistration[]>(
          `tournament_registrations_${altSlug}`,
          `registrations_${altSlug}.json`,
          []
        );
        if (Array.isArray(altRegs) && altRegs.length > 0) {
          registrations = altRegs;
        }
      }

      // Load rules and configs to get target purse & squad limit
      const [allRulesContainer, allConfigs] = await Promise.all([
        getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
        getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
      ]);
      const currentRules = allRulesContainer?.tournaments?.[tSlug] || allRulesContainer?.tournaments?.['ddpl'] || {};
      const currentConf = allConfigs?.[tSlug] || allConfigs?.['ddpl'] || {};
      const targetPurse = currentRules.basePurse || currentConf.pursePerTeam || 7000;
      const targetOwnerPrice = currentRules.ownerBlockedPrice !== undefined ? currentRules.ownerBlockedPrice : (currentConf.ownerBasePrice || 100);
      const targetBasePrice = currentRules.defaultPlayerBasePrice || currentConf.defaultPlayerBasePrice || 100;
      const targetSquadCap = currentRules.maxSquadSize || currentConf.maxSquad || 8;

      // Define standard DDPL 3.0 franchises & owners (matching actual Supabase auth registrations)
      const franchiseConfigs = [
        { name: 'FALCON', short: 'FA', owner: 'Md Sagir Hossain', email: 'mdsagirhossain560@gmail.com', group: 'Group A' },
        { name: 'MATRIX', short: 'MA', owner: 'Hiranmoy Saha', email: 'hiranmoy.saha@teoco.com', group: 'Group B' },
        { name: 'QUANTUM', short: 'QA', owner: 'Ajaz Md Ghalib', email: 'ajaz.mg@gmail.com', group: 'Group A' },
        { name: 'APEX', short: 'AP', owner: 'Sudipto Chowdhury', email: 'sudiptochowdhury721@gmail.com', group: 'Group B' },
        { name: 'NOVA', short: 'NO', owner: 'Surojit Das', email: 'surojit.das@teoco.com', group: 'Group A' },
        { name: 'NEBULA', short: 'NE', owner: 'Gour Singha', email: 'goursingha21@gmail.com', group: 'Group B' },
      ];

      // Build photo lookup from registrations
      const photoLookup = new Map<string, string>();
      for (const r of registrations || []) {
        const photo = r.avatarUrl || (r as any).photo;
        if (r.name && photo) {
          photoLookup.set(r.name.trim().toLowerCase(), photo);
        }
      }

      // Reconstruct 6 clean teams (each with only the retained owner)
      const freshTeams = franchiseConfigs.map((fc) => {
        const ownerPhoto = photoLookup.get(fc.owner.toLowerCase()) || null;
        return {
          id: `t-${fc.name.toLowerCase()}`,
          name: fc.name,
          short: fc.short,
          owner: fc.owner,
          ownerEmail: fc.email,
          allocated: targetPurse,
          spent: targetOwnerPrice,
          remaining: targetPurse - targetOwnerPrice,
          playersBought: 1,
          maxSquad: targetSquadCap,
          captain: `${fc.owner} (C)`,
          viceCaptain: 'To be assigned',
          group: fc.group,
          players: [
            {
              name: fc.owner,
              role: 'All-rounder (Franchise Owner)',
              price: targetOwnerPrice,
              avatarUrl: ownerPhoto,
            },
          ],
        };
      });

      // Exactly 6 owner retention transactions
      const freshSoldTransactions = freshTeams.map((t, idx) => ({
        id: `tx-owner-${idx + 1}`,
        player: t.owner,
        team: t.name,
        price: targetOwnerPrice,
        role: 'Franchise Owner',
        avatarUrl: t.players[0].avatarUrl,
      }));

      // Filter out franchise owners to get the pure pool
      const ownerNames = new Set(franchiseConfigs.map(fc => fc.owner.toLowerCase()));
      const nonOwners = (registrations || []).filter((r) => {
        const norm = (r.name || '').trim().toLowerCase();
        return !r.isOwner && !ownerNames.has(norm);
      });

      // Deduplicate non-owners
      const seenRegNames = new Set<string>();
      const freshPool = nonOwners
        .filter((r) => {
          const norm = r.name?.trim().toLowerCase();
          if (!norm || seenRegNames.has(norm)) return false;
          seenRegNames.add(norm);
          return true;
        })
        .map((r, idx) => ({
          id: `p-${idx + 1}`,
          name: r.name.trim(),
          role: r.role || 'All-rounder',
          basePrice: r.basePrice || targetBasePrice,
          avatarUrl: r.avatarUrl || photoLookup.get(r.name.trim().toLowerCase()) || null,
          battingStyle: r.battingStyle || null,
          bowlingStyle: r.bowlingStyle || null,
          phone: r.phone || null,
        }));

      const freshLot = freshPool.length > 0 ? {
        id: freshPool[0].id,
        name: freshPool[0].name,
        role: freshPool[0].role,
        avatarUrl: freshPool[0].avatarUrl,
        basePrice: freshPool[0].basePrice || targetBasePrice,
        currentBid: freshPool[0].basePrice || targetBasePrice,
        leadingTeam: null,
        history: [],
      } : null;

      const cleanAuctionState = {
        teams: freshTeams,
        soldTransactions: freshSoldTransactions,
        playerPool: freshPool,
        unsoldPlayers: [],
        currentLotIndex: 0,
        lastUpdated: new Date().toISOString(),
        auctionStatus: 'stopped',
        biddingAccessEnabled: false,
        teamBiddingAccess: {},
        timerSeconds: 120,
        timerRunning: false,
        timerLastReset: new Date().toISOString(),
        autoBoardingEnabled: true,
        currentLot: freshLot,
      };

      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', {
        tournaments: {},
      });

      allAuction.tournaments = {
        ...allAuction.tournaments,
        [tSlug]: cleanAuctionState,
      };

      if (tSlug === 'ddpl' || tSlug === 'ddpl-3-0') {
        const mirrorKey = tSlug === 'ddpl' ? 'ddpl-3-0' : 'ddpl';
        allAuction.tournaments[mirrorKey] = { ...cleanAuctionState };
      }

      invalidateStoreCache('auction_data_ddpl');
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      return NextResponse.json({
        success: true,
        message: `Auction reset to clean slate! 6 franchises restored, ${freshPool.length} registered players loaded into auction pool!`,
        data: cleanAuctionState,
        count: freshPool.length,
      });
    }

    // 5. CREATE CUSTOM TOURNAMENT (Super Admin & Global Tournament Organizers)
    if (action === 'create_tournament') {
      const { 
        name, 
        slug: rawSlug, 
        shortName, 
        fullName, 
        tagline, 
        season = '2027', 
        format = 'ddpl', 
        overs = 10,
        maxBowlerOvers,
        ballsPerOver = 6,
        pitchType,
        formatTitle,
        pursePerTeam = 10000,
        ownerBasePrice = 100,
        defaultPlayerBasePrice = 100,
        maxSquad = 11,
        minSquad = 7,
        logo,
        bannerColor,
        status = 'open',
        startDate = null,
        endDate = null,
        organizationName,
        organizationSlug: rawOrgSlug,
        country = 'India',
        currency = 'INR',
        currencySymbol = '₹',
        creatorEmail = '',
        creatorName = '',
        adminPassword = '',
        adminPin = '',
        isPublic = true,
      } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Tournament name is required' }, { status: 400 });
      }

      const generatedSlug = (rawSlug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!generatedSlug) {
        return NextResponse.json({ success: false, error: 'Invalid tournament slug' }, { status: 400 });
      }

      // Fast parallel fetch of all required initial store states in a single batch (< 1s)
      const [
        configs,
        adminAccounts,
        orgs,
        roles,
        allAuction,
        rulesContainer,
      ] = await Promise.all([
        getStoreData<Record<string, TournamentConfig>>('tournament_configs', 'tournament_configs.json', {}),
        getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {}),
        getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {}),
        getStoreData<Record<string, string>>('user_roles', 'roles.json', {}),
        getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
        getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
      ]);

      const resolvedShort = (shortName || name.split(' ').map((w: string) => w[0]).join('').slice(0, 4)).toUpperCase();
      const tournamentType = body.tournamentType === 'direct_groups' ? 'direct_groups' : 'auction_league';
      const rawGroupsCount = Number(body.groupsCount) || (Array.isArray(body.groupNames) ? body.groupNames.length : 2);
      const groupsCount = Math.min(Math.max(rawGroupsCount, 1), 8);
      const groupNames: string[] = Array.isArray(body.groupNames) && body.groupNames.length > 0
        ? body.groupNames
        : Array.from({ length: groupsCount }, (_, i) => `Group ${String.fromCharCode(65 + i)}`);

      const resolvedFormat = tournamentType === 'direct_groups'
        ? (groupsCount > 1 ? 'group-stage-playoffs' : 'round-robin-playoffs')
        : (format === 'group-stage-playoffs' || format === 'dual_groups' || groupsCount > 1 ? 'group-stage-playoffs' : (format === 'game-of-run' ? 'game-of-run' : 'ddpl'));
      const resolvedOvers = Number(overs) || (resolvedFormat === 'game-of-run' ? 12 : 10);
      const resolvedBanner = bannerColor || (resolvedFormat === 'game-of-run' ? 'from-amber-950 via-orange-950 to-cricket-dark' : 'from-blue-900 via-indigo-950 to-cricket-dark');
      const resolvedLogo = logo || '/images/default-tournament.svg';

      const resolvedOrgName = (organizationName || `${name.trim()} League Org`).trim();
      const finalOrgSlug = (rawOrgSlug || resolvedOrgName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'global-leagues';

      let resolvedAdminPassword = adminPassword?.trim() || undefined;
      let resolvedAdminPin = adminPin?.trim() || undefined;

      if (creatorEmail) {
        const existingAcc = adminAccounts[creatorEmail.toLowerCase()];
        if (existingAcc) {
          if (!resolvedAdminPassword && existingAcc.password) {
            resolvedAdminPassword = existingAcc.password;
          }
          if (!resolvedAdminPin && existingAcc.pin) {
            resolvedAdminPin = existingAcc.pin;
          }
        }
      }

      const newTournamentConfig: TournamentConfig = {
        slug: generatedSlug,
        name: name.trim(),
        shortName: resolvedShort,
        fullName: fullName?.trim() || `${name.trim()} Championship`,
        tagline: tagline?.trim() || `Official ${name.trim()} Corporate Cricket Tournament`,
        season: String(season),
        totalSeasons: 1,
        overs: resolvedOvers,
        format: resolvedFormat,
        tournamentType,
        groupsCount,
        groupNames,
        bannerColor: resolvedBanner,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/20 animate-pulse',
        logo: resolvedLogo,
        status: status || 'open',
        pursePerTeam: Number(pursePerTeam) || 10000,
        ownerBasePrice: Number(ownerBasePrice) || 100,
        defaultPlayerBasePrice: Number(defaultPlayerBasePrice) || Number(ownerBasePrice) || 100,
        maxSquad: Number(maxSquad) || 11,
        minSquad: Number(minSquad) || 7,
        startDate: startDate || null,
        endDate: endDate || null,
        createdAt: new Date().toISOString(),
        organizationSlug: finalOrgSlug,
        organizationName: resolvedOrgName,
        country: country?.trim() || 'Global',
        currency: currency?.trim() || 'INR',
        currencySymbol: currencySymbol?.trim() || '₹',
        creatorEmail: creatorEmail?.trim() || undefined,
        creatorName: creatorName?.trim() || undefined,
        adminPassword: resolvedAdminPassword,
        adminPin: resolvedAdminPin,
        isPublic: Boolean(isPublic),
        maxBowlerOvers: Number(maxBowlerOvers) || Math.max(1, Math.ceil(resolvedOvers / 5)),
        ballsPerOver: Number(ballsPerOver) || 6,
        pitchType: pitchType || undefined,
        formatTitle: formatTitle || undefined,
      };

      configs[generatedSlug] = newTournamentConfig;

      // Prepare organization record
      const currentOrg = orgs[finalOrgSlug] || {
        id: `org-${Date.now()}`,
        slug: finalOrgSlug,
        name: resolvedOrgName,
        country: country?.trim() || 'Global',
        currency: currency?.trim() || 'INR',
        currencySymbol: currencySymbol?.trim() || '₹',
        adminEmails: [],
        tournaments: [],
        createdAt: new Date().toISOString(),
        isVerified: false,
      };

      if (creatorEmail && !currentOrg.adminEmails?.includes(creatorEmail.toLowerCase())) {
        currentOrg.adminEmails = [...(currentOrg.adminEmails || []), creatorEmail.toLowerCase()];
      }
      if (!currentOrg.tournaments?.includes(generatedSlug)) {
        currentOrg.tournaments = [...(currentOrg.tournaments || []), generatedSlug];
      }
      orgs[finalOrgSlug] = currentOrg;

      // Prepare Super Admin roles & credentials
      if (creatorEmail) {
        roles[creatorEmail.toLowerCase()] = 'super_admin';

        const prevAccount = adminAccounts[creatorEmail.toLowerCase()] || {};
        const resolvedAdminName = creatorName?.trim() || (prevAccount.name && !prevAccount.name.includes('Super Admin') ? prevAccount.name : '') || (creatorEmail ? creatorEmail.split('@')[0] : 'Organizer');
        adminAccounts[creatorEmail.toLowerCase()] = {
          ...prevAccount,
          email: creatorEmail.toLowerCase(),
          name: resolvedAdminName,
          role: 'super_admin',
          password: resolvedAdminPassword || prevAccount.password,
          pin: resolvedAdminPin || prevAccount.pin,
          tournamentSlug: generatedSlug,
          tournamentName: name.trim(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Prepare Auction & Teams state
      if (!allAuction.tournaments) allAuction.tournaments = {};

      let initialTeams: any[] = [];
      if (Array.isArray(body.directTeams) && body.directTeams.length > 0) {
        initialTeams = body.directTeams.map((t: any, idx: number) => {
          const short = (t.short || t.shortName || t.name.slice(0, 3)).toUpperCase();
          const group = t.group || groupNames[idx % groupNames.length];
          const captain = t.captain || '';
          const players = Array.isArray(t.players) && t.players.length > 0
            ? t.players
            : (captain ? [{ name: captain, role: 'Captain / All Rounder' }] : []);

          return {
            id: `t-${Date.now()}-${idx + 1}`,
            name: t.name,
            short,
            group,
            captain,
            owner: captain || `${t.name} Captain`,
            players,
            allocated: Number(newTournamentConfig.pursePerTeam) || 10000,
            spent: 0,
            remaining: Number(newTournamentConfig.pursePerTeam) || 10000,
            playersBought: players.length,
            maxSquad: newTournamentConfig.maxSquad,
          };
        });
      }

      if (!allAuction.tournaments[generatedSlug] || initialTeams.length > 0) {
        allAuction.tournaments[generatedSlug] = {
          teams: initialTeams,
          playerPool: [],
          soldTransactions: [],
          unsoldPlayers: [],
          currentLotIndex: 0,
          lastUpdated: new Date().toISOString(),
          auctionStatus: tournamentType === 'direct_groups' ? 'completed' : 'live',
          biddingAccessEnabled: tournamentType !== 'direct_groups',
          teamBiddingAccess: {},
          timerSeconds: 120,
          timerRunning: false,
          timerLastReset: new Date().toISOString(),
          autoBoardingEnabled: tournamentType !== 'direct_groups',
          currentLot: null,
        };
      }

      // Prepare Tournament Rules
      const rules = {
        basePurse: newTournamentConfig.pursePerTeam || 10000,
        ownerBlockedPrice: newTournamentConfig.ownerBasePrice || 100,
        defaultPlayerBasePrice: Number(defaultPlayerBasePrice) || Number(newTournamentConfig.defaultPlayerBasePrice) || Number(newTournamentConfig.ownerBasePrice) || 100,
        maxSquadSize: newTournamentConfig.maxSquad || 11,
        minSquadSize: newTournamentConfig.minSquad || 7,
        matchOvers: newTournamentConfig.overs,
        maxBowlerOvers: newTournamentConfig.maxBowlerOvers || Math.max(1, Math.ceil(newTournamentConfig.overs! / 5)),
        ballsPerOver: newTournamentConfig.ballsPerOver || 6,
        wideBallPenalty: '+1 Run & Extra Ball',
        noBallPenalty: '+1 Run + Free Hit',
        pointsPerWin: 2,
        knockoutFormat: groupsCount > 1 || resolvedFormat === 'group-stage-playoffs' ? 'group_stage_knockout' : 'ipl_playoffs',
        pathwayTitle: groupsCount > 1 || resolvedFormat === 'group-stage-playoffs'
          ? 'Knockout Pathway: Multi-Group Stage ➔ Semi-Finals ➔ Grand Final'
          : 'Knockout Pathway: League Stage ➔ Playoffs ➔ Grand Final',
        pathwayBadge: groupsCount > 1 || resolvedFormat === 'group-stage-playoffs' ? 'Multi-Group League' : 'Official League Structure',
        bidSteps: [50, 100, 200, 500],
      };

      // Prepare Tournament Schedule
      let initialMatches: any[] = [];
      if (initialTeams.length >= 2) {
        initialMatches = generateMultiGroupFixtures(initialTeams, groupNames, resolvedOvers, generatedSlug);
      }

      const schedule = {
        tournament: generatedSlug,
        startDate: newTournamentConfig.startDate,
        endDate: newTournamentConfig.endDate,
        format: groupsCount > 1 || resolvedFormat === 'game-of-run' ? 'group-stage-playoffs' : 'round-robin-playoffs',
        matches: initialMatches,
        lastUpdated: new Date().toISOString(),
      };

      // Update global tournament_rules container so rules are immediately synced everywhere
      if (!rulesContainer.tournaments) rulesContainer.tournaments = {};
      rulesContainer.tournaments[generatedSlug] = rules;

      // FAST PARALLEL WRITE: Persist all tournament stores simultaneously (< 1.5s total)
      await Promise.all([
        setStoreData('tournament_configs', configs, 'tournament_configs.json'),
        setStoreData('tournament_rules', rulesContainer, 'rules.json'),
        setStoreData('auction_data_ddpl', allAuction, 'auction_data.json'),
        setStoreData(`tournament_rules_${generatedSlug}`, rules, `rules_${generatedSlug}.json`),
        setStoreData(`tournament_schedule_${generatedSlug}`, schedule, `schedule_${generatedSlug}.json`),
        setStoreData('corporate_organizations', orgs, 'organizations.json'),
        creatorEmail ? setStoreData('user_roles', roles, 'roles.json') : Promise.resolve(),
        creatorEmail ? setStoreData('super_admin_accounts', adminAccounts, 'super_admin_accounts.json') : Promise.resolve(),
      ]);

      // Invalidate memory cache across all stores
      invalidateStoreCache('tournament_configs');
      invalidateStoreCache('tournament_rules');
      invalidateStoreCache(`tournament_rules_${generatedSlug}`);
      invalidateStoreCache('auction_data_ddpl');

      // Non-blocking background Supabase Auth user & profile provisioning
      if (creatorEmail) {
        (async () => {
          try {
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zucpetuipfdufwvrcgcl.supabase.co';
            const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_OTwkrFMSeuzq_QbWS6htWQ_FicJF8Tf';
            const { createClient } = await import('@supabase/supabase-js');
            const authClient = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

            const adminDisplayName = creatorName?.trim() || (creatorEmail ? creatorEmail.split('@')[0] : 'Organizer');
            const targetPass = adminPassword || process.env.SUPERADMIN_PASSWORD || `P@ss-${Date.now()}`;

            // Ensure the tournament host is provisioned directly in Supabase Authentication (auth.users)
            const { data: signUpRes } = await authClient.auth.signUp({
              email: creatorEmail.toLowerCase().trim(),
              password: targetPass,
              options: {
                data: {
                  full_name: adminDisplayName,
                  role: 'super_admin',
                },
              },
            });

            const uid = signUpRes?.user?.id;

            if (uid) {
              await authClient.from('profiles').upsert({
                id: uid,
                email: creatorEmail.toLowerCase().trim(),
                full_name: adminDisplayName,
                system_role: 'super_admin',
                primary_role: 'All-rounder',
                updated_at: new Date().toISOString(),
              });
            }
          } catch (authErr) {
            console.warn('Background auto-provision Supabase Auth user skipped:', authErr);
          }
        })().catch(() => {});
      }

      const response = NextResponse.json({
        success: true,
        message: `Tournament "${newTournamentConfig.name}" created successfully!`,
        tournament: newTournamentConfig,
        allConfigs: configs,
        tournamentsList: Object.values(configs),
      });

      if (creatorEmail) {
        const token = `active_session:${Buffer.from(creatorEmail.toLowerCase().trim()).toString('base64')}`;
        response.cookies.set('cricplus_superadmin', token, {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        });
        response.cookies.set('cricpluse_superadmin', token, {
          path: '/',
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        });
      }

      return response;
    }

    // 6. DELETE TOURNAMENT (Super Admin - Any created or previous tournament)
    if (action === 'delete_tournament') {
      const targetSlug = (body.slug || tSlug).toLowerCase();

      const configs = await getStoreData<Record<string, TournamentConfig>>(
        'tournament_configs',
        'tournament_configs.json',
        {}
      );

      const deletedTournamentName = configs[targetSlug]?.name || targetSlug;
      delete configs[targetSlug];
      await setStoreData('tournament_configs', configs, 'tournament_configs.json');

      // 1. Clean up Auction Data for this tournament
      try {
        const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
        if (allAuction?.tournaments?.[targetSlug]) {
          delete allAuction.tournaments[targetSlug];
          await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
        }
      } catch (e) {
        console.warn('Auction cleanup skipped for deleted tournament:', e);
      }

      // 2. Clean up Rules container & schedule
      try {
        const rulesContainer = await getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} });
        if (rulesContainer?.tournaments?.[targetSlug]) {
          delete rulesContainer.tournaments[targetSlug];
          await setStoreData('tournament_rules', rulesContainer, 'rules.json');
        }
      } catch (e) {
        console.warn('Tournament rules container cleanup skipped:', e);
      }

      // 2.1 Direct hard delete of all tournament keys from Supabase store
      try {
        const { supabaseAdmin } = await import('@/lib/supabase/store');
        await supabaseAdmin
          .from('cricpluse_store')
          .delete()
          .in('key', [
            `tournament_rules_${targetSlug}`,
            `tournament_schedule_${targetSlug}`,
            `tournament_registrations_${targetSlug}`,
          ]);
      } catch (e) {
        console.warn('Direct cricpluse_store rows deletion skipped:', e);
      }

      // 3. Clean up Schedule & Registrations fallbacks
      try {
        await setStoreData(`tournament_schedule_${targetSlug}`, { tournament: targetSlug, matches: [] }, `schedule_${targetSlug}.json`);
        await setStoreData(`tournament_registrations_${targetSlug}`, [], `registrations_${targetSlug}.json`);
        await setStoreData(`tournament_rules_${targetSlug}`, null, `rules_${targetSlug}.json`);
      } catch (e) {
        console.warn('Schedule & registrations file cleanup skipped:', e);
      }

      // 3.1 Clean up from corporate_organizations
      try {
        const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
        let modified = false;
        Object.keys(orgs).forEach((oSlug) => {
          if (orgs[oSlug].tournaments?.includes(targetSlug)) {
            orgs[oSlug].tournaments = orgs[oSlug].tournaments.filter((t: string) => t !== targetSlug);
            modified = true;
          }
        });
        if (modified) {
          await setStoreData('corporate_organizations', orgs, 'organizations.json');
        }
      } catch (e) {
        console.warn('Organization tournament reference cleanup skipped:', e);
      }

      // 3.2 Clean up Announcements for this deleted tournament
      try {
        const tournamentMap = await getStoreData<Record<string, any>>('tournament_announcements', 'tournament_announcements.json', {});
        if (tournamentMap[targetSlug]) {
          delete tournamentMap[targetSlug];
          await setStoreData('tournament_announcements', tournamentMap, 'tournament_announcements.json');
        }

        const feed = await getStoreData<any[]>('live_announcements_feed', 'announcements_feed.json', []);
        const filteredFeed = feed.filter((a) => a.tournamentSlug?.toLowerCase() !== targetSlug);
        await setStoreData('live_announcements_feed', filteredFeed, 'announcements_feed.json');

        const primary = await getStoreData<any>('live_announcement', 'announcement.json', null);
        if (primary && primary.tournamentSlug?.toLowerCase() === targetSlug) {
          const nextPrimary = filteredFeed.find((a) => a.isActive && a.message?.trim()) || null;
          await setStoreData('live_announcement', nextPrimary, 'announcement.json');
        }
      } catch (e) {
        console.warn('Announcement cleanup skipped for deleted tournament:', e);
      }

      // 3.3 Clean up Super Admin account pointers
      try {
        const adminAccounts = await getStoreData<Record<string, any>>('super_admin_accounts', 'super_admin_accounts.json', {});
        let modifiedAccounts = false;
        Object.keys(adminAccounts).forEach((email) => {
          if (adminAccounts[email]?.tournamentSlug?.toLowerCase() === targetSlug) {
            delete adminAccounts[email].tournamentSlug;
            delete adminAccounts[email].tournamentName;
            modifiedAccounts = true;
          }
        });
        if (modifiedAccounts) {
          await setStoreData('super_admin_accounts', adminAccounts, 'super_admin_accounts.json');
        }
      } catch (e) {
        console.warn('Super admin accounts cleanup skipped:', e);
      }

      // 4. Invalidate server cache so all consumers see the deletion immediately
      invalidateStoreCache();

      const response = NextResponse.json({
        success: true,
        message: `Tournament "${deletedTournamentName}" deleted successfully.`,
        deletedSlug: targetSlug,
        allConfigs: configs,
        tournamentsList: Object.values(configs),
      });

      return response;
    }

    // 7. WIPE ALL TOURNAMENTS & CLEAN SLATE
    if (action === 'wipe_all_tournaments') {
      await setStoreData('tournament_configs', {}, 'tournament_configs.json');

      try {
        const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
        Object.keys(orgs).forEach((oSlug) => {
          orgs[oSlug].tournaments = [];
        });
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      } catch (e) {
        console.warn('Orgs cleanup skipped:', e);
      }

      try {
        await setStoreData('auction_data_ddpl', { tournaments: {} }, 'auction_data.json');
      } catch (e) {
        console.warn('Auction wipe skipped:', e);
      }

      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: 'All test tournaments and data have been wiped clean. Ready for clean testing!',
        allConfigs: {},
        tournamentsList: [],
      });
    }

    // 8. ADD DIRECT TEAM (For Direct Groups & Non-Auction Tournaments)
    if (action === 'add_direct_team') {
      const { teamName, shortName, group, captain, players } = body;
      if (!teamName || !teamName.trim()) {
        return NextResponse.json({ success: false, error: 'Team name is required' }, { status: 400 });
      }

      const [allAuction, rulesContainer, configs] = await Promise.all([
        getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} }),
        getStoreData<any>('tournament_rules', 'rules.json', { tournaments: {} }),
        getStoreData<Record<string, any>>('tournament_configs', 'tournament_configs.json', {}),
      ]);
      if (!allAuction.tournaments) allAuction.tournaments = {};
      const currentTourneyData = allAuction.tournaments[tSlug] || { teams: [] };
      const existingTeams = currentTourneyData.teams || [];

      const currentRules = rulesContainer?.tournaments?.[tSlug] || rulesContainer?.[tSlug] || {};
      const currentConfig = configs?.[tSlug] || {};
      const directPurse = Number(currentRules.basePurse || currentConfig.pursePerTeam || 10000);

      const teamId = `t-${Date.now()}`;
      const short = (shortName || teamName.split(' ').map((w: string) => w[0]).join('').slice(0, 3)).toUpperCase();
      const resolvedGroup = group || 'Group A';
      const resolvedCaptain = captain?.trim() || '';
      const resolvedPlayers = Array.isArray(players) && players.length > 0
        ? players
        : (resolvedCaptain ? [{ name: resolvedCaptain, role: 'Captain / All Rounder' }] : []);

      const newTeam = {
        id: teamId,
        name: teamName.trim(),
        short,
        group: resolvedGroup,
        captain: resolvedCaptain,
        owner: resolvedCaptain || `${teamName.trim()} Captain`,
        players: resolvedPlayers,
        allocated: directPurse,
        spent: 0,
        remaining: directPurse,
        playersBought: resolvedPlayers.length,
        maxSquad: Number(currentRules.maxSquadSize || currentConfig.maxSquad || 15),
      };

      const updatedTeams = [...existingTeams.filter((t: any) => t.name.toLowerCase() !== teamName.trim().toLowerCase()), newTeam];
      currentTourneyData.teams = updatedTeams;
      currentTourneyData.lastUpdated = new Date().toISOString();
      allAuction.tournaments[tSlug] = currentTourneyData;
      await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');

      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: `Team "${teamName}" added successfully to ${resolvedGroup}!`,
        team: newTeam,
        teams: updatedTeams,
      });
    }

    // 9. AUTO GENERATE SCHEDULE FIXTURES (For Direct Multi-Group League)
    if (action === 'auto_generate_schedule') {
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      const currentTourneyData = allAuction.tournaments?.[tSlug] || { teams: [] };
      const teams = currentTourneyData.teams || [];

      if (teams.length < 2) {
        return NextResponse.json({ success: false, error: 'At least 2 teams are required to generate schedule fixtures.' }, { status: 400 });
      }

      const configs = await getStoreData<Record<string, TournamentConfig>>('tournament_configs', 'tournament_configs.json', {});
      const currentConfig = configs[tSlug];
      const overs = currentConfig?.overs || 10;
      const groupNames = currentConfig?.groupNames || ['Group A', 'Group B'];

      const matches = generateMultiGroupFixtures(teams, groupNames, overs, tSlug);
      const schedule = {
        tournament: tSlug,
        startDate: currentConfig?.startDate || null,
        endDate: currentConfig?.endDate || null,
        format: groupNames.length > 1 ? 'group-stage-playoffs' : 'round-robin-playoffs',
        matches,
        lastUpdated: new Date().toISOString(),
      };
      await setStoreData(`tournament_schedule_${tSlug}`, schedule, `schedule_${tSlug}.json`);

      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: `Generated ${matches.length} fixtures across ${groupNames.length} groups!`,
        schedule,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API tournament/register] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/tournaments/register?slug=ddpl OR ?wipeAll=true
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get('slug')?.toLowerCase();
    const wipeAll = url.searchParams.get('wipeAll') === 'true';

    if (!slug && !wipeAll) {
      try {
        const body = await req.json();
        slug = body.slug?.toLowerCase();
      } catch {}
    }

    if (wipeAll) {
      await setStoreData('tournament_configs', {}, 'tournament_configs.json');

      try {
        const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
        Object.keys(orgs).forEach((oSlug) => {
          orgs[oSlug].tournaments = [];
        });
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      } catch (e) {}

      try {
        await setStoreData('auction_data_ddpl', { tournaments: {} }, 'auction_data.json');
      } catch (e) {}

      invalidateStoreCache();

      return NextResponse.json({
        success: true,
        message: 'All test tournaments have been wiped clean.',
        tournamentsList: [],
      });
    }

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Tournament slug is required' }, { status: 400 });
    }

    const configs = await getStoreData<Record<string, TournamentConfig>>(
      'tournament_configs',
      'tournament_configs.json',
      {}
    );

    const deletedTournamentName = configs[slug]?.name || slug;
    delete configs[slug];
    await setStoreData('tournament_configs', configs, 'tournament_configs.json');

    try {
      const allAuction = await getStoreData<any>('auction_data_ddpl', 'auction_data.json', { tournaments: {} });
      if (allAuction?.tournaments?.[slug]) {
        delete allAuction.tournaments[slug];
        await setStoreData('auction_data_ddpl', allAuction, 'auction_data.json');
      }
    } catch (e) {}

    try {
      await setStoreData(`tournament_schedule_${slug}`, { tournament: slug, matches: [] }, `schedule_${slug}.json`);
    } catch (e) {}

    try {
      await setStoreData(`tournament_registrations_${slug}`, [], `registrations_${slug}.json`);
    } catch (e) {}

    try {
      const orgs = await getStoreData<Record<string, any>>('corporate_organizations', 'organizations.json', {});
      let modified = false;
      Object.keys(orgs).forEach((oSlug) => {
        if (orgs[oSlug].tournaments?.includes(slug)) {
          orgs[oSlug].tournaments = orgs[oSlug].tournaments.filter((t: string) => t !== slug);
          modified = true;
        }
      });
      if (modified) {
        await setStoreData('corporate_organizations', orgs, 'organizations.json');
      }
    } catch (e) {}

    invalidateStoreCache();

    return NextResponse.json({
      success: true,
      message: `Tournament "${deletedTournamentName}" deleted successfully.`,
      deletedSlug: slug,
      tournamentsList: Object.values(configs),
    });
  } catch (err: any) {
    console.error('[API DELETE tournament/register] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
