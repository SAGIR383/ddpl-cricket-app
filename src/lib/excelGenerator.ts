import * as XLSX from 'xlsx';
import { TournamentDossierData } from './pdfGenerator';

/**
 * Generates and downloads a multi-sheet corporate tournament Excel workbook (.xlsx)
 */
export function generateTournamentExcelReport(data: TournamentDossierData) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Tournament Summary
  const summaryRows = [
    ['CRICPLUS TOURNAMENT OFFICIAL DOSSIER'],
    ['Generated', new Date().toLocaleString()],
    [''],
    ['Tournament Name', data.tournament.name],
    ['Tournament Slug', data.tournament.slug],
    ['Governing Organization', data.tournament.organizationName || 'Corporate League Foundation'],
    ['Season', data.tournament.season || '2026-2027'],
    ['Format', data.tournament.format || 'Round-Robin + Playoffs'],
    ['Match Overs', data.tournament.overs || 10],
    ['Base Team Purse', data.tournament.basePurse || 10000],
    ['Total Franchises', data.teams?.length || data.standings?.length || 0],
    ['Total Matches Scheduled', data.matches?.length || 0],
    ['Total Players Drafted', data.soldTransactions?.length || 0],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Overview');

  // 2. Sheet: Points Table & Standings
  const standingsRows: any[] = [
    ['Rank', 'Franchise / Team', 'Played', 'Won', 'Lost', 'Tied', 'Points', 'NRR', 'Runs For', 'Overs For', 'Runs Against', 'Overs Against', 'Form'],
  ];
  (data.standings || []).forEach((st, idx) => {
    standingsRows.push([
      st.rank || idx + 1,
      st.name,
      st.played || 0,
      st.won || 0,
      st.lost || 0,
      st.tied || 0,
      st.points || 0,
      st.nrrStr || st.nrr || '0.000',
      st.runsFor || 0,
      st.oversFor || 0,
      st.runsAgainst || 0,
      st.oversAgainst || 0,
      (st.form || []).join('-'),
    ]);
  });
  const standingsWs = XLSX.utils.aoa_to_sheet(standingsRows);
  XLSX.utils.book_append_sheet(wb, standingsWs, 'Points Table');

  // 3. Sheet: Franchise Auction Ledger
  const auctionLedgerRows: any[] = [
    ['Team Name', 'Team Owner', 'Total Purse', 'Budget Spent', 'Budget Remaining', 'Squad Size'],
  ];
  (data.teams || []).forEach((t) => {
    auctionLedgerRows.push([
      t.name,
      t.owner || 'Corporate Sponsor',
      t.budgetAllocated || data.tournament.basePurse || 10000,
      t.budgetSpent || 0,
      t.budgetLeft || 10000,
      t.squadSize || t.players?.length || 0,
    ]);
  });
  const auctionWs = XLSX.utils.aoa_to_sheet(auctionLedgerRows);
  XLSX.utils.book_append_sheet(wb, auctionWs, 'Auction Ledger');

  // 4. Sheet: Detailed Player Rosters
  const rosterRows: any[] = [
    ['Player Name', 'Team Name', 'Role', 'Acquisition Price (Points)'],
  ];
  (data.soldTransactions || []).forEach((tx) => {
    rosterRows.push([
      tx.player?.name || tx.playerName || 'Player',
      tx.team || 'Unassigned',
      tx.player?.role || tx.role || 'All-rounder',
      tx.amount || tx.price || 0,
    ]);
  });
  const rosterWs = XLSX.utils.aoa_to_sheet(rosterRows);
  XLSX.utils.book_append_sheet(wb, rosterWs, 'Player Roster');

  // 5. Sheet: Match Fixtures & Results
  const matchRows: any[] = [
    ['Match #', 'Stage', 'Title', 'Team A', 'Team B', 'Venue', 'Date & Time', 'Status', 'Match Result / Winner'],
  ];
  (data.matches || []).forEach((m) => {
    matchRows.push([
      m.matchNumber || m.id,
      m.stage || 'League',
      m.title || '',
      m.teamA?.name || 'Team A',
      m.teamB?.name || 'Team B',
      m.venue || 'Corporate Sports Complex',
      `${m.matchDate || ''} ${m.matchTime || ''}`,
      m.status || 'upcoming',
      m.summary || m.result || '',
    ]);
  });
  const matchWs = XLSX.utils.aoa_to_sheet(matchRows);
  XLSX.utils.book_append_sheet(wb, matchWs, 'Matches & Results');

  // 6. Sheet: Top Batters (Orange Cap)
  if (data.orangeCap && data.orangeCap.length > 0) {
    const batRows: any[] = [
      ['Rank', 'Player Name', 'Team', 'Runs', 'Innings', 'Balls', 'Strike Rate', 'Highest Score', '4s', '6s'],
    ];
    data.orangeCap.forEach((b, i) => {
      batRows.push([
        b.rank || i + 1,
        b.name,
        b.team,
        b.runs,
        b.innings,
        b.balls,
        b.strikeRate,
        b.highestScore,
        b.fours,
        b.sixes,
      ]);
    });
    const batWs = XLSX.utils.aoa_to_sheet(batRows);
    XLSX.utils.book_append_sheet(wb, batWs, 'Top Batters');
  }

  // 7. Sheet: Top Bowlers (Purple Cap)
  if (data.purpleCap && data.purpleCap.length > 0) {
    const bowlRows: any[] = [
      ['Rank', 'Player Name', 'Team', 'Wickets', 'Innings', 'Overs', 'Runs Conceded', 'Economy', 'Maidens', 'Best Bowling'],
    ];
    data.purpleCap.forEach((bw, i) => {
      bowlRows.push([
        bw.rank || i + 1,
        bw.name,
        bw.team,
        bw.wickets,
        bw.innings,
        bw.oversStr,
        bw.runsConceded,
        bw.economy,
        bw.maidens,
        bw.bestBowling,
      ]);
    });
    const bowlWs = XLSX.utils.aoa_to_sheet(bowlRows);
    XLSX.utils.book_append_sheet(wb, bowlWs, 'Top Bowlers');
  }

  const cleanSlug = (data.tournament.slug || 'tournament').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Report_${cleanSlug}_Official.xlsx`);
}
