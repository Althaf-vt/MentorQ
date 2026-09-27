import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSettings, PlatformSettingsDocument } from '../schemas/settings.schema.js';

@Injectable()
export class SettingsSeederService implements OnModuleInit {
  private readonly logger = new Logger(SettingsSeederService.name);

  constructor(
    @InjectModel(PlatformSettings.name) private readonly settingsModel: Model<PlatformSettingsDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSettings();
  }

  private async seedSettings() {
    const existingSettings = await this.settingsModel.findOne();

    if (!existingSettings) {
      const defaultSettings = new this.settingsModel({});
      await defaultSettings.save();
      this.logger.log('Platform settings seeded with default values.');
    } else {
      this.logger.log('Platform settings already exist. Seeding skipped.');
    }
  }
}
