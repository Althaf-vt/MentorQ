import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema.js';
import { INotificationsRepository } from './notifications.repository.interface.js';
import { NotificationModel } from '../types/notification.type.js';
import { NotificationSchemaMapper } from './mappers/notification.schema-mapper.js';

@Injectable()
export class NotificationsRepository implements INotificationsRepository {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: Partial<Notification>): Promise<NotificationModel> {
    const newNotification = new this.notificationModel(notification);
    const saved = await newNotification.save();
    return NotificationSchemaMapper.toDomain(saved);
  }

  async findByUser(userId: string, role: string): Promise<NotificationModel[]> {
    const docs = await this.notificationModel
      .find({
        $or: [
          { recipientId: userId as any, role },
          { recipientId: null, role },
          { recipientId: { $exists: false }, role },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();
    return NotificationSchemaMapper.toDomainList(docs);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationModel | null> {
    const updated = await this.notificationModel.findOneAndUpdate(
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
    return updated ? NotificationSchemaMapper.toDomain(updated) : null;
  }

  async markAllAsRead(userId: string, role: string): Promise<number> {
    const res = await this.notificationModel.updateMany(
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
    return res.modifiedCount;
  }
}
