export interface OperatingHours {
  start: string;
  end: string;
  timezone: string;
}

export interface MentorProfileModel {
  id: string;
  userId: string;
  expertiseTags: string[];
  dailyAvailableMinutes: number;
  remainingMinutesToday: number;
  isOnline: boolean;
  ratingAvg: number;
  operatingHours: OperatingHours;
  createdAt?: Date;
  updatedAt?: Date;
}
