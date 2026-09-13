import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository.js';
import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async createTicket(studentId: string, data: Partial<Ticket>): Promise<TicketDocument> {
    return this.ticketsRepository.create({
      ...data,
      student_id: studentId as any,
      status: 'PENDING',
      status_history: [{ status: 'PENDING', timestamp: new Date() }],
    });
  }

  async getTicketById(id: string): Promise<TicketDocument> {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateTicketStatus(
    id: string,
    status: string,
    feedbackNote?: string,
  ): Promise<TicketDocument> {
    const ticket = await this.getTicketById(id);
    const statusHistory = ticket.status_history || [];
    statusHistory.push({ status, timestamp: new Date(), feedback_note: feedbackNote });

    const updated = await this.ticketsRepository.update(id, {
      status,
      status_history: statusHistory,
    });
    if (!updated) throw new NotFoundException('Ticket not found during update');
    return updated;
  }

  async getStudentTickets(studentId: string): Promise<TicketDocument[]> {
    return this.ticketsRepository.find({ student_id: studentId });
  }

  async getMentorTickets(mentorId: string): Promise<TicketDocument[]> {
    return this.ticketsRepository.find({ mentor_id: mentorId });
  }

  async getQueuePosition(ticketId: string): Promise<number> {
    return this.ticketsRepository.getQueuePosition(ticketId);
  }
}
