import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionary, type Lang, type TextKey } from './dictionary';

const STORAGE_KEY = 'monoraily-lang';

type LanguageValue = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  /** Locale for Intl formatters. */
  locale: string;
  t: (key: TextKey) => string;
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    // storage can be blocked: fall back to Arabic
  }
  return 'ar';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const toggleLang = useCallback(() => setLang((current) => (current === 'ar' ? 'en' : 'ar')), []);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      locale: lang === 'ar' ? 'ar-EG' : 'en-GB',
      t: (key) => dictionary[lang][key],
      toggleLang,
    }),
    [lang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
