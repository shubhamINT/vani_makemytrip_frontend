import { useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchToken, type TokenResult } from './useToken';
import ErrorBoundary from './ErrorBoundary';
import Conversation from './Conversation';
import Composer from './Composer';
import Visualizer from './Visualizer';
import './site.css';

type ConnState = 'idle' | 'connecting' | 'connected' | 'error';

const AGENT = (import.meta.env.VITE_AGENT_NAME as string) || 'MakeMyTrip';

const STARTERS = [
  'Hotels in Paris this weekend',
  'Cheapest flight to Goa next Friday',
  'Plan a 3-day Bali trip on a budget',
  'Beach resorts in Bali under ₹8000/night',
];

export default function Concierge() {
  const [started, setStarted] = useState(false);
  const [creds, setCreds] = useState<TokenResult | null>(null);
  const [conn, setConn] = useState<ConnState>('idle');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const start = async (text: string) => {
    const msg = text.trim();
    if (!msg || conn === 'connecting') return;
    setStarted(true);
    setPending(msg);
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
    setDraft('');
    setError('');
  };

  const heroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(draft);
    setDraft('');
  };

  /* ── Hero (before first message) ── */
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
            Ask for flights, hotels and trips in plain words. I&rsquo;ll find and book them for you.
          </p>

          <form className="mmt-heroform" onSubmit={heroSubmit}>
            <input
              className="mmt-heroinput"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Weekend in Jaipur with a rooftop pool"
              aria-label="Ask the travel concierge"
              autoFocus
            />
            <button className="mmt-cta" type="submit" disabled={!draft.trim()}>
              Ask
            </button>
          </form>

          <ul className="mmt-starters">
            {STARTERS.map((s) => (
              <li key={s}>
                <button className="mmt-chip" type="button" onClick={() => start(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }

  /* ── Live (connecting / connected) ── */
  return (
    <main className="mmt">
      <header className="mmt-topbar">
        <Brand />
        <div className="mmt-topbar-right">
          <span className="mmt-conn" data-state={conn}>
            <span className="mmt-conn-dot" />
            {conn === 'connected' ? 'Live' : conn === 'error' ? 'Offline' : 'Connecting…'}
          </span>
          <button className="mmt-newsearch" type="button" onClick={reset}>
            New search
          </button>
        </div>
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
            <RoomAudioRenderer />
            <StartAudio label="Tap to enable sound" className="mmt-startaudio" />
            <div className="mmt-feedwrap">
              <Conversation agentName={AGENT} connecting={conn !== 'connected'} />
            </div>
            <footer className="mmt-dock">
              <Visualizer />
              <Composer
                pending={pending}
                ready={conn === 'connected'}
                onPendingSent={() => setPending(null)}
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
            {pending && <p className="mmt-connecting-msg">“{pending}”</p>}
          </div>
        </div>
      )}
    </main>
  );
}

function Brand() {
  return (
    <div className="mmt-brand">
      <span className="mmt-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
          <path d="M2 16.5 21 8c1-.45 1.6.9.7 1.6l-6.4 5 .5 6.2c.06.7-.8 1-1.2.4l-3-4.3-6.8 1.9c-1 .3-1.6-1-.8-1.7l4.2-3.6-6-1.1c-.9-.16-1-1.4-.1-1.6Z" fill="currentColor"/>
        </svg>
      </span>
      <span className="mmt-brand-name">
        MakeMy<span className="mmt-brand-accent">Trip</span>
      </span>
    </div>
  );
}
