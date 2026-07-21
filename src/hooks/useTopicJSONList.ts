import { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { MOCK, MOCK_TOPICS } from '../dev/fixtures';

/** Normalize a mock seed to an array (accepts a single object or a list). */
function seed<T>(topic: string): T[] {
  if (!MOCK) return [];
  const v = MOCK_TOPICS[topic];
  if (v == null) return [];
  return (Array.isArray(v) ? v : [v]) as T[];
}

/**
 * Like useTopicJSON, but each stream on the topic is a distinct event that is
 * APPENDED (not replaced). Used for things that stack — e.g. booking
 * confirmations, where a second booking must not clobber the first.
 */
export function useTopicJSONList<T>(topic: string): T[] {
  const room = useRoomContext();
  const [items, setItems] = useState<T[]>(() => seed<T>(topic));

  useEffect(() => {
    if (MOCK) return; // dev preview: seeded from fixtures, no live stream
    room.registerTextStreamHandler(topic, async (reader) => {
      const text = await reader.readAll();
      try {
        setItems((prev) => [...prev, JSON.parse(text) as T]);
      } catch {
        /* ignore malformed payload */
      }
    });
    return () => room.unregisterTextStreamHandler(topic);
  }, [room, topic]);

  return items;
}
