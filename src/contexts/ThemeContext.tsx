'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CorporateTheme = 'gold' | 'blue' | 'emerald' | 'purple' | 'rose';

export interface ThemeConfig {
  id: CorporateTheme;
  name: string;
  primaryHex: string;
  lightHex: string;
  glowRgba: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
}

export const THEME_PRESETS: Record<CorporateTheme, ThemeConfig> = {
  gold: {
    id: 'gold',
    name: 'DDPL Gold',
    primaryHex: '#D8AD55',
    lightHex: '#F2D69A',
    glowRgba: 'rgba(216, 173, 85, 0.35)',
    badgeBg: 'bg-[#D8AD55]/15',
    badgeText: 'text-[#F2D69A]',
    borderClass: 'border-[#D8AD55]/40',
  },
  blue: {
    id: 'blue',
    name: 'Tech Blue',
    primaryHex: '#3B82F6',
    lightHex: '#93C5FD',
    glowRgba: 'rgba(59, 130, 246, 0.35)',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    borderClass: 'border-blue-500/40',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    primaryHex: '#10B981',
    lightHex: '#6EE7B7',
    glowRgba: 'rgba(16, 185, 129, 0.35)',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    borderClass: 'border-emerald-500/40',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    primaryHex: '#A855F7',
    lightHex: '#D8B4FE',
    glowRgba: 'rgba(168, 85, 247, 0.35)',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    borderClass: 'border-purple-500/40',
  },
  rose: {
    id: 'rose',
    name: 'Crimson Rose',
    primaryHex: '#F43F5E',
    lightHex: '#FDA4AF',
    glowRgba: 'rgba(244, 63, 94, 0.35)',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    borderClass: 'border-rose-500/40',
  },
};

interface ThemeContextType {
  theme: CorporateTheme;
  setTheme: (t: CorporateTheme) => void;
  currentTheme: ThemeConfig;
  customLogo: string | null;
  setCustomLogo: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'gold',
  setTheme: () => {},
  currentTheme: THEME_PRESETS.gold,
  customLogo: null,
  setCustomLogo: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<CorporateTheme>('gold');
  const [customLogo, setCustomLogoState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cricplus_theme') as CorporateTheme;
      if (savedTheme && THEME_PRESETS[savedTheme]) {
        setThemeState(savedTheme);
      }
      const savedLogo = localStorage.getItem('cricplus_custom_logo');
      if (savedLogo) {
        setCustomLogoState(savedLogo);
      }
    } catch {
      // ignore
    }
  }, []);

  const setTheme = (t: CorporateTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem('cricplus_theme', t);
    } catch {
      // ignore
    }
  };

  const setCustomLogo = (url: string | null) => {
    setCustomLogoState(url);
    try {
      if (url) localStorage.setItem('cricplus_custom_logo', url);
      else localStorage.removeItem('cricplus_custom_logo');
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentTheme: THEME_PRESETS[theme] || THEME_PRESETS.gold,
        customLogo,
        setCustomLogo,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useCorporateTheme() {
  return useContext(ThemeContext);
}
