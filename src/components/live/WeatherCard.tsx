import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudLightning,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Weather } from '../../hooks/useWeather';

const ICONS: Record<string, [LucideIcon, string]> = {
  Clear: [Sun, 'text-amber-brand bg-amber-soft'],
  'Partly cloudy': [CloudSun, 'text-amber-brand bg-amber-soft'],
  Cloudy: [Cloud, 'text-sky-brand bg-sky-soft'],
  Foggy: [CloudFog, 'text-faint bg-paper-2'],
  Rainy: [CloudRain, 'text-sky-brand bg-sky-soft'],
  Snow: [CloudSnow, 'text-sky-brand bg-sky-soft'],
  Showers: [CloudDrizzle, 'text-sky-brand bg-sky-soft'],
  Stormy: [CloudLightning, 'text-lavender-ink bg-lavender'],
};

/** Live weather at the destination (Open-Meteo). */
export default function WeatherCard({
  weather,
  destination,
}: {
  weather: Weather;
  destination: string;
}) {
  const [Icon, tint] = ICONS[weather.label] ?? [Sun, 'text-amber-brand bg-amber-soft'];

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-faint">Weather in {destination}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-[34px] font-extrabold leading-none text-ink">
            {weather.tempC}°C
          </p>
          <p className="mt-1.5 text-xs font-medium text-muted">
            {weather.label}
            {typeof weather.hi === 'number' && typeof weather.lo === 'number' && (
              <span className="text-faint">
                {' '}
                · H:{weather.hi}° L:{weather.lo}°
              </span>
            )}
          </p>
        </div>
        <span className={`flex size-12 items-center justify-center rounded-full ${tint}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
