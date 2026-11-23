import { Injectable, Inject } from '@nestjs/common';
import {
  MENTOR_PROFILES_REPOSITORY,
  type IMentorProfilesRepository,
} from '../repositories/mentor-profiles.repository.interface.js';
import { MentorProfileModel } from '../types/mentor-profile.type.js';
import { MENTOR_PROFILE_DEFAULTS } from '../constants/mentor-profiles.constants.js';

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

  async updateProfile(userId: string, updateData: any): Promise<MentorProfileModel | null> {
    const updatePayload: any = {};
    
    if (updateData.isOnline !== undefined) {
      updatePayload.is_online = updateData.isOnline;
    }
    if (updateData.dailyAvailability !== undefined) {
      updatePayload.daily_available_minutes = updateData.dailyAvailability;
    }
    if (updateData.operatingHours) {
      updatePayload.operating_hours = {
        start: updateData.operatingHours.startTime,
        end: updateData.operatingHours.endTime,
        timezone: updateData.operatingHours.timezone,
      };
    }
    if (updateData.expertiseTags) {
      updatePayload.expertise_tags = updateData.expertiseTags;
    }

    updatePayload.$unset = {
      isAvailable: "",
      is_available: "",
      dailyAvailability: "",
      operatingHours: ""
    };

    return this.mentorProfilesRepository.update(userId, updatePayload);
  }

  async getOnlineMentors(): Promise<MentorProfileModel[]> {
    return this.mentorProfilesRepository.findAllOnline();
  }

  async updateRating(userId: string, ratingAvg: number): Promise<void> {
    await this.mentorProfilesRepository.update(userId, { rating_avg: ratingAvg });
  }
}
