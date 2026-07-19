import { Headphones } from 'lucide-react';
import { Card } from '@/components/ui/card';

/** Persistent "talk to Myra" nudge; clicking focuses the voice dock input. */
export default function HelpCard() {
  return (
    <Card className="border-0 bg-lavender p-0">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-[inherit] p-4 text-left transition-opacity hover:opacity-85"
        onClick={() => window.dispatchEvent(new CustomEvent('dock:focus'))}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-lavender-ink shadow-card">
          <Headphones className="size-5" aria-hidden="true" />
        </span>
        <span>
          <span className="block text-[13px] font-bold text-ink">Need help?</span>
          <span className="block text-xs text-muted">Talk to Myra anytime</span>
        </span>
      </button>
    </Card>
  );
}
