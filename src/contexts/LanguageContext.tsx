'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, TranslationDictionary, translations } from '@/lib/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  isRtl: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    try {
      // Always enforce English and reset any legacy language preference
      localStorage.setItem('cricplus_lang', 'en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
      setLanguageState('en');
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (_lang: SupportedLanguage) => {
    // English only platform standard
    setLanguageState('en');
    try {
      localStorage.setItem('cricplus_lang', 'en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    } catch {
      // ignore
    }
  };

  const isRtl = false;
  const t = translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
