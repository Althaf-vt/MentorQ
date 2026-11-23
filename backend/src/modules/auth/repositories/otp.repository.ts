import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../schemas/otp.schema.js';
import { IOtpRepository } from './otp.repository.interface.js';

@Injectable()
export class OtpRepository implements IOtpRepository {
  constructor(
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
  ) {}

  async upsertOtp(email: string, otpCode: string, expiresAt: Date): Promise<OtpDocument> {
    return this.otpModel.findOneAndUpdate(
      { email },
      { otp_code: otpCode, expires_at: expiresAt, is_verified: false },
      { upsert: true, returnDocument: 'after' },
    ).exec() as Promise<OtpDocument>;
  }

  async findValidOtp(email: string, otpCode: string): Promise<OtpDocument | null> {
    return this.otpModel.findOne({ email, otp_code: otpCode }).exec();
  }

  async markAsVerified(otpId: string): Promise<OtpDocument | null> {
    return this.otpModel.findByIdAndUpdate(
      otpId,
      { is_verified: true },
      { returnDocument: 'after' },
    ).exec();
  }
}
