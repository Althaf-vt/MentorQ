import { Notification, NotificationDocument } from '../schemas/notification.schema.js';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface INotificationsRepository {
  create(notification: Partial<Notification>): Promise<NotificationDocument>;
  findByUser(userId: string, role: string): Promise<NotificationDocument[]>;
  markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null>;
  markAllAsRead(userId: string, role: string): Promise<any>;
}
