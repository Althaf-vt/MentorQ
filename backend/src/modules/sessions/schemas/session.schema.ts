import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = Session & Document & { createdAt: Date; updatedAt: Date };

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true, unique: true })
  ticket_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  mentor_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  started_at: Date;

  @Prop({ required: true })
  allocated_minutes: number;

  @Prop({ default: 0 })
  extended_minutes: number;

  @Prop()
  ended_at: Date;

  @Prop({ default: 0 })
  actual_duration_minutes: number;

  @Prop({
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'TERMINATED'],
    default: 'ACTIVE',
  })
  session_status: string;

  @Prop()
  resolution_notes: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
