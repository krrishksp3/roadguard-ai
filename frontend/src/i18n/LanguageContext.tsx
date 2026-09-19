import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, TranslationDictionary } from './types';
import { en } from './translations/en';
import { hi } from './translations/hi';

const STORAGE_KEY = 'roadguard-language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dict: TranslationDictionary;
  t: (path: string, fallback?: string) => string;
  getStatusExplanation: (status?: string) => string;
  getDamageTypeLabel: (type?: string) => string;
  getSeverityLabel: (severity?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        return saved;
      }
    } catch {
      // localStorage unavailable or restricted
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    if (lang !== 'en' && lang !== 'hi') return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dict = useMemo<TranslationDictionary>(() => {
    return language === 'hi' ? hi : en;
  }, [language]);

  /**
   * Translates dot-delimited path (e.g. "common.submit", "landing.heroTitlePart1")
   * Falls back to fallback string or the last segment if not found.
   */
  const t = (path: string, fallback?: string): string => {
    const parts = path.split('.');
    let current: any = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return fallback !== undefined ? fallback : parts[parts.length - 1];
      }
    }

    if (typeof current === 'string') {
      return current;
    }

    return fallback !== undefined ? fallback : path;
  };

  const getStatusExplanation = (status?: string): string => {
    if (!status) return '';
    const upper = status.toUpperCase() as keyof typeof dict.statusExplanation;
    return dict.statusExplanation[upper] || status;
  };

  const getDamageTypeLabel = (type?: string): string => {
    if (!type) return '';
    const lower = type.toLowerCase() as keyof typeof dict.damageTypes;
    return dict.damageTypes[lower] || type;
  };

  const getSeverityLabel = (severity?: string): string => {
    if (!severity) return '';
    const lower = severity.toLowerCase() as keyof typeof dict.severities;
    return dict.severities[lower] || severity;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        dict,
        t,
        getStatusExplanation,
        getDamageTypeLabel,
        getSeverityLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
