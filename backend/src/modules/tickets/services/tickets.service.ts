import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  TICKETS_REPOSITORY,
  type ITicketsRepository,
} from '../repositories/tickets.repository.interface.js';
import { Ticket } from '../schemas/ticket.schema.js';
import { TicketModel } from '../types/ticket.type.js';
import {
  TICKET_EVENTS,
  TicketRequestedEvent,
  TicketClaimedEvent,
  TicketResolvedEvent,
} from '../events/ticket.events.js';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKETS_REPOSITORY)
    private readonly ticketsRepository: ITicketsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTicket(studentId: string, data: Partial<Ticket>): Promise<TicketModel> {
    const ticket = await this.ticketsRepository.create({
      ...data,
      student_id: studentId as any,
      status: 'PENDING',
      status_history: [{ status: 'PENDING', timestamp: new Date() }],
    });
    this.eventEmitter.emit(
      TICKET_EVENTS.REQUESTED,
      new TicketRequestedEvent(ticket.id),
    );
    return ticket;
  }

  async getTicketById(id: string): Promise<TicketModel> {
    const ticket = await this.ticketsRepository.findById(id);
    if (!ticket) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, 'Ticket not found');
    }
    return ticket;
  }

  async getPendingPool(): Promise<TicketModel[]> {
    return this.ticketsRepository.findPendingPool();
  }

  async claimTicket(id: string, mentorId: string): Promise<TicketModel> {
    const ticket = await this.getTicketById(id);
    if (ticket.status !== 'PENDING') {
      throw new AppException(ErrorCode.TICKET_NOT_PENDING, 'Ticket is not in PENDING status');
    }
    if (ticket.mentorId) {
      throw new AppException(ErrorCode.TICKET_ALREADY_CLAIMED, 'Ticket is already claimed');
    }

    const statusHistory = ticket.statusHistory || [];
    statusHistory.push({ status: 'APPROVED', timestamp: new Date(), feedback_note: 'Ticket claimed by mentor' });

    const updated = await this.ticketsRepository.update(id, {
      mentor_id: mentorId,
      status: 'APPROVED',
      status_history: statusHistory,
    });
    if (!updated) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, 'Ticket not found during claim');
    }
    this.eventEmitter.emit(
      TICKET_EVENTS.CLAIMED,
      new TicketClaimedEvent(ticket.id, ticket.studentId),
    );
    return updated;
  }

  async resolveWithGuidance(ticketId: string, mentorId: string, message: string): Promise<TicketModel> {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.status !== 'APPROVED' && ticket.status !== 'ACTIVE') {
      throw new AppException(ErrorCode.BAD_REQUEST, 'Ticket must be APPROVED or ACTIVE to resolve');
    }
    if (ticket.mentorId !== mentorId) {
      throw new AppException(ErrorCode.FORBIDDEN, 'You are not the mentor for this ticket');
    }

    const statusHistory = ticket.statusHistory || [];
    statusHistory.push({ status: 'COMPLETED', timestamp: new Date(), feedback_note: 'Resolved with guidance' });

    const updated = await this.ticketsRepository.update(ticketId, {
      status: 'COMPLETED',
      guidance_message: message,
      status_history: statusHistory,
    });
    
    if (!updated) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, 'Ticket not found during resolution');
    }
    
    this.eventEmitter.emit(
      TICKET_EVENTS.RESOLVED,
      new TicketResolvedEvent(ticketId, ticket.studentId, mentorId),
    );
    
    return updated;
  }

  async updateTicketStatus(
    id: string,
    status: string,
    feedbackNote?: string,
  ): Promise<TicketModel> {
    const ticket = await this.getTicketById(id);
    const statusHistory = ticket.statusHistory || [];
    statusHistory.push({ status, timestamp: new Date(), feedback_note: feedbackNote });

    const updated = await this.ticketsRepository.update(id, {
      status,
      status_history: statusHistory,
    });
    if (!updated) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, 'Ticket not found during update');
    }
    return updated;
  }

  async getStudentTickets(studentId: string): Promise<TicketModel[]> {
    return this.ticketsRepository.findByStudentId(studentId);
  }

  async getMentorTickets(mentorId: string): Promise<TicketModel[]> {
    return this.ticketsRepository.findByMentorId(mentorId);
  }

  async getQueuePosition(ticketId: string): Promise<number> {
    return this.ticketsRepository.getQueuePosition(ticketId);
  }

  async getPendingTicketCount(): Promise<number> {
    return this.ticketsRepository.countPending();
  }
}

