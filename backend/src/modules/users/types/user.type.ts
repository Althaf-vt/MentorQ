export interface SocialLinks {
  linkedin?: string;
  github?: string;
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
