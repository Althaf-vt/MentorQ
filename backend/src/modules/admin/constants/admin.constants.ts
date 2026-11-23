export const ADMIN_CONFIG = {
  BCRYPT_SALT_ROUNDS: 10,
  OTP_EXPIRY_MS: 5 * 60 * 1000,
  RESET_TOKEN_EXPIRY: '15m',
  RESET_TOKEN_INTENT: 'reset_password',
} as const;

export const ADMIN_MESSAGES = {
  OTP_SENT_MASKED: 'If an account exists with this email, an OTP has been sent.',
  OTP_VERIFIED: 'OTP verified successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
} as const;

export const ADMIN_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_SUSPENDED: 'Admin account is suspended',
  INVALID_OTP: 'Invalid OTP',
  OTP_EXPIRED: 'OTP has expired',
  INVALID_OR_EXPIRED_RESET_TOKEN: 'Invalid or expired reset token',
  INVALID_TOKEN_INTENT: 'Invalid token intent',
  ADMIN_NOT_FOUND: 'Admin not found',
} as const;
