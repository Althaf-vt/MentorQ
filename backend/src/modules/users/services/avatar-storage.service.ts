import { Injectable, Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

export const AVATAR_DESTINATION = join(process.cwd(), 'uploads', 'avatars');

@Injectable()
export class AvatarStorageService {
  private readonly logger = new Logger(AvatarStorageService.name);

  buildAvatarUrl(filename: string): string {
    return `/uploads/avatars/${filename}`;
  }

  deleteAvatarFile(relativeUrl?: string | null): boolean {
    if (!relativeUrl) return false;
    try {
      const filePath = join(process.cwd(), relativeUrl.replace(/^\//, ''));
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      this.logger.warn(`Failed to delete avatar file at ${relativeUrl}: ${(error as Error).message}`);
    }
    return false;
  }
}
