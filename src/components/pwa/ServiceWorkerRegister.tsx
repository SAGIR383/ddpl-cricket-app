'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('CricPluse Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('CricPluse Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
