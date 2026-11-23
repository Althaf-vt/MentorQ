import {
  MentorProfileModel,
  CreateMentorProfileInput,
  UpdateMentorProfileInput,
} from '../types/mentor-profile.type.js';

export const MENTOR_PROFILES_REPOSITORY = Symbol('MENTOR_PROFILES_REPOSITORY');

export interface IMentorProfilesRepository {
  create(profile: CreateMentorProfileInput): Promise<MentorProfileModel>;
  findByUserId(userId: string): Promise<MentorProfileModel | null>;
  upsertProfile(
    userId: string,
    updateData: UpdateMentorProfileInput,
    defaults: CreateMentorProfileInput,
  ): Promise<MentorProfileModel | null>;
  updateRating(userId: string, ratingAvg: number): Promise<void>;
  findAllOnline(): Promise<MentorProfileModel[]>;
}
