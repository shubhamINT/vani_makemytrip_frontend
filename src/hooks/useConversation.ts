import { useMemo } from 'react';
import { useChat, useTranscriptions, useLocalParticipant } from '@livekit/components-react';
import { MOCK, chat as mockChat } from '../dev/fixtures';

export interface ConversationLine {
  id: string;
  text: string;
  isAgent: boolean;
  timestamp: number;
}

/**
 * The running conversation: typed chat plus live spoken transcriptions,
 * merged and sorted by time. (Lifted from the old Transcript component.)
 */
export function useConversation(): ConversationLine[] {
  const { localParticipant } = useLocalParticipant();
  const localIdentity = localParticipant?.identity;
  const { chatMessages } = useChat();
  const transcriptions = useTranscriptions();

  return useMemo<ConversationLine[]>(() => {
    if (MOCK) return mockChat; // dev preview
    // Known local identities never count as the agent — this keeps a user's
    // own typed message on the user side even before localParticipant resolves.
    const LOCAL_IDS = new Set(['', 'web-user', localIdentity].filter(Boolean) as string[]);
    const isAgent = (identity: string) =>
      localIdentity ? identity !== localIdentity : !LOCAL_IDS.has(identity);

    const result: ConversationLine[] = [];
    for (const msg of chatMessages) {
      const identity = msg.from?.identity ?? '';
      result.push({
        id: `chat-${msg.timestamp}-${identity}`,
        text: msg.message,
        isAgent: isAgent(identity),
        timestamp: msg.timestamp,
      });
    }
    for (const t of transcriptions) {
      const identity = t.participantInfo.identity;
      result.push({
        id: `trans-${t.streamInfo.timestamp}-${identity}`,
        text: t.text,
        isAgent: isAgent(identity),
        timestamp: t.streamInfo.timestamp,
      });
    }
    result.sort((a, b) => a.timestamp - b.timestamp);
    return result;
  }, [chatMessages, transcriptions, localIdentity]);
}
