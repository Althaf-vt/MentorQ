import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document & { createdAt: Date; updatedAt: Date };

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  TICKET = 'TICKET',
  SESSION = 'SESSION',
  REVIEW = 'REVIEW',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  recipientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['MENTOR', 'STUDENT'] })
  role: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: Object.values(NotificationType), default: NotificationType.SYSTEM })
  type: NotificationType;

  @Prop({ default: false })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
