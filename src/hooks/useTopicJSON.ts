import { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';

/**
 * Subscribe to a LiveKit text-stream topic that carries a single JSON blob
 * per stream (snapshot semantics: each send replaces the last). Returns null
 * until the first valid payload arrives.
 */
export function useTopicJSON<T>(topic: string): T | null {
  const room = useRoomContext();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    room.registerTextStreamHandler(topic, async (reader) => {
      const text = await reader.readAll();
      try {
        setData(JSON.parse(text));
      } catch {
        /* ignore malformed payload */
      }
    });
    return () => room.unregisterTextStreamHandler(topic);
  }, [room, topic]);

  return data;
}
