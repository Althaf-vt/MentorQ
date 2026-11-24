import { MentorProfileModel } from '../../mentor-profiles/types/mentor-profile.type.js';

export interface SocialLinks {
  linkedin?: string;
  github?: string;
}

export interface CreateUserInput {
  email: string;
  password_hash: string;
  full_name: string;
  role?: string;
  status?: string;
  is_verified?: boolean;
  avatar_url?: string;
}

export interface UpdateUserProfileInput {
  fullName?: string;
  socialLinks?: SocialLinks;
}

export interface UserModel {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  isVerified: boolean;
  avatarUrl?: string;
  socialLinks?: SocialLinks;
  isOnline: boolean;
  favoriteMentors: (string | UserModel)[];
  createdAt?: Date;
  updatedAt?: Date;

  // Compatibility aliases for consumers transitioning across phases
  _id: string;
  full_name?: string;
  password_hash: string;
  is_verified?: boolean;
  avatar_url?: string;
  favorite_mentors?: (string | UserModel)[];
}

export interface UserSummaryDto {
  id: string;
  fullName: string;
  avatarUrl?: string;
  role: string;
  isOnline: boolean;
}

export interface UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
  avatarUrl?: string;
  socialLinks?: SocialLinks;
  isOnline: boolean;
}

export interface UserStatusResponseDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
}

export interface PaginatedUsersResponseDto {
  data: UserSummaryDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserEnvelopeDto<T> {
  status: 'success';
  data: T;
}

export interface UserMetricsResponseDto {
  students: { total: number; suspended: number; active: number };
  mentors: { total: number; suspended: number; active: number };
}

export interface MentorDirectoryEntryDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
  avatarUrl?: string;
  socialLinks?: SocialLinks;
  isOnline: boolean;
  mentorProfile: MentorProfileModel | null;
}
