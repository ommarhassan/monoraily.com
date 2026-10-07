import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations, type Station } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';

type Props = { 
  onTicket?: (from: string, to: string) => void 
};

// إحداثيات المحطات المتناسقة على المسار
const EAST_COORDS: Record<string, { x: number; y: number }> = {
  'st-1': { x: 50, y: 160 },
  'st-2': { x: 82, y: 175 },
  'st-3': { x: 114, y: 190 },
  'st-4': { x: 146, y: 205 },
  'st-5': { x: 178, y: 215 },
  'st-6': { x: 210, y: 225 },
  'st-7': { x: 242, y: 232 },
  'st-8': { x: 274, y: 235 },
  'st-9': { x: 306, y: 235 },
  'st-10': { x: 338, y: 230 },
  'st-11': { x: 370, y: 220 },
  'st-12': { x: 402, y: 205 },
  'st-13': { x: 434, y: 185 },
  'st-14': { x: 466, y: 165 },
  'st-15': { x: 498, y: 150 },
  'st-16': { x: 530, y: 140 },
  'st-17': { x: 562, y: 135 },
  'st-18': { x: 594, y: 135 },
  'st-19': { x: 626, y: 140 },
  'st-20': { x: 658, y: 155 },
  'st-21': { x: 690, y: 175 },
  'st-22': { x: 722, y: 200 },
  'st-23': { x: 754, y: 230 },
  'st-24': { x: 786, y: 265 },
  'st-25': { x: 818, y: 300 },
  'st-26': { x: 850, y: 335 },
  'st-27': { x: 882, y: 370 },
};

const WEST_COORDS: { x: number; y: number }[] = [
  { x: 140, y: 390 },
  { x: 190, y: 350 },
  { x: 240, y: 310 },
  { x: 290, y: 270 },
  { x: 338, y: 230 },
];

const isInterchangeStation = (st: any): boolean => {
  if (!st) return false;
  return Boolean(st.isInterchange || st.interchange || st.transfer || ['st-1', 'st-10', 'st-24'].includes(st.id));
};

