import { MatchFixture } from '@/app/api/matches/route';

/**
 * Generates and triggers browser download of an RFC 5545 iCalendar (.ics) file
 */
export function downloadIcsCalendar(tournamentName: string, matches: MatchFixture[]) {
  const sanitize = (str: string) => str.replace(/[,;]/g, ' ').trim();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CricPlus Enterprise//Corporate Cricket Fixtures//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${sanitize(tournamentName)} Cricket League`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  matches.forEach((m, idx) => {
    // Generate dates or fallbacks
    const now = new Date();
    const matchDate = m.matchDate ? new Date(m.matchDate) : new Date(now.getTime() + (idx + 1) * 86400000);
    
    // Default to 10:00 AM if not set
    let startHour = 10;
    let startMinute = 0;
    if (m.matchTime) {
      const match = m.matchTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        startHour = parseInt(match[1], 10);
        if (match[3]?.toUpperCase() === 'PM' && startHour < 12) startHour += 12;
        if (match[3]?.toUpperCase() === 'AM' && startHour === 12) startHour = 0;
        startMinute = parseInt(match[2], 10);
      }
    }

    matchDate.setHours(startHour, startMinute, 0, 0);
    const endDate = new Date(matchDate.getTime() + 3 * 3600000); // 3-hour match window

    const formatIcsDate = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const uid = `${m.id || `match-${idx + 1}`}@ddpl-cricket-app.vercel.app`;
    const summary = `${m.teamA.name} vs ${m.teamB.name} (${m.stage || 'Corporate League'})`;
    const description = `Corporate Cricket Match #${m.matchNumber}. Follow live scores on CricPlus!`;
    const location = m.venue || 'Corporate Arena Ground';

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(matchDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${sanitize(summary)}`,
      `DESCRIPTION:${sanitize(description)}`,
      `LOCATION:${sanitize(location)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tournamentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-fixtures.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers browser download of tournament matches in CSV format
 */
export function downloadMatchesCsv(tournamentName: string, matches: MatchFixture[]) {
  const headers = [
    'Match Number',
    'Stage',
    'Team A',
    'Team B',
    'Venue',
    'Date',
    'Time',
    'Status',
    'Summary',
  ];

  const rows = matches.map((m) => [
    m.matchNumber,
    `"${(m.stage || 'League').replace(/"/g, '""')}"`,
    `"${m.teamA.name.replace(/"/g, '""')}"`,
    `"${m.teamB.name.replace(/"/g, '""')}"`,
    `"${(m.venue || 'Arena Ground').replace(/"/g, '""')}"`,
    `"${(m.matchDate || 'TBD').replace(/"/g, '""')}"`,
    `"${(m.matchTime || '10:00 AM').replace(/"/g, '""')}"`,
    `"${(m.status || 'upcoming').toUpperCase()}"`,
    `"${(m.summary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tournamentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-fixtures.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
