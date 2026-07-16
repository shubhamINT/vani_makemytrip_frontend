import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat, useRoomContext } from '@livekit/components-react';
import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { openuiChatLibrary } from '@openuidev/react-ui';

interface UIRender {
  id: string;
  renderId: number;
  content: string;
}

/**
 * The main stage: generative UI streamed from the agent over the `ui.render`
 * LiveKit topic. Renders stack newest-at-bottom and auto-scroll.
 */
export default function Stage({ connecting }: { connecting: boolean }) {
  const room = useRoomContext();
  const { send } = useChat();

  const [renders, setRenders] = useState<UIRender[]>([]);
  const [minimized, setMinimized] = useState<Record<number, boolean>>({});
  const idRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    room.registerTextStreamHandler('ui.render', async (reader) => {
      const text = await reader.readAll();
      const renderId = idRef.current++;
      setRenders((prev) => [...prev, { id: `ui-${renderId}`, renderId, content: text }]);
    });
    return () => room.unregisterTextStreamHandler('ui.render');
  }, [room]);

  useEffect(() => {
    requestAnimationFrame(() => {
      stageRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [renders.length]);

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

  const toggle = (renderId: number) =>
    setMinimized((prev) => ({ ...prev, [renderId]: !prev[renderId] }));
  const dismiss = (renderId: number) =>
    setRenders((prev) => prev.filter((r) => r.renderId !== renderId));

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
    <div className="mmt-stage" ref={stageRef}>
      {renders.map((e) => (
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
      ))}
    </div>
  );
}
