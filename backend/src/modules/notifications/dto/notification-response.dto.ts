import { NotificationType } from '../types/notification.type.js';

export interface NotificationResponseDto {
  id: string;
  recipientId: string | null;
  role: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationActionResponseDto {
  success: boolean;
}
