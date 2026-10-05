import { MINUTES_PER_STOP } from './fares';

/** East Nile timetable as announced by the Ministry of Transport (Sept 2026). Update here if it changes. */
export const FIRST_DEPARTURE = 6 * 60; // minutes after midnight
export const LAST_DEPARTURE = 19 * 60 + 50;
export const HEADWAY_MINUTES = 12;

export type TrainDirection = 'toCapital' | 'toStadium';
export type TrainPosition = { id: string; direction: TrainDirection; progress: number };

const cairoClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

/** Minutes since midnight in Cairo, whatever timezone the device is set to. */
export function cairoMinutesOfDay(date: Date): number {
  const parts = cairoClock.formatToParts(date);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (read('hour') % 24) * 60 + read('minute') + read('second') / 60;
}

/**
 * Estimated trains on the line right now. Trains leave both ends together every HEADWAY_MINUTES
 * and take `hops * MINUTES_PER_STOP` minutes to reach the other end. This is an estimate, not live tracking.
 */
export function trainsAt(minutesOfDay: number, hops: number): TrainPosition[] {
  const trip = hops * MINUTES_PER_STOP;
  const trains: TrainPosition[] = [];
  for (let departure = FIRST_DEPARTURE; departure <= LAST_DEPARTURE; departure += HEADWAY_MINUTES) {
    const elapsed = minutesOfDay - departure;
    if (elapsed < 0 || elapsed > trip) continue;
    const progress = elapsed / trip;
    trains.push({ id: `a-${departure}`, direction: 'toCapital', progress });
    trains.push({ id: `b-${departure}`, direction: 'toStadium', progress });
  }
  return trains;
}
