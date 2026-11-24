export enum NotificationType {
  SYSTEM = 'SYSTEM',
  TICKET = 'TICKET',
  SESSION = 'SESSION',
  REVIEW = 'REVIEW',
}

export interface CreateNotificationInput {
  recipientId?: string | null;
  role: string;
  title: string;
  message: string;
  type?: NotificationType;
}

export interface NotificationModel {
  id: string;
  recipientId?: string | null;
  role: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
