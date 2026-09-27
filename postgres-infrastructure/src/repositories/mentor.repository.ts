import { prisma } from "../lib/prisma";

export class MentorRepository {
  async updateStatus(userId: string, isOnline: boolean) {
    return prisma.mentorProfile.update({ where: { userId }, data: { isOnline } });
  }
}