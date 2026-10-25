export type SupportedLanguage = 'en' | 'hi' | 'ar' | 'es';

export interface TranslationDictionary {
  // Navigation
  navHome: string;
  navTournaments: string;
  navMatches: string;
  navAuction: string;
  navStandings: string;
  navLeaderboard: string;
  navArchive: string;
  navHostLeague: string;
  navSignIn: string;
  navAdmin: string;

  // Match Centre & Scoring
  live: string;
  upcoming: string;
  completed: string;
  inningsBreak: string;
  target: string;
  overs: string;
  runs: string;
  wickets: string;
  crr: string;
  rrr: string;
  thisOver: string;
  wagonWheel: string;
  scorecard: string;
  squads: string;
  pressReport: string;
  dlsTarget: string;
  undoBall: string;
  changeBowler: string;

  // Auction
  auctionRoom: string;
  currentBid: string;
  leadingTeam: string;
  basePrice: string;
  placeBid: string;
  sold: string;
  unsold: string;
  rtm: string;
  purseRemaining: string;
  projectorMode: string;

  // Standings & Leaderboards
  pointsTable: string;
  franchise: string;
  played: string;
  won: string;
  lost: string;
  points: string;
  nrr: string;
  form: string;
  playoffs: string;
  orangeCap: string;
  purpleCap: string;
  mvp: string;
  maxSixes: string;

  // General & Corporate Branding
  enterpriseSports: string;
  corporateTournament: string;
  exportCalendar: string;
  exportCsv: string;
  themeColor: string;
  changeLanguage: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    navHome: 'Home',
    navTournaments: 'Tournaments',
    navMatches: 'Matches',
    navAuction: 'Auction',
    navStandings: 'Standings',
    navLeaderboard: 'Leaderboard',
    navArchive: 'Archive',
    navHostLeague: '+ Host League',
    navSignIn: 'Sign In',
    navAdmin: 'Admin',

    live: 'LIVE',
    upcoming: 'UPCOMING',
    completed: 'COMPLETED',
    inningsBreak: 'INNINGS BREAK',
    target: 'Target',
    overs: 'Overs',
    runs: 'Runs',
    wickets: 'Wickets',
    crr: 'CRR',
    rrr: 'RRR',
    thisOver: 'This Over',
    wagonWheel: 'Wagon Wheel',
    scorecard: 'Scorecard',
    squads: 'Squads',
    pressReport: 'Press Report',
    dlsTarget: 'Rain / DLS',
    undoBall: 'Undo Ball',
    changeBowler: 'Change Bowler',

    auctionRoom: 'Live Auction Room',
    currentBid: 'Current Bid',
    leadingTeam: 'Leading Team',
    basePrice: 'Base Price',
    placeBid: 'Place Bid',
    sold: 'SOLD',
    unsold: 'UNSOLD',
    rtm: 'Right to Match',
    purseRemaining: 'Purse Remaining',
    projectorMode: 'Projector Mode',

    pointsTable: 'Points Table',
    franchise: 'Franchise',
    played: 'P',
    won: 'W',
    lost: 'L',
    points: 'PTS',
    nrr: 'NRR',
    form: 'Form',
    playoffs: 'Playoffs',
    orangeCap: 'Orange Cap',
    purpleCap: 'Purple Cap',
    mvp: 'MVP Ranking',
    maxSixes: 'Maximum Sixes',

