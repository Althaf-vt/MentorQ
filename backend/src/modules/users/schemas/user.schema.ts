import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true, trim: true })
  full_name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, enum: ['STUDENT', 'MENTOR', 'ADMIN'], default: 'STUDENT' })
  role: string;

  @Prop({ required: true, default: false })
  is_verified: boolean;

  @Prop()
  avatar_url?: string;

  @Prop({ type: { linkedin: String, github: String }, required: false })
  social_links?: {
    linkedin?: string;
    github?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
