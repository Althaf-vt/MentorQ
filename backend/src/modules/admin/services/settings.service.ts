import { Injectable, Inject } from '@nestjs/common';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import { PlatformSettingsResponseDto } from '../types/platform-settings.type.js';
import { UpdateSettingsDto } from '../dto/settings.dto.js';
import {
  PLATFORM_SETTINGS_REPOSITORY,
  type IPlatformSettingsRepository,
} from '../repositories/platform-settings.repository.interface.js';
import { PlatformSettingsDtoMapper } from '../mappers/platform-settings.dto-mapper.js';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY)
    private readonly settingsRepository: IPlatformSettingsRepository,
  ) {}

  async getSettings(): Promise<PlatformSettingsResponseDto> {
    const settings = await this.settingsRepository.findSettings();
    if (!settings) {
      throw new AppException(ErrorCode.SETTINGS_NOT_FOUND, 'Platform settings not found');
    }
    return PlatformSettingsDtoMapper.toResponseDto(settings);
  }

  async updateSettings(updateDto: UpdateSettingsDto): Promise<PlatformSettingsResponseDto> {
    const settings = await this.settingsRepository.updateSettings(updateDto);
    if (!settings) {
      throw new AppException(ErrorCode.SETTINGS_NOT_FOUND, 'Platform settings not found');
    }
    return PlatformSettingsDtoMapper.toResponseDto(settings);
  }
}
