import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { TicketsRepository } from '../repositories/tickets.repository.js';
import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';
import { SessionsGateway } from '../../sessions/gateways/sessions.gateway.js';

@Injectable()
export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository,
    @Inject(forwardRef(() => SessionsGateway))
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async createTicket(studentId: string, data: Partial<Ticket>): Promise<TicketDocument> {
    const ticket = await this.ticketsRepository.create({
      ...data,
      student_id: studentId as any,
      status: 'PENDING',
      status_history: [{ status: 'PENDING', timestamp: new Date() }],
    });
    this.sessionsGateway.emitStudentRequestedMentorship(ticket._id.toString());
    return ticket;
  }

  async getTicketById(id: string): Promise<TicketDocument> {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async getPendingPool(): Promise<TicketDocument[]> {
    return await this.ticketsRepository.find({
      status: 'PENDING',
      $or: [{ mentor_id: null }, { mentor_id: { $exists: false } }],
    });
  }

  async claimTicket(id: string, mentorId: string): Promise<TicketDocument> {
    const ticket = await this.getTicketById(id);
    if (ticket.status !== 'PENDING') {
      throw new BadRequestException('Ticket is not in PENDING status');
    }
    if (ticket.mentor_id) {
      throw new BadRequestException('Ticket is already claimed');
    }

    const statusHistory = ticket.status_history || [];
    statusHistory.push({ status: 'APPROVED', timestamp: new Date(), feedback_note: 'Ticket claimed by mentor' });

    const updated = await this.ticketsRepository.update(id, {
      mentor_id: mentorId,
      status: 'APPROVED',
      status_history: statusHistory,
    });
    if (!updated) throw new NotFoundException('Ticket not found during claim');
    this.sessionsGateway.emitMentorClaimedTicket(ticket.student_id.toString(), ticket._id.toString());
    return updated;
  }

  async resolveWithGuidance(ticketId: string, mentorId: string, message: string): Promise<TicketDocument> {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.status !== 'APPROVED' && ticket.status !== 'ACTIVE') {
      throw new BadRequestException('Ticket must be APPROVED or ACTIVE to resolve');
    }
    if (ticket.mentor_id?.toString() !== mentorId) {
      throw new BadRequestException('You are not the mentor for this ticket');
    }

    const statusHistory = ticket.status_history || [];
    statusHistory.push({ status: 'COMPLETED', timestamp: new Date(), feedback_note: 'Resolved with guidance' });

    const updated = await this.ticketsRepository.update(ticketId, {
      status: 'COMPLETED',
      guidance_message: message,
      status_history: statusHistory,
    });
    
    if (!updated) throw new NotFoundException('Ticket not found during resolution');
    
    this.sessionsGateway.emitTicketResolvedWithGuidance(ticketId, ticket.student_id.toString(), mentorId);
    
    return updated;
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
    return this.ticketsRepository.find({ student_id: studentId }, { createdAt: -1 });
  }

  async getMentorTickets(mentorId: string): Promise<TicketDocument[]> {
    return this.ticketsRepository.find({ mentor_id: mentorId });
  }

  async getQueuePosition(ticketId: string): Promise<number> {
    return this.ticketsRepository.getQueuePosition(ticketId);
  }
}

