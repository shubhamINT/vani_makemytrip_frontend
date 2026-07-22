import type { ConnState } from '../../lib/connState';
import LiveHeader from './LiveHeader';
import ChatPanel from './ChatPanel';
import MainStage from './MainStage';
import UtilityRail from './UtilityRail';
import VoiceDock from './VoiceDock';

/**
 * The live conversation screen: header, 3-column cockpit
 * (chat | dashboard | utilities) and the floating voice dock.
 * Must be rendered inside a LiveKitRoom.
 */
export default function LiveShell({
  conn,
  agentName,
  error,
  pending,
  onPendingSent,
  speakerMuted,
  onToggleSpeaker,
  onDisconnect,
}: {
  conn: ConnState;
  agentName: string;
  error?: string;
  pending: string | null;
  onPendingSent: () => void;
  speakerMuted: boolean;
  onToggleSpeaker: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="live-shell fixed inset-0 flex flex-col bg-paper-2 font-body text-ink">
      <LiveHeader conn={conn} onReset={onDisconnect} />

      {conn === 'error' && error && (
        <div
          role="alert"
          className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/8 px-4 py-2.5 text-sm font-medium text-danger sm:mx-5"
        >
          {error}
          <button
            type="button"
            className="shrink-0 rounded-lg border border-danger/40 px-3 py-1 text-xs font-bold hover:bg-danger hover:text-white"
            onClick={onDisconnect}
          >
            Start over
          </button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-4 pb-4 sm:px-5 lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:overflow-visible xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        {/* Three clean white panels on a cool-gray canvas. */}
        <div className="order-3 flex h-105 min-h-0 flex-col overflow-hidden rounded-card-lg border border-line bg-surface shadow-card lg:order-none lg:h-auto">
          <ChatPanel agentName={agentName} />
        </div>
        <div className="order-1 flex min-h-0 flex-col overflow-hidden rounded-card-lg border border-line bg-surface px-4 shadow-card lg:order-none">
          <MainStage connecting={conn !== 'connected'} />
        </div>
        <div className="order-2 min-h-0 overflow-y-auto rounded-card-lg border border-line bg-surface p-4 shadow-card lg:order-none">
          <UtilityRail />
        </div>
      </div>

      <VoiceDock
        pending={pending}
        ready={conn === 'connected'}
        onPendingSent={onPendingSent}
        speakerMuted={speakerMuted}
        onToggleSpeaker={onToggleSpeaker}
        onDisconnect={onDisconnect}
      />
    </div>
  );
}
