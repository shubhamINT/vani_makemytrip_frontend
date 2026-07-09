import { useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { fetchToken, type TokenResult } from './useToken';
import Visualizer from './Visualizer';
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
      setCreds(await fetchToken());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect');
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
        <LiveKitRoom
          serverUrl={creds.url}
          token={creds.token}
          connect
          audio
          video={false}
          onConnected={() => setStatus('connected')}
          onDisconnected={reset}
          onError={(e) => {
            setError(e.message);
            setStatus('error');
          }}
        >
          <RoomAudioRenderer />
          <StartAudio label="Click to enable audio" />
          <Visualizer />
          <Controls />
        </LiveKitRoom>
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
