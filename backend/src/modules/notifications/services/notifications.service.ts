import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { NotificationDocument, NotificationType } from '../schemas/notification.schema.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async createNotification(
    recipientId: string,
    role: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
  ): Promise<NotificationDocument> {
    return this.notificationsRepository.create({
      recipientId: recipientId as any,
      role,
      title,
      message,
      type,
    });
  }

  async getUserNotifications(userId: string, role: string): Promise<NotificationDocument[]> {
    return this.notificationsRepository.findByUser(userId, role);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    return this.notificationsRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string, role: string): Promise<void> {
    await this.notificationsRepository.markAllAsRead(userId, role);
  }
}
