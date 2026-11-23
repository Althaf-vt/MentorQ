import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../schemas/message.schema.js';
import { IMessagesRepository } from './messages.repository.interface.js';

@Injectable()
export class MessagesRepository implements IMessagesRepository {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(message: Partial<Message>): Promise<MessageDocument> {
    const newMessage = new this.messageModel(message);
    return newMessage.save();
  }

  async findBySession(sessionId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({ session_id: sessionId as any })
      .sort({ createdAt: 1 })
      .exec();
  }

  async markAsRead(sessionId: string, userId: string): Promise<any> {
    return this.messageModel.updateMany(
      { session_id: sessionId as any, sender_id: { $ne: userId as any } },
      { read_status: true },
    );
  }
}
