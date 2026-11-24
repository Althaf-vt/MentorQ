import { MessageModel, CreateMessageInput } from '../types/message.type.js';

export const MESSAGES_REPOSITORY = Symbol('MESSAGES_REPOSITORY');

export interface IMessagesRepository {
  create(input: CreateMessageInput): Promise<MessageModel>;
  findBySession(sessionId: string): Promise<MessageModel[]>;
  markAsRead(sessionId: string, userId: string): Promise<number>;
}
