/**
 * Fares as announced by the Ministry of Transport when the East Nile Monorail opened (May 2026).
 * Prices can change: always double-check with the official source before presenting them.
 */

export type TicketKind = 'full' | 'half';

export type FareZone = {
  /** Upper limit of stations travelled for this zone (Infinity = the rest of the line). */
  maxStops: number;
  label: string;
  hint: string;
  full: number;
  half: number;
};

export const fareZones: FareZone[] = [
  { maxStops: 5, label: 'منطقة واحدة (حتى ٥ محطات)', hint: 'للمشاوير القريبة', full: 20, half: 10 },
  { maxStops: 10, label: 'منطقتان (حتى ١٠ محطات)', hint: 'لمشاويرك اليومية', full: 40, half: 20 },
  { maxStops: 15, label: 'ثلاث مناطق (حتى ١٥ محطة)', hint: 'المسافات المتوسطة', full: 55, half: 30 },
  { maxStops: Infinity, label: 'أربع مناطق (الخط كامل)', hint: 'الرحلة الطويلة للعاصمة', full: 80, half: 40 },
];

export function fareForStops(stops: number, kind: TicketKind = 'full') {
  const zone = fareZones.find((z) => stops <= z.maxStops) ?? fareZones[fareZones.length - 1];
  return zone[kind];
}

export const ticketKindLabels: Record<TicketKind, string> = {
  full: 'تذكرة كاملة',
  half: 'نصف تذكرة',
};

/** Half tickets are for riders over 60 and riders with disabilities. */
export const halfTicketEligibility = 'كبار السن فوق ٦٠ سنة وذوي الإعاقة';

export type Subscription = {
  name: string;
  trips: number;
  validityDays: number;
  /** One price per zone, in the same order as `fareZones`. All include a 50% discount. */
  prices: [number, number, number, number];
};

export const subscriptions: Subscription[] = [
  { name: 'أسبوعي', trips: 14, validityDays: 14, prices: [140, 280, 385, 560] },
  { name: 'شهري', trips: 60, validityDays: 60, prices: [600, 1200, 1650, 2400] },
  { name: 'ربع سنوي', trips: 180, validityDays: 180, prices: [1800, 3600, 4950, 7200] },
];

export const operatingHours = 'من ٦ صباحًا حتى ٧:٥٠ مساءً (آخر قطار)';

/** Full line (21 hops) takes roughly 60 to 70 minutes. */
export const MINUTES_PER_STOP = 3;
