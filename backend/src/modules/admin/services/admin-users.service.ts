import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import { UpdateUserStatusDto } from '../dto/users.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(private readonly usersService: UsersService) {}

  async listUsers(page: number = 1, limit: number = 10, role?: string) {
    return this.usersService.listUsers(page, limit, role);
  }

  async updateUserStatus(id: string, updateDto: UpdateUserStatusDto) {
    return this.usersService.updateUserStatus(id, updateDto.status);
  }
}
