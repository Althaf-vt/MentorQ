import { NotificationModel, CreateNotificationInput } from '../types/notification.type.js';

export const NOTIFICATIONS_REPOSITORY = Symbol('NOTIFICATIONS_REPOSITORY');

export interface INotificationsRepository {
  create(input: CreateNotificationInput): Promise<NotificationModel>;
  findByUser(userId: string, role: string): Promise<NotificationModel[]>;
  markAsRead(notificationId: string, userId: string): Promise<NotificationModel | null>;
  markAllAsRead(userId: string, role: string): Promise<number>;
}
