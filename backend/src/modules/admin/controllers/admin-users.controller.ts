import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminUsersService } from '../services/admin-users.service.js';
import { UpdateUserStatusDto } from '../dto/users.dto.js';

@Controller('api/v1/admin/users')
@UseGuards(AuthGuard('jwt'))
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.adminUsersService.listUsers(pageNum, limitNum, role);
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateUserStatus(id, updateDto);
  }
}
