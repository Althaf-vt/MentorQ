import { MentorProfile } from '../schemas/mentor-profile.schema.js';
import { MentorProfileModel } from '../types/mentor-profile.type.js';

export const MENTOR_PROFILES_REPOSITORY = Symbol('MENTOR_PROFILES_REPOSITORY');

export interface IMentorProfilesRepository {
  create(profile: Partial<MentorProfile>): Promise<MentorProfileModel>;
  findByUserId(userId: string): Promise<MentorProfileModel | null>;
  update(userId: string, update: any): Promise<MentorProfileModel | null>;
  findAllOnline(): Promise<MentorProfileModel[]>;
}
