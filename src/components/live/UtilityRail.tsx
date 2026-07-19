import { useCallback } from 'react';
import { useChat } from '@livekit/components-react';
import { useTopicJSON } from '../../hooks/useTopicJSON';
import { useWeather } from '../../hooks/useWeather';
import type { TripSummaryData } from '../../lib/streamTypes';
import TripSummaryCard from './TripSummaryCard';
import WeatherCard from './WeatherCard';
import HelpCard from './HelpCard';

/** Right column: trip summary, live weather, help — quiet utility cards. */
export default function UtilityRail() {
  const { send } = useChat();
  const summary = useTopicJSON<TripSummaryData>('trip.summary');
  const weather = useWeather(summary?.destination);

  const sendAction = useCallback(
    (message: string) => {
      void Promise.resolve(send(message)).catch(() => {});
    },
    [send],
  );

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pb-32">
      {summary && <TripSummaryCard summary={summary} onAction={sendAction} />}
      {weather && summary?.destination && (
        <WeatherCard weather={weather} destination={summary.destination} />
      )}
      <HelpCard />
    </div>
  );
}
