import { Injectable, NotFoundException } from '@nestjs/common';
import { MentorProfilesRepository } from '../repositories/mentor-profiles.repository.js';
import { MentorProfileDocument } from '../schemas/mentor-profile.schema.js';

@Injectable()
export class MentorProfilesService {
  constructor(private readonly mentorProfilesRepository: MentorProfilesRepository) {}

  async findByUserId(userId: string): Promise<MentorProfileDocument> {
    const profile = await this.mentorProfilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Mentor profile not found');
    }
    return profile;
  }

  async updateProfile(userId: string, updateData: any): Promise<MentorProfileDocument> {
    const profile = await this.mentorProfilesRepository.update(userId, updateData);
    if (!profile) {
      throw new NotFoundException('Mentor profile not found');
    }
    return profile;
  }

  async getOnlineMentors(): Promise<MentorProfileDocument[]> {
    return this.mentorProfilesRepository.findAllOnline();
  }
}
