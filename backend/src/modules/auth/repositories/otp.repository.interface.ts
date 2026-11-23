import { OtpModel } from '../types/otp.type.js';

export const OTP_REPOSITORY = Symbol('OTP_REPOSITORY');

export interface IOtpRepository {
  upsertOtp(email: string, otpCode: string, expiresAt: Date): Promise<OtpModel>;
  findValidOtp(email: string, otpCode: string): Promise<OtpModel | null>;
  markAsVerified(otpId: string): Promise<OtpModel | null>;
}
