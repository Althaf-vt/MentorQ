import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSettings, PlatformSettingsDocument } from '../schemas/settings.schema.js';
import { IPlatformSettingsRepository } from './platform-settings.repository.interface.js';
import { PlatformSettingsModel, UpdatePlatformSettingsInput } from '../types/platform-settings.type.js';
import { PlatformSettingsSchemaMapper } from './mappers/platform-settings.schema-mapper.js';

@Injectable()
export class PlatformSettingsRepository implements IPlatformSettingsRepository {
  constructor(
    @InjectModel(PlatformSettings.name)
    private readonly settingsModel: Model<PlatformSettingsDocument>,
  ) {}

  async findSettings(): Promise<PlatformSettingsModel | null> {
    const doc = await this.settingsModel.findOne().exec();
    return PlatformSettingsSchemaMapper.toDomain(doc);
  }

  async updateSettings(data: UpdatePlatformSettingsInput): Promise<PlatformSettingsModel | null> {
    const doc = await this.settingsModel
      .findOneAndUpdate({}, data, { returnDocument: 'after' })
      .exec();
    return PlatformSettingsSchemaMapper.toDomain(doc);
  }

  async createDefaultSettings(): Promise<PlatformSettingsModel> {
    const defaultSettings = new this.settingsModel({});
    const saved = await defaultSettings.save();
    return PlatformSettingsSchemaMapper.toDomain(saved)!;
  }
}
