import { useMemo, useRef, useState } from 'react';
import TrainLayer, { TrainStatus } from '../components/TrainLayer';
import { fareForStops } from '../data/fares';
import { lineColors, lineNames, linePaths, stations } from '../data/network';
import { MAP_HEIGHT, MAP_WIDTH, stationPositions, westNilePositions } from '../data/mapLayout';
import { westNile, type PlannedStation } from '../data/westNile';
import { getStationName } from '../components/StationPicker';
import { useLanguage } from '../i18n/LanguageContext';
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

/** Where a West Nile label sits, so names don't collide with the line or the East Nile curve. */
const westLabel = (index: number, x: number, y: number) =>
  index <= 3
    ? { x, y: y - 16, anchor: 'middle' as const }
    : index <= 7
      ? { x: x + 14, y: y + 4, anchor: 'start' as const }
      : { x: x - 14, y: y + 4, anchor: 'end' as const };

type Props = { onTicket: (from: string, to: string) => void };

export default function MapPage({ onTicket }: Props) {
  const { lang, locale } = useLanguage();
  const isAr = lang === 'ar';

  const phaseText = {
    1: isAr ? 'المرحلة الأولى: تشغيل تجريبي مقرر في أكتوبر 2026' : 'Phase 1: Trial operation planned for Oct 2026',
    2: isAr ? 'المرحلة التانية: مقررة في الربع الأول من 2027' : 'Phase 2: Planned for Q1 2027',
  } as const;

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
        <span className="eyebrow green">{isAr ? 'خريطة تفاعلية' : 'Interactive Map'}</span>
        <h1>{isAr ? 'اضغط على محطتين وشوف الطريق.' : 'Click two stations to see the route.'}</h1>
        <p>{isAr ? 'اسحب الخريطة للتحريك، وكبّر بالأزرار أو بعجلة الماوس.' : 'Drag map to pan, use buttons or mouse wheel to zoom.'}</p>
      </div>

      <div className="network-layout">
        <div className="network-card map-card">
          <div className="map-tools">
            <button onClick={() => zoom(0.7)} aria-label={isAr ? 'تكبير' : 'Zoom in'}>
              +
            </button>
            <button onClick={() => zoom(1 / 0.7)} aria-label={isAr ? 'تصغير' : 'Zoom out'}>
              −
            </button>
            <button onClick={() => setView(FULL_VIEW)}>{isAr ? 'إعادة ضبط' : 'Reset'}</button>
          </div>

          <svg
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className="route-map"
            role="img"
            aria-label={isAr ? 'خريطة مونوريل القاهرة: خط شرق النيل وخط غرب النيل (قيد التنفيذ)' : 'Cairo Monorail Map: East Nile Line and West Nile Line (Under Construction)'}
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
                  aria-label={getStationName(station.name, lang)}
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
                      {getStationName(station.name, lang)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Estimated train positions (East Nile) */}
            <TrainLayer />

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
                  aria-label={`${getStationName(station.name, lang)} (${isAr ? 'قيد التنفيذ' : 'Under construction'})`}
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
                      {getStationName(station.name, lang)}
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
                {isAr ? lineNames[id as keyof typeof lineNames] : 'East Nile Line'}
              </span>
            ))}
            <span>
              <i style={{ background: WEST_COLOR }} />
              {isAr ? `${westNile.name} (قيد التنفيذ)` : 'West Nile Line (Under Construction)'}
            </span>
            <span>
              <i className="legend-ring" />
              {isAr ? 'محطة تبديل' : 'Interchange Station'}
            </span>
            <TrainStatus />
          </div>
        </div>

        <aside className="network-aside">
          <h3>{isAr ? 'رحلتك' : 'Your Trip'}</h3>
          <p>
            {isAr ? 'من: ' : 'From: '}<b>{from ? getStationName(from, lang) : (isAr ? 'اختر محطة' : 'Select a station')}</b>
          </p>
          <p>
            {isAr ? 'إلى: ' : 'To: '}<b>{to ? getStationName(to, lang) : (isAr ? 'اختر محطة' : 'Select a station')}</b>
          </p>
          {route ? (
            <>
              <div className="aside-divider" />
              <span>
                {num(route.stops, locale)} {isAr ? 'محطة' : 'stations'} · {num(route.minutes, locale)} {isAr ? 'دقيقة' : 'min'}
              </span>
              <strong>{num(fareForStops(route.stops), locale)} {isAr ? 'جنيه' : 'EGP'}</strong>
              <button className="light-button map-action" onClick={() => onTicket(from, to)}>
                {isAr ? 'احجز تذكرة' : 'Book Ticket'}
              </button>
            </>
          ) : (
            <p>{isAr ? 'اضغط محطة البداية ثم الوصول.' : 'Click departure station then arrival.'}</p>
          )}
          {(from || to || westInfo) && (
            <button className="light-button map-action ghost" onClick={clear}>
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}

          {westInfo && (
            <>
              <div className="aside-divider" />
              <span>{isAr ? 'قريبًا' : 'Coming soon'}</span>
              <strong>{getStationName(westInfo.name, lang)}</strong>
              <p>
                {isAr ? `${westNile.name} · ${westNile.status}` : 'West Nile Line · Under Construction'}
              </p>
              <p>{phaseText[westInfo.phase]}</p>
              {westInfo.connections.length > 0 && (
                <p>{isAr ? 'تبديل: ' : 'Transfer: '}{westInfo.connections.map((c) => getStationName(c, lang)).join(', ')}</p>
              )}
              <p>{isAr ? `${westNile.note} الحجز متاح حاليًا على خط شرق النيل بس.` : 'Booking is currently available on the East Nile Line only.'}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
