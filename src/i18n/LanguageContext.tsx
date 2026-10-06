import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ar, type Key } from './ar';
import { en } from './en';

const STORAGE_KEY = 'monoraily-lang';

export type Lang = 'ar' | 'en';
export type TextKey = Key;

const dictionary: Record<Lang, Record<TextKey, string>> = { ar, en };

type LanguageValue = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  /** Locale for Intl formatters. */
  locale: string;
  t: (key: TextKey, vars?: Record<string, string | number>) => string;
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

function translate(lang: Lang, key: TextKey, vars?: Record<string, string | number>): string {
  let text = dictionary[lang]?.[key] ?? dictionary.ar[key] ?? String(key);
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
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
      t: (key, vars) => translate(lang, key, vars),
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
