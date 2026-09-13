import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { NotificationDocument, NotificationType } from '../schemas/notification.schema.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.SYSTEM,
  ): Promise<NotificationDocument> {
    return this.notificationsRepository.create({
      user_id: userId as any,
      title,
      message,
      type,
    });
  }

  async getUserNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationsRepository.findByUser(userId);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    return this.notificationsRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.markAllAsRead(userId);
  }
}
