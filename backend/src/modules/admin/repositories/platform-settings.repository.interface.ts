import { PlatformSettingsModel, UpdatePlatformSettingsInput } from '../types/platform-settings.type.js';

export const PLATFORM_SETTINGS_REPOSITORY = Symbol('PLATFORM_SETTINGS_REPOSITORY');

export interface IPlatformSettingsRepository {
  findSettings(): Promise<PlatformSettingsModel | null>;
  updateSettings(data: UpdatePlatformSettingsInput): Promise<PlatformSettingsModel | null>;
  createDefaultSettings(): Promise<PlatformSettingsModel>;
}
