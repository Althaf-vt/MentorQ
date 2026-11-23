import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../schemas/otp.schema.js';
import { IOtpRepository } from './otp.repository.interface.js';
import { OtpModel } from '../types/otp.type.js';
import { OtpSchemaMapper } from './mappers/otp.schema-mapper.js';

@Injectable()
export class OtpRepository implements IOtpRepository {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
  ) {}

  async upsertOtp(email: string, otpCode: string, expiresAt: Date): Promise<OtpModel> {
    const doc = await this.otpModel.findOneAndUpdate(
      { email },
      { otp_code: otpCode, expires_at: expiresAt, is_verified: false },
      { upsert: true, returnDocument: 'after' },
    ).exec();
    return OtpSchemaMapper.toDomain(doc as OtpDocument)!;
  }

  async findValidOtp(email: string, otpCode: string): Promise<OtpModel | null> {
    const doc = await this.otpModel.findOne({ email, otp_code: otpCode }).exec();
    return OtpSchemaMapper.toDomain(doc);
  }

  async markAsVerified(otpId: string): Promise<OtpModel | null> {
    const doc = await this.otpModel.findByIdAndUpdate(
      otpId,
      { is_verified: true },
      { returnDocument: 'after' },
    ).exec();
    return OtpSchemaMapper.toDomain(doc);
  }
}
