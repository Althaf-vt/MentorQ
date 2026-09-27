export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface AdminAuthResponse {
  access_token: string;
  admin: AdminUser;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminForgotPasswordRequest {
  email: string;
}

export interface AdminVerifyOtpRequest {
  email: string;
  otp: string;
}

export interface AdminVerifyOtpResponse {
  message: string;
  resetToken: string;
}

export interface AdminResetPasswordRequest {
  token: string;
  newPassword: string;
}
