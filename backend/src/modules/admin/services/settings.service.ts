import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PlatformSettingsDocument } from '../schemas/settings.schema.js';
import { UpdateSettingsDto } from '../dto/settings.dto.js';
import {
  PLATFORM_SETTINGS_REPOSITORY,
  type IPlatformSettingsRepository,
} from '../repositories/platform-settings.repository.interface.js';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY)
    private readonly settingsRepository: IPlatformSettingsRepository,
  ) {}

  async getSettings(): Promise<PlatformSettingsDocument> {
    const settings = await this.settingsRepository.findSettings();
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    return settings;
  }

  async updateSettings(updateDto: UpdateSettingsDto): Promise<PlatformSettingsDocument> {
    const settings = await this.settingsRepository.updateSettings(updateDto);
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    return settings;
  }
}
