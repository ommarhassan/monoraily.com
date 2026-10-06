import { fareZones, subscriptions } from '../data/fares';
import { getLang, translate } from './index';
import { stationNamesEn } from '../data/stations'

/** Display name of a station. The Arabic name stays the internal value. */
export const stationName = (arabicName: string) =>
  getLang() === 'en' ? (stationNamesEn[arabicName] ?? arabicName) : arabicName;

/** Arrow that points in the reading direction. */
export const arrow = () => (getLang() === 'ar' ? '←' : '→');

/** "From ← To" (Arabic) or "From → To" (English), with display names. */
export const routeText = (from: string, to: string) => `${stationName(from)} ${arrow()} ${stationName(to)}`;

export const planName = (plan: string) => {
  const found = subscriptions.find((s) => s.id === plan);
  return found ? translate(found.nameKey) : plan;
};

export const zoneName = (zone: number) => {
  const found = fareZones[zone];
  return found ? translate(found.shortKey) : '';
};