    enterpriseSports: 'Enterprise Sports',
    corporateTournament: 'Corporate Tournament',
    exportCalendar: 'Add to Calendar (.ics)',
    exportCsv: 'Export CSV',
    themeColor: 'Theme Palette',
    changeLanguage: 'Language',
  },

  hi: {
    navHome: 'होम',
    navTournaments: 'टूर्नामेंट',
    navMatches: 'मैच',
    navAuction: 'नीलामी',
    navStandings: 'अंक तालिका',
    navLeaderboard: 'लीडरबोर्ड',
    navArchive: 'आर्काइव',
    navHostLeague: '+ लीग बनाएं',
    navSignIn: 'लॉग इन',
    navAdmin: 'एडमिन',

    live: 'लाइव',
    upcoming: 'आगामी',
    completed: 'समाप्त',
    inningsBreak: 'पारी विराम',
    target: 'लक्ष्य',
    overs: 'ओवर',
    runs: 'रन',
    wickets: 'विकेट',
    crr: 'वर्तमान रन रेट',
    rrr: 'आवश्यक रन रेट',
    thisOver: 'यह ओवर',
    wagonWheel: 'वैगन व्हील',
    scorecard: 'स्कोरकार्ड',
    squads: 'टीमें',
    pressReport: 'प्रेस रिपोर्ट',
    dlsTarget: 'बारिश / डीएलएस',
    undoBall: 'गेंद वापस लें',
    changeBowler: 'गेंदबाज बदलें',

    auctionRoom: 'लाइव ऑक्शन रूम',
    currentBid: 'मौजूदा बोली',
    leadingTeam: 'अग्रणी टीम',
    basePrice: 'बेस प्राइस',
    placeBid: 'बोली लगाएं',
    sold: 'बिका (SOLD)',
    unsold: 'अनसोल्ड',
    rtm: 'राइट टू मैच (RTM)',
    purseRemaining: 'शेष राशि',
    projectorMode: 'प्रोजेक्टर मोड',

    pointsTable: 'अंक तालिका',
    franchise: 'फ्रेंचाइजी',
    played: 'खेले',
    won: 'जीते',
    lost: 'हारे',
    points: 'अंक',
    nrr: 'नेट रन रेट',
    form: 'फॉर्म',
    playoffs: 'प्लेऑफ',
    orangeCap: 'ऑरेंज कैप',
    purpleCap: 'पर्पल कैप',
    mvp: 'एमवीपी रैंकिंग',
    maxSixes: 'सर्वाधिक छक्के',

    enterpriseSports: 'कॉर्पोरेट स्पोर्ट्स',
    corporateTournament: 'कॉर्पोरेट टूर्नामेंट',
    exportCalendar: 'कैलेंडर में जोड़ें (.ics)',
    exportCsv: 'सीएसवी निर्यात',
    themeColor: 'थीम रंग',
    changeLanguage: 'भाषा',
  },

  ar: {
    navHome: 'الرئيسية',
    navTournaments: 'البطولات',
    navMatches: 'المباريات',
    navAuction: 'المزاد',
    navStandings: 'الترتيب',
    navLeaderboard: 'قائمة المتصدرين',
    navArchive: 'الأرشيف',
    navHostLeague: '+ استضافة بطولة',
    navSignIn: 'تسجيل الدخول',
    navAdmin: 'الإدارة',

    live: 'مباشر',
    upcoming: 'قادمة',
    completed: 'مكتملة',
    inningsBreak: 'استراحة الشوط',
    target: 'الهدف',
    overs: 'الأوفرات',
    runs: 'الركضات',
    wickets: 'الويكيت',
    crr: 'معدل الركض الحالي',
    rrr: 'المعدل المطلوب',
    thisOver: 'هذا الأوفر',
    wagonWheel: 'خريطة الضربات',
    scorecard: 'بطاقة النتائج',
    squads: 'التشكيلات',
    pressReport: 'تقرير صحفي',
    dlsTarget: 'مطر / DLS',
    undoBall: 'تراجع عن الكرة',
    changeBowler: 'تغيير الرامي',

    auctionRoom: 'غرفة المزاد المباشر',
    currentBid: 'العرض الحالي',
    leadingTeam: 'الفريق المتقدم',
    basePrice: 'السعر الأساسي',
    placeBid: 'تقديم عرض',
    sold: 'تم البيع',
    unsold: 'لم يباع',
    rtm: 'حق المطابقة (RTM)',
    purseRemaining: 'الميزانية المتبقية',
    projectorMode: 'وضع شاشة العرض',

    pointsTable: 'جدول النقاط',
    franchise: 'الفريق',
    played: 'لعب',
    won: 'فاز',
    lost: 'خسر',
    points: 'نقاط',
    nrr: 'صافي معدل الركض',
    form: 'المستوى',
    playoffs: 'التصفيات',
    orangeCap: 'القبعة البرتقالية',
    purpleCap: 'القبعة البنفسجية',
    mvp: 'أفضل لاعب (MVP)',
    maxSixes: 'أكثر الستات',

    enterpriseSports: 'رياضات الشركات',
    corporateTournament: 'بطولة شركات',
    exportCalendar: 'إضافة للتقويم (.ics)',
    exportCsv: 'تصدير CSV',
    themeColor: 'لون السمة',
    changeLanguage: 'اللغة',
  },

  es: {
    navHome: 'Inicio',
    navTournaments: 'Torneos',
    navMatches: 'Partidos',
    navAuction: 'Subasta',
    navStandings: 'Clasificación',
    navLeaderboard: 'Líderes',
    navArchive: 'Archivo',
    navHostLeague: '+ Crear Torneo',
    navSignIn: 'Iniciar Sesión',
    navAdmin: 'Admin',

    live: 'EN VIVO',
    upcoming: 'PRÓXIMO',
    completed: 'FINALIZADO',
    inningsBreak: 'DESCANSO',
    target: 'Objetivo',
    overs: 'Overs',
    runs: 'Carreras',
    wickets: 'Wickets',
    crr: 'Tasa Actual',
    rrr: 'Tasa Requerida',
    thisOver: 'Este Over',
    wagonWheel: 'Wagon Wheel',
    scorecard: 'Anotaciones',
    squads: 'Equipos',
    pressReport: 'Boletín de Prensa',
    dlsTarget: 'Lluvia / DLS',
    undoBall: 'Deshacer Bola',
    changeBowler: 'Cambiar Lanzador',

    auctionRoom: 'Sala de Subasta en Vivo',
    currentBid: 'Oferta Actual',
    leadingTeam: 'Equipo Líder',
    basePrice: 'Precio Base',
    placeBid: 'Pujar',
    sold: 'VENDIDO',
    unsold: 'NO VENDIDO',
    rtm: 'Derecho a Igualar (RTM)',
    purseRemaining: 'Presupuesto Restante',
    projectorMode: 'Modo Proyector',

    pointsTable: 'Tabla de Posiciones',
    franchise: 'Franquicia',
    played: 'PJ',
    won: 'PG',
    lost: 'PP',
    points: 'PTS',
    nrr: 'NRR',
    form: 'Forma',
    playoffs: 'Playoffs',
    orangeCap: 'Gorra Naranja',
    purpleCap: 'Gorra Morada',
    mvp: 'Jugador Más Valioso (MVP)',
    maxSixes: 'Más Seises',

    enterpriseSports: 'Deportes Corporativos',
    corporateTournament: 'Torneo Corporativo',
    exportCalendar: 'Agregar al Calendario (.ics)',
    exportCsv: 'Exportar CSV',
    themeColor: 'Color de Tema',
    changeLanguage: 'Idioma',
  },
};
