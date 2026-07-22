import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Mic, CheckCheck } from 'lucide-react';

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

// The concierge persona is always "Myra" regardless of the raw agent identity.
const PERSONA = 'Myra';

/** One conversation turn: user = blue right-aligned, agent = gray with avatar. */
export default function MessageBubble({
  text,
  isAgent,
  timestamp,
}: {
  text: string;
  isAgent: boolean;
  timestamp: number;
  agentName: string;
}) {
  if (!isAgent) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-sky-brand px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
          {text}
        </div>
        <span className="flex items-center gap-1 pr-1 text-[10px] font-medium text-faint">
          {fmtTime(timestamp)}
          <CheckCheck className="size-3.5 text-sky-brand" aria-label="Delivered" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-coral-ink"
        aria-hidden="true"
      >
        <Mic className="size-3" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-medium text-faint">
          <span className="font-bold text-muted">{PERSONA}</span> · {fmtTime(timestamp)}
        </span>
        <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-paper-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          <div className="mmt-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
