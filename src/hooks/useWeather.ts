import { useState, useEffect } from 'react';

export interface Weather {
  tempC: number;
  hi?: number;
  lo?: number;
  label: string;
  icon: string;
}

// WMO weather codes → a coarse label + emoji. ponytail: buckets, not all 28 codes.
function describe(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' };
  if (code <= 2) return { label: 'Partly cloudy', icon: '⛅' };
  if (code <= 3) return { label: 'Cloudy', icon: '☁️' };
  if (code <= 48) return { label: 'Foggy', icon: '🌫️' };
  if (code <= 67) return { label: 'Rainy', icon: '🌧️' };
  if (code <= 77) return { label: 'Snow', icon: '🌨️' };
  if (code <= 82) return { label: 'Showers', icon: '🌦️' };
  return { label: 'Stormy', icon: '⛈️' };
}

/**
 * Live current weather for a city name via Open-Meteo (free, no API key).
 * Geocodes the name, then fetches current temp + today's high/low. Returns
 * null until resolved or on any failure (caller hides the widget).
 */
export function useWeather(city: string | undefined): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (!city) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setWeather(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        ).then((r) => r.json());
        const place = geo?.results?.[0];
        if (!place) return;
        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`,
        ).then((r) => r.json());
        const cur = wx?.current;
        if (cancelled || !cur) return;
        const hi = wx?.daily?.temperature_2m_max?.[0];
        const lo = wx?.daily?.temperature_2m_min?.[0];
        setWeather({
          tempC: Math.round(cur.temperature_2m),
          hi: typeof hi === 'number' ? Math.round(hi) : undefined,
          lo: typeof lo === 'number' ? Math.round(lo) : undefined,
          ...describe(cur.weather_code),
        });
      } catch {
        if (!cancelled) setWeather(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city]);

  return weather;
}
