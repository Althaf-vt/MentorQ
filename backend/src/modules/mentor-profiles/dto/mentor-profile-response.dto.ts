import { OperatingHours } from '../types/mentor-profile.type.js';

export interface MentorProfileResponseDto {
  id: string;
  userId: string;
  expertiseTags: string[];
  dailyAvailableMinutes: number;
  remainingMinutesToday: number;
  isOnline: boolean;
  ratingAvg: number;
  operatingHours: OperatingHours;
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorProfileEnvelopeDto {
  status: string;
  data: MentorProfileResponseDto | MentorProfileResponseDto[];
}
