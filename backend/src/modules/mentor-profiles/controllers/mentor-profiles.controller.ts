import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { MentorProfilesService } from '../services/mentor-profiles.service.js';

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
  async getMyProfile(@Req() req: any) {
    const profile = await this.mentorProfilesService.findByUserId(req.user.id);
    return {
      status: 'success',
      data: profile,
    };
  }

  @Patch('me')
  async updateMyProfile(@Req() req: any, @Body() updateData: any) {
    const profile = await this.mentorProfilesService.updateProfile(req.user.id, updateData);
    return {
      status: 'success',
      data: profile,
    };
  }
}
