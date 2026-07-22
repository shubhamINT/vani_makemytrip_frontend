import { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { MOCK, MOCK_TOPICS } from '../dev/fixtures';

/** Append `items` onto `all`, skipping any whose key is already present. */
export function mergeById<I>(all: I[], items: I[], keyOf: (i: I) => string): I[] {
  const seen = new Set(all.map(keyOf));
  const fresh = items.filter((i) => !seen.has(keyOf(i)));
  return fresh.length ? [...all, ...fresh] : all;
}

/**
 * Like useTopicJSON (snapshot/replace) but ALSO keeps an id-deduped list of
 * every item seen across snapshots. `latest` powers the Overview (replace);
 * `all` powers the section tab (append: e.g. Kolkata hotels stay when Delhi
 * hotels arrive).
 */
export function useTopicJSONAccumulate<T, I>(
  topic: string,
  pick: (t: T) => I[],
  keyOf: (i: I) => string,
): { latest: T | null; all: I[] } {
  const room = useRoomContext();
  const seed = MOCK ? ((MOCK_TOPICS[topic] as T) ?? null) : null;
  const [latest, setLatest] = useState<T | null>(seed);
  const [all, setAll] = useState<I[]>(seed ? pick(seed) : []);

  useEffect(() => {
    if (MOCK) return; // dev preview: seeded from fixtures, no live stream
    room.registerTextStreamHandler(topic, async (reader) => {
      const text = await reader.readAll();
      try {
        const parsed = JSON.parse(text) as T;
        setLatest(parsed);
        setAll((prev) => mergeById(prev, pick(parsed), keyOf));
      } catch {
        /* ignore malformed payload */
      }
    });
    return () => room.unregisterTextStreamHandler(topic);
  }, [room, topic, pick, keyOf]);

  return { latest, all };
}
