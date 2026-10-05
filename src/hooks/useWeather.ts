import { useEffect, useState } from 'react';

export type Weather = { temp: number; feelsLike: number; code: number; wind: number };

/** Cairo city centre. Weather is for the city, not per station. */
const CAIRO = { lat: 30.0444, lng: 31.2357 };
const REFRESH_MS = 10 * 60 * 1000;

/** Arabic label for a WMO weather code. */
export function weatherLabel(code: number): string {
  if (code === 0) return 'صافي';
  if (code === 1) return 'غالبًا صافي';
  if (code === 2) return 'غيوم متفرقة';
  if (code === 3) return 'غائم';
  if (code === 45 || code === 48) return 'شبورة';
  if (code >= 51 && code <= 57) return 'رذاذ';
  if (code >= 61 && code <= 67) return 'مطر';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'ثلج';
  if (code >= 80 && code <= 82) return 'زخات مطر';
  if (code >= 95) return 'عواصف رعدية';
  return 'طقس متغيّر';
}

/** Current weather in Cairo from Open-Meteo (free, no key). Returns null until loaded or if the request fails. */
export function useWeather(): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const params = new URLSearchParams({
          latitude: String(CAIRO.lat),
          longitude: String(CAIRO.lng),
          current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
          timezone: 'Africa/Cairo',
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`weather ${res.status}`);
        const data = await res.json();
        const c = data?.current;
        if (!c || typeof c.temperature_2m !== 'number') throw new Error('bad weather payload');
        if (!cancelled) {
          setWeather({
            temp: c.temperature_2m,
            feelsLike: c.apparent_temperature,
            code: c.weather_code,
            wind: c.wind_speed_10m,
          });
        }
      } catch (e) {
        console.error('weather failed', e);
        if (!cancelled) setWeather(null); // the badge simply hides
      }
    };

    void load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return weather;
}
