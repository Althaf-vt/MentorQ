import { PlatformSettings, PlatformSettingsDocument } from '../schemas/settings.schema.js';

export const PLATFORM_SETTINGS_REPOSITORY = Symbol('PLATFORM_SETTINGS_REPOSITORY');

export interface IPlatformSettingsRepository {
  findSettings(): Promise<PlatformSettingsDocument | null>;
  updateSettings(data: Partial<PlatformSettings>): Promise<PlatformSettingsDocument | null>;
  createDefaultSettings(): Promise<PlatformSettingsDocument>;
}
