import { BarVisualizer, useVoiceAssistant } from '@livekit/components-react';

const LABEL: Record<string, string> = {
  connecting: 'Connecting',
  initializing: 'Getting ready',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
};

export default function Visualizer() {
  const { state, audioTrack } = useVoiceAssistant();
  // Only surface the pill while the agent is actively doing something voice-related.
  if (!audioTrack && (state === 'disconnected' || !state)) return null;

  return (
    <div className="mmt-voice" data-state={state}>
      {audioTrack ? (
        <BarVisualizer
          state={state}
          trackRef={audioTrack}
          barCount={4}
          options={{ minHeight: 8 }}
          className="mmt-voice-bars"
        />
      ) : (
        <span className="mmt-voice-dot" />
      )}
      <span className="mmt-voice-label">{LABEL[state] ?? 'Ready'}</span>
    </div>
  );
}
