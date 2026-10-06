export type Lang = 'ar' | 'en';

const CAIRO = 'Africa/Cairo';
const LOCALES: Record<Lang, string> = { ar: 'ar-EG', en: 'en-US' };

let current: Lang = 'ar';

/** Called by LanguageProvider whenever the language changes. */
export const setFormatLocale = (lang: Lang) => {
  current = lang;
};

/** Builds a formatter once per locale and returns the one for the current language. */
function perLocale<T>(make: (locale: string) => T) {
  const cache = new Map<string, T>();
  return (): T => {
    const locale = LOCALES[current];
    let formatter = cache.get(locale);
    if (!formatter) {
      formatter = make(locale);
      cache.set(locale, formatter);
    }
    return formatter;
  };
}

const numberFormat = perLocale((l) => new Intl.NumberFormat(l));
const dateFormat = perLocale(
  (l) => new Intl.DateTimeFormat(l, { weekday: 'long', day: 'numeric', month: 'long', timeZone: CAIRO }),
);
const timeFormat = perLocale(
  (l) => new Intl.DateTimeFormat(l, { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: CAIRO }),
);
const dateTimeFormat = perLocale(
  (l) => new Intl.DateTimeFormat(l, { dateStyle: 'medium', timeStyle: 'short', timeZone: CAIRO }),
);

/** Arabic: 1200 -> ١٬٢٠٠   English: 1200 -> 1,200 */
export const num = (n: number) => numberFormat().format(n);

export const formatDate = (d: Date) => dateFormat().format(d);
export const formatTime = (d: Date | number) => timeFormat().format(d);
export const formatDateTime = (iso: string) => dateTimeFormat().format(new Date(iso));
