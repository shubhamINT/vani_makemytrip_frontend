import { Sparkles } from 'lucide-react';

/** Tappable follow-up chips ("People also ask"). */
export default function RelatedQueries({
  items,
  onSend,
}: {
  items: string[];
  onSend: (q: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Related queries">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-bold text-muted">
        <Sparkles className="size-3.5 text-coral" aria-hidden="true" />
        Related queries
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSend(q)}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-coral/50 hover:bg-coral-soft hover:text-coral-ink"
          >
            {q}
          </button>
        ))}
      </div>
    </section>
  );
}
