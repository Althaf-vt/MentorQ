export interface OtpModel {
  _id: string;
  id: string;
  email: string;
  otpCode: string;
  otp_code: string;
  expiresAt: Date;
  expires_at: Date;
  isVerified: boolean;
  is_verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
