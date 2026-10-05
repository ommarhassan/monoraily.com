import type { CSSProperties } from 'react';
import Icon from '../components/Icon';
import { lineColors, lineMeta, linePaths, plannedLines, stationById } from '../data/network';
import { operatingHours } from '../data/fares';
import { westNile, type PlannedStation } from '../data/westNile';
import { num } from '../lib/format';

const OFFICIAL_URL = 'https://www.nat.gov.eg';
const WEST_COLOR = '#7b8794';
const westStations: PlannedStation[] = westNile.stations;
const westPhases = [
  { phase: 1, title: 'المرحلة الأولى (تشغيل تجريبي مقرر في أكتوبر 2026)' },
  { phase: 2, title: 'المرحلة التانية (مقررة في الربع الأول من 2027)' },
] as const;

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
  const line = lineMeta['east-nile'];
  const path = linePaths.find((p) => p.line === 'east-nile')!;
  const groups = groupByArea(path.names);
  let counter = 0;

  return (
    <div className="subpage">
      <div className="page-heading">
        <span className="eyebrow green">شبكة المونوريل</span>
        <h1>كل محطة، في مكان واحد.</h1>
        <p>محطات خط شرق النيل بالترتيب، من الاستاد في مدينة نصر لحد مدينة العدالة في العاصمة الإدارية.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>عدد المحطات</span>
          <strong>{num(line.stationCount)}</strong>
        </div>
        <div className="stat-card">
          <span>طول الخط</span>
          <strong>
            {num(line.lengthKm)} <small>كم</small>
          </strong>
        </div>
        <div className="stat-card">
          <span>زمن الرحلة الكاملة</span>
          <strong>
            ٦٠–٧٠ <small>دقيقة</small>
          </strong>
        </div>
        <div className="stat-card">
          <span>ساعات التشغيل</span>
          <strong className="stat-small">{operatingHours}</strong>
        </div>
      </div>

      <div className="network-layout">
        <div className="network-card">
          <div className="network-header">
            <div>
              <span className="eyebrow green">دليل المحطات</span>
              <h2>{line.name}</h2>
            </div>
            <span className="network-count">{num(path.names.length)} محطة</span>
          </div>

          {groups.map((group) => (
            <div className="network-branch" key={group.area}>
              <h3>{group.area}</h3>
              <div className="network-stations" style={{ '--line-color': lineColors['east-nile'] } as CSSProperties}>
                {group.names.map((name) => {
                  const station = stationById.get(name)!;
                  const isTerminal = ++counter === 1 || counter === path.names.length;
                  return (
                    <div className="network-station" key={name}>
                      <span className={`network-node ${station.connections.length ? 'interchange' : ''}`} />
                      <span className="network-name">{name}</span>
                      {station.connections.map((c) => (
                        <span key={c.label} className={`interchange-label ${c.status === 'planned' ? 'planned' : ''}`}>
                          {c.status === 'active' ? 'تبديل: ' : ''}
                          {c.label}
                        </span>
                      ))}
                      {isTerminal && (
                        <span className="terminal-label">{counter === 1 ? 'بداية الخط' : 'نهاية الخط'}</span>
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
              <span className="eyebrow green">قريبًا</span>
              <h2>{westNile.name}</h2>
            </div>
            <span className="network-count">{westNile.status}</span>
          </div>
          <p className="source-note">
            {num(westNile.stationCount)} محطة · {num(westNile.lengthKm)} كم. {westNile.note}
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
                      <span className="network-name">{station.name}</span>
                      {station.connections.map((c) => (
                        <span key={c} className="interchange-label planned">
                          {c}
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
          <h3>قطارات بدون سائق، فوق الزحمة.</h3>
          <p>المونوريل بيشتغل أوتوماتيك على كوبري علوي، ومحطاته فيها أبواب رصيف للأمان.</p>
          <div className="aside-divider" />
          {plannedLines.map((planned) => (
            <div className="aside-planned" key={planned.name}>
              <span>قريبًا</span>
              <strong>{planned.name}</strong>
              <small>{planned.description}</small>
            </div>
          ))}
        </aside>
      </div>

      <p className="source-note">
        البيانات مبنية على الإعلانات الرسمية لمشروع المونوريل، وممكن تتغير.{' '}
        <a href={OFFICIAL_URL} target="_blank" rel="noreferrer">
          الهيئة القومية للأنفاق <Icon name="external" size={13} />
        </a>
      </p>
    </div>
  );
}
