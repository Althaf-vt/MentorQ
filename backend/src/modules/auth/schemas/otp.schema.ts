import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Otp {
  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  otp_code: string;

  @Prop({ required: true })
  expires_at: Date;

  @Prop({ default: false })
  is_verified: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
