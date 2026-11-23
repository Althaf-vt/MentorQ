import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../schemas/admin.schema.js';
import { IAdminRepository } from './admin.repository.interface.js';

@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  async findByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).exec();
  }

  async createAdmin(data: Partial<Admin>): Promise<AdminDocument> {
    const admin = new this.adminModel(data);
    return admin.save();
  }

  async setOtp(id: string, otp: string, expiresAt: Date): Promise<AdminDocument | null> {
    return this.adminModel.findByIdAndUpdate(
      id,
      { otp, otpExpiresAt: expiresAt },
      { returnDocument: 'after' },
    ).exec();
  }

  async clearOtp(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findByIdAndUpdate(
      id,
      { $unset: { otp: 1, otpExpiresAt: 1 } },
      { returnDocument: 'after' },
    ).exec();
  }

  async updatePassword(id: string, passwordHash: string): Promise<AdminDocument | null> {
    return this.adminModel.findByIdAndUpdate(
      id,
      { password_hash: passwordHash },
      { returnDocument: 'after' },
    ).exec();
  }
}
