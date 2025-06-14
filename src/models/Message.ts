import type { UserProfile } from '@/src/models/User';

export interface MessageReactionMap {
  [emoji: string]: string[]; // emoji -> list of userIds
}

export interface Message {
  messageId: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO date string or Firestore Timestamp
  parentMessageId?: string | null; // null for top-level, or id for thread replies
  reactions?: MessageReactionMap;
  mentions?: string[]; // userIds mentioned
  author?: Partial<UserProfile>
  replyCount?: number; // Number of thread replies (only for root messages)
}
