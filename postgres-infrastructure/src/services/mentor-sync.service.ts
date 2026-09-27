import { prisma } from "../lib/prisma";
export class MentorSyncService {
  async syncProfiles(profiles: any[]) {
    return profiles.length;
  }
}
