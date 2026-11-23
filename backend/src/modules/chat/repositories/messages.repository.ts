import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema.js';
import { IMessagesRepository } from './messages.repository.interface.js';
import { MessageModel, CreateMessageInput } from '../types/message.type.js';
import { MessageSchemaMapper } from './mappers/message.schema-mapper.js';

@Injectable()
export class MessagesRepository implements IMessagesRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(input: CreateMessageInput): Promise<MessageModel> {
    const newMessage = new this.messageModel({
      session_id: Types.ObjectId.isValid(input.sessionId) ? new Types.ObjectId(input.sessionId) : input.sessionId,
      sender_id: Types.ObjectId.isValid(input.senderId) ? new Types.ObjectId(input.senderId) : input.senderId,
      message_text: input.messageText,
      sent_at: input.sentAt || new Date(),
    });
    const saved = await newMessage.save();
    return MessageSchemaMapper.toDomain(saved as MessageDocument);
  }

  async findBySession(sessionId: string): Promise<MessageModel[]> {
    const query: Record<string, unknown> = {
      session_id: Types.ObjectId.isValid(sessionId) ? new Types.ObjectId(sessionId) : sessionId,
    };
    const docs = await this.messageModel
      .find(query)
      .sort({ createdAt: 1 })
      .exec();
    return MessageSchemaMapper.toDomainList(docs as MessageDocument[]);
  }

  async markAsRead(sessionId: string, userId: string): Promise<number> {
    const sessionTarget = Types.ObjectId.isValid(sessionId) ? new Types.ObjectId(sessionId) : sessionId;
    const userTarget = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
    const query: Record<string, unknown> = {
      session_id: sessionTarget,
      sender_id: { $ne: userTarget },
    };
    const res = await this.messageModel.updateMany(
      query,
      { read_status: true },
    );
    return res.modifiedCount;
  }
}
