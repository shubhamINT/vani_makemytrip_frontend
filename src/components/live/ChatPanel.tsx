import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    requestAnimationFrame(() => {
      feedRef.current?.lastElementChild?.scrollIntoView({ block: 'end' });
    });
  }, [lines.length, thinking]);

  return (
    <div className="flex h-full min-h-0 flex-col lg:border-r lg:border-line">
      <div className="border-b border-line px-2 py-3">
        <p className="font-display text-sm font-bold text-ink">{agentName} Conversation</p>
      </div>

      <div
        ref={feedRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-4"
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
