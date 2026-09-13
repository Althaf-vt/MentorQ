import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TicketDocument = Ticket & Document & { createdAt: Date; updatedAt: Date };

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  mentor_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 15 })
  requested_minutes: number;

  @Prop({
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: string;

  @Prop()
  scheduled_time: Date;

  @Prop({ default: 0 })
  actual_time_spent_minutes: number;

  @Prop([String])
  tags: string[];

  @Prop([
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      feedback_note: String,
    },
  ])
  status_history: any[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
