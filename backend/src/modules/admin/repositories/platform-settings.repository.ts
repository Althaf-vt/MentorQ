import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSettings, PlatformSettingsDocument } from '../schemas/settings.schema.js';
import { IPlatformSettingsRepository } from './platform-settings.repository.interface.js';

@Injectable()
export class PlatformSettingsRepository implements IPlatformSettingsRepository {
  constructor(
    @InjectModel(PlatformSettings.name)
    private readonly settingsModel: Model<PlatformSettingsDocument>,
  ) {}

  async findSettings(): Promise<PlatformSettingsDocument | null> {
    return this.settingsModel.findOne().exec();
  }

  async updateSettings(data: Partial<PlatformSettings>): Promise<PlatformSettingsDocument | null> {
    return this.settingsModel
      .findOneAndUpdate({}, data, { returnDocument: 'after' })
      .exec();
  }

  async createDefaultSettings(): Promise<PlatformSettingsDocument> {
    const defaultSettings = new this.settingsModel({});
    return defaultSettings.save();
  }
}
