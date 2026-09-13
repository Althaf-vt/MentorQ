import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document & { createdAt: Date; updatedAt: Date };

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Session', required: true })
  session_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  message_text: string;

  @Prop({ default: Date.now })
  sent_at: Date;

  @Prop({ default: false })
  read_status: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
