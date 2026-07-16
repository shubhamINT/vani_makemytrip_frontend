import { useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchToken, type TokenResult } from './useToken';
import ErrorBoundary from './ErrorBoundary';
import Stage from './Stage';
import Transcript from './Transcript';
import Composer from './Composer';
import './site.css';

type ConnState = 'idle' | 'connecting' | 'connected' | 'error';

const AGENT = (import.meta.env.VITE_AGENT_NAME as string) || 'MakeMyTrip';

export default function Concierge() {
  const [started, setStarted] = useState(false);
  const [creds, setCreds] = useState<TokenResult | null>(null);
  const [conn, setConn] = useState<ConnState>('idle');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  // Voice-first: connect with no seed message; the user just talks.
  const start = async (text?: string) => {
    if (conn === 'connecting') return;
    setStarted(true);
    setPending(text?.trim() || null);
    setConn('connecting');
    setError('');
    try {
      const token = await fetchToken();
      setCreds(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect. Try again.');
      setConn('error');
    }
  };

  const reset = () => {
    setCreds(null);
    setConn('idle');
    setStarted(false);
    setPending(null);
    setSpeakerMuted(false);
    setError('');
  };

  /* ── Hero (before connecting) ── */
  if (!started) {
    return (
      <main className="mmt">
        <header className="mmt-topbar mmt-topbar--hero">
          <Brand />
        </header>

        <section className="mmt-hero">
          <p className="mmt-eyebrow">AI Travel Concierge</p>
          <h1 className="mmt-hero-title">
            Where to <span className="mmt-hero-accent">next?</span>
          </h1>
          <span className="mmt-horizon" aria-hidden="true" />
          <p className="mmt-hero-sub">
            Connect and just say where you&rsquo;d like to go. I&rsquo;ll pull up flights, hotels
            and the whole plan while we talk.
          </p>

          <button className="mmt-connect" type="button" onClick={() => start()}>
            <span className="mmt-connect-ring" aria-hidden="true" />
            <span className="mmt-connect-face">
              <MicGlyph />
              Connect
            </span>
          </button>
          <p className="mmt-connect-hint">Uses your microphone · talk naturally</p>
        </section>
      </main>
    );
  }

  /* ── Live (connecting / connected) ── */
  return (
    <main className="mmt">
      <header className="mmt-topbar">
        <Brand onClick={reset} />
        <span className="mmt-conn" data-state={conn}>
          <span className="mmt-conn-dot" />
          {conn === 'connected' ? 'Live' : conn === 'error' ? 'Offline' : 'Connecting…'}
        </span>
      </header>

      {conn === 'error' && (
        <div className="mmt-banner" role="alert">
          {error}
          <button className="mmt-banner-btn" onClick={reset}>Start over</button>
        </div>
      )}

      {creds && (
        <ErrorBoundary onReset={reset}>
          <LiveKitRoom
            serverUrl={creds.url}
            token={creds.token}
            connect
            audio
            video={false}
            className="mmt-room"
            onConnected={() => setConn('connected')}
            onDisconnected={reset}
            onError={(e) => {
              setError(e.message);
              setConn('error');
              setCreds(null);
            }}
          >
            <RoomAudioRenderer volume={speakerMuted ? 0 : 1} />
            <StartAudio label="Tap to enable sound" className="mmt-startaudio" />
            <div className="mmt-cockpit">
              <Stage connecting={conn !== 'connected'} />
              <Transcript agentName={AGENT} />
            </div>
            <footer className="mmt-dock">
              <Composer
                pending={pending}
                ready={conn === 'connected'}
                onPendingSent={() => setPending(null)}
                speakerMuted={speakerMuted}
                onToggleSpeaker={() => setSpeakerMuted((m) => !m)}
                onDisconnect={reset}
              />
            </footer>
          </LiveKitRoom>
        </ErrorBoundary>
      )}

      {!creds && conn === 'connecting' && (
        <div className="mmt-feedwrap">
          <div className="mmt-connecting">
            <span className="mmt-spinner" aria-hidden="true" />
            <p>Connecting you to your concierge…</p>
          </div>
        </div>
      )}
    </main>
  );
}

const MicGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z" />
  </svg>
);

function Brand({ onClick }: { onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className="mmt-brand"
      {...(onClick ? { type: 'button', onClick, title: 'End session and start over' } : {})}
    >
      <span className="mmt-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M2 16.5 21 8c1-.45 1.6.9.7 1.6l-6.4 5 .5 6.2c.06.7-.8 1-1.2.4l-3-4.3-6.8 1.9c-1 .3-1.6-1-.8-1.7l4.2-3.6-6-1.1c-.9-.16-1-1.4-.1-1.6Z" fill="currentColor"/>
        </svg>
      </span>
      <span className="mmt-brand-name">
        MakeMy<span className="mmt-brand-accent">Trip</span>
      </span>
    </Tag>
  );
}
