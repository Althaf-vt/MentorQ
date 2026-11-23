import { Admin, AdminDocument } from '../schemas/admin.schema.js';

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export interface IAdminRepository {
  findByEmail(email: string): Promise<AdminDocument | null>;
  findById(id: string): Promise<AdminDocument | null>;
  createAdmin(data: Partial<Admin>): Promise<AdminDocument>;
  setOtp(id: string, otp: string, expiresAt: Date): Promise<AdminDocument | null>;
  clearOtp(id: string): Promise<AdminDocument | null>;
  updatePassword(id: string, passwordHash: string): Promise<AdminDocument | null>;
}
