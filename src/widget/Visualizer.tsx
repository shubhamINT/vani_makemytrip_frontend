import { BarVisualizer, useVoiceAssistant } from '@livekit/components-react';

const LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  initializing: 'Getting ready…',
  listening: 'Listening',
  thinking: 'Thinking…',
  speaking: 'Speaking',
};

export default function Visualizer() {
  const { state, audioTrack } = useVoiceAssistant();
  return (
    <div className="vw-visualizer">
      <BarVisualizer
        state={state}
        trackRef={audioTrack}
        barCount={5}
        options={{ minHeight: 12 }}
        className="vw-bars"
      />
      <p className="vw-status">{LABEL[state] ?? 'Ready'}</p>
    </div>
  );
}
