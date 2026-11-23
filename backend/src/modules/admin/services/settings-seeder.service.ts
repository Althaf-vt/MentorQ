import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import {
  PLATFORM_SETTINGS_REPOSITORY,
  type IPlatformSettingsRepository,
} from '../repositories/platform-settings.repository.interface.js';

@Injectable()
export class SettingsSeederService implements OnModuleInit {
  private readonly logger = new Logger(SettingsSeederService.name);

  constructor(
    @Inject(PLATFORM_SETTINGS_REPOSITORY)
    private readonly settingsRepository: IPlatformSettingsRepository,
  ) {}

  async onModuleInit() {
    await this.seedSettings();
  }

  private async seedSettings() {
    const existingSettings = await this.settingsRepository.findSettings();

    if (!existingSettings) {
      await this.settingsRepository.createDefaultSettings();
      this.logger.log('Platform settings seeded with default values.');
    } else {
      this.logger.log('Platform settings already exist. Seeding skipped.');
    }
  }
}
