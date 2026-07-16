import { useState, useEffect, useRef } from 'react';
import { useLocalParticipant, useChat } from '@livekit/components-react';

const MicOn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"/></svg>
);
const MicOff = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 10.6V6a3 3 0 0 0-5.94-.6l5.94 5.6ZM19 12h-2a5 5 0 0 1-.36 1.85l1.5 1.5A6.94 6.94 0 0 0 19 12ZM3.3 3.3 2 4.6l7 6.6V12a3 3 0 0 0 4.1 2.8l1.2 1.13A5 5 0 0 1 7 12H5a7 7 0 0 0 6 6.92V22h2v-3.08a6.9 6.9 0 0 0 2.06-.72L19.4 21 20.7 19.7 3.3 3.3Z"/></svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21 23 12 2 3v7l15 2-15 2v5Z"/></svg>
);

export default function Composer({
  pending,
  ready,
  onPendingSent,
}: {
  pending: string | null;
  ready: boolean;
  onPendingSent: () => void;
}) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const { send } = useChat();
  const [text, setText] = useState('');
  const sentPending = useRef(false);

  // Send the buffered first message once the room is connected.
  useEffect(() => {
    if (ready && pending && !sentPending.current) {
      sentPending.current = true;
      send(pending).finally(onPendingSent);
    }
  }, [ready, pending, send, onPendingSent]);

  const toggleMic = () => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || !ready) return;
    setText('');
    await send(msg);
  };

  return (
    <form className="mmt-composer" onSubmit={submit}>
      <button
        type="button"
        className={`mmt-mic${isMicrophoneEnabled ? ' mmt-mic--on' : ''}`}
        onClick={toggleMic}
        disabled={!ready}
        aria-pressed={isMicrophoneEnabled}
        aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Speak'}
      >
        {isMicrophoneEnabled ? <MicOn /> : <MicOff />}
      </button>
      <input
        className="mmt-composer-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ready ? 'Ask anything about your trip…' : 'Connecting…'}
        aria-label="Message"
        disabled={!ready}
      />
      <button className="mmt-send" type="submit" aria-label="Send" disabled={!text.trim() || !ready}>
        <SendIcon />
      </button>
    </form>
  );
}
