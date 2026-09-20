import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

export enum AdminRole {
  ADMIN = 'ADMIN',
}

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Admin {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, enum: AdminRole, default: AdminRole.ADMIN })
  role: string;

  @Prop({ required: true, enum: AdminStatus, default: AdminStatus.ACTIVE })
  status: string;

  @Prop()
  otp?: string;

  @Prop()
  otpExpiresAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
