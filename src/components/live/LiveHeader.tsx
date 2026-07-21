import { Share2, Settings } from 'lucide-react';
import type { ConnState } from '../../lib/connState';

const MMT_LOGO = 'https://jsak.mmtcdn.com/mmt-ai/static/assets/ic-mmt-logo-nIgQh4Q-.webp';

const CONN_LABEL: Record<ConnState, string> = {
  idle: 'Connecting…',
  connecting: 'Connecting…',
  connected: 'Live',
  error: 'Offline',
};

const CONN_DOT: Record<ConnState, string> = {
  idle: 'bg-amber-brand',
  connecting: 'bg-amber-brand',
  connected: 'bg-emerald-brand',
  error: 'bg-danger',
};

/** Top bar of the live screen: brand (click = end session) + connection pill. */
export default function LiveHeader({ conn, onReset }: { conn: ConnState; onReset: () => void }) {
  const onShare = () => {
    const url = window.location.href;
    if (navigator.share) void navigator.share({ title: 'My Kolkata trip · Myra', url }).catch(() => {});
    else void navigator.clipboard?.writeText(url).catch(() => {});
  };

  return (
    <header className="flex items-center justify-between gap-4 px-5 py-3">
      <button
        type="button"
        className="flex items-center gap-3 rounded-xl"
        onClick={onReset}
        title="End session and start over"
        aria-label="MakeMyTrip — Myra AI Concierge. End session and start over."
      >
        <img src={MMT_LOGO} alt="MakeMyTrip" className="h-8 w-auto" />
      </button>

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-muted"
          data-state={conn}
          title={CONN_LABEL[conn]}
        >
          <span className="relative flex size-2">
            {conn === 'connected' && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-brand opacity-60 motion-reduce:hidden" />
            )}
            <span className={`relative inline-flex size-2 rounded-full ${CONN_DOT[conn]}`} />
          </span>
          {CONN_LABEL[conn]}
        </span>

        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-paper-2"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share Trip
        </button>

        <button
          type="button"
          aria-label="Settings"
          className="flex size-8 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:bg-paper-2 hover:text-ink"
        >
          <Settings className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
