export enum AdminRole {
  ADMIN = 'ADMIN',
}

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface AdminModel {
  id: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  status: AdminStatus;
  otp?: string;
  otpExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAdminInput {
  email: string;
  passwordHash?: string;
  password_hash?: string;
  role?: AdminRole;
  status?: AdminStatus;
}

export interface AdminUserDto {
  id: string;
  email: string;
  role: string;
  status: string;
}

export interface AdminTokenResponseDto {
  access_token: string;
  admin: AdminUserDto;
}
