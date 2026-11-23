import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../schemas/admin.schema.js';
import { IAdminRepository } from './admin.repository.interface.js';
import { AdminModel, CreateAdminInput } from '../types/admin.type.js';
import { AdminSchemaMapper } from './mappers/admin.schema-mapper.js';

@Injectable()
export class AdminRepository implements IAdminRepository {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  async findByEmail(email: string): Promise<AdminModel | null> {
    const doc = await this.adminModel.findOne({ email }).exec();
    return AdminSchemaMapper.toDomain(doc);
  }

  async findById(id: string): Promise<AdminModel | null> {
    const doc = await this.adminModel.findById(id).exec();
    return AdminSchemaMapper.toDomain(doc);
  }

  async createAdmin(data: CreateAdminInput): Promise<AdminModel> {
    const admin = new this.adminModel({
      email: data.email,
      password_hash: data.passwordHash || data.password_hash,
      role: data.role,
      status: data.status,
    });
    const saved = await admin.save();
    return AdminSchemaMapper.toDomain(saved)!;
  }

  async setOtp(id: string, otp: string, expiresAt: Date): Promise<AdminModel | null> {
    const doc = await this.adminModel.findByIdAndUpdate(
      id,
      { otp, otpExpiresAt: expiresAt },
      { returnDocument: 'after' },
    ).exec();
    return AdminSchemaMapper.toDomain(doc);
  }

  async clearOtp(id: string): Promise<AdminModel | null> {
    const doc = await this.adminModel.findByIdAndUpdate(
      id,
      { $unset: { otp: 1, otpExpiresAt: 1 } },
      { returnDocument: 'after' },
    ).exec();
    return AdminSchemaMapper.toDomain(doc);
  }

  async updatePassword(id: string, passwordHash: string): Promise<AdminModel | null> {
    const doc = await this.adminModel.findByIdAndUpdate(
      id,
      { password_hash: passwordHash },
      { returnDocument: 'after' },
    ).exec();
    return AdminSchemaMapper.toDomain(doc);
  }
}
