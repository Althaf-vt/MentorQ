export const AUTH_CONFIG = {
  BCRYPT_SALT_ROUNDS: 10,
  OTP_EXPIRY_MS: 10 * 60 * 1000,
  OAUTH_PASSWORD_PLACEHOLDER: 'OAUTH_USER',
  DEFAULT_FRONTEND_URL: 'http://localhost:5180',
  LOGIN_ROUTES: {
    MENTOR: '/mentor/login',
    STUDENT: '/login',
  },
} as const;

export const AUTH_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful. OTP sent to email.',
  OTP_SENT: 'OTP sent successfully',
  OTP_VERIFIED: 'OTP verified successfully',
} as const;

export const AUTH_ERROR_MESSAGES = {
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_CREDENTIALS: 'Invalid credentials',
  MENTOR_NOT_ACCESSED: 'Mentor profile not accessed',
  USER_NOT_FOUND: 'User not found',
  INVALID_ROLE: 'Invalid role specified',
  EMAIL_NOT_VERIFIED:
    'Please verify your email before logging in. A new verification code has been sent.',
  INVALID_OR_EXPIRED_OTP: 'Invalid or expired OTP',
  USER_NO_LONGER_EXISTS: 'User no longer exists',
} as const;
