import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  useChat,
  useTranscriptions,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { openuiChatLibrary } from '@openuidev/react-ui';

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

export default function Conversation({
  agentName,
  connecting,
}: {
  agentName: string;
  connecting: boolean;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const localIdentity = localParticipant?.identity;

  const { chatMessages, send } = useChat();
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

  // Booking / interactive actions from rendered cards → round-trip to the agent.
  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === 'open_url' && typeof event.params?.url === 'string') {
        window.open(event.params.url, '_blank', 'noopener');
        return;
      }
      const message =
        event.humanFriendlyMessage ||
        (typeof event.params?.message === 'string' ? event.params.message : '');
      if (message) send(message);
    },
    [send],
  );

  const entries = useMemo<Entry[]>(() => {
    const result: Entry[] = [];
    const isAgent = (identity: string) =>
      localIdentity ? identity !== localIdentity : identity !== '' && identity !== 'web-user';

    for (const msg of chatMessages) {
      const identity = msg.from?.identity ?? '';
      result.push({
        kind: 'message',
        id: `chat-${msg.timestamp}-${identity}`,
        text: msg.message,
        isAgent: isAgent(identity),
        timestamp: msg.timestamp,
      });
    }

    for (const t of transcriptions) {
      const identity = t.participantInfo.identity;
      result.push({
        kind: 'message',
        id: `trans-${t.streamInfo.timestamp}-${identity}`,
        text: t.text,
        isAgent: isAgent(identity),
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
        listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [entries.length]);

  const toggle = (renderId: number) =>
    setMinimized((prev) => ({ ...prev, [renderId]: !prev[renderId] }));
  const dismiss = (renderId: number) =>
    setRenders((prev) => prev.filter((r) => r.renderId !== renderId));

  if (entries.length === 0) {
    return (
      <div className="mmt-feed mmt-feed--empty">
        {connecting && <p className="mmt-hint">Getting your concierge ready…</p>}
      </div>
    );
  }

  return (
    <div className="mmt-feed" ref={listRef}>
      {entries.map((e) =>
        e.kind === 'ui-render' ? (
          <section key={e.id} className="mmt-result" aria-label="Trip results">
            <div className="mmt-result-head">
              <span className="mmt-result-chip">Trip results</span>
              <div className="mmt-result-tools">
                <button
                  className="mmt-icon-btn"
                  onClick={() => toggle(e.renderId)}
                  aria-label={minimized[e.renderId] ? 'Expand results' : 'Collapse results'}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    {minimized[e.renderId] ? (
                      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                  </svg>
                </button>
                <button
                  className="mmt-icon-btn"
                  onClick={() => dismiss(e.renderId)}
                  aria-label="Dismiss results"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            {!minimized[e.renderId] && (
              <div className="mmt-result-body">
                <Renderer
                  response={e.content}
                  library={openuiChatLibrary}
                  onAction={handleAction}
                  onError={(errors) => console.error('OpenUI render error:', errors)}
                />
              </div>
            )}
          </section>
        ) : (
          <div key={e.id} className={`mmt-msg ${e.isAgent ? 'mmt-msg--agent' : 'mmt-msg--user'}`}>
            <span className="mmt-msg-who">{e.isAgent ? agentName : 'You'}</span>
            <div className="mmt-bubble">{e.text}</div>
          </div>
        ),
      )}
    </div>
  );
}
