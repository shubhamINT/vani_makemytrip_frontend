import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  useLocalParticipant,
  useChat,
  useVoiceAssistant,
  BarVisualizer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { motion, useReducedMotion } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, SendHorizontal, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting',
  initializing: 'Getting ready',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

const STATE_DOT: Record<string, string> = {
  listening: 'bg-emerald-brand',
  thinking: 'bg-amber-brand',
  speaking: 'bg-coral',
};

/**
 * Floating assistant dock: voice controls, live state, waveform, text input.
 * All transport behavior is inherited from the old Composer unchanged.
 */
export default function VoiceDock({
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
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();

  // Send the buffered first message once the room is connected.
  useEffect(() => {
    if (ready && pending && !sentPending.current) {
      sentPending.current = true;
      Promise.resolve(send(pending))
        .catch(() => {})
        .finally(onPendingSent);
    }
  }, [ready, pending, send, onPendingSent]);

  // The Help card (and anything else) can summon the dock.
  useEffect(() => {
    const onFocus = () => inputRef.current?.focus();
    window.addEventListener('dock:focus', onFocus);
    return () => window.removeEventListener('dock:focus', onFocus);
  }, []);

  const toggleMic = () => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || !ready) return;
    setText('');
    await Promise.resolve(send(msg)).catch(() => {});
  };

  // Waveform source: agent audio while it speaks, the user's own mic otherwise
  // (so the bars move both ways — "listening" as well as "speaking").
  const micRef =
    localParticipant && isMicrophoneEnabled
      ? { participant: localParticipant, source: Track.Source.Microphone }
      : undefined;
  const vizTrack = state === 'speaking' && audioTrack && !speakerMuted ? audioTrack : micRef;

  const listening = ready && state === 'listening' && isMicrophoneEnabled;

  // Portal to <body> so the dock is pinned to the viewport regardless of any
  // ancestor that establishes a containing block (transform/filter) or clips
  // overflow. ponytail: portal, not manual z-index whack-a-mole.
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <form
        onSubmit={submit}
        className="pointer-events-auto flex w-[min(94vw,620px)] max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-line bg-surface/95 py-2 pl-2 pr-2 shadow-float backdrop-blur-md focus-within:border-sky-brand/60"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleSpeaker}
          disabled={!ready}
          aria-pressed={speakerMuted}
          aria-label={speakerMuted ? 'Unmute concierge audio' : 'Mute concierge audio'}
          title={speakerMuted ? 'Unmute sound' : 'Mute sound'}
          className={speakerMuted ? 'text-faint' : 'text-muted'}
        >
          {speakerMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </Button>

        <span className="relative flex">
          {listening && !reduced && (
            <motion.span
              className="absolute inset-0 rounded-full bg-coral"
              animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
              aria-hidden="true"
            />
          )}
          <Button
            type="button"
            variant={isMicrophoneEnabled ? 'coral' : 'ghost'}
            size="icon"
            onClick={toggleMic}
            disabled={!ready}
            aria-pressed={!isMicrophoneEnabled}
            aria-label={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'}
            title={isMicrophoneEnabled ? 'Mute mic' : 'Unmute mic'}
            className={`relative size-11 ${isMicrophoneEnabled ? '' : 'bg-paper-2 text-faint'}`}
          >
            {isMicrophoneEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </Button>
        </span>

        {ready && state && state !== 'disconnected' && (
          <span className="hidden shrink-0 items-center gap-1.5 pl-1 text-xs font-semibold text-muted sm:flex">
            <span className="relative flex size-1.5">
              {STATE_DOT[state] && (
                <span
                  className={`absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping ${STATE_DOT[state]}`}
                />
              )}
              <span
                className={`relative inline-flex size-1.5 rounded-full ${STATE_DOT[state] ?? 'bg-faint'}`}
              />
            </span>
            {STATE_LABEL[state] ?? ''}
          </span>
        )}

        {ready && vizTrack && (
          <BarVisualizer
            state={state}
            trackRef={vizTrack}
            barCount={7}
            options={{ minHeight: 8 }}
            className="hidden h-[22px] w-12 shrink-0 text-coral [--lk-fg:currentColor] data-[lk-va-state=listening]:text-sky-brand sm:block"
          />
        )}

        <input
          ref={inputRef}
          className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-faint"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={ready ? 'Type or speak naturally…' : 'Connecting…'}
          aria-label="Message"
          disabled={!ready}
        />

        <Button
          type="submit"
          size="icon"
          aria-label="Send message"
          disabled={!text.trim() || !ready}
        >
          <SendHorizontal className="size-4.5" />
        </Button>

        <span className="mx-0.5 h-6 w-px shrink-0 bg-line" aria-hidden="true" />

        <Button
          type="button"
          variant="danger"
          size="icon"
          onClick={onDisconnect}
          aria-label="End session"
          title="End session"
        >
          <PhoneOff className="size-4.5" />
        </Button>
      </form>
    </div>,
    document.body,
  );
}
