import { useWeather, weatherLabel } from '../hooks/useWeather';
import { num } from '../lib/format';

/** Small weather chip. Hides itself if the data is not available. */
export default function WeatherBadge() {
  const weather = useWeather();
  if (!weather) return null;

  return (
    <span className="weather-badge">
      <span>
        القاهرة {num(Math.round(weather.temp))}° · {weatherLabel(weather.code)}
      </span>
      <a className="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
        Open-Meteo
      </a>
    </span>
  );
}
