import { Injectable, Inject } from '@nestjs/common';
import {
  NOTIFICATIONS_REPOSITORY,
  type INotificationsRepository,
} from '../repositories/notifications.repository.interface.js';
import { NotificationType } from '../schemas/notification.schema.js';
import { NotificationModel } from '../types/notification.type.js';

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
  ): Promise<NotificationModel> {
    return this.notificationsRepository.create({
      recipientId: recipientId as any,
      role,
      title,
      message,
      type,
    });
  }

  async getUserNotifications(userId: string, role: string): Promise<NotificationModel[]> {
    return this.notificationsRepository.findByUser(userId, role);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationModel | null> {
    return this.notificationsRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string, role: string): Promise<void> {
    await this.notificationsRepository.markAllAsRead(userId, role);
  }
}
