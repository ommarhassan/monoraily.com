import { useMemo, useRef, useState } from 'react';
import { fareForStops } from '../data/fares';
import { lineColors, lineNames, linePaths, stations } from '../data/network';
import { MAP_HEIGHT, MAP_WIDTH, stationPositions } from '../data/mapLayout';
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

type Props = { onTicket: (from: string, to: string) => void };

export default function MapPage({ onTicket }: Props) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [hover, setHover] = useState('');
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
            aria-label="خريطة مونوريل شرق النيل"
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
          </svg>

          <div className="map-legend">
            {Object.keys(lineColors).map((id) => (
              <span key={id}>
                <i style={{ background: lineColors[id as keyof typeof lineColors] }} />
                {lineNames[id as keyof typeof lineNames]}
              </span>
            ))}
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
          {(from || to) && (
            <button className="light-button map-action ghost" onClick={clear}>
              مسح
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
