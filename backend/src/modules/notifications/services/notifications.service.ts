import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATIONS_REPOSITORY,
  type INotificationsRepository,
} from '../repositories/notifications.repository.interface.js';
import { NotificationDocument, NotificationType } from '../schemas/notification.schema.js';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

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
