export interface MessageResponseDto {
  id: string;
  sessionId: string;
  senderId: string;
  messageText: string;
  sentAt: string;
  readStatus: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageActionResponseDto {
  success: boolean;
}
