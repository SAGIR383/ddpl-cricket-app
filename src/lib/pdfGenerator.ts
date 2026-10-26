import jsPDF from 'jspdf';
import { MatchLiveState, InningsData } from '@/types/match.types';
import { TeamStandingRow, OrangeCapBatter, PurpleCapBowler, MvpPlayer } from '@/lib/tournamentAnalytics';

export interface CertificateOptions {
  recipientName: string;
  type: 'participation' | 'winner' | 'runner_up' | 'mvp' | 'orange_cap' | 'purple_cap';
  tournamentName: string;
  organizationName?: string;
  teamName?: string;
  awardTitle?: string;
  signatoryName?: string;
  signatoryRole?: string;
  issueDate?: string;
}

export interface TournamentDossierData {
  tournament: {
    slug: string;
    name: string;
    organizationName?: string;
    season?: string;
    format?: string;
    overs?: number;
    basePurse?: number;
  };
  standings?: TeamStandingRow[];
  teams?: any[];
  soldTransactions?: any[];
  matches?: any[];
  orangeCap?: OrangeCapBatter[];
  purpleCap?: PurpleCapBowler[];
  mvpList?: MvpPlayer[];
}

/**
 * Helper to draw a styled dark header box
 */
function drawHeaderBanner(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(8, 17, 31); // #08111F
  doc.rect(0, 0, 210, 32, 'F');

  // Gold accent line
  doc.setFillColor(216, 173, 85); // #D8AD55
  doc.rect(0, 32, 210, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(242, 214, 154); // #F2D69A
  doc.text(title.toUpperCase(), 105, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(194, 203, 216); // #C2CBD8
  doc.text(subtitle, 105, 24, { align: 'center' });
}

/**
 * 1. OFFICIAL MATCH SCORECARD PDF GENERATOR
 */
export function generateMatchScorecardPDF(match: MatchLiveState | any, tournamentName = 'Corporate League') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const title = tournamentName || 'CricPlus Enterprise League';
  const subtitle = `${match.title || 'Official Match Fixture'} • Venue: ${match.venue || 'Corporate Sports Complex'} • Date: ${match.matchDate || new Date().toLocaleDateString()}`;

  drawHeaderBanner(doc, title, subtitle);

  let y = 42;

  // Result Banner
  doc.setFillColor(13, 27, 42); // #0D1B2A
  doc.roundedRect(12, y, 186, 16, 2, 2, 'F');
  doc.setDrawColor(216, 173, 85);
  doc.setLineWidth(0.5);
  doc.roundedRect(12, y, 186, 16, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(216, 173, 85);
  const resultText = match.summary || match.result || 'Match Completed — Official Scorecard Verified';
  doc.text(resultText, 105, y + 7, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(194, 203, 216);
  const pom = match.playerOfTheMatch ? `Player of the Match: ${match.playerOfTheMatch}` : 'Verified by Official Scorer & Match Referee';
  doc.text(pom, 105, y + 12, { align: 'center' });

  y += 24;

  const renderInnings = (inn: InningsData | undefined, teamName: string, label: string) => {
    if (!inn) return;

    // Innings Header Bar
    doc.setFillColor(17, 29, 45);
    doc.rect(12, y, 186, 7.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(242, 214, 154);
    const oversStr = `${Math.floor((inn.legalBalls || 0) / 6)}.${(inn.legalBalls || 0) % 6}`;
    const runRate = (inn.legalBalls || 0) > 0 ? (((inn.totalRuns || 0) * 6) / inn.legalBalls).toFixed(2) : '0.00';
    const innScore = `${teamName} — ${inn.totalRuns || 0}/${inn.wickets || 0} (${oversStr} Ov)`;
    doc.text(`${label}: ${innScore}`, 15, y + 5.2);

    y += 10;

    // Batting Table Header
    doc.setFillColor(240, 243, 246);
    doc.rect(12, y, 186, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 60, 70);
    doc.text('BATTER', 15, y + 3.5);
    doc.text('DISMISSAL', 65, y + 3.5);
    doc.text('R', 135, y + 3.5, { align: 'right' });
    doc.text('B', 148, y + 3.5, { align: 'right' });
    doc.text('4s', 160, y + 3.5, { align: 'right' });
    doc.text('6s', 172, y + 3.5, { align: 'right' });
    doc.text('SR', 190, y + 3.5, { align: 'right' });

    y += 6;

    // Batters Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 35, 45);

    const batters = inn.batters || [];
    batters.slice(0, 11).forEach((b) => {
      doc.text(b.name, 15, y + 3);
      doc.text(b.dismissal || (b.isOut ? 'out' : 'not out'), 65, y + 3);
      doc.text(String(b.runs || 0), 135, y + 3, { align: 'right' });
      doc.text(String(b.balls || 0), 148, y + 3, { align: 'right' });
      doc.text(String(b.fours || 0), 160, y + 3, { align: 'right' });
      doc.text(String(b.sixes || 0), 172, y + 3, { align: 'right' });
      doc.text(String((b.strikeRate || 0).toFixed(1)), 190, y + 3, { align: 'right' });
      doc.setDrawColor(230, 230, 230);
      doc.line(12, y + 4.5, 198, y + 4.5);
      y += 5.2;
    });

    // Extras & Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Extras: ${inn.extras?.total || 0} (w ${inn.extras?.wide || 0}, nb ${inn.extras?.noBall || 0}, b ${inn.extras?.bye || 0}, lb ${inn.extras?.legBye || 0})`, 15, y + 2.5);
    doc.text(`TOTAL: ${inn.totalRuns || 0}/${inn.wickets || 0} in ${oversStr} Overs (RR: ${runRate})`, 190, y + 2.5, { align: 'right' });
    y += 6.5;

    // Bowling Table Header
    doc.setFillColor(240, 243, 246);
    doc.rect(12, y, 186, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 60, 70);
    doc.text('BOWLER', 15, y + 3.5);
    doc.text('O', 120, y + 3.5, { align: 'right' });
    doc.text('M', 135, y + 3.5, { align: 'right' });
    doc.text('R', 150, y + 3.5, { align: 'right' });
    doc.text('W', 165, y + 3.5, { align: 'right' });
    doc.text('ECON', 190, y + 3.5, { align: 'right' });
    y += 6;

    // Bowlers Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 35, 45);

    const bowlers = inn.bowlers || [];
    bowlers.slice(0, 6).forEach((bw) => {
      doc.text(bw.name, 15, y + 3);
      doc.text(bw.oversStr || '0.0', 120, y + 3, { align: 'right' });
      doc.text(String(bw.maidens || 0), 135, y + 3, { align: 'right' });
      doc.text(String(bw.runsConceded || 0), 150, y + 3, { align: 'right' });
      doc.text(String(bw.wickets || 0), 165, y + 3, { align: 'right' });
      doc.text(String((bw.economy || 0).toFixed(2)), 190, y + 3, { align: 'right' });
      doc.setDrawColor(230, 230, 230);
      doc.line(12, y + 4.5, 198, y + 4.5);
      y += 5.2;
    });

    y += 5;
  };

  // Render 1st Innings
  renderInnings(match.innings1, match.teamA?.name || 'Innings 1', '1ST INNINGS');

  // Check page overflow for 2nd innings
  if (y > 200) {
    doc.addPage();
    drawHeaderBanner(doc, title, subtitle);
    y = 42;
  }

  // Render 2nd Innings
  renderInnings(match.innings2, match.teamB?.name || 'Innings 2', '2ND INNINGS');

  // Official Footer Verification
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(8, 17, 31);
  doc.rect(0, pageHeight - 16, 210, 16, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(194, 203, 216);
  doc.text('Verified by CricPlus Enterprise Scorer System • Digitally Signed & Archived', 105, pageHeight - 9, { align: 'center' });
  doc.text(`Official Match Document ID: ${match.id || 'M-MATCH'} • Generated ${new Date().toLocaleString()}`, 105, pageHeight - 5, { align: 'center' });

  // Save the PDF
  const cleanId = (match.id || 'match-scorecard').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Scorecard_${cleanId}.pdf`);
}

/**
 * 2. 1-CLICK OFFICIAL CERTIFICATE GENERATOR (A4 LANDSCAPE)
 */
export function generateCertificatePDF(options: CertificateOptions) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth(); // 297mm
  const height = doc.internal.pageSize.getHeight(); // 210mm

  // Dark Royal Luxury Background
  doc.setFillColor(8, 17, 31); // #08111F
  doc.rect(0, 0, width, height, 'F');

  // Multi-tier Golden Borders
  doc.setDrawColor(216, 173, 85); // Gold
  doc.setLineWidth(1.8);
  doc.rect(10, 10, width - 20, height - 20, 'S');

  doc.setDrawColor(242, 214, 154); // Light Gold inner thin border
  doc.setLineWidth(0.6);
  doc.rect(13, 13, width - 26, height - 26, 'S');

  // Corner Ornaments (Golden Blocks)
  const drawCorner = (x: number, y: number) => {
    doc.setFillColor(216, 173, 85);
    doc.rect(x - 2, y - 2, 4, 4, 'F');
  };
  drawCorner(10, 10);
  drawCorner(width - 10, 10);
  drawCorner(10, height - 10);
  drawCorner(width - 10, height - 10);

  // Platform Crest & Brand Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(216, 173, 85);
  doc.text('CRICPLUS ENTERPRISE SPORTS', width / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(194, 203, 216);
  doc.text(options.organizationName || 'Corporate Cricket League Governance', width / 2, 34, { align: 'center' });

  // Main Certificate Title
  let mainTitle = 'CERTIFICATE OF PARTICIPATION';
  let badgeColor = [216, 173, 85];

  switch (options.type) {
    case 'winner':
      mainTitle = 'CHAMPIONSHIP VICTORY CERTIFICATE';
      badgeColor = [255, 215, 0];
      break;
    case 'runner_up':
      mainTitle = 'RUNNER-UP EXCELLENCE AWARD';
      badgeColor = [192, 192, 192];
      break;
    case 'mvp':
      mainTitle = 'MOST VALUABLE PLAYER (MVP) AWARD';
      badgeColor = [216, 173, 85];
      break;
    case 'orange_cap':
      mainTitle = 'ORANGE CAP • LEADING RUN SCORER';
      badgeColor = [255, 140, 0];
      break;
    case 'purple_cap':
      mainTitle = 'PURPLE CAP • LEADING WICKET TAKER';
      badgeColor = [147, 51, 234];
      break;
    default:
      mainTitle = 'CERTIFICATE OF PARTICIPATION';
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.text(mainTitle, width / 2, 50, { align: 'center' });

  // Divider Line
  doc.setDrawColor(216, 173, 85);
  doc.setLineWidth(0.8);
  doc.line(width / 2 - 60, 56, width / 2 + 60, 56);

  // Presentation Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(194, 203, 216);
  doc.text('THIS CERTIFICATE IS PROUDLY CONFERRED UPON', width / 2, 68, { align: 'center' });

  // Recipient Name in Big Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(242, 214, 154);
  doc.text(options.recipientName.toUpperCase(), width / 2, 85, { align: 'center' });

  // Underline beneath name
  doc.setDrawColor(242, 214, 154);
  doc.setLineWidth(0.5);
  const nameWidth = doc.getTextWidth(options.recipientName.toUpperCase());
  doc.line(width / 2 - nameWidth / 2 - 5, 89, width / 2 + nameWidth / 2 + 5, 89);

  // Commendation Citation Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(230, 235, 245);

  const teamPart = options.teamName ? ` representing franchise "${options.teamName}"` : '';
  const tourneyPart = options.tournamentName || 'the Corporate Tournament';

  let citation = `For outstanding athletic commitment, exemplary sportsmanship, and exceptional contribution${teamPart} during ${tourneyPart}.`;

  if (options.type === 'winner') {
    citation = `For leading franchise "${options.teamName || 'Champions'}" to glorious victory and securing the Grand Championship Trophy in ${tourneyPart}.`;
  } else if (options.type === 'mvp') {
    citation = `For delivering exceptional all-round match-winning performances and being honored as the premier tournament MVP in ${tourneyPart}.`;
  }

  const splitCitation = doc.splitTextToSize(citation, 220);
  doc.text(splitCitation, width / 2, 104, { align: 'center', lineHeightFactor: 1.4 });

  // Tournament Badge Box
  doc.setFillColor(13, 27, 42);
  doc.roundedRect(width / 2 - 50, 126, 100, 14, 2, 2, 'F');
  doc.setDrawColor(216, 173, 85);
  doc.setLineWidth(0.5);
  doc.roundedRect(width / 2 - 50, 126, 100, 14, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(216, 173, 85);
  doc.text(options.tournamentName.toUpperCase(), width / 2, 133, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(194, 203, 216);
  doc.text(`Official Edition • Verified Record`, width / 2, 137.5, { align: 'center' });

  // Signature Block
  const sigY = 166;

  // Left: Tournament Director / Organizer
  doc.setDrawColor(216, 173, 85);
  doc.setLineWidth(0.5);
  doc.line(40, sigY, 105, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(242, 214, 154);
  doc.text(options.signatoryName || 'Tournament Governing Council', 72.5, sigY + 5.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 170, 185);
  doc.text(options.signatoryRole || 'Head of Sports & League Director', 72.5, sigY + 10, { align: 'center' });

  // Middle: Official Golden Seal
  doc.setFillColor(216, 173, 85);
  doc.circle(width / 2, sigY + 2, 11, 'F');
  doc.setFillColor(8, 17, 31);
  doc.circle(width / 2, sigY + 2, 9.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(216, 173, 85);
  doc.text('OFFICIAL', width / 2, sigY + 0.5, { align: 'center' });
  doc.text('SEAL', width / 2, sigY + 4.5, { align: 'center' });

  // Right: Date & Verification
  doc.setDrawColor(216, 173, 85);
  doc.line(width - 105, sigY, width - 40, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(242, 214, 154);
  doc.text(options.issueDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), width - 72.5, sigY + 5.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 170, 185);
  doc.text('Date of Conferral & Validation', width - 72.5, sigY + 10, { align: 'center' });

  // Footer Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(130, 140, 155);
  doc.text(`Digital Verification Hash: CP-CERT-${Date.now().toString(36).toUpperCase()} • Authenticated via CricPlus Platform`, width / 2, height - 13, { align: 'center' });

  const cleanName = options.recipientName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Certificate_${cleanName}_${options.type}.pdf`);
}

/**
 * 3. EXECUTIVE TOURNAMENT DOSSIER (PDF)
 */
export function generateExecutiveTournamentDossierPDF(data: TournamentDossierData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const tourneyName = data.tournament.name || 'Corporate Tournament';
  const orgName = data.tournament.organizationName || 'Corporate League Foundation';

  // PAGE 1: EXECUTIVE COVER & SUMMARY
  doc.setFillColor(8, 17, 31);
  doc.rect(0, 0, 210, 297, 'F');

  // Golden Frame
  doc.setDrawColor(216, 173, 85);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, 190, 277, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(216, 173, 85);
  doc.text('CRICPLUS EXECUTIVE REPORT', 105, 30, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(242, 214, 154);
  const titleLines = doc.splitTextToSize(tourneyName.toUpperCase(), 160);
  doc.text(titleLines, 105, 55, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(194, 203, 216);
  doc.text(`Official Season Dossier • ${data.tournament.season || '2026-2027'}`, 105, 75, { align: 'center' });
  doc.text(`Governed by ${orgName}`, 105, 82, { align: 'center' });

  // Key Statistics Grid (Boxed)
  let y = 105;
  const drawStatBox = (x: number, y: number, label: string, val: string) => {
    doc.setFillColor(13, 27, 42);
    doc.roundedRect(x, y, 42, 24, 2, 2, 'F');
    doc.setDrawColor(216, 173, 85);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, 42, 24, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(242, 214, 154);
    doc.text(val, x + 21, y + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(194, 203, 216);
    doc.text(label.toUpperCase(), x + 21, y + 18, { align: 'center' });
  };

  const teamsCount = data.teams?.length || data.standings?.length || 0;
  const matchesCount = data.matches?.length || 0;
  const playersCount = data.soldTransactions?.length || 0;
  const oversPerMatch = String(data.tournament.overs || 10);

  drawStatBox(18, y, 'Franchises', String(teamsCount));
  drawStatBox(64, y, 'Matches', String(matchesCount));
  drawStatBox(110, y, 'Squad Players', String(playersCount));
  drawStatBox(156, y, 'Overs / Inn', `${oversPerMatch} Ov`);

  y += 40;

  // Executive Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(216, 173, 85);
  doc.text('EXECUTIVE TOURNAMENT OVERVIEW', 20, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(210, 215, 225);
  const overviewText = `This document provides the verified administrative summary, official league table standings, player auction ledger, and individual award honors for the ${tourneyName}. All data has been computed and authenticated through the CricPlus digital match and live auction engine.`;
  const splitOverview = doc.splitTextToSize(overviewText, 170);
  doc.text(splitOverview, 20, y, { lineHeightFactor: 1.4 });

  // Cover Page Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 170, 185);
  doc.text(`Generated on ${new Date().toLocaleDateString()} • CricPlus Sports Platform`, 105, 275, { align: 'center' });

  // PAGE 2: STANDINGS & POINTS TABLE
  doc.addPage();
  drawHeaderBanner(doc, tourneyName, 'Official Points Table & League Standings');

  y = 44;
  doc.setFillColor(240, 243, 246);
  doc.rect(12, y, 186, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 50, 60);

  doc.text('POS', 16, y + 4.8);
  doc.text('FRANCHISE / TEAM', 32, y + 4.8);
  doc.text('P', 105, y + 4.8, { align: 'right' });
  doc.text('W', 118, y + 4.8, { align: 'right' });
  doc.text('L', 131, y + 4.8, { align: 'right' });
  doc.text('T', 144, y + 4.8, { align: 'right' });
  doc.text('PTS', 160, y + 4.8, { align: 'right' });
  doc.text('NRR', 190, y + 4.8, { align: 'right' });

  y += 8;

  const standings = data.standings || [];
  standings.forEach((st, idx) => {
    doc.setFont('helvetica', idx < 4 ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(20, 25, 35);

    doc.text(String(st.rank || idx + 1), 16, y + 4);
    doc.text(st.name, 32, y + 4);
    doc.text(String(st.played || 0), 105, y + 4, { align: 'right' });
    doc.text(String(st.won || 0), 118, y + 4, { align: 'right' });
    doc.text(String(st.lost || 0), 131, y + 4, { align: 'right' });
    doc.text(String(st.tied || 0), 144, y + 4, { align: 'right' });
    doc.text(String(st.points || 0), 160, y + 4, { align: 'right' });
    doc.text(st.nrrStr || (st.nrr >= 0 ? `+${st.nrr.toFixed(3)}` : st.nrr.toFixed(3)), 190, y + 4, { align: 'right' });

    doc.setDrawColor(220, 225, 230);
    doc.line(12, y + 6, 198, y + 6);
    y += 7.5;
  });

  // PAGE 3: AUCTION FINANCIAL LEDGER
  doc.addPage();
  drawHeaderBanner(doc, tourneyName, 'Official Franchise Auction Ledger & Spending');

  y = 44;
  doc.setFillColor(240, 243, 246);
  doc.rect(12, y, 186, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 50, 60);

  doc.text('FRANCHISE', 16, y + 4.8);
  doc.text('OWNER', 70, y + 4.8);
  doc.text('PURSE', 120, y + 4.8, { align: 'right' });
  doc.text('SPENT', 145, y + 4.8, { align: 'right' });
  doc.text('BALANCE', 170, y + 4.8, { align: 'right' });
  doc.text('SQUAD', 190, y + 4.8, { align: 'right' });

  y += 8;

  const teams = data.teams || [];
  teams.forEach((t) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(20, 25, 35);

    doc.text(t.name, 16, y + 4);
    doc.text(t.owner || 'Franchise Group', 70, y + 4);
    doc.text(String(t.budgetAllocated || data.tournament.basePurse || '10,000'), 120, y + 4, { align: 'right' });
    doc.text(String(t.budgetSpent || '0'), 145, y + 4, { align: 'right' });
    doc.text(String(t.budgetLeft || '10,000'), 170, y + 4, { align: 'right' });
    doc.text(String(t.squadSize || t.players?.length || 0), 190, y + 4, { align: 'right' });

    doc.setDrawColor(220, 225, 230);
    doc.line(12, y + 6, 198, y + 6);
    y += 7.5;
  });

  // PAGE 4: INDIVIDUAL HONORS & LEADERS
  doc.addPage();
  drawHeaderBanner(doc, tourneyName, 'Tournament Honors, Orange & Purple Cap Leaders');

  y = 44;

  // Orange Cap
  doc.setFillColor(255, 243, 230);
  doc.rect(12, y, 88, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 80, 0);
  doc.text('ORANGE CAP (TOP BATTERS)', 16, y + 4.2);

  // Purple Cap
  doc.setFillColor(245, 235, 255);
  doc.rect(110, y, 88, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(110, 40, 180);
  doc.text('PURPLE CAP (TOP BOWLERS)', 114, y + 4.2);

  y += 8;

  const orangeCap = data.orangeCap || [];
  const purpleCap = data.purpleCap || [];
  const maxRows = Math.max(orangeCap.length, purpleCap.length, 5);

  for (let i = 0; i < Math.min(maxRows, 8); i++) {
    const bat = orangeCap[i];
    const bowl = purpleCap[i];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 35, 45);

    if (bat) {
      doc.text(`${i + 1}. ${bat.name} (${bat.team})`, 16, y + 4);
      doc.text(`${bat.runs} Runs (${bat.strikeRate.toFixed(1)} SR)`, 95, y + 4, { align: 'right' });
    }

    if (bowl) {
      doc.text(`${i + 1}. ${bowl.name} (${bowl.team})`, 114, y + 4);
      doc.text(`${bowl.wickets} Wkts (${bowl.economy.toFixed(2)} Econ)`, 195, y + 4, { align: 'right' });
    }

    doc.setDrawColor(230, 230, 230);
    doc.line(12, y + 6, 198, y + 6);
    y += 7;
  }

  const cleanSlug = (data.tournament.slug || 'tournament').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Dossier_${cleanSlug}_Official.pdf`);
}
