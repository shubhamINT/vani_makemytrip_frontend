import { useEffect, useMemo, useRef } from 'react';
import { useChat, useTranscriptions, useLocalParticipant } from '@livekit/components-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Line {
  id: string;
  text: string;
  isAgent: boolean;
  timestamp: number;
}

/**
 * Side rail: the running conversation — typed chat plus live spoken
 * transcriptions, merged and sorted. Generative UI does NOT live here.
 */
export default function Transcript({ agentName }: { agentName: string }) {
  const { localParticipant } = useLocalParticipant();
  const localIdentity = localParticipant?.identity;
  const { chatMessages } = useChat();
  const transcriptions = useTranscriptions();

  const railRef = useRef<HTMLDivElement>(null);

  const lines = useMemo<Line[]>(() => {
    const isAgent = (identity: string) =>
      localIdentity ? identity !== localIdentity : identity !== '' && identity !== 'web-user';

    const result: Line[] = [];
    for (const msg of chatMessages) {
      const identity = msg.from?.identity ?? '';
      result.push({
        id: `chat-${msg.timestamp}-${identity}`,
        text: msg.message,
        isAgent: isAgent(identity),
        timestamp: msg.timestamp,
      });
    }
    for (const t of transcriptions) {
      const identity = t.participantInfo.identity;
      result.push({
        id: `trans-${t.streamInfo.timestamp}-${identity}`,
        text: t.text,
        isAgent: isAgent(identity),
        timestamp: t.streamInfo.timestamp,
      });
    }
    result.sort((a, b) => a.timestamp - b.timestamp);
    return result;
  }, [chatMessages, transcriptions, localIdentity]);

  useEffect(() => {
    requestAnimationFrame(() => {
      railRef.current?.lastElementChild?.scrollIntoView({ block: 'end' });
    });
  }, [lines.length]);

  return (
    <aside className="mmt-rail" aria-label="Conversation transcript">
      <div className="mmt-rail-head">
        <span className="mmt-rail-title">Transcript</span>
      </div>
      <div className="mmt-rail-feed" ref={railRef}>
        {lines.length === 0 ? (
          <p className="mmt-rail-empty">Say hello or type below to begin.</p>
        ) : (
          lines.map((l) => (
            <div key={l.id} className={`mmt-rail-line ${l.isAgent ? 'is-agent' : 'is-user'}`}>
              <span className="mmt-rail-who">{l.isAgent ? agentName : 'You'}</span>
              <div className="mmt-rail-text mmt-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{l.text}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
