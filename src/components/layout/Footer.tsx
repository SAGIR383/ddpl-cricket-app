import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-cricket-border bg-cricket-dark/80 text-cricket-muted py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-cricket-teal/20 text-cricket-teal flex items-center justify-center font-display font-bold text-xs">
            CP
          </div>
          <span className="text-sm font-semibold text-gray-300">
            CricPlus © {new Date().getFullYear()} Corporate Sports Community
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <Link href="/tournaments/ddpl" className="hover:text-cricket-teal transition-colors">
            DDPL Official
          </Link>
          <Link href="/tournaments/game-of-run" className="hover:text-cricket-teal transition-colors">
            Game of RUN
          </Link>
          <Link href="/archive" className="hover:text-cricket-teal transition-colors">
            Hall of Fame &amp; Archives
          </Link>
        </div>
      </div>
    </footer>
  );
}
