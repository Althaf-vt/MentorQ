import { PlatformSettingsModel, PlatformSettingsResponseDto } from '../types/platform-settings.type.js';

export class PlatformSettingsDtoMapper {
  static toResponseDto(model: PlatformSettingsModel): PlatformSettingsResponseDto {
    return {
      allowStudentRegistration: model.allowStudentRegistration,
      allowMentorRegistration: model.allowMentorRegistration,
      platformName: model.platformName,
      platformDescription: model.platformDescription,
      logoUrl: model.logoUrl,
    };
  }
}
