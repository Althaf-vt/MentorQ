import { MentorProfile, MentorProfileDocument } from '../schemas/mentor-profile.schema.js';

export const MENTOR_PROFILES_REPOSITORY = Symbol('MENTOR_PROFILES_REPOSITORY');

export interface IMentorProfilesRepository {
  create(profile: Partial<MentorProfile>): Promise<MentorProfileDocument>;
  findByUserId(userId: string): Promise<MentorProfileDocument | null>;
  update(userId: string, update: any): Promise<MentorProfileDocument | null>;
  findAllOnline(): Promise<MentorProfileDocument[]>;
}
