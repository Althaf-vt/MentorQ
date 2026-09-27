import { prisma } from "../lib/prisma";

export class TicketRepository {
  async getPendingQueue() {
    return prisma.ticket.findMany({ where: { status: "PENDING" } });
  }
  async assignTicket(ticketId: string, mentorId: string) {
    return prisma.ticket.update({ where: { id: ticketId }, data: { status: "ACTIVE" } });
  }
}