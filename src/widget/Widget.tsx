import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchToken, type TokenResult } from './useToken';
import ErrorBoundary from './ErrorBoundary';
import Visualizer from './Visualizer';
import Transcript from './Transcript';
import Controls from './Controls';
import './widget.css';

type Status = 'idle' | 'connecting' | 'connected' | 'error';

const AGENT = (import.meta.env.VITE_AGENT_NAME as string) || 'Voice Assistant';

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.25c.3 0 .57.18.69.46l1.83 4.27 4.27 1.83a.75.75 0 0 1 0 1.38l-4.27 1.83-1.83 4.27a.75.75 0 0 1-1.38 0l-1.83-4.27-4.27-1.83a.75.75 0 0 1 0-1.38l4.27-1.83 1.83-4.27a.75.75 0 0 1 .69-.46Z" />
    <path d="M18.75 15a.6.6 0 0 1 .55.36l.78 1.81 1.81.78a.6.6 0 0 1 0 1.1l-1.81.78-.78 1.81a.6.6 0 0 1-1.1 0l-.78-1.81-1.81-.78a.6.6 0 0 1 0-1.1l1.81-.78.78-1.81a.6.6 0 0 1 .55-.36Z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function Widget() {
  const [status, setStatus] = useState<Status>('idle');
  const [creds, setCreds] = useState<TokenResult | null>(null);
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);

  /* ── postMessage bridge for embed host ── */
  useEffect(() => {
    if (!window.parent || window.parent === window) return;
    const msg = { type: 'vani:ready' };
    window.parent.postMessage(msg, '*');
  }, []);

  const notifyHost = (mode: 'collapsed' | 'open') => {
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage({ type: 'vani:resize', mode }, '*');
  };

  const start = async () => {
    setStatus('connecting');
    setError('');
    try {
      const token = await fetchToken();
      console.log('[Widget] Token fetched:', { url: token.url, room: token.room });
      setCreds(token);
      setMinimized(false);
      notifyHost('open');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to connect';
      console.error('[Widget] Token fetch failed:', msg);
      setError(msg);
      setStatus('error');
    }
  };

  const reset = () => {
    setCreds(null);
    setMinimized(false);
    setStatus('idle');
    notifyHost('collapsed');
  };

  const showFab = !creds || minimized;

  /* ── FAB (idle idle or call active but minimized) ── */
  const fabSection = (
    <div className="vw-idle">
      {status === 'error' && <p className="vw-error">{error}</p>}

      <button
        className={`vw-fab${status === 'connecting' ? ' vw-fab--busy' : ''}${minimized ? ' vw-fab--active' : ''}`}
        onClick={minimized ? () => setMinimized(false) : start}
        aria-label={minimized ? 'Open chat' : 'Talk to Vaani'}
      >
        <span className="vw-fab-swirl" />
        <span className="vw-fab-highlight" />
        <MicIcon />
      </button>

      <div className="vw-tooltip">
        <div className="vw-tooltip-icon">
          <SparkleIcon />
        </div>
        <div className="vw-tooltip-text">
          <span className="vw-tooltip-title">Hi, I&rsquo;m Vaani</span>
          <span className="vw-tooltip-sub">Your SBI assistant</span>
        </div>
      </div>
    </div>
  );

  /* ── LiveKit room (always mounted once creds exist) ── */
  const room = creds ? (
    <ErrorBoundary onReset={reset}>
      <LiveKitRoom
        serverUrl={creds.url}
        token={creds.token}
        connect
        audio
        video={false}
        className="vw-room"
        onConnected={() => setStatus('connected')}
        onDisconnected={() => reset()}
        onError={(e) => {
          console.error('[Widget] LiveKit error:', e.message);
          setError(e.message);
          setStatus('error');
          setCreds(null);
        }}
      >
        <RoomAudioRenderer />
        <StartAudio label="Click to enable audio" />
        <div className="vw-body">
          <Transcript />
          <Visualizer />
        </div>
        <Controls />
      </LiveKitRoom>
    </ErrorBoundary>
  ) : null;

  return (
    <div className="vw-root">
      {showFab && fabSection}

      {creds && (
        <div
          className={`vw-panel${minimized ? ' vw-panel--hidden' : ''}`}
        >
          <header className="vw-head">
            <span className="vw-dot" data-on={status === 'connected'} />
            <h1 className="vw-title">{AGENT}</h1>
            <button
              className="vw-close"
              onClick={() => setMinimized(true)}
              aria-label="Minimise"
            >
              <CloseIcon />
            </button>
          </header>
          {room}
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ position: 'relative', zIndex: 1 }}
    >
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="11" y="20" width="2" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}
