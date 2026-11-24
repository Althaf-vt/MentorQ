import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { MentorProfilesService } from '../services/mentor-profiles.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { UpdateMentorConfigDto } from '../dto/update-mentor-config.dto.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';
import { MentorProfileDtoMapper } from '../mappers/mentor-profile.dto-mapper.js';
import { MentorProfileEnvelopeDto } from '../dto/mentor-profile-response.dto.js';

@Controller('api/v1/mentors')
export class MentorProfilesController {
  constructor(private readonly mentorProfilesService: MentorProfilesService) {}

  @Get('online')
  async getOnlineMentors(): Promise<MentorProfileEnvelopeDto> {
    const mentors = await this.mentorProfilesService.getOnlineMentors();
    return MentorProfileDtoMapper.toListEnvelope(mentors);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req: AuthenticatedRequest): Promise<MentorProfileEnvelopeDto> {
    const userId = req.user.id;
    const profile = await this.mentorProfilesService.findByUserId(userId);
    return MentorProfileDtoMapper.toEnvelope(profile);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMyProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateData: UpdateMentorConfigDto,
  ): Promise<MentorProfileEnvelopeDto> {
    const userId = req.user.id;
    const profile = await this.mentorProfilesService.updateProfile(userId, updateData);
    return MentorProfileDtoMapper.toEnvelope(profile!);
  }
}
