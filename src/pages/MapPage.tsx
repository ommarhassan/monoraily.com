import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import MapCanvas from '../components/MapCanvas';
import { getStationName } from '../components/StationPicker';
import { lineColors, lineMeta, stations } from '../data/network';
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
        <span className="eyebrow green">{isAr ? 'الخريطة التفاعلية' : 'Interactive Map'}</span>
        <h1>{isAr ? 'شبكة المونوريل بين إيديك.' : 'The Monorail Network in Your Hands.'}</h1>
        <p>
          {isAr
            ? 'استكشف مسار خط شرق وغرب النيل والمحطات التبادلية على الخريطة.'
            : 'Explore the East & West Nile lines and interchange stations on the map.'}
        </p>
      </div>

      <div className="map-page-layout">
        <div className="map-card-wrap">
          <MapCanvas
            selectedId={selectedStationId}
            originId={originId}
            onSelect={(st) => setSelectedStationId(st.id)}
          />

          <div className="map-legend-strip">
            <span className="legend-chip">
              <span className="chip-dot" style={{ background: lineColors['east-nile'] }} />
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
