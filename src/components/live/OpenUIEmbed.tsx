import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { openuiChatLibrary } from '@openuidev/react-ui';
import '../../styles/openui-embed.css';

/**
 * A single streamed openui-lang render, wrapped in a card surface that matches
 * the native sections. Theme comes from the app-level openui ThemeProvider.
 */
export default function OpenUIEmbed({
  content,
  title,
  streaming,
  onAction,
}: {
  content: string;
  title?: string;
  streaming: boolean;
  onAction: (event: ActionEvent) => void;
}) {
  return (
    <section className="openui-embed" aria-label={title || 'Agent result'}>
      {title && <h2 className="openui-embed-title">{title}</h2>}
      <Renderer
        response={content}
        library={openuiChatLibrary}
        isStreaming={streaming}
        onAction={onAction}
        onError={(errors) => {
          // Partial/forward-ref errors are expected while streaming.
          if (!streaming) console.error('OpenUI render error:', errors);
        }}
      />
    </section>
  );
}
