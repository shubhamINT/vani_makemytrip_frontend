import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** One conversation turn: user = blue right-aligned, agent = white with avatar. */
export default function MessageBubble({
  text,
  isAgent,
  timestamp,
  agentName,
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
        <span className="pr-1 text-[10px] font-medium text-faint">{fmtTime(timestamp)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-muted">{agentName}</span>
      <div className="max-w-[92%] text-[13px] leading-relaxed text-ink">
        <div className="mmt-md">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
      <span className="text-[10px] font-medium text-faint">{fmtTime(timestamp)}</span>
    </div>
  );
}
