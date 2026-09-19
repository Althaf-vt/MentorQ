import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema.js';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: Partial<Notification>): Promise<NotificationDocument> {
    const newNotification = new this.notificationModel(notification);
    return newNotification.save();
  }

  async findByUser(userId: string, role: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({
        $or: [
          { recipientId: userId as any, role },
          { recipientId: null, role },
          { recipientId: { $exists: false }, role },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    return this.notificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        $or: [
          { recipientId: userId as any },
          { recipientId: null },
          { recipientId: { $exists: false } },
        ],
      },
      { isRead: true },
      { returnDocument: 'after' },
    );
  }

  async markAllAsRead(userId: string, role: string): Promise<any> {
    return this.notificationModel.updateMany(
      {
        role,
        isRead: false,
        $or: [
          { recipientId: userId as any },
          { recipientId: null },
          { recipientId: { $exists: false } },
        ],
      },
      { isRead: true },
    );
  }
}
