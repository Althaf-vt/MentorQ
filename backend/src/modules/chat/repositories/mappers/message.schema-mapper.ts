import { MessageDocument } from '../../schemas/message.schema.js';
import { MessageModel } from '../../types/message.type.js';

export class MessageSchemaMapper {
  static toDomain(doc: MessageDocument): MessageModel {
    return {
      id: doc._id.toString(),
      sessionId: doc.session_id.toString(),
      senderId: doc.sender_id.toString(),
      messageText: doc.message_text,
      sentAt: doc.sent_at,
      readStatus: doc.read_status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static toDomainList(docs: MessageDocument[]): MessageModel[] {
    return docs.map((doc) => this.toDomain(doc));
  }
}
