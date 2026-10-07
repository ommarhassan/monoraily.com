import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setFormatLocale } from '../lib/format';
import { dictionary, type Lang, type TextKey } from './dictionary';

const STORAGE_KEY = 'monoraily-lang';

type Vars = Record<string, string | number>;

type LanguageValue = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  /** Locale for Intl formatters. */
  locale: string;
  t: (key: TextKey, vars?: Vars) => string;
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

  // Set before the children render, so num() and the date helpers already use the right locale.
  setFormatLocale(lang);

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
      t: (key, vars) => {
        const text = dictionary[lang][key];
        return vars ? text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : text;
      },
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
