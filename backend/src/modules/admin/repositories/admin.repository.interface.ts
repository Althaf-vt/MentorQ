import { AdminModel, CreateAdminInput } from '../types/admin.type.js';

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export interface IAdminRepository {
  findByEmail(email: string): Promise<AdminModel | null>;
  findById(id: string): Promise<AdminModel | null>;
  createAdmin(data: CreateAdminInput): Promise<AdminModel>;
  setOtp(id: string, otp: string, expiresAt: Date): Promise<AdminModel | null>;
  clearOtp(id: string): Promise<AdminModel | null>;
  updatePassword(id: string, passwordHash: string): Promise<AdminModel | null>;
}
