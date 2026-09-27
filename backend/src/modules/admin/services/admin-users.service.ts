import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { UpdateUserStatusDto } from '../dto/users.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async listUsers(page: number = 1, limit: number = 10, role?: string) {
    const query = role ? { role } : {};
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return {
      data: users.map(user => ({
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.get('created_at'),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async updateUserStatus(id: string, updateDto: UpdateUserStatusDto) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status: updateDto.status },
      { new: true }
    ).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
