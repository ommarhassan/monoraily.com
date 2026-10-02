import { useState } from 'react';
import { planRoute, type Route } from '../lib/routing';

const DEFAULT_FROM = 'الاستاد';
const DEFAULT_TO = 'مدينة الفنون والثقافة';

/** State and actions of the trip planner (start, destination, computed route, error message). */
export function usePlanner() {
  const [from, setFromState] = useState(DEFAULT_FROM);
  const [to, setToState] = useState(DEFAULT_TO);
  const [route, setRoute] = useState<Route | null>(() => planRoute(DEFAULT_FROM, DEFAULT_TO));
  const [error, setError] = useState('');

  const reset = () => {
    setRoute(null);
    setError('');
  };

  return {
    from,
    to,
    route,
    error,

    setFrom(station: string) {
      setFromState(station);
      reset();
    },
    setTo(station: string) {
      setToState(station);
      reset();
    },
    swap() {
      setFromState(to);
      setToState(from);
      reset();
    },

    /** Validates the two stations and computes the route (used by the "show best route" button). */
    submit() {
      if (!from || !to) {
        setError('اختار محطة البداية والوصول الأول.');
        setRoute(null);
        return;
      }
      if (from === to) {
        setError('اختار محطتين مختلفتين عشان نقدر نحسب الرحلة.');
        setRoute(null);
        return;
      }
      const next = planRoute(from, to);
      setRoute(next);
      setError(next ? '' : 'مش قادرين نحدد مسار بين المحطتين.');
    },

    /** Used by the map page: set both stations at once and return the route. */
    planBetween(start: string, end: string) {
      setFromState(start);
      setToState(end);
      const next = planRoute(start, end);
      setRoute(next);
      setError('');
      return next;
    },
  };
}

export type Planner = ReturnType<typeof usePlanner>;
