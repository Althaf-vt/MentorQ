import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MentorProfileDocument = MentorProfile & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, strict: false })
export class MentorProfile {
  @Prop({ type: MongooseSchema.Types.Mixed, ref: 'User', required: true, unique: true })
  user_id: any;

  @Prop({ type: [String], required: true })
  expertise_tags: string[];

  @Prop({ required: true, default: 90 })
  daily_available_minutes: number;

  @Prop({ required: true, default: 90 })
  remaining_minutes_today: number;

  @Prop({ required: true, default: true })
  is_online: boolean;

  @Prop({ default: 0 })
  rating_avg: number;

  @Prop({
    type: {
      start: { type: String, required: true },
      end: { type: String, required: true },
      timezone: { type: String, required: true, default: 'Asia/Kolkata' },
    },
    required: true,
  })
  operating_hours: {
    start: string;
    end: string;
    timezone: string;
  };
}

export const MentorProfileSchema = SchemaFactory.createForClass(MentorProfile);
