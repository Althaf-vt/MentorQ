import { MentorProfileModel } from '../types/mentor-profile.type.js';
import {
  MentorProfileResponseDto,
  MentorProfileEnvelopeDto,
} from '../dto/mentor-profile-response.dto.js';

export class MentorProfileDtoMapper {
  static toResponseDto(model: MentorProfileModel): MentorProfileResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      expertiseTags: model.expertiseTags,
      dailyAvailableMinutes: model.dailyAvailableMinutes,
      remainingMinutesToday: model.remainingMinutesToday,
      isOnline: model.isOnline,
      ratingAvg: model.ratingAvg,
      operatingHours: model.operatingHours,
      createdAt: model.createdAt ? model.createdAt.toISOString() : undefined,
      updatedAt: model.updatedAt ? model.updatedAt.toISOString() : undefined,
    };
  }

  static toResponseDtoList(models: MentorProfileModel[]): MentorProfileResponseDto[] {
    return models.map((m) => this.toResponseDto(m));
  }

  static toEnvelope(model: MentorProfileModel): MentorProfileEnvelopeDto {
    return {
      status: 'success',
      data: this.toResponseDto(model),
    };
  }

  static toListEnvelope(models: MentorProfileModel[]): MentorProfileEnvelopeDto {
    return {
      status: 'success',
      data: this.toResponseDtoList(models),
    };
  }
}
