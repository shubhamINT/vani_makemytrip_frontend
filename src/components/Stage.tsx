import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useChat, useRoomContext } from '@livekit/components-react';
import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { openuiChatLibrary } from '@openuidev/react-ui';

interface UIRender {
  id: string;
  renderId: number;
  content: string;
  streaming: boolean;
  tab: string;
  title: string;
}

// Canonical dashboard tabs, in display order. The agent tags each render with
// one of these keys via the stream's `tab` attribute (falls back to overview).
const TAB_ORDER = [
  'overview',
  'hotels',
  'flights',
  'experiences',
  'food',
  'itinerary',
  'budget',
  'visa',
] as const;
const TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  hotels: 'Hotels',
  flights: 'Flights',
  experiences: 'Experiences',
  food: 'Food',
  itinerary: 'Itinerary',
  budget: 'Budget',
  visa: 'Visa',
};
// Minimal line icons per tab (20x20, currentColor).
const TAB_ICONS: Record<string, string> = {
  overview: 'M4 5h7v7H4zM13 5h7v4h-7zM13 11h7v8h-7zM4 14h7v5H4z',
  hotels: 'M3 20V9l9-5 9 5v11h-6v-6H9v6zM3 20h18',
  flights: 'M2 16l9-3V5.5a1.5 1.5 0 0 1 3 0V13l7 2.5V18l-7-2v3l2 1.5V22l-3.5-1L9 22v-1.5L11 19v-3l-9 2z',
  experiences: 'M12 2l2.5 6.5H21l-5 4 2 7-6-4-6 4 2-7-5-4h6.5z',
  food: 'M7 2v8a2 2 0 0 0 4 0V2M9 2v20M17 2c-1.5 0-3 2-3 6s1.5 5 3 5v9',
  itinerary: 'M8 2v3M16 2v3M4 8h16M4 6h16v14H4zM8 12h4M8 16h8',
  budget: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  visa: 'M4 4h16v16H4zM4 9h16M8 14h5M8 17h8',
};
const normTab = (t: string) => (TAB_ORDER.includes(t as never) ? t : 'overview');

/**
 * The main stage: generative UI streamed from the agent over the `ui.render`
 * LiveKit topic. Renders are grouped into dashboard tabs by the stream's `tab`
 * attribute; the newest render's tab becomes active so results surface as we talk.
 */
export default function Stage({ connecting }: { connecting: boolean }) {
  const room = useRoomContext();
  const { send } = useChat();

  const [renders, setRenders] = useState<UIRender[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const idRef = useRef(0);
  const seq = useRef(new Map<string, number>());
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // openui-lang is streamed line-by-line: read incrementally and re-render
    // each chunk. readAll() would block until close and kill the live build.
    const upsert = (
      streamId: string,
      content: string,
      streaming: boolean,
      tab: string,
      title: string,
    ) => {
      let renderId = seq.current.get(streamId);
      if (renderId === undefined) {
        renderId = idRef.current++;
        seq.current.set(streamId, renderId);
      }
      const rid = renderId;
      setRenders((prev) => {
        const i = prev.findIndex((r) => r.renderId === rid);
        const next: UIRender = { id: `ui-${rid}`, renderId: rid, content, streaming, tab, title };
        if (i === -1) return [...prev, next];
        const copy = prev.slice();
        copy[i] = next;
        return copy;
      });
      setActiveTab(tab); // follow the freshest result onto its tab
    };

    room.registerTextStreamHandler('ui.render', async (reader) => {
      const streamId = reader.info.id;
      const attrs = reader.info.attributes ?? {};
      const tab = normTab(attrs.tab ?? 'overview');
      const title = attrs.title ?? '';
      let text = '';
      for await (const chunk of reader) {
        text += chunk;
        upsert(streamId, text, true, tab, title);
      }
      upsert(streamId, text, false, tab, title);
    });
    return () => room.unregisterTextStreamHandler('ui.render');
  }, [room]);

  // Tabs that actually have content, in canonical order.
  const tabs = useMemo(() => {
    const present = new Set(renders.map((r) => r.tab));
    return TAB_ORDER.filter((t) => present.has(t));
  }, [renders]);

  const visible = useMemo(() => renders.filter((r) => r.tab === activeTab), [renders, activeTab]);

  useEffect(() => {
    requestAnimationFrame(() => {
      bodyRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [visible.length, activeTab]);

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

  if (renders.length === 0) {
    return (
      <div className="mmt-stage mmt-stage--empty">
        <div className="mmt-stage-placeholder">
          <span className="mmt-stage-orb" aria-hidden="true" />
          <p className="mmt-stage-lead">Your trip takes shape here</p>
          <p className="mmt-stage-sub">
            {connecting ? 'Getting your concierge ready…' : 'Flights, hotels and plans appear as we talk.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mmt-stage">
      <div className="mmt-tabs" role="tablist" aria-label="Trip sections">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={t === activeTab}
            className={`mmt-tab${t === activeTab ? ' is-active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={TAB_ICONS[t]} />
            </svg>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="mmt-dash-body" ref={bodyRef}>
        {visible.map((e) => (
          <section key={e.id} className="mmt-dash-card" aria-label={e.title || TAB_LABELS[e.tab]}>
            {e.title && <h2 className="mmt-dash-title">{e.title}</h2>}
            <Renderer
              response={e.content}
              library={openuiChatLibrary}
              isStreaming={e.streaming}
              onAction={handleAction}
              onError={(errors) => {
                // Partial/forward-ref errors are expected while streaming.
                if (!e.streaming) console.error('OpenUI render error:', errors);
              }}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
