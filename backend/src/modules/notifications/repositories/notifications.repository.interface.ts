import { Notification } from '../schemas/notification.schema.js';
import { NotificationModel } from '../types/notification.type.js';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface INotificationsRepository {
  create(notification: Partial<Notification>): Promise<NotificationModel>;
  findByUser(userId: string, role: string): Promise<NotificationModel[]>;
  markAsRead(notificationId: string, userId: string): Promise<NotificationModel | null>;
  markAllAsRead(userId: string, role: string): Promise<number>;
}
