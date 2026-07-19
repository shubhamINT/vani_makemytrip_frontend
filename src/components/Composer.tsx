import { useState, useEffect, useRef } from 'react';
import {
  useLocalParticipant,
  useChat,
  useVoiceAssistant,
  BarVisualizer,
} from '@livekit/components-react';

const MicOn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"/></svg>
);
const MicOff = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15 10.6V6a3 3 0 0 0-5.94-.6l5.94 5.6ZM19 12h-2a5 5 0 0 1-.36 1.85l1.5 1.5A6.94 6.94 0 0 0 19 12ZM3.3 3.3 2 4.6l7 6.6V12a3 3 0 0 0 4.1 2.8l1.2 1.13A5 5 0 0 1 7 12H5a7 7 0 0 0 6 6.92V22h2v-3.08a6.9 6.9 0 0 0 2.06-.72L19.4 21 20.7 19.7 3.3 3.3Z"/></svg>
);
const SpeakerOn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4Zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-9v2.06A7 7 0 0 1 14 21v-2.06A5 5 0 0 0 14 3Z"/></svg>
);
const SpeakerOff = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4Zm18.7 1.3-1.4-1.4L19 11.2l-2.3-2.3-1.4 1.4L17.6 12.6l-2.3 2.3 1.4 1.4L19 14l2.3 2.3 1.4-1.4-2.3-2.3 2.3-2.3Z"/></svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21 23 12 2 3v7l15 2-15 2v5Z"/></svg>
);
const HangUp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.27 11.27 0 0 0-2.66-1.85.998.998 0 0 1-.56-.9v-3.1A16.35 16.35 0 0 0 12 9Z"/></svg>
);

const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting',
  initializing: 'Getting ready',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

export default function Composer({
  pending,
  ready,
  onPendingSent,
  speakerMuted,
  onToggleSpeaker,
  onDisconnect,
}: {
  pending: string | null;
  ready: boolean;
  onPendingSent: () => void;
  speakerMuted: boolean;
  onToggleSpeaker: () => void;
  onDisconnect: () => void;
}) {
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const { send } = useChat();
  const { state, audioTrack } = useVoiceAssistant();
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
      {/* Voice controls + live bars, integrated in the bar */}
      <div className="mmt-voicecluster" data-state={state}>
        <button
          type="button"
          className={`mmt-ctl mmt-ctl--mic${isMicrophoneEnabled ? ' is-on' : ' is-muted'}`}
          onClick={toggleMic}
          disabled={!ready}
          aria-pressed={!isMicrophoneEnabled}
          aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
          title={isMicrophoneEnabled ? 'Mute mic' : 'Unmute mic'}
        >
          {isMicrophoneEnabled ? <MicOn /> : <MicOff />}
        </button>
        <button
          type="button"
          className={`mmt-ctl mmt-ctl--spk${speakerMuted ? ' is-muted' : ' is-on'}`}
          onClick={onToggleSpeaker}
          disabled={!ready}
          aria-pressed={speakerMuted}
          aria-label={speakerMuted ? 'Unmute concierge audio' : 'Mute concierge audio'}
          title={speakerMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {speakerMuted ? <SpeakerOff /> : <SpeakerOn />}
        </button>
        {audioTrack && !speakerMuted && (
          <BarVisualizer
            state={state}
            trackRef={audioTrack}
            barCount={5}
            options={{ minHeight: 6 }}
            className="mmt-voice-bars"
          />
        )}
        {ready && state && state !== 'disconnected' && (
          <span className="mmt-voice-label">{STATE_LABEL[state] ?? ''}</span>
        )}
      </div>

      <input
        className="mmt-composer-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={ready ? 'Or type a message…' : 'Connecting…'}
        aria-label="Message"
        disabled={!ready}
      />
      <button className="mmt-send" type="submit" aria-label="Send message" disabled={!text.trim() || !ready}>
        <SendIcon />
      </button>

      <span className="mmt-dock-sep" aria-hidden="true" />

      <button
        type="button"
        className="mmt-ctl mmt-ctl--end"
        onClick={onDisconnect}
        aria-label="End session"
        title="End session"
      >
        <HangUp />
      </button>
    </form>
  );
}
