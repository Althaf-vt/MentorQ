import { OtpDocument } from '../schemas/otp.schema.js';

export const OTP_REPOSITORY = Symbol('OTP_REPOSITORY');

export interface IOtpRepository {
  upsertOtp(email: string, otpCode: string, expiresAt: Date): Promise<OtpDocument>;
  findValidOtp(email: string, otpCode: string): Promise<OtpDocument | null>;
  markAsVerified(otpId: string): Promise<OtpDocument | null>;
}
