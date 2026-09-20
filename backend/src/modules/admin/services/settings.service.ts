import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSettings, PlatformSettingsDocument } from '../schemas/settings.schema.js';
import { UpdateSettingsDto } from '../dto/settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(PlatformSettings.name) private readonly settingsModel: Model<PlatformSettingsDocument>,
  ) {}

  async getSettings() {
    const settings = await this.settingsModel.findOne();
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    return settings;
  }

  async updateSettings(updateDto: UpdateSettingsDto) {
    const settings = await this.settingsModel.findOneAndUpdate({}, updateDto, { new: true });
    if (!settings) {
      throw new NotFoundException('Platform settings not found');
    }
    return settings;
  }
}
