import type { MessageModel } from '../types/message.type.js';

export class ChatMessageSentEvent {
  constructor(
    public readonly sessionId: string,
    public readonly message: MessageModel,
  ) {}
}

export const CHAT_EVENTS = {
  MESSAGE_SENT: 'chat.message.sent',
} as const;
