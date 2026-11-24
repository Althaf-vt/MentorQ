import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema.js';
import { INotificationsRepository } from './notifications.repository.interface.js';
import { NotificationModel, CreateNotificationInput, NotificationType } from '../types/notification.type.js';
import { NotificationSchemaMapper } from './mappers/notification.schema-mapper.js';

@Injectable()
export class NotificationsRepository implements INotificationsRepository {
  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: CreateNotificationInput): Promise<NotificationModel> {
    const newNotification = new this.notificationModel({
      recipientId: notification.recipientId && Types.ObjectId.isValid(notification.recipientId)
        ? new Types.ObjectId(notification.recipientId)
        : undefined,
      role: notification.role,
      title: notification.title,
      message: notification.message,
      type: notification.type ?? NotificationType.SYSTEM,
    });
    const saved = await newNotification.save();
    return NotificationSchemaMapper.toDomain(saved);
  }

  async findByUser(userId: string, role: string): Promise<NotificationModel[]> {
    const queryConditions: Record<string, unknown>[] = [
      { role, recipientId: null },
      { role, recipientId: { $exists: false } },
    ];

    if (Types.ObjectId.isValid(userId)) {
      queryConditions.unshift({ role, recipientId: new Types.ObjectId(userId) });
    }

    const docs = await this.notificationModel
      .find({ $or: queryConditions })
      .sort({ createdAt: -1 })
      .exec();
    return NotificationSchemaMapper.toDomainList(docs);
  }

  async markAsRead(notificationId: string, userId: string): Promise<NotificationModel | null> {
    const filter: Record<string, unknown> = { _id: notificationId };
    if (Types.ObjectId.isValid(userId)) {
      filter.$or = [
        { recipientId: new Types.ObjectId(userId) },
        { recipientId: null },
        { recipientId: { $exists: false } },
      ];
    }

    const doc = await this.notificationModel
      .findOneAndUpdate(filter, { isRead: true }, { returnDocument: 'after' })
      .exec();
    return doc ? NotificationSchemaMapper.toDomain(doc) : null;
  }

  async markAllAsRead(userId: string, role: string): Promise<number> {
    const queryConditions: Record<string, unknown>[] = [
      { role, recipientId: null },
      { role, recipientId: { $exists: false } },
    ];

    if (Types.ObjectId.isValid(userId)) {
      queryConditions.unshift({ role, recipientId: new Types.ObjectId(userId) });
    }

    const result = await this.notificationModel
      .updateMany({ $or: queryConditions, isRead: false }, { isRead: true })
      .exec();
    return result.modifiedCount;
  }
}
