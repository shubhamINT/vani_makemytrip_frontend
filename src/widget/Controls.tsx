import { useState } from 'react';
import {
  useLocalParticipant,
  useRoomContext,
  useChat,
} from '@livekit/components-react';

// Inline icons — no icon lib for four glyphs.
const MicOn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"/></svg>
);
const MicOff = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 10.6V6a3 3 0 0 0-5.94-.6l5.94 5.6ZM19 12h-2a5 5 0 0 1-.36 1.85l1.5 1.5A6.94 6.94 0 0 0 19 12ZM3.3 3.3 2 4.6l7 6.6V12a3 3 0 0 0 4.1 2.8l1.2 1.13A5 5 0 0 1 7 12H5a7 7 0 0 0 6 6.92V22h2v-3.08a6.9 6.9 0 0 0 2.06-.72L19.4 21 20.7 19.7 3.3 3.3Z"/></svg>
);
const EndIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85a.98.98 0 0 1-.69.28c-.28 0-.53-.11-.71-.29L.29 13.08a.98.98 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-1.79 1.79c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.65-1.85.998.998 0 0 1-.56-.9v-3.1A15.6 15.6 0 0 0 12 9Z"/></svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21 23 12 2 3v7l15 2-15 2v5Z"/></svg>
);

export default function Controls() {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const { send } = useChat();
  const [text, setText] = useState('');

  const toggleMic = () =>
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setText('');
    await send(msg);
  };

  return (
    <div className="vw-controls">
      <form className="vw-textrow" onSubmit={submit}>
        <input
          className="vw-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
        />
        <button className="vw-btn vw-send" type="submit" aria-label="Send" disabled={!text.trim()}>
          <SendIcon />
        </button>
      </form>

      <div className="vw-btnrow">
        <button
          className={`vw-btn vw-mute${isMicrophoneEnabled ? '' : ' vw-muted'}`}
          type="button"
          onClick={toggleMic}
          aria-pressed={!isMicrophoneEnabled}
          aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicrophoneEnabled ? <MicOn /> : <MicOff />}
          <span>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</span>
        </button>

        <button
          className="vw-btn vw-end"
          type="button"
          onClick={() => room.disconnect()}
          aria-label="End call"
        >
          <EndIcon />
          <span>End</span>
        </button>
      </div>
    </div>
  );
}
