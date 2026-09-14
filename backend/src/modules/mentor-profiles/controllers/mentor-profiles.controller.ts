import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { MentorProfilesService } from '../services/mentor-profiles.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('api/v1/mentors')
export class MentorProfilesController {
  constructor(private readonly mentorProfilesService: MentorProfilesService) {}

  @Get('online')
  async getOnlineMentors() {
    const mentors = await this.mentorProfilesService.getOnlineMentors();
    return {
      status: 'success',
      data: mentors,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req: any) {
    const userId = (req.user?.id || req.user?._id)?.toString();
    const profile = await this.mentorProfilesService.findByUserId(userId);
    return {
      status: 'success',
      data: profile,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(@Req() req: any, @Body() updateData: any) {
    const userId = (req.user?.id || req.user?._id)?.toString();
    const profile = await this.mentorProfilesService.updateProfile(userId, updateData);
    return {
      status: 'success',
      data: profile,
    };
  }
}
