import { fareZones } from '../data/fares';
import { lineMeta } from '../data/network';
import { HEADWAY_MINUTES } from '../data/schedule';
import { westNile } from '../data/westNile';
import { useWeather, weatherLabel } from '../hooks/useWeather';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';

const EXTRA_NEWS: string[] = [];

export default function NewsTicker() {
  const { lang, t } = useLanguage();
  const weather = useWeather();
  const east = lineMeta['east-nile'];
  const firstPhase = westNile.stations.filter((s) => s.phase === 1).length;

  const lineName = lang === 'en' ? 'East Nile Line' : east.name;
  const westName = lang === 'en' ? 'West Nile Line' : westNile.name;
  const westStatus = lang === 'en' ? 'Under construction' : westNile.status;

  const fareText = fareZones
    .map((z) =>
      z.maxStops === Infinity
        ? t('news.fareFull', { price: num(z.full) })
        : t('news.fareZone', { price: num(z.full), stops: num(z.maxStops) }),
    )
    .join(' · ');

  const items: string[] = [
    ...(weather
      ? [
          t('news.weather', {
            temp: num(Math.round(weather.temp)),
            label: weatherLabel(weather.code, lang),
            feels: num(Math.round(weather.feelsLike)),
          }),
        ]
      : []),
    t('news.line', { name: lineName, count: num(east.stationCount), km: num(east.lengthKm) }),
    t('news.fares', { text: fareText }),
    t('news.hours', { hours: t('fares.operatingHours'), n: num(HEADWAY_MINUTES) }),
    t('news.west', {
      name: westName,
      count: num(westNile.stationCount),
      km: num(westNile.lengthKm),
      status: westStatus,
      first: num(firstPhase),
    }),
    t('news.interchange'),
    t('news.demoPay'),
    ...EXTRA_NEWS,
  ];

  return (
    <section className="news-ticker" aria-label={t('news.label')}>
      <span className="news-label">{t('news.label')}</span>
      <div className="news-viewport">
        <div className="news-track">
          <ul className="news-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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
