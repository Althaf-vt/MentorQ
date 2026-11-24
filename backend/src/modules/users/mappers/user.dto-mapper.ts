import {
  UserModel,
  UserSummaryDto,
  UserResponseDto,
  MentorDirectoryEntryDto,
} from '../types/user.type.js';
import { MentorProfileModel } from '../../mentor-profiles/types/mentor-profile.type.js';

export class UserDtoMapper {
  static toResponseDto(user: UserModel): UserResponseDto {
    return {
      id: user.id || user._id,
      fullName: user.fullName || user.full_name || '',
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: Boolean(user.isVerified ?? user.is_verified),
      avatarUrl: user.avatarUrl ?? user.avatar_url,
      socialLinks: user.socialLinks,
      isOnline: user.isOnline ?? false,
    };
  }

  static toSummaryDto(user: UserModel): UserSummaryDto {
    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isOnline: user.isOnline,
    };
  }

  static toSummaryDtoList(users: UserModel[]): UserSummaryDto[] {
    return users.map((user) => this.toSummaryDto(user));
  }

  static toDirectoryEntry(
    user: UserModel,
    profile: MentorProfileModel | null,
  ): MentorDirectoryEntryDto {
    return {
      id: user.id || user._id,
      fullName: user.fullName || user.full_name || '',
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: Boolean(user.isVerified ?? user.is_verified),
      avatarUrl: user.avatarUrl ?? user.avatar_url,
      socialLinks: user.socialLinks,
      isOnline: user.isOnline ?? false,
      mentorProfile: profile,
    };
  }

  static toDirectoryList(
    mentors: UserModel[],
    profileMap: Map<string, MentorProfileModel>,
  ): MentorDirectoryEntryDto[] {
    return mentors.map((mentor) =>
      this.toDirectoryEntry(mentor, profileMap.get(mentor.id) || null),
    );
  }

  static toFavoriteList(favorites: (string | UserModel)[]): (string | UserResponseDto)[] {
    return favorites.map((m) =>
      typeof m === 'object' && m ? this.toResponseDto(m) : m,
    );
  }
}
