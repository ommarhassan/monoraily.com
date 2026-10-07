import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations, type Station } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';

type Props = { onTicket?: (from: string, to: string) => void };

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
              {/* Glow backdrop path */}
              <path
                d="M 80 120 C 220 40, 380 380, 620 120 C 680 50, 780 70, 750 160 C 720 250, 820 280, 850 220"
                fill="none"
                stroke={lineColors['east-nile']}
                strokeWidth="14"
                strokeOpacity="0.2"
                strokeLinecap="round"
              />
              {/* Main Line path */}
              <path
                d="M 80 120 C 220 40, 380 380, 620 120 C 680 50, 780 70, 750 160 C 720 250, 820 280, 850 220"
                fill="none"
                stroke={lineColors['east-nile']}
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Electric pulse line */}
              <path
                className="glow-line"
                d="M 80 120 C 220 40, 380 380, 620 120 C 680 50, 780 70, 750 160 C 720 250, 820 280, 850 220"
                fill="none"
                stroke="#5ce1e6"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* West Nile Line path */}
              <path
                d="M 100 360 C 240 340, 320 260, 360 180"
                fill="none"
                stroke="#7b8794"
                strokeWidth="4"
                strokeDasharray="8,6"
                strokeLinecap="round"
              />

              {/* Station Nodes */}
              {stations.map((st: Station, i: number) => {
                const cx = 80 + i * 36;
                const cy = 120 + Math.sin(i * 0.45) * 80;
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
                      y={i % 2 === 0 ? cy - 14 : cy + 20}
                      fontSize="10"
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

          <div className="map-legend-strip">
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
