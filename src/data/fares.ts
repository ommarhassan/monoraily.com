import type { Key } from '../i18n/ar';

/**
 * Fares as announced by the Ministry of Transport when the East Nile Monorail opened (May 2026).
 * Prices can change: always double-check with the official source before presenting them.
 *
 * The Arabic `label` / `hint` / `name` fields are kept for pages that are not translated yet.
 * Translated pages use the `*Key` fields with `t()`.
 */

export type TicketKind = 'full' | 'half';

export type FareZone = {
  /** Upper limit of stations travelled for this zone (Infinity = the rest of the line). */
  maxStops: number;
  label: string;
  hint: string;
  labelKey: Key;
  /** Short name without the station range, e.g. "One zone". */
  shortKey: Key;
  hintKey: Key;
  full: number;
  half: number;
};

export const fareZones: FareZone[] = [
  {
    maxStops: 5,
    label: 'منطقة واحدة (حتى ٥ محطات)',
    hint: 'للمشاوير القريبة',
    labelKey: 'zone.0.label',
    shortKey: 'zone.0.short',
    hintKey: 'zone.0.hint',
    full: 20,
    half: 10,
  },
  {
    maxStops: 10,
    label: 'منطقتان (حتى ١٠ محطات)',
    hint: 'لمشاويرك اليومية',
    labelKey: 'zone.1.label',
    shortKey: 'zone.1.short',
    hintKey: 'zone.1.hint',
    full: 40,
    half: 20,
  },
  {
    maxStops: 15,
    label: 'ثلاث مناطق (حتى ١٥ محطة)',
    hint: 'المسافات المتوسطة',
    labelKey: 'zone.2.label',
    shortKey: 'zone.2.short',
    hintKey: 'zone.2.hint',
    full: 55,
    half: 30,
  },
  {
    maxStops: Infinity,
    label: 'أربع مناطق (الخط كامل)',
    hint: 'الرحلة الطويلة للعاصمة',
    labelKey: 'zone.3.label',
    shortKey: 'zone.3.short',
    hintKey: 'zone.3.hint',
    full: 80,
    half: 40,
  },
];

export function fareForStops(stops: number, kind: TicketKind = 'full') {
  const zone = fareZones.find((z) => stops <= z.maxStops) ?? fareZones[fareZones.length - 1];
  return zone[kind];
}

export const ticketKindLabels: Record<TicketKind, string> = {
  full: 'تذكرة كاملة',
  half: 'نصف تذكرة',
};

export const ticketKindKeys: Record<TicketKind, Key> = {
  full: 'kind.full',
  half: 'kind.half',
};

/** Half tickets are for riders over 60 and riders with disabilities. (Arabic; translated pages use 'fares.halfEligibility'.) */
export const halfTicketEligibility = 'كبار السن فوق ٦٠ سنة وذوي الإعاقة';

/** Same ids the server uses (create-payment / paymob-webhook). */
export type PlanId = 'weekly' | 'monthly' | 'quarterly';

export type Subscription = {
  id: PlanId;
  name: string;
  nameKey: Key;
  trips: number;
  validityDays: number;
  /** One price per zone, in the same order as `fareZones`. All include a 50% discount. */
  prices: [number, number, number, number];
};

export const subscriptions: Subscription[] = [
  { id: 'weekly', name: 'أسبوعي', nameKey: 'plan.weekly', trips: 14, validityDays: 14, prices: [140, 280, 385, 560] },
  { id: 'monthly', name: 'شهري', nameKey: 'plan.monthly', trips: 60, validityDays: 60, prices: [600, 1200, 1650, 2400] },
  {
    id: 'quarterly',
    name: 'ربع سنوي',
    nameKey: 'plan.quarterly',
    trips: 180,
    validityDays: 180,
    prices: [1800, 3600, 4950, 7200],
  },
];

/** Arabic; translated pages use 'fares.operatingHours'. */
export const operatingHours = 'من ٦ صباحًا حتى ٧:٥٠ مساءً (آخر قطار)';

/** Full line (21 hops) takes roughly 60 to 70 minutes. */
export const MINUTES_PER_STOP = 3;
