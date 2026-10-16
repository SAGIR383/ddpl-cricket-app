'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [animating, setAnimating] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setAnimating(true);
    setWidth(28);

    const t1 = setTimeout(() => setWidth(72), 90);
    const t2 = setTimeout(() => setWidth(100), 240);
    const t3 = setTimeout(() => {
      setAnimating(false);
      setWidth(0);
    }, 420);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, searchParams]);

  if (!animating && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] pointer-events-none transition-opacity duration-200"
      style={{ opacity: animating ? 1 : 0 }}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-cricket-teal to-cricket-gold shadow-[0_0_12px_rgba(0,245,212,0.9)] transition-all duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressContent />
    </Suspense>
  );
}
