import { Injectable, NotFoundException } from '@nestjs/common';
import { MentorProfilesRepository } from '../repositories/mentor-profiles.repository.js';
import { MentorProfileDocument } from '../schemas/mentor-profile.schema.js';

@Injectable()
export class MentorProfilesService {
  constructor(private readonly mentorProfilesRepository: MentorProfilesRepository) {}

  async findByUserId(userId: string): Promise<MentorProfileDocument | any> {
    const profile = await this.mentorProfilesRepository.findByUserId(userId);
    if (!profile) {
      return {
        user_id: userId,
        expertise_tags: [],
        daily_available_minutes: 90,
        remaining_minutes_today: 90,
        is_online: true,
        rating_avg: 0,
        operating_hours: {
          start: '09:00 AM',
          end: '06:00 PM',
          timezone: 'Asia/Kolkata',
        },
      };
    }
    return profile;
  }

  async updateProfile(userId: string, updateData: any): Promise<MentorProfileDocument | any> {
    const profile = await this.mentorProfilesRepository.update(userId, updateData);
    return profile;
  }

  async getOnlineMentors(): Promise<MentorProfileDocument[]> {
    return this.mentorProfilesRepository.findAllOnline();
  }
}
