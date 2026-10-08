import type { CSSProperties } from 'react';
import Icon from '../components/Icon';
import { getStationName } from '../components/StationPicker';
import { operatingHours } from '../data/fares';
import { lineColors, lineMeta, linePaths, plannedLines, stationById } from '../data/network';
import { westNile, type PlannedStation } from '../data/westNile';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';

const OFFICIAL_URL = 'https://www.nat.gov.eg';
const WEST_COLOR = '#7b8794';
const westStations: PlannedStation[] = westNile.stations;

const areaTranslations: Record<string, string> = {
  'مدينة نصر': 'Nasr City',
  'القاهرة الجديدة': 'New Cairo',
  'العاصمة الإدارية': 'New Administrative Capital',
  'التجمع الخامس': '5th Settlement',
  '6 أكتوبر': '6th of October',
  'الشيخ زايد': 'Sheikh Zayed',
};

function getAreaName(area: string, lang: string): string {
  if (lang === 'en' && areaTranslations[area]) return areaTranslations[area];
  return area;
}

function translateConnection(label: string, lang: string): string {
  if (lang === 'en') {
    if (label === 'مترو الخط الرابع (مستقبلاً)') return 'Metro Line 4 (Future)';
    if (label === 'القطار الكهربائي السريع (مستقبلاً)') return 'High-Speed Rail (Future)';
    if (label === 'مترو الخط السادس (مستقبلاً)') return 'Metro Line 6 (Future)';
    if (label === 'محطة قطارات الصعيد') return 'Upper Egypt Railway Station';
    if (label === 'مترو الخط الثالث') return 'Metro Line 3';
  }
  return getStationName(label, lang);
}

/** Splits a line's stations into runs that share the same area (Nasr City, New Cairo, New Capital...). */
function groupByArea(names: string[]) {
  const groups: { area: string; names: string[] }[] = [];
  for (const name of names) {
    const area = stationById.get(name)!.area;
    const last = groups[groups.length - 1];
    if (last && last.area === area) last.names.push(name);
    else groups.push({ area, names: [name] });
  }
  return groups;
}

