import { Message } from '../schemas/message.schema.js';
import { MessageModel } from '../types/message.type.js';

export const MESSAGES_REPOSITORY = Symbol('MESSAGES_REPOSITORY');

export interface IMessagesRepository {
  create(message: Partial<Message>): Promise<MessageModel>;
  findBySession(sessionId: string): Promise<MessageModel[]>;
  markAsRead(sessionId: string, userId: string): Promise<number>;
}
