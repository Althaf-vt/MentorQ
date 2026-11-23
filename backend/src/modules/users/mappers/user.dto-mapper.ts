import { UserModel, UserSummaryDto } from '../types/user.type.js';

export class UserDtoMapper {
  static toResponseDto(user: UserModel | any): any {
    return {
      id: user.id || user._id,
      fullName: user.fullName || user.full_name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? user.avatar_url,
      socialLinks: user.socialLinks ?? user.social_links,
      favoriteMentors: user.favoriteMentors ?? user.favorite_mentors ?? [],
      isOnline: user.isOnline ?? user.is_online ?? false,
    };
  }

  static toSummaryDto(user: UserModel): UserSummaryDto {
    return {
      id: user.id,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.isVerified,
      created_at: user.createdAt || new Date(),
    };
  }

  static toSummaryDtoList(users: UserModel[]): UserSummaryDto[] {
    return users.map((user) => this.toSummaryDto(user));
  }
}
