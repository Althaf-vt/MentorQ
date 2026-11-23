import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema.js';
import { IMessagesRepository } from './messages.repository.interface.js';
import { MessageModel } from '../types/message.type.js';
import { MessageSchemaMapper } from './mappers/message.schema-mapper.js';

@Injectable()
export class MessagesRepository implements IMessagesRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(message: Partial<Message>): Promise<MessageModel> {
    const newMessage = new this.messageModel(message);
    const saved = await newMessage.save();
    return MessageSchemaMapper.toDomain(saved);
  }

  async findBySession(sessionId: string): Promise<MessageModel[]> {
    const docs = await this.messageModel
      .find({ session_id: sessionId as any })
      .sort({ createdAt: 1 })
      .exec();
    return MessageSchemaMapper.toDomainList(docs);
  }

  async markAsRead(sessionId: string, userId: string): Promise<number> {
    const res = await this.messageModel.updateMany(
      { session_id: sessionId as any, sender_id: { $ne: userId as any } },
      { read_status: true },
    );
    return res.modifiedCount;
  }
}
