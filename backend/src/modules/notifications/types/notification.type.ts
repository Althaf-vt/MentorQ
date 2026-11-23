import { NotificationType } from '../schemas/notification.schema.js';

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
