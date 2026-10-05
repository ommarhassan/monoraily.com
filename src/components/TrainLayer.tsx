import { useEffect, useState } from 'react';
import { stationPositions } from '../data/mapLayout';
import { linePaths } from '../data/network';
import { cairoMinutesOfDay, trainsAt, type TrainPosition } from '../data/schedule';
import { num } from '../lib/format';

const path = linePaths.find((p) => p.line === 'east-nile')!;
const points = path.names.map((name) => stationPositions.get(name)!);
const HOPS = points.length - 1;
const TICK_MS = 1000;

function useTrains(): TrainPosition[] {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return trainsAt(cairoMinutesOfDay(now), HOPS);
}

/** Point on the drawn line for a train, interpolated between two neighbouring stations. */
function positionOf(train: TrainPosition): [number, number] {
  const along = (train.direction === 'toCapital' ? train.progress : 1 - train.progress) * HOPS;
  const i = Math.min(Math.floor(along), HOPS - 1);
  const t = along - i;
  const [x1, y1] = points[i];
  const [x2, y2] = points[i + 1];
  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
}

/** Estimated train markers, drawn inside the map SVG. */
export default function TrainLayer() {
  const trains = useTrains();
  return (
    <g pointerEvents="none" aria-hidden="true">
      {trains.map((train) => {
        const [x, y] = positionOf(train);
        return <circle key={train.id} cx={x} cy={y} r={8} fill="var(--sidebar)" stroke="#fff" strokeWidth={3} />;
      })}
    </g>
  );
}

/** Legend entry: how many trains are estimated to be running. */
export function TrainStatus() {
  const count = useTrains().length;
  return (
    <span>
      <i style={{ background: 'var(--sidebar)' }} />
      {count > 0 ? `قطارات على الخط دلوقتي: ${num(count)} (مواقعها تقديرية)` : 'خارج ساعات التشغيل'}
    </span>
  );
}