export default function MapPage({ onTicket }: Props) {
  const { lang } = useLanguage();
  const isAr = (lang || 'ar') === 'ar';

  const [selectedStationId, setSelectedStationId] = useState<string | null>('st-1');
  const [originId, setOriginId] = useState<string | null>(null);

  const colorsMap = lineColors as Record<string, string>;
  const metaMap = lineMeta as Record<string, any>;

  const eastColor = colorsMap['east-nile'] || '#2f6fd6';
  const westColor = colorsMap['west-nile'] || '#7b8794';

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) || stations[0],
    [selectedStationId]
  );

  const originStation = useMemo(
    () => stations.find((s) => s.id === originId),
    [originId]
  );

  const eastLinePathD = useMemo(() => {
    const points = stations.map((st) => EAST_COORDS[st.id]).filter(Boolean);
    if (!points.length) return '';
    return points.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
  }, []);

  const westLinePathD = useMemo(() => {
    return WEST_COORDS.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
  }, []);

  return (
    <div className="subpage w-full">
      <div className="page-heading">
        <span className="eyebrow green">
          {isAr ? 'الخريطة التفاعلية المستقبلية' : 'Futuristic Monorail Control'}
        </span>
        <h1>{isAr ? 'مركز التحكم في شبكة المونوريل.' : 'Monorail Control & Network Map.'}</h1>
        <p>
          {isAr
            ? 'انقر على أي محطة لاستكشاف المسارات المباشرة، محطات التبادل، والرحلات.'
            : 'Click on any station to explore live routes, interchanges, and trip planning.'}
        </p>
      </div>

      <div className="map-page-layout w-full">
        <div className="map-card-wrap w-full">
          <div
            className="interactive-map-container w-full"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #0b132b, #1c2541, #131b2e)',
              padding: '24px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
            }}
          >
            <style>{`
              @keyframes pulse-glow {
                0% { stroke-dashoffset: 1000; }
                100% { stroke-dashoffset: 0; }
              }
              .glow-line {
                stroke-dasharray: 20, 12;
                animation: pulse-glow 25s linear infinite;
              }
            `}</style>
            
            <svg viewBox="0 0 920 440" style={{ width: '100%', height: 'auto', maxHeight: '520px' }}>
              {/* Outer Glow Path */}
              <path
                d={eastLinePathD}
                fill="none"
                stroke={eastColor}
                strokeWidth="12"
                strokeOpacity="0.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main Line Path */}
              <path
                d={eastLinePathD}
                fill="none"
                stroke={eastColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Glow Animated Particle Path */}
              <path
                className="glow-line"
                d={eastLinePathD}
                fill="none"
                stroke="#5ce1e6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* West Nile Intersecting Line */}
              <path
                d={westLinePathD}
                fill="none"
                stroke={westColor}
                strokeWidth="4"
                strokeDasharray="8,6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* East Nile Stations */}
              {stations.map((st: Station, i: number) => {
                const coord = EAST_COORDS[st.id] || { x: 50 + i * 30, y: 200 };
                const cx = coord.x;
                const cy = coord.y;
                const isSelected = selectedStationId === st.id;
                const isOrigin = originId === st.id;
                const isInterchange = isInterchangeStation(st);

                return (
                  <g key={st.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStationId(st.id)}>
                    {isSelected && (
                      <circle cx={cx} cy={cy} r="14" fill="none" stroke="#5ce1e6" strokeWidth="2">
                        <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected || isOrigin ? '8' : isInterchange ? '7' : '5'}
                      fill={isOrigin ? '#ff9f43' : isSelected ? '#5ce1e6' : '#ffffff'}
                      stroke={isOrigin ? '#e67e22' : isInterchange ? '#5ce1e6' : eastColor}
                      strokeWidth="2.5"
                    />
                    <text
                      x={cx}
                      y={i % 2 === 0 ? cy - 14 : cy + 22}
                      fontSize="9.5"
                      fontWeight="700"
                      textAnchor="middle"
                      fill={isSelected ? '#5ce1e6' : '#e2e8f0'}
                      style={{ pointerEvents: 'none' }}
                    >
                      {getStationName(st.name, lang)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Legend Chips Strip */}
            <div className="map-legend-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
              <span className="legend-chip">
                <span className="chip-dot" style={{ background: eastColor, boxShadow: '0 0 8px #2f6fd6' }} />
                {isAr ? metaMap['east-nile']?.name || 'خط شرق النيل' : 'East Nile Line'}
              </span>
              <span className="legend-chip">
                <span className="chip-dot" style={{ background: westColor }} />
                {isAr ? 'خط غرب النيل (تحت الإنشاء)' : 'West Nile Line (Under Construction)'}
              </span>
              <span className="legend-chip">
                <span className="chip-ring" />
                {isAr ? 'محطة تبادلية' : 'Interchange Station'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Station Side Panel */}
        {selectedStation && (
          <aside className="map-detail-panel" style={{ marginTop: '20px' }}>
            <div className="panel-header">
              <span className="eyebrow green">{isAr ? 'تفاصيل المحطة' : 'Station Details'}</span>
              <h3>{getStationName(selectedStation.name, lang)}</h3>
              <p>{getStationName(selectedStation.area, lang)}</p>
            </div>

            {originStation && originStation.id !== selectedStation.id ? (
              <div className="panel-action-box" style={{ marginTop: '16px' }}>
                <p>
                  {isAr
                    ? `من ${getStationName(originStation.name, lang)} إلى ${getStationName(selectedStation.name, lang)}`
                    : `From ${getStationName(originStation.name, lang)} to ${getStationName(selectedStation.name, lang)}`}
                </p>
                <button
                  className="dark-button full"
                  style={{ marginTop: '12px' }}
                  onClick={() => onTicket?.(originStation.id, selectedStation.id)}
                >
                  <Icon name="ticket" size={18} />
                  <span>{isAr ? 'احجز التذكرة لهذه الرحلة' : 'Book Ticket for Route'}</span>
                </button>
              </div>
            ) : (
              <button
                className="dark-button full"
                style={{ marginTop: '16px' }}
                onClick={() => setOriginId(selectedStation.id)}
              >
                <Icon name="route" size={18} />
                <span>{isAr ? 'حددها كمحطة بداية' : 'Set as departure station'}</span>
              </button>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
