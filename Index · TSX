import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setFormatLocale, type Lang } from '../lib/format';
import { ar, type Key } from './ar';
import { en } from './en';

export type { Lang, Key };

const dictionaries: Record<Lang, Record<Key, string>> = { ar, en };
const STORAGE_KEY = 'site-lang';

const readSavedLang = (): Lang => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* storage can be blocked: fall back to Arabic */
  }
  return 'ar';
};

let currentLang: Lang = readSavedLang();
setFormatLocale(currentLang);

export const getLang = () => currentLang;

export type Params = Record<string, string | number>;

/** Non-hook translate: use it in plain helpers. In components prefer `const { t } = useI18n()`. */
export function translate(key: Key, params?: Params): string {
  const text = dictionaries[currentLang][key] ?? ar[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

type I18nValue = {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: (key: Key, params?: Params) => string;
  setLang: (lang: Lang) => void;
  toggle: () => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  // Keep the module-level language in sync during render, so helpers and formatters see it immediately.
  currentLang = lang;
  setFormatLocale(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggle = useCallback(() => setLangState((l) => (l === 'ar' ? 'en' : 'ar')), []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      t: (key, params) => translate(key, params),
      setLang,
      toggle,
    }),
    [lang, setLang, toggle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <LanguageProvider>');
  return ctx;
}
