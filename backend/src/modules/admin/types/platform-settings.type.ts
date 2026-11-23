export interface PlatformSettingsModel {
  id: string;
  allowStudentRegistration: boolean;
  allowMentorRegistration: boolean;
  platformName: string;
  platformDescription: string;
  logoUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdatePlatformSettingsInput {
  allowStudentRegistration?: boolean;
  allowMentorRegistration?: boolean;
  platformName?: string;
  platformDescription?: string;
  logoUrl?: string;
}

export interface PlatformSettingsResponseDto {
  allowStudentRegistration: boolean;
  allowMentorRegistration: boolean;
  platformName: string;
  platformDescription: string;
  logoUrl: string;
}