export default function StationsPage() {
  const { lang, locale } = useLanguage();
  const line = lineMeta['east-nile'];
  const path = linePaths.find((p) => p.line === 'east-nile')!;
  const groups = groupByArea(path.names);
  let counter = 0;

  const isAr = lang === 'ar';

  const lineName = isAr ? line.name : 'East Nile Line';
  const westName = isAr ? westNile.name : 'West Nile Line';
  const westStatus = isAr ? westNile.status : 'Trial Operation / Under Construction';

  const westPhases = [
    {
      phase: 1,
      title: isAr
        ? 'المرحلة الأولى (تشغيل تجريبي مقرر في أكتوبر 2026)'
        : 'Phase 1 (Trial operation planned for Oct 2026)',
    },
    {
      phase: 2,
      title: isAr
        ? 'المرحلة التانية (مقررة في الربع الأول من 2027)'
        : 'Phase 2 (Planned for Q1 2027)',
    },
  ] as const;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">{isAr ? 'شبكة المونوريل' : 'Monorail Network'}</span>
        <h1>{isAr ? 'كل محطة، في مكان واحد.' : 'Every station, in one place.'}</h1>
        <p>
          {isAr
            ? 'محطات خط شرق النيل بالترتيب، من الاستاد في مدينة نصر لحد مدينة العدالة في العاصمة الإدارية.'
            : 'East Nile line stations in order, from Stadium in Nasr City to Justice City in the Administrative Capital.'}
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>{isAr ? 'عدد المحطات' : 'Number of Stations'}</span>
          <strong>{num(line.stationCount, locale)}</strong>
        </div>
        <div className="stat-card">
          <span>{isAr ? 'طول الخط' : 'Line Length'}</span>
          <strong>
            {num(line.lengthKm, locale)} <small>{isAr ? 'كم' : 'km'}</small>
          </strong>
        </div>
        <div className="stat-card">
          <span>{isAr ? 'زمن الرحلة الكاملة' : 'Full Trip Duration'}</span>
          <strong>
            {isAr ? '٦٠–٧٠' : '60–70'} <small>{isAr ? 'دقيقة' : 'min'}</small>
          </strong>
        </div>
        <div className="stat-card">
          <span>{isAr ? 'ساعات التشغيل' : 'Operating Hours'}</span>
          <strong className="stat-small">{operatingHours}</strong>
        </div>
      </div>

      <div className="network-layout">
        <div className="network-card">
          <div className="network-header">
            <div>
              <span className="eyebrow green">{isAr ? 'دليل المحطات' : 'Stations Guide'}</span>
              <h2>{lineName}</h2>
            </div>
            <span className="network-count">
              {num(path.names.length, locale)} {isAr ? 'محطة' : 'stations'}
            </span>
          </div>

          {groups.map((group) => (
            <div className="network-branch" key={group.area}>
              <h3>{getAreaName(group.area, lang)}</h3>
              <div className="network-stations" style={{ '--line-color': lineColors['east-nile'] } as CSSProperties}>
                {group.names.map((name) => {
                  const station = stationById.get(name)!;
                  const isTerminal = ++counter === 1 || counter === path.names.length;
                  return (
                    <div className="network-station" key={name}>
                      <span className={`network-node ${station.connections.length ? 'interchange' : ''}`} />
                      <span className="network-name">{getStationName(name, lang)}</span>
                      {station.connections.map((c) => (
                        <span key={c.label} className={`interchange-label ${c.status === 'planned' ? 'planned' : ''}`}>
                          {c.status === 'active' ? (isAr ? 'تبديل: ' : 'Transfer: ') : ''}
                          {translateConnection(c.label, lang)}
                        </span>
                      ))}
                      {isTerminal && (
                        <span className="terminal-label">
                          {counter === 1 ? (isAr ? 'بداية الخط' : 'Line start') : (isAr ? 'نهاية الخط' : 'Line end')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* West Nile: information only, no booking yet */}
          <div className="network-header">
            <div>
              <span className="eyebrow green">{isAr ? 'قريبًا' : 'Coming soon'}</span>
              <h2>{westName}</h2>
            </div>
            <span className="network-count">{westStatus}</span>
          </div>
          <p className="source-note">
            {num(westNile.stationCount, locale)} {isAr ? 'محطة' : 'stations'} · {num(westNile.lengthKm, locale)} {isAr ? 'كم.' : 'km.'}{' '}
            {isAr ? westNile.note : 'Trial operation starting soon.'}
          </p>

          {westPhases.map(({ phase, title }) => (
            <div className="network-branch" key={phase}>
              <h3>{title}</h3>
              <div className="network-stations" style={{ '--line-color': WEST_COLOR } as CSSProperties}>
                {westStations
                  .filter((station) => station.phase === phase)
                  .map((station) => (
                    <div className="network-station" key={station.name}>
                      <span className={`network-node ${station.connections.length ? 'interchange' : ''}`} />
                      <span className="network-name">{getStationName(station.name, lang)}</span>
                      {station.connections.map((c) => (
                        <span key={c} className="interchange-label planned">
                          {translateConnection(c, lang)}
                        </span>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="network-aside">
          <div className="aside-symbol">
            <Icon name="monorail" size={26} />
          </div>
          <h3>{isAr ? 'قطارات بدون سائق، فوق الزحمة.' : 'Driverless trains, above traffic.'}</h3>
          <p>
            {isAr
              ? 'المونوريل بيشتغل أوتوماتيك على كوبري علوي، ومحطاته فيها أبواب رصيف للأمان.'
              : 'The monorail operates automatically on an elevated viaduct, with platform screen doors for safety.'}
          </p>
          <div className="aside-divider" />
          {plannedLines.map((planned) => (
            <div className="aside-planned" key={planned.name}>
              <span>{isAr ? 'قريبًا' : 'Coming soon'}</span>
              <strong>{isAr ? planned.name : translateConnection(planned.name, lang)}</strong>
              <small>
                {isAr
                  ? planned.description
                  : 'Under construction: 13 stations from 6th of October to Wadi El Nile'}
              </small>
            </div>
          ))}
        </aside>
      </div>

      <p className="source-note">
        {isAr
          ? 'البيانات مبنية على الإعلانات الرسمية لمشروع المونوريل، وممكن تتغير. '
          : 'Data is based on official monorail project announcements and subject to change. '}
        <a href={OFFICIAL_URL} target="_blank" rel="noreferrer">
          {isAr ? 'الهيئة القومية للأنفاق' : 'National Authority for Tunnels'} <Icon name="external" size={13} />
        </a>
      </p>
    </div>
  );
}
