import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from '../services/users.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return {
      status: 'success',
      data: {
        id: user._id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
    };
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() updateData: any) {
    const user = await this.usersService.updateProfile(req.user.id, updateData);
    return {
      status: 'success',
      data: {
        id: user._id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
    };
  }
}
