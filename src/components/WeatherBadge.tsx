import { useWeather, weatherLabel } from '../hooks/useWeather';
import { useLanguage } from '../i18n/LanguageContext';
import { num } from '../lib/format';

/** Small weather chip. Hides itself if the data is not available. */
export default function WeatherBadge() {
  const weather = useWeather();
  const { lang } = useLanguage();
  if (!weather) return null;

  const city = lang === 'ar' ? 'القاهرة' : 'Cairo';

  return (
    <span className="weather-badge">
      <span>
        {city} {num(Math.round(weather.temp))}° · {weatherLabel(weather.code, lang)}
      </span>
      <a className="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
        Open-Meteo
      </a>
    </span>
  );
}
