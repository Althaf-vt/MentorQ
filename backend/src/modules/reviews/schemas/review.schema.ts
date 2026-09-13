import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReviewDocument = Review & Document & { createdAt: Date; updatedAt: Date };

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Session', required: true, unique: true })
  session_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  mentor_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  feedback_text: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
