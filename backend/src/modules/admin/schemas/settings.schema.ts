import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlatformSettingsDocument = PlatformSettings & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class PlatformSettings {
  @Prop({ required: true, default: true })
  allowStudentRegistration: boolean;

  @Prop({ required: true, default: true })
  allowMentorRegistration: boolean;

  @Prop({ required: true, default: 'MentorQ' })
  platformName: string;

  @Prop({ required: true, default: 'Expert guidance for your journey' })
  platformDescription: string;

  @Prop({ required: true, default: '/logo.png' })
  logoUrl: string;
}

export const PlatformSettingsSchema = SchemaFactory.createForClass(PlatformSettings);
