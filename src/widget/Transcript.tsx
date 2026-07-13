import { useState, useEffect, useMemo, useRef } from 'react';
import {
  useChat,
  useTranscriptions,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import { Renderer } from '@openuidev/react-lang';
import { openuiChatLibrary } from '@openuidev/react-ui';

const AGENT = (import.meta.env.VITE_AGENT_NAME as string) || 'Voice Assistant';

interface MessageEntry {
  kind: 'message';
  id: string;
  text: string;
  isAgent: boolean;
  timestamp: number;
}

interface UIRenderEntry {
  kind: 'ui-render';
  id: string;
  content: string;
  timestamp: number;
  renderId: number;
}

type Entry = MessageEntry | UIRenderEntry;

export default function Transcript() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const localIdentity = localParticipant?.identity;

  const { chatMessages } = useChat();
  const transcriptions = useTranscriptions();

  const [renders, setRenders] = useState<UIRenderEntry[]>([]);
  const [minimized, setMinimized] = useState<Record<number, boolean>>({});
  const idRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    room.registerTextStreamHandler('ui.render', async (reader) => {
      const text = await reader.readAll();
      const renderId = idRef.current++;
      setRenders((prev) => [
        ...prev,
        { kind: 'ui-render', id: `ui-${renderId}`, content: text, timestamp: Date.now(), renderId },
      ]);
    });
  }, [room]);

  const entries = useMemo<Entry[]>(() => {
    const result: Entry[] = [];

    for (const msg of chatMessages) {
      const identity = msg.from?.identity ?? '';
      result.push({
        kind: 'message',
        id: `chat-${msg.timestamp}-${identity}`,
        text: msg.message,
        isAgent: localIdentity ? identity !== localIdentity : identity !== '' && identity !== 'web-user',
        timestamp: msg.timestamp,
      });
    }

    for (const t of transcriptions) {
      const identity = t.participantInfo.identity;
      result.push({
        kind: 'message',
        id: `trans-${t.streamInfo.timestamp}-${identity}`,
        text: t.text,
        isAgent: localIdentity ? identity !== localIdentity : identity !== '' && identity !== 'web-user',
        timestamp: t.streamInfo.timestamp,
      });
    }

    result.push(...renders);
    result.sort((a, b) => a.timestamp - b.timestamp);
    return result;
  }, [chatMessages, transcriptions, renders, localIdentity]);

  useEffect(() => {
    if (entries.length > prevLen.current) {
      prevLen.current = entries.length;
      requestAnimationFrame(() => {
        listRef.current?.lastElementChild?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }, [entries.length]);

  const toggle = (renderId: number) =>
    setMinimized((prev) => ({ ...prev, [renderId]: !prev[renderId] }));

  const dismiss = (renderId: number) =>
    setRenders((prev) => prev.filter((r) => r.renderId !== renderId));

  if (entries.length === 0) return null;

  return (
    <div className="vw-transcript" ref={listRef}>
      {entries.map((e) =>
        e.kind === 'ui-render' ? (
          <div key={e.id} className="vw-openui-card">
            <div className="vw-openui-header">
              <button
                className="vw-openui-toggle"
                onClick={() => toggle(e.renderId)}
                aria-label={minimized[e.renderId] ? 'Expand' : 'Minimize'}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  {minimized[e.renderId] ? (
                    <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </button>
              <span className="vw-openui-label">Agent Response</span>
              <button
                className="vw-openui-close"
                onClick={() => dismiss(e.renderId)}
                aria-label="Dismiss"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {!minimized[e.renderId] && (
              <div className="vw-openui-body">
                <Renderer
                  response={e.content}
                  library={openuiChatLibrary}
                  onError={(errors) => console.error('OpenUI render error:', errors)}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            key={e.id}
            className={`vw-msg ${e.isAgent ? 'vw-msg--agent' : 'vw-msg--user'}`}
          >
            <div className="vw-msg-label">
              {e.isAgent ? AGENT : 'You'}
            </div>
            <div className="vw-msg-text">{e.text}</div>
            <div className="vw-msg-time">
              {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
      )}
    </div>
  );
}