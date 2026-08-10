import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { translate, LANGUAGE_LABELS, type Language, type TranslationKey } from '../lib/i18n';

const STORAGE_KEY = 'finly-language';

function loadInitial(): Language {
  if (typeof window === 'undefined') return 'id';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('cakumu-language');
    if (stored === 'id' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'id';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Translate a dictionary key, optionally interpolating `{var}` placeholders. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Locale string matching the active language, for Intl/date formatting. */
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadInitial);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore quota errors
    }
  };

  const t = useMemo(() => {
    return (key: TranslationKey, vars?: Record<string, string | number>) => translate(language, key, vars);
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, locale: LANGUAGE_LABELS[language].locale }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
