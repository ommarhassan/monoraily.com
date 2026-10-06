export type Lang = 'ar' | 'en';

let currentLocale = 'ar-EG';

export function setFormatLocale(lang: Lang) {
  currentLocale = lang === 'ar' ? 'ar-EG' : 'en-GB';
}

export function num(value: number | string, locale: string = currentLocale): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return String(value);
  return new Intl.NumberFormat(locale).format(n);
}

function toDate(d: Date | number | string): Date {
  if (d instanceof Date) return d;
  return new Date(d);
}

export function formatDate(date: Date | number | string, locale: string = currentLocale): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function formatTime(date: Date | number | string, locale: string = currentLocale): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | number | string, locale: string = currentLocale): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
}
