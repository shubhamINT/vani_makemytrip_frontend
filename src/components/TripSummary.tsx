import { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { useWeather } from '../hooks/useWeather';

interface Summary {
  destination?: string;
  dates?: string;
  duration?: string;
  travelers?: string;
  budget?: string;
}

const ROWS: { key: keyof Summary; label: string }[] = [
  { key: 'destination', label: 'Destination' },
  { key: 'dates', label: 'Dates' },
  { key: 'duration', label: 'Duration' },
  { key: 'travelers', label: 'Travelers' },
  { key: 'budget', label: 'Budget (est.)' },
];

/**
 * Pinned trip summary at the top of the right rail. Fed by the agent over the
 * `trip.summary` topic (a small JSON blob); weather is live from Open-Meteo.
 * Renders nothing until the agent sets a summary.
 */
export default function TripSummary() {
  const room = useRoomContext();
  const [summary, setSummary] = useState<Summary | null>(null);
  const weather = useWeather(summary?.destination);

  useEffect(() => {
    room.registerTextStreamHandler('trip.summary', async (reader) => {
      const text = await reader.readAll();
      try {
        setSummary(JSON.parse(text));
      } catch {
        /* ignore malformed summary */
      }
    });
    return () => room.unregisterTextStreamHandler('trip.summary');
  }, [room]);

  if (!summary) return null;
  const rows = ROWS.filter((r) => summary[r.key]);

  return (
    <section className="mmt-tripsum" aria-label="Trip summary">
      <div className="mmt-tripsum-head">
        <span className="mmt-tripsum-title">Trip summary</span>
      </div>
      <dl className="mmt-tripsum-grid">
        {rows.map((r) => (
          <div key={r.key} className="mmt-tripsum-row">
            <dt>{r.label}</dt>
            <dd>{summary[r.key]}</dd>
          </div>
        ))}
      </dl>
      {weather && (
        <div className="mmt-weather">
          <span className="mmt-weather-icon" aria-hidden="true">{weather.icon}</span>
          <div>
            <span className="mmt-weather-temp">{weather.tempC}°C</span>
            <span className="mmt-weather-label">
              {weather.label}{summary.destination ? ` · ${summary.destination}` : ''}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
