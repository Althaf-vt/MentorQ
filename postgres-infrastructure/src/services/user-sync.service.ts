import { prisma } from "../lib/prisma";
export class UserSyncService {
  async syncBatch(users: any[]) {
    return users.length;
  }
}
