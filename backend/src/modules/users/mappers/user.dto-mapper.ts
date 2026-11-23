import { UserModel, UserSummaryDto, UserResponseDto } from '../types/user.type.js';

export class UserDtoMapper {
  static toResponseDto(user: UserModel | any): UserResponseDto {
    return {
      id: user.id || user._id,
      fullName: user.fullName || user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: Boolean(user.isVerified ?? user.is_verified),
      avatarUrl: user.avatarUrl ?? user.avatar_url,
      socialLinks: user.socialLinks ?? user.social_links,
      isOnline: user.isOnline ?? user.is_online ?? false,
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
      ...this.toResponseDto(d),
      mentorProfile: d.mentorProfile,
    };
  }

  static toDirectoryList(list: any[]): any[] {
    return list.map((d) => this.toDirectoryEntry(d));
  }

  static toFavoriteList(favorites: (string | UserModel)[]): any[] {
    return favorites.map((m) =>
      typeof m === 'object' && m ? this.toResponseDto(m) : m,
    );
  }
}
