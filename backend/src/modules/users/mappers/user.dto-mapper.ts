import {
  UserModel,
  UserSummaryDto,
  UserResponseDto,
} from '../types/user.type.js';

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

  static toDirectoryEntry(d: any): any {
    return {
      id: d._id?.toString() || d.id,
      fullName: d.full_name || d.fullName,
      email: d.email,
      role: d.role,
      status: d.status,
      isVerified: Boolean(d.is_verified ?? d.isVerified),
      avatarUrl: d.avatar_url ?? d.avatarUrl,
      socialLinks: d.social_links ?? d.socialLinks,
      isOnline: d.is_online ?? d.isOnline ?? false,
      mentorProfile: d.mentorProfile,
    };
  }

  static toDirectoryList(list: any[]): any[] {
    return list.map((d) => this.toDirectoryEntry(d));
  }

  static toFavoriteList(favorites: (string | UserModel)[]): (string | UserResponseDto)[] {
    return favorites.map((m) =>
      typeof m === 'object' && m ? this.toResponseDto(m) : m,
    );
  }
}
