import { prisma } from "../lib/prisma";

export class TicketRepository {
  async getPendingQueue() {
    return prisma.ticket.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } });
  }
}