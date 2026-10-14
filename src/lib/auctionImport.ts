import * as XLSX from 'xlsx';

export interface ParsedFranchise {
  id: string;
  name: string;
  short: string;
  owner: string;
  captain?: string;
  viceCaptain?: string;
  allocated: number;
  spent: number;
  playersBought: number;
  maxSquad: number;
}

export interface ParsedPlayer {
  id: string;
  name: string;
  role: string;
  basePrice: number;
}

export interface AuctionImportRules {
  basePurse: number;
  ownerBlockedPrice: number;
  defaultPlayerBasePrice: number;
  maxSquadSize: number;
}

export function parseAuctionWorkbook(
  arrayBuffer: ArrayBuffer,
  rules: AuctionImportRules = {
    basePurse: 10000,
    ownerBlockedPrice: 500,
    defaultPlayerBasePrice: 500,
    maxSquadSize: 11,
  }
) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = wb.SheetNames;

  let rawPlayerRows: any[] = [];
  let rawFranchiseRows: any[] = [];

  // Check if multiple sheets or single sheet
  if (sheetNames.length > 1) {
    const playerSheetName = sheetNames.find((s) => /player/i.test(s)) || sheetNames[0];
    const franchiseSheetName = sheetNames.find((s) => /fran|owner|team/i.test(s)) || sheetNames[1];

    rawPlayerRows = XLSX.utils.sheet_to_json(wb.Sheets[playerSheetName] || {}) || [];
    rawFranchiseRows = XLSX.utils.sheet_to_json(wb.Sheets[franchiseSheetName] || {}) || [];
  } else {
    // Single sheet with columns for both players and franchise/owners
    const sheet = wb.Sheets[sheetNames[0]];
    const allRows = XLSX.utils.sheet_to_json<any>(sheet) || [];
    rawPlayerRows = allRows;
    rawFranchiseRows = allRows;
  }

  // 1. Extract Franchises
  const franchiseMap = new Map<string, { name: string; owner: string }>();

  rawFranchiseRows.forEach((row) => {
    // Look for franchise column
    const teamNameRaw =
      row['4 Franchise'] ||
      row['Franchise'] ||
      row['Franchise Name'] ||
      row['Franshise'] ||
      row['Team'] ||
      row['Team Name'];

    // Look for owner column
    const ownerNameRaw =
      row['Franshise owner name'] ||
      row['Franchise Owner'] ||
      row['Franchise Owner Name'] ||
      row['Owner'] ||
      row['Owner Name'];

    if (teamNameRaw && typeof teamNameRaw === 'string') {
      const cleanTeam = teamNameRaw.trim();
      // Ignore explanatory notes/rules rows (check for explicit rule statements, not team names like 'Teoco Rulers')
      const lower = cleanTeam.toLowerCase();
      if (
        lower.includes('itself a player') ||
        lower.includes('base point') ||
        lower.includes('rule set') ||
        lower.includes('rules:') ||
        lower.includes('rules :') ||
        lower.includes('deducting') ||
        lower.includes('remaining base')
      ) {
        return;
      }

      const cleanOwner = typeof ownerNameRaw === 'string' && ownerNameRaw.trim().length > 0
        ? ownerNameRaw.trim()
        : 'Team Owner';

      if (!franchiseMap.has(cleanTeam.toLowerCase())) {
        franchiseMap.set(cleanTeam.toLowerCase(), {
          name: cleanTeam,
          owner: cleanOwner,
        });
      }
    }
  });

  const parsedTeams: ParsedFranchise[] = [];
  const ownerTransactions: any[] = [];
  const ownerNamesSet = new Set<string>();

  let tIndex = 1;
  franchiseMap.forEach(({ name, owner }) => {
    // Create Short code (e.g. Teoco Knight Riders -> TKR)
    const words = name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
    const shortCode = words.length > 1
      ? words.map((w) => w[0].toUpperCase()).join('').substring(0, 4)
      : name.substring(0, 3).toUpperCase();

    ownerNamesSet.add(owner.toLowerCase());

    parsedTeams.push({
      id: `t-${tIndex}`,
      name,
      short: shortCode,
      owner,
      captain: owner,
      viceCaptain: 'To be assigned',
      allocated: rules.basePurse,
      spent: rules.ownerBlockedPrice, // Blocked 500 for owner
      playersBought: 1, // Franchise owner is player #1
      maxSquad: rules.maxSquadSize,
    });

    ownerTransactions.push({
      id: `tx-owner-${tIndex}`,
      player: owner,
      team: name,
      price: rules.ownerBlockedPrice,
      role: 'Player (Franchise Owner)',
    });

    tIndex++;
  });

  // 2. Extract Players
  const playerMap = new Map<string, { name: string; role: string; basePrice: number }>();

  rawPlayerRows.forEach((row) => {
    const playerNameRaw =
      row['Players name'] ||
      row['Player Name'] ||
      row['Player'] ||
      row['Name'];

    const roleRaw =
      row['Role'] ||
      row['Playing Role'] ||
      row['Category'] ||
      'All Rounder';

    const basePriceRaw =
      row['base price'] ||
      row['Base Price'] ||
      row['Base price'] ||
      row['Price'];

    if (playerNameRaw && typeof playerNameRaw === 'string') {
      const cleanPlayer = playerNameRaw.trim();
      // Ignore header repetitions or notes
      if (
        cleanPlayer.toLowerCase().includes('player') &&
        cleanPlayer.toLowerCase().includes('name')
      ) {
        return;
      }

      const numPrice = Number(basePriceRaw);
      const finalPrice = !isNaN(numPrice) && numPrice > 0 ? numPrice : rules.defaultPlayerBasePrice;

      if (!playerMap.has(cleanPlayer.toLowerCase())) {
        playerMap.set(cleanPlayer.toLowerCase(), {
          name: cleanPlayer,
          role: typeof roleRaw === 'string' ? roleRaw.trim() : 'All Rounder',
          basePrice: finalPrice,
        });
      }
    }
  });

  // 3. Separate Auction Queue (exclude retained franchise owners)
  const parsedPlayerPool: ParsedPlayer[] = [];
  let pIndex = 1;

  playerMap.forEach((p) => {
    // Check if this player is a franchise owner who is already retained
    const isOwner = ownerNamesSet.has(p.name.toLowerCase());
    if (isOwner) {
      // Update role in owner transaction if found
      const matchingTx = ownerTransactions.find(
        (tx) => tx.player.toLowerCase() === p.name.toLowerCase()
      );
      if (matchingTx) {
        matchingTx.role = `${p.role} (Franchise Owner)`;
      }
    } else {
      parsedPlayerPool.push({
        id: `p-${pIndex}`,
        name: p.name,
        role: p.role,
        basePrice: p.basePrice,
      });
      pIndex++;
    }
  });

  return {
    teams: parsedTeams,
    playerPool: parsedPlayerPool,
    soldTransactions: ownerTransactions,
    totalPlayersFound: playerMap.size,
    totalFranchisesFound: parsedTeams.length,
  };
}
