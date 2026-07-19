import { useState, type CSSProperties } from 'react';
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchToken, type TokenResult } from '../hooks/useToken';
import ErrorBoundary from './ErrorBoundary';
import Stage from './Stage';
import Transcript from './Transcript';
import TripSummary from './TripSummary';
import Composer from './Composer';
import Globe3D from './Globe3D';
import '../styles/site.css';

const MMT_LOGO = 'https://jsak.mmtcdn.com/mmt-ai/static/assets/ic-mmt-logo-nIgQh4Q-.webp';

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
          <button className="mmt-login-btn" type="button">
            <UserGlyph />
            Login / Sign up
          </button>
        </header>

        <section className="mmt-hero">
          <div className="mmt-hero-inner">
            <div className="mmt-hero-lead">
              <p className="mmt-eyebrow">AI Travel Concierge</p>
              <h1 className="mmt-hero-title">
                Where to <span className="mmt-hero-accent">next?</span>
              </h1>
              <span className="mmt-horizon" aria-hidden="true" />
              <p className="mmt-hero-sub">
                Connect and just say where you&rsquo;d like to go. I&rsquo;ll pull up flights,
                hotels and the whole plan while we talk.
              </p>

              <button className="mmt-connect" type="button" onClick={() => start()}>
                <span className="mmt-connect-ring" aria-hidden="true" />
                <span className="mmt-connect-face">
                  <MicGlyph />
                  Tap to speak
                </span>
              </button>
              <p className="mmt-connect-hint">Uses your microphone · talk naturally</p>

              <div className="mmt-chips" role="group" aria-label="Popular with travelers">
                <span className="mmt-chips-label">Popular with travelers</span>
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="mmt-chip"
                    onClick={() => start(s.seed)}
                    style={{ '--chip-tint': s.tint, '--chip-ink': s.ink } as CSSProperties}
                  >
                    <span className="mmt-chip-emoji" aria-hidden="true">{s.emoji}</span>
                    <span>
                      <span className="mmt-chip-title">{s.label}</span>
                      <span className="mmt-chip-sub">{s.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Globe3D />
          </div>
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
              <div className="mmt-rail-col">
                <TripSummary />
                <Transcript agentName={AGENT} />
              </div>
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

const STARTERS = [
  { emoji: '🏖️', label: 'Weekend Getaway', sub: '2–3 days', seed: 'Plan a weekend getaway', tint: '#e8f8ee', ink: '#16a34a' },
  { emoji: '👨‍👩‍👧', label: 'Family Vacation', sub: '4–7 days', seed: 'Plan a family vacation', tint: '#e8f1fe', ink: '#2563eb' },
  { emoji: '✈️', label: 'International Trip', sub: 'Flights + stay', seed: 'Plan an international trip', tint: '#e6f6fd', ink: '#0284c7' },
  { emoji: '💛', label: 'Honeymoon', sub: 'Romantic escapes', seed: 'Plan a honeymoon', tint: '#fdeaf2', ink: '#db2777' },
  { emoji: '💼', label: 'Business Travel', sub: 'Work trips', seed: 'Plan a business trip', tint: '#eceafe', ink: '#6d28d9' },
  { emoji: '🛕', label: 'Thailand Special', sub: 'Visa on arrival', seed: 'Plan a trip to Thailand', tint: '#f3e9fd', ink: '#7c3aed' },
];

const MicGlyph = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={size} height={size}>
    <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z" />
  </svg>
);

const UserGlyph = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
  </svg>
);

function Brand({ onClick }: { onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className="mmt-brand"
      aria-label="MakeMyTrip — Myra AI Concierge"
      {...(onClick ? { type: 'button', onClick, title: 'End session and start over' } : {})}
    >
      <img src={MMT_LOGO} alt="MakeMyTrip" className="mmt-brand-logo" />
      <span className="mmt-myra-badge">
        <MicGlyph size={12} />
        MYRA AI CONCIERGE
      </span>
    </Tag>
  );
}
