import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository.js';
import { UserDocument } from '../schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findOne({ email });
  }

  async updateProfile(id: string, updateData: any): Promise<UserDocument> {
    const user = await this.usersRepository.update(id, updateData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
