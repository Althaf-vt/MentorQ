import { PlatformSettingsDocument } from '../../schemas/settings.schema.js';
import { PlatformSettingsModel } from '../../types/platform-settings.type.js';

export class PlatformSettingsSchemaMapper {
  static toDomain(doc: PlatformSettingsDocument | null | undefined): PlatformSettingsModel | null {
    if (!doc) return null;

    return {
      id: doc._id.toString(),
      allowStudentRegistration: Boolean(doc.allowStudentRegistration),
      allowMentorRegistration: Boolean(doc.allowMentorRegistration),
      platformName: doc.platformName,
      platformDescription: doc.platformDescription,
      logoUrl: doc.logoUrl,
      createdAt: (doc as PlatformSettingsDocument & { created_at?: Date }).created_at,
      updatedAt: (doc as PlatformSettingsDocument & { updated_at?: Date }).updated_at,
    };
  }
}
