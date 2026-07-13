import { useState } from 'react';
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

export default function Widget() {
  const [status, setStatus] = useState<Status>('idle');
  const [creds, setCreds] = useState<TokenResult | null>(null);
  const [error, setError] = useState('');

  const start = async () => {
    setStatus('connecting');
    setError('');
    try {
      const token = await fetchToken();
      console.log('[Widget] Token fetched:', { url: token.url, room: token.room });
      setCreds(token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to connect';
      console.error('[Widget] Token fetch failed:', msg);
      setError(msg);
      setStatus('error');
    }
  };

  const reset = () => {
    setCreds(null);
    setStatus('idle');
  };

  return (
    <div className="vw-card">
      <header className="vw-head">
        <span className="vw-dot" data-on={status === 'connected'} />
        <h1 className="vw-title">{AGENT}</h1>
      </header>

      {creds ? (
        <ErrorBoundary onReset={reset}>
          <LiveKitRoom
            serverUrl={creds.url}
            token={creds.token}
            connect
            audio
            video={false}
            className="vw-room"
            onConnected={() => {
              console.log('[Widget] LiveKit connected');
              setStatus('connected');
            }}
            onDisconnected={() => {
              console.log('[Widget] LiveKit disconnected');
              reset();
            }}
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
      ) : (
        <div className="vw-idle">
          <div className="vw-orb" data-busy={status === 'connecting'} />
          {status === 'error' && <p className="vw-error">{error}</p>}
          <button
            className="vw-btn vw-start"
            onClick={start}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting…' : 'Start call'}
          </button>
        </div>
      )}
    </div>
  );
}
