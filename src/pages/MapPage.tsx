import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations, type Station } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';

type Props = { onTicket?: (from: string, to: string) => void };

const EAST_COORDS: Record<string, { x: number; y: number }> = {
  'st-1': { x: 60, y: 140 },   // Stadium
  'st-2': { x: 90, y: 155 },   // Hisham Barakat
  'st-3': { x: 120, y: 170 },  // Nouri Khattab
  'st-4': { x: 150, y: 185 },  // Al-Azhar University
  'st-5': { x: 180, y: 195 },  // 7th District
  'st-6': { x: 210, y: 205 },  // Ahmed El-Zomor
  'st-7': { x: 240, y: 215 },  // 10th District
  'st-8': { x: 270, y: 220 },  // Zahraa Nasr City
  'st-9': { x: 300, y: 225 },  // Ring Road
  'st-10': { x: 330, y: 225 }, // El Mushir Tantawi
  'st-11': { x: 360, y: 220 }, // El Mushir Ahmed Ismail
  'st-12': { x: 390, y: 210 }, // Gehan El-Sadat
  'st-13': { x: 420, y: 195 }, // One Ninety
  'st-14': { x: 450, y: 175 }, // Air Force Hospital
  'st-15': { x: 480, y: 155 }, // El Narges
  'st-16': { x: 510, y: 140 }, // Investors District
  'st-17': { x: 540, y: 130 }, // El Lotus
  'st-18': { x: 570, y: 125 }, // Golden Square
  'st-19': { x: 600, y: 125 }, // Beit El Watan
  'st-20': { x: 630, y: 135 }, // Al-Fattah Al-Aleem Mosque
  'st-21': { x: 660, y: 150 }, // R1 District
  'st-22': { x: 690, y: 175 }, // R2 District
  'st-23': { x: 720, y: 205 }, // Financial & Business District
  'st-24': { x: 750, y: 240 }, // Arts & Culture City
  'st-25': { x: 780, y: 275 }, // Government District
  'st-26': { x: 805, y: 310 }, // Misr Mosque
  'st-27': { x: 825, y: 345 }, // Justice City
};

const WEST_COORDS: { x: number; y: number }[] = [
  { x: 120, y: 360 },
  { x: 160, y: 345 },
  { x: 200, y: 325 },
  { x: 240, y: 300 },
  { x: 280, y: 270 },
  { x: 320, y: 235 },
  { x: 360, y: 195 },
];

export default function MapPage({ onTicket }: Props) {
  const { lang, t } = useLanguage();
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [originId, setOriginId] = useState<string | null>(null);
  const isAr = lang === 'ar';

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId),
    [selectedStationId],
  );

  const originStation = useMemo(
    () => stations.find((s) => s.id === originId),
    [originId],
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
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{isAr ? 'الخريطة التفاعلية المستقبلية' : 'Futuristic Monorail Control'}</span>
        <h1>{isAr ? 'مركز التحكم في شبكة المونوريل.' : 'Monorail Control & Network Map.'}</h1>
        <p>
          {isAr
            ? 'انقر على أي محطة لاستكشاف المسارات المباشرة، محطات التبادل، والرحلات.'
            : 'Click on any station to explore live routes, interchanges, and trip planning.'}
        </p>
      </div>

      <div className="map-page-layout">
        <div className="map-card-wrap">
          <div
            className="interactive-map-container"
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
            <svg viewBox="0 0 900 450" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
              <path
                d={eastLinePathD}
                fill="none"
                stroke={lineColors['east-nile']}
                strokeWidth="12"
                strokeOpacity="0.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={eastLinePathD}
                fill="none"
                stroke={lineColors['east-nile']}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="glow-line"
                d={eastLinePathD}
                fill="none"
                stroke="#5ce1e6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={westLinePathD}
                fill="none"
                stroke="#7b8794"
                strokeWidth="4"
                strokeDasharray="8,6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {stations.map((st: Station, i: number) => {
                const coord = EAST_COORDS[st.id] || { x: 80 + i * 30, y: 200 };
                const cx = coord.x;
                const cy = coord.y;
                const isSelected = selectedStationId === st.id;
                const isOrigin = originId === st.id;

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
                      r={isSelected || isOrigin ? '8' : '5'}
                      fill={isOrigin ? '#ff9f43' : isSelected ? '#5ce1e6' : '#ffffff'}
                      stroke={isOrigin ? '#e67e22' : lineColors['east-nile']}
                      strokeWidth="3"
                    />
                    <text
                      x={cx}
                      y={i % 2 === 0 ? cy - 14 : cy + 22}
                      fontSize="9.5"
                      fontWeight="700"
                      textAnchor="middle"
                      fill={isSelected ? '#5ce1e6' : '#e2e8f0'}
                    >
                      {getStationName(st.name, lang)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="map-legend-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
            <span className="legend-chip">
              <span className="chip-dot" style={{ background: lineColors['east-nile'], boxShadow: '0 0 8px #2f6fd6' }} />
              {isAr ? lineMeta['east-nile'].name : 'East Nile Line'}
            </span>
            <span className="legend-chip">
              <span className="chip-dot" style={{ background: '#7b8794' }} />
              {isAr ? 'خط غرب النيل (تحت الإنشاء)' : 'West Nile Line (Under Construction)'}
            </span>
            <span className="legend-chip">
              <span className="chip-ring" />
              {isAr ? 'محطة تبادلية' : 'Interchange Station'}
            </span>
            <span className="legend-chip">
              <span className="chip-dot closed" />
              {isAr ? 'خارج ساعات التشغيل' : 'Out of operating hours'}
            </span>
          </div>
        </div>

        {selectedStation && (
          <aside className="map-detail-panel">
            <div className="panel-header">
              <span className="eyebrow green">{isAr ? 'تفاصيل المحطة' : 'Station Details'}</span>
              <h3>{getStationName(selectedStation.name, lang)}</h3>
              <p>{getStationName(selectedStation.area, lang)}</p>
            </div>

            {originStation && originStation.id !== selectedStation.id ? (
              <div className="panel-action-box">
                <p>
                  {isAr
                    ? `من ${getStationName(originStation.name, lang)} إلى ${getStationName(selectedStation.name, lang)}`
                    : `From ${getStationName(originStation.name, lang)} to ${getStationName(selectedStation.name, lang)}`}
                </p>
                <button
                  className="dark-button full"
                  onClick={() => onTicket?.(originStation.id, selectedStation.id)}
                >
                  <Icon name="ticket" size={18} /> {t('fares.ctaButton')}
                </button>
              </div>
            ) : (
              <button className="dark-button full" onClick={() => setOriginId(selectedStation.id)}>
                <Icon name="route" size={18} />
                {isAr ? 'حددها كمحطة بداية' : 'Set as departure station'}
              </button>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
