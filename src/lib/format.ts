export function num(value: number | string, locale: string = 'ar-EG'): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return String(value);
  return new Intl.NumberFormat(locale).format(n);
}

export function formatDate(date: Date, locale: string = 'ar-EG'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatTime(date: Date, locale: string = 'ar-EG'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}
