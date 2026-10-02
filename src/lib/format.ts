const CAIRO = 'Africa/Cairo';

/** Arabic-Indic digits with grouping: 1200 -> ١٬٢٠٠ */
export const num = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

const dateFormat = new Intl.DateTimeFormat('ar-EG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: CAIRO,
});
const timeFormat = new Intl.DateTimeFormat('ar-EG', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: CAIRO,
});
const dateTimeFormat = new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short', timeZone: CAIRO });

export const formatDate = (d: Date) => dateFormat.format(d);
export const formatTime = (d: Date | number) => timeFormat.format(d);
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
