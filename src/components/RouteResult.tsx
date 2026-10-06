import type { CSSProperties } from 'react';
import { fareForStops } from '../data/fares';
import { lineColors, lineNames, type LineId } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';
import type { Route } from '../lib/routing';
import Icon from './Icon';
import LineBadge from './LineBadge';

type Segment = { line: LineId; start: string; end: string; stops: number };

/** Groups consecutive hops on the same line, so a transfer starts a new segment. */
function toSegments(route: Route): Segment[] {
  const segments: Segment[] = [];
  route.lines.forEach((line, i) => {
    const last = segments[segments.length - 1];
    if (last && last.line === line) {
      last.end = route.names[i + 1];
      last.stops++;
    } else {
      segments.push({ line, start: route.names[i], end: route.names[i + 1], stops: 1 });
    }
  });
  return segments;
}

type Props = { route: Route; onTicket: () => void };

export default function RouteResult({ route, onTicket }: Props) {
  const { t } = useLanguage();
  const from = route.names[0];
  const to = route.names[route.names.length - 1];
  const segments = toSegments(route);
  const halfFare = fareForStops(route.stops, 'half');

  return (
    <div className="result-card">
      <div className="result-head">
        <div>
          <span className="eyebrow green">{t('route.eyebrow')}</span>
          <h3>{t('route.title')}</h3>
        </div>
        <span className="result-pill">
          <Icon name="check" size={14} /> {t('route.available')}
        </span>
      </div>

      <div className="result-stats">
        <div>
          <span>{t('route.timeEst')}</span>
          <strong>
            {num(route.minutes)} <small>{t('route.minutes')}</small>
          </strong>
        </div>
        <div>
          <span>{t('route.stopsCount')}</span>
          <strong>
            {num(route.stops)} <small>{t('route.stops')}</small>
          </strong>
        </div>
        <div>
          <span>{t('route.fare')}</span>
          <strong>
            {num(route.fare)} <small>{t('common.egp')}</small>
          </strong>
        </div>
      </div>

      <div className="route-timeline">
        <div className="timeline-row">
          <span className="timeline-marker origin" />
          <div>
            <strong>{from}</strong>
            <small>{t('route.start')}</small>
          </div>
        </div>

        {segments.map((segment, i) => {
          const nextSegment = segments[i + 1];
          return (
            <div
              className="timeline-segment"
              key={`${segment.line}-${i}`}
              style={{ '--segment-color': lineColors[segment.line] } as CSSProperties}
            >
              <div className="segment-content">
                <LineBadge line={segment.line} />
                <span>
                  {num(segment.stops)} {segment.stops === 1 ? t('route.stops') : t('route.stopsPlural')}
                </span>
              </div>
              {nextSegment && (
                <div className="transfer-row">
                  <span className="timeline-marker transfer" />
                  <div>
                    <strong>{segment.end}</strong>
                    <small>{t('route.transferTo', { line: lineNames[nextSegment.line] })}</small>
                  </div>
                  <span className="transfer-tag">{t('route.transfer')}</span>
                </div>
              )}
            </div>
          );
        })}

        <div className="timeline-row end">
          <span className="timeline-marker destination" />
          <div>
            <strong>{to}</strong>
            <small>{t('route.end')}</small>
          </div>
        </div>
      </div>

      <button className="dark-button full" onClick={onTicket}>
        <Icon name="ticket" size={19} /> {t('route.viewDemoTicket')} <Icon name="arrow" size={18} />
      </button>
      <p className="estimate-note">
        <Icon name="info" size={15} /> {t('route.note', { half: num(halfFare) })}
      </p>
    </div>
  );
}
