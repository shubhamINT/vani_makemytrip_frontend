import { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useVoiceAssistant } from '@livekit/components-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useConversation } from '../../hooks/useConversation';
import MessageBubble from './MessageBubble';
import ThinkingChecklist from './ThinkingChecklist';

/** Left column: the Myra conversation — bubbles + simulated search checklist. */
export default function ChatPanel({ agentName }: { agentName: string }) {
  const lines = useConversation();
  const thinking = useThinking();
  const reduced = useReducedMotion();
  const feedRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      feedRef.current?.lastElementChild?.scrollIntoView({ block: 'end' });
    });
  }, [lines.length, thinking]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-coral-ink">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="12" height="12">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z" />
          </svg>
          MYRA AI CONCIERGE
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand conversation' : 'Collapse conversation'}
          className="flex size-6 items-center justify-center rounded-full text-faint transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <ChevronUp className={`size-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div
        ref={feedRef}
        className={`flex-1 flex-col gap-4 overflow-y-auto px-2 py-4 ${collapsed ? 'hidden' : 'flex'}`}
        aria-live="polite"
      >
        {lines.length === 0 && !thinking ? (
          <p className="m-auto max-w-[22ch] text-center text-[13px] text-faint">
            Say hello or type below to begin.
          </p>
        ) : (
          lines.map((l) => (
            <MessageBubble
              key={l.id}
              text={l.text}
              isAgent={l.isAgent}
              timestamp={l.timestamp}
              agentName={agentName}
            />
          ))
        )}
        <AnimatePresence>
          {thinking && (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.5 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ThinkingChecklist active={thinking} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** True while the agent has been thinking for >400ms (skips flicker on fast turns). */
function useThinking(): boolean {
  const { state } = useVoiceAssistant();
  const [debounced, setDebounced] = useState(false);
  const thinking = state === 'thinking';

  useEffect(() => {
    if (!thinking) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setDebounced(false);
      return;
    }
    const t = setTimeout(() => setDebounced(true), 400);
    return () => clearTimeout(t);
  }, [thinking]);

  return debounced;
}
