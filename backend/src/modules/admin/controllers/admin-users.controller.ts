import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminUsersService } from '../services/admin-users.service.js';
import { UpdateUserStatusDto } from '../dto/users.dto.js';
import { ListUsersQueryDto } from '../dto/list-users-query.dto.js';
import { PaginatedUsersResponseDto, UserStatusResponseDto } from '../../users/types/user.type.js';

@Controller('api/v1/admin/users')
@UseGuards(AuthGuard('jwt'))
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async listUsers(
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 10;
    return this.adminUsersService.listUsers(pageNum, limitNum, query.role);
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStatusDto,
  ): Promise<UserStatusResponseDto> {
    return this.adminUsersService.updateUserStatus(id, updateDto);
  }
}
