import { NotificationDocument } from '../../schemas/notification.schema.js';
import { NotificationModel } from '../../types/notification.type.js';

export class NotificationSchemaMapper {
  static toDomain(doc: NotificationDocument): NotificationModel {
    return {
      id: doc._id.toString(),
      recipientId: doc.recipientId ? doc.recipientId.toString() : null,
      role: doc.role,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      isRead: doc.isRead,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDomainList(docs: NotificationDocument[]): NotificationModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
