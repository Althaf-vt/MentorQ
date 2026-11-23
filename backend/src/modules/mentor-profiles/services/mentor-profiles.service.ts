import { Injectable, Inject } from '@nestjs/common';
import {
  MENTOR_PROFILES_REPOSITORY,
  type IMentorProfilesRepository,
} from '../repositories/mentor-profiles.repository.interface.js';
import {
  MentorProfileModel,
  CreateMentorProfileInput,
  UpdateMentorProfileInput,
} from '../types/mentor-profile.type.js';
import { MENTOR_PROFILE_DEFAULTS } from '../constants/mentor-profiles.constants.js';
import { UpdateMentorConfigDto } from '../dto/update-mentor-config.dto.js';

@Injectable()
export class MentorProfilesService {
  constructor(
    @Inject(MENTOR_PROFILES_REPOSITORY)
    private readonly mentorProfilesRepository: IMentorProfilesRepository,
  ) {}

  async findByUserId(userId: string): Promise<MentorProfileModel> {
    const profile = await this.mentorProfilesRepository.findByUserId(userId);
    if (!profile) {
      return {
        id: '',
        userId,
        expertiseTags: [],
        dailyAvailableMinutes: MENTOR_PROFILE_DEFAULTS.DAILY_AVAILABLE_MINUTES,
        remainingMinutesToday: MENTOR_PROFILE_DEFAULTS.REMAINING_MINUTES_TODAY,
        isOnline: MENTOR_PROFILE_DEFAULTS.IS_ONLINE,
        ratingAvg: MENTOR_PROFILE_DEFAULTS.RATING_AVG,
        operatingHours: {
          start: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_START,
          end: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_END,
          timezone: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_TIMEZONE,
        },
      };
    }
    return profile;
  }

  async updateProfile(userId: string, updateDto: UpdateMentorConfigDto): Promise<MentorProfileModel | null> {
    const updateInput: UpdateMentorProfileInput = {};

    if (updateDto.isOnline !== undefined) {
      updateInput.isOnline = updateDto.isOnline;
    }
    if (updateDto.dailyAvailability !== undefined) {
      updateInput.dailyAvailableMinutes = updateDto.dailyAvailability;
    }
    if (updateDto.operatingHours) {
      updateInput.operatingHours = {
        start: updateDto.operatingHours.startTime,
        end: updateDto.operatingHours.endTime,
        timezone: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_TIMEZONE,
      };
    }
    if (updateDto.expertiseTags) {
      updateInput.expertiseTags = updateDto.expertiseTags;
    }

    const defaultInput: CreateMentorProfileInput = {
      userId,
      expertiseTags: updateInput.expertiseTags || [],
      dailyAvailableMinutes: updateInput.dailyAvailableMinutes ?? MENTOR_PROFILE_DEFAULTS.DAILY_AVAILABLE_MINUTES,
      remainingMinutesToday: MENTOR_PROFILE_DEFAULTS.REMAINING_MINUTES_TODAY,
      isOnline: updateInput.isOnline ?? MENTOR_PROFILE_DEFAULTS.IS_ONLINE,
      ratingAvg: MENTOR_PROFILE_DEFAULTS.RATING_AVG,
      operatingHours: updateInput.operatingHours || {
        start: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_START,
        end: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_END,
        timezone: MENTOR_PROFILE_DEFAULTS.OPERATING_HOURS_TIMEZONE,
      },
    };

    return this.mentorProfilesRepository.upsertProfile(userId, updateInput, defaultInput);
  }

  async getOnlineMentors(): Promise<MentorProfileModel[]> {
    return this.mentorProfilesRepository.findAllOnline();
  }

  async updateRating(userId: string, ratingAvg: number): Promise<void> {
    await this.mentorProfilesRepository.updateRating(userId, ratingAvg);
  }
}
