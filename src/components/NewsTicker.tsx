import { fareZones, operatingHours } from '../data/fares';
import { lineMeta } from '../data/network';
import { HEADWAY_MINUTES } from '../data/schedule';
import { westNile } from '../data/westNile';
import { useWeather, weatherLabel } from '../hooks/useWeather';
import { num } from '../lib/format';

/** Add your own lines here (keep them factual: this bar looks like official news). */
const EXTRA_NEWS: string[] = [];

/** "أهم الأخبار" bar. Most lines are built from the site's own data, so they stay in sync with fares and timetable. */
export default function NewsTicker() {
  const weather = useWeather();
  const east = lineMeta['east-nile'];
  const firstPhase = westNile.stations.filter((s) => s.phase === 1).length;

  const fareText = fareZones
    .map((z) =>
      z.maxStops === Infinity ? `${num(z.full)} جنيه للخط كامل` : `${num(z.full)} جنيه لحد ${num(z.maxStops)} محطات`,
    )
    .join(' · ');

  const items: string[] = [
    ...(weather
      ? [
          `الطقس في القاهرة دلوقتي: ${num(Math.round(weather.temp))}° · ${weatherLabel(weather.code)} · الإحساس ${num(
            Math.round(weather.feelsLike),
          )}°`,
        ]
      : []),
    `${east.name}: ${num(east.stationCount)} محطة بطول ${num(east.lengthKm)} كم، من الاستاد لحد مدينة العدالة`,
    `أسعار التذاكر: ${fareText} · نصف التذكرة لكبار السن وذوي الإعاقة بعد توثيق الحساب`,
    `ساعات التشغيل: ${operatingHours} · قطار كل ${num(HEADWAY_MINUTES)} دقيقة تقريبًا`,
    `${westNile.name} (${num(westNile.stationCount)} محطة، ${num(westNile.lengthKm)} كم) ${westNile.status}: التشغيل التجريبي لأول ${num(
      firstPhase,
    )} محطات مقرر في أكتوبر ٢٠٢٦، والباقي لحد وادي النيل في الربع الأول من ٢٠٢٧ (حسب التقارير المنشورة)`,
    'التبديل متاح مع مترو الخط الثالث عند الاستاد، والأتوبيس الترددي عند المشير طنطاوي، والقطار الخفيف عند مدينة الفنون والثقافة',
    'الدفع في الموقع تجريبي ومفيش أي فلوس بتتسحب',
    ...EXTRA_NEWS,
  ];

  return (
    <section className="news-ticker" aria-label="أهم الأخبار">
      <span className="news-label">أهم الأخبار</span>
      <div className="news-viewport">
        <div className="news-track">
          <ul className="news-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {/* second copy makes the loop seamless; hidden from screen readers */}
          <ul className="news-list" aria-hidden="true">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
