import { useMemo, useRef, useState } from 'react';
import { fareForStops } from '../data/fares';
import { lineColors, lineNames, linePaths, stations } from '../data/network';
import { MAP_HEIGHT, MAP_WIDTH, stationPositions, westNilePositions } from '../data/mapLayout';
import { westNile, type PlannedStation } from '../data/westNile';
import { num } from '../lib/format';
import { planRoute } from '../lib/routing';

const FULL_VIEW = { x: 0, y: 0, w: MAP_WIDTH, h: MAP_HEIGHT };
const MIN_WIDTH = 220;
const SHOW_ALL_LABELS_BELOW = 520;

const lineShapes = linePaths.map((path) => ({
  line: path.line,
  names: path.names,
  points: path.names.map((name) => stationPositions.get(name)!),
}));
const endpoints = new Set(lineShapes.flatMap((l) => [l.names[0], l.names[l.names.length - 1]]));

// West Nile: information only (not part of routing or booking).
const WEST_COLOR = '#7b8794';
const westStations: PlannedStation[] = westNile.stations;
const westPoints = westStations.map((s) => westNilePositions.get(s.name)!);
const phaseText = {
  1: 'المرحلة الأولى: تشغيل تجريبي مقرر في أكتوبر 2026',
  2: 'المرحلة التانية: مقررة في الربع الأول من 2027',
} as const;

/** Where a West Nile label sits, so names don't collide with the line or the East Nile curve. */
const westLabel = (index: number, x: number, y: number) =>
  index <= 3
    ? { x, y: y - 16, anchor: 'middle' as const }
    : index <= 7
      ? { x: x + 14, y: y + 4, anchor: 'start' as const }
      : { x: x - 14, y: y + 4, anchor: 'end' as const };

type Props = { onTicket: (from: string, to: string) => void };

