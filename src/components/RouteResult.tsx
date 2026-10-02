import type { CSSProperties } from 'react';
import { fareForStops } from '../data/fares';
import { lineColors, lineNames, type LineId } from '../data/network';
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
  const from = route.names[0];
  const to = route.names[route.names.length - 1];
  const segments = toSegments(route);
  const halfFare = fareForStops(route.stops, 'half');

  return (
    <div className="result-card">
      <div className="result-head">
        <div>
          <span className="eyebrow green">مسارك المقترح</span>
          <h3>وصلتك أسهل مما تتخيل</h3>
        </div>
        <span className="result-pill">
          <Icon name="check" size={14} /> مسار متاح
        </span>
      </div>

      <div className="result-stats">
        <div>
          <span>المدة التقديرية</span>
          <strong>
            {num(route.minutes)} <small>دقيقة</small>
          </strong>
        </div>
        <div>
          <span>عدد المحطات</span>
          <strong>
            {num(route.stops)} <small>محطة</small>
          </strong>
        </div>
        <div>
          <span>سعر التذكرة</span>
          <strong>
            {num(route.fare)} <small>جنيه</small>
          </strong>
        </div>
      </div>

      <div className="route-timeline">
        <div className="timeline-row">
          <span className="timeline-marker origin" />
          <div>
            <strong>{from}</strong>
            <small>بداية الرحلة</small>
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
                  {num(segment.stops)} {segment.stops === 1 ? 'محطة' : 'محطات'}
                </span>
              </div>
              {nextSegment && (
                <div className="transfer-row">
                  <span className="timeline-marker transfer" />
                  <div>
                    <strong>{segment.end}</strong>
                    <small>بدّل إلى {lineNames[nextSegment.line]}</small>
                  </div>
                  <span className="transfer-tag">تبديل</span>
                </div>
              )}
            </div>
          );
        })}

        <div className="timeline-row end">
          <span className="timeline-marker destination" />
          <div>
            <strong>{to}</strong>
            <small>الوصول</small>
          </div>
        </div>
      </div>

      <button className="dark-button full" onClick={onTicket}>
        <Icon name="ticket" size={19} /> اعرض تذكرة تجريبية <Icon name="arrow" size={18} />
      </button>
      <p className="estimate-note">
        <Icon name="info" size={15} /> المدة تقديرية وليست موعد قطار مباشر. نصف التذكرة {num(halfFare)} جنيه لكبار السن
        وذوي الإعاقة.
      </p>
    </div>
  );
}
