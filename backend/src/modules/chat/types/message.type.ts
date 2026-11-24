export interface CreateMessageInput {
  sessionId: string;
  senderId: string;
  messageText: string;
  sentAt?: Date;
}

export interface MessageModel {
  id: string;
  sessionId: string;
  senderId: string;
  messageText: string;
  sentAt: Date;
  readStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
