import { Message, MessageDocument } from '../schemas/message.schema.js';

export const MESSAGES_REPOSITORY = Symbol('MESSAGES_REPOSITORY');

export interface IMessagesRepository {
  create(message: Partial<Message>): Promise<MessageDocument>;
  findBySession(sessionId: string): Promise<MessageDocument[]>;
  markAsRead(sessionId: string, userId: string): Promise<any>;
}