export default function MapPage({ onTicket }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hover, setHover] = useState('');
  const [westInfo, setWestInfo] = useState<PlannedStation | null>(null);
  const [view, setView] = useState(FULL_VIEW);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const route = useMemo(() => (from && to ? planRoute(from, to) : null), [from, to]);
  const showAllLabels = view.w < SHOW_ALL_LABELS_BELOW;

  const zoom = (factor: number) =>
    setView((v) => {
      const w = Math.min(MAP_WIDTH, Math.max(MIN_WIDTH, v.w * factor));
      const h = (w * MAP_HEIGHT) / MAP_WIDTH;
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
    });

  // First tap sets the start, second tap sets the destination, third tap starts over.
  const pick = (name: string) => {
    setWestInfo(null);
    if (!from || (from && to)) {
      setFrom(name);
      setTo('');
    } else if (name !== from) {
      setTo(name);
    }
  };

  const clear = () => {
    setFrom('');
    setTo('');
    setWestInfo(null);
  };

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">خريطة تفاعلية</span>
        <h1>اضغط على محطتين وشوف الطريق.</h1>
        <p>اسحب الخريطة للتحريك، وكبّر بالأزرار أو بعجلة الماوس.</p>
      </div>

      <div className="network-layout">
        <div className="network-card map-card">
          <div className="map-tools">
            <button onClick={() => zoom(0.7)} aria-label="تكبير">
              +
            </button>
            <button onClick={() => zoom(1 / 0.7)} aria-label="تصغير">
              −
            </button>
            <button onClick={() => setView(FULL_VIEW)}>إعادة ضبط</button>
          </div>

          <svg
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className="route-map"
            role="img"
            aria-label="خريطة مونوريل القاهرة: خط شرق النيل وخط غرب النيل (قيد التنفيذ)"
            onWheel={(e) => zoom(e.deltaY < 0 ? 0.9 : 1.1)}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY, moved: false };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              const scale = view.w / e.currentTarget.getBoundingClientRect().width;
              const dx = (e.clientX - d.x) * scale;
              const dy = (e.clientY - d.y) * scale;
              if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
              if (d.moved) {
                setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
                d.x = e.clientX;
                d.y = e.clientY;
              }
            }}
            onPointerUp={() => {
              setTimeout(() => {
                drag.current = null;
              }, 0);
            }}
            onPointerLeave={() => {
              drag.current = null;
            }}
          >
            {/* West Nile line: dashed, because it is still under construction */}
            <polyline
              points={westPoints.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke={WEST_COLOR}
              strokeWidth={7}
              strokeDasharray="14 12"
              strokeLinejoin="round"
              opacity={route ? 0.35 : 0.9}
            />

            {lineShapes.map((shape, i) => (
              <polyline
                key={i}
                points={shape.points.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={lineColors[shape.line]}
                strokeWidth={route ? 5 : 9}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={route ? 0.28 : 1}
              />
            ))}

            {route && (
              <polyline
                points={route.names.map((n) => stationPositions.get(n)!.join(',')).join(' ')}
                fill="none"
                stroke="var(--sidebar)"
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {stations.map((station) => {
              const [x, y] = stationPositions.get(station.id)!;
              const special = station.connections.length > 0;
              const selected = station.id === from || station.id === to;
              const onRoute = selected || route?.names.includes(station.id);
              const labelOnLeft = x > 760;
              const showLabel =
                special || endpoints.has(station.id) || showAllLabels || hover === station.id || selected;

              return (
                <g
                  key={station.id}
                  className="map-station"
                  tabIndex={0}
                  role="button"
                  aria-label={station.name}
                  onPointerEnter={() => setHover(station.id)}
                  onPointerLeave={() => setHover('')}
                  onClick={() => {
                    if (!drag.current?.moved) pick(station.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') pick(station.id);
                  }}
                >
                  <circle cx={x} cy={y} r={14} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={selected ? 11 : special ? 9 : 6}
                    fill={station.id === from ? '#6aa5d8' : station.id === to ? '#dd8b67' : '#fff'}
                    stroke={onRoute ? 'var(--sidebar)' : lineColors[station.lines[0]]}
                    strokeWidth={special ? 4 : 3}
                  />
                  {showLabel && (
                    <text
                      x={labelOnLeft ? x - 14 : x + 14}
                      y={y + 4}
                      textAnchor={labelOnLeft ? 'end' : 'start'}
                      className={hover === station.id ? 'map-label hot' : 'map-label'}
                    >
                      {station.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* West Nile stations: tap for info only, never for booking */}
            {westStations.map((station, i) => {
              const [x, y] = westPoints[i];
              const special = station.connections.length > 0;
              const selected = westInfo?.name === station.name;
              const hoverKey = `w:${station.name}`;
              const label = westLabel(i, x, y);
              const showLabel =
                special || i === 0 || i === westStations.length - 1 || showAllLabels || hover === hoverKey || selected;

              return (
                <g
                  key={station.name}
                  className="map-station"
                  tabIndex={0}
                  role="button"
                  aria-label={`${station.name} (قيد التنفيذ)`}
                  onPointerEnter={() => setHover(hoverKey)}
                  onPointerLeave={() => setHover('')}
                  onClick={() => {
                    if (!drag.current?.moved) setWestInfo(station);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setWestInfo(station);
                  }}
                >
                  <circle cx={x} cy={y} r={14} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={selected ? 11 : special ? 9 : 6}
                    fill="#fff"
                    stroke={station.phase === 1 ? '#5b6577' : '#9aa3b2'}
                    strokeWidth={special ? 4 : 3}
                  />
                  {showLabel && (
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor={label.anchor}
                      className={hover === hoverKey ? 'map-label hot' : 'map-label'}
                    >
                      {station.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="map-legend">
            {Object.keys(lineColors).map((id) => (
              <span key={id}>
                <i style={{ background: lineColors[id as keyof typeof lineColors] }} />
                {lineNames[id as keyof typeof lineNames]}
              </span>
            ))}
            <span>
              <i style={{ background: WEST_COLOR }} />
              {westNile.name} (قيد التنفيذ)
            </span>
            <span>
              <i className="legend-ring" />
              محطة تبديل
            </span>
          </div>
        </div>

        <aside className="network-aside">
          <h3>رحلتك</h3>
          <p>
            من: <b>{from || 'اختار محطة'}</b>
          </p>
          <p>
            إلى: <b>{to || 'اختار محطة'}</b>
          </p>
          {route ? (
            <>
              <div className="aside-divider" />
              <span>
                {num(route.stops)} محطة · {num(route.minutes)} دقيقة
              </span>
              <strong>{num(fareForStops(route.stops))} جنيه</strong>
              <button className="light-button map-action" onClick={() => onTicket(from, to)}>
                احجز تذكرة
              </button>
            </>
          ) : (
            <p>اضغط محطة البداية ثم الوصول.</p>
          )}
          {(from || to || westInfo) && (
            <button className="light-button map-action ghost" onClick={clear}>
              مسح
            </button>
          )}

          {westInfo && (
            <>
              <div className="aside-divider" />
              <span>قريبًا</span>
              <strong>{westInfo.name}</strong>
              <p>
                {westNile.name} · {westNile.status}
              </p>
              <p>{phaseText[westInfo.phase]}</p>
              {westInfo.connections.length > 0 && <p>تبديل: {westInfo.connections.join('، ')}</p>}
              <p>{westNile.note} الحجز متاح حاليًا على خط شرق النيل بس.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
