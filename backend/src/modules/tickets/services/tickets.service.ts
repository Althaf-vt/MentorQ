import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  TICKETS_REPOSITORY,
  type ITicketsRepository,
} from '../repositories/tickets.repository.interface.js';
import {
  TicketModel,
  TicketStatusHistoryItem,
} from '../types/ticket.type.js';
import { CreateTicketDto } from '../dto/create-ticket.dto.js';
import {
  TICKET_EVENTS,
  TicketRequestedEvent,
  TicketClaimedEvent,
  TicketResolvedEvent,
} from '../events/ticket.events.js';
import {
  TICKET_STATUS,
  TICKET_FEEDBACK,
  TICKET_ERROR_MESSAGES,
} from '../constants/tickets.constants.js';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKETS_REPOSITORY)
    private readonly ticketsRepository: ITicketsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createTicket(studentId: string, data: CreateTicketDto): Promise<TicketModel> {
    const ticket = await this.ticketsRepository.create({
      studentId,
      topic: data.topic,
      description: data.description,
      requestedMinutes: data.requested_minutes,
      tags: data.tags,
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
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, TICKET_ERROR_MESSAGES.NOT_FOUND);
    }
    return ticket;
  }

  async getPendingPool(): Promise<TicketModel[]> {
    return this.ticketsRepository.findPendingPool();
  }

  async claimTicket(id: string, mentorId: string): Promise<TicketModel> {
    const ticket = await this.getTicketById(id);
    if (ticket.status !== TICKET_STATUS.PENDING) {
      throw new AppException(ErrorCode.TICKET_NOT_PENDING, TICKET_ERROR_MESSAGES.NOT_PENDING);
    }
    if (ticket.mentorId) {
      throw new AppException(ErrorCode.TICKET_ALREADY_CLAIMED, TICKET_ERROR_MESSAGES.ALREADY_CLAIMED);
    }

    const historyEntry: TicketStatusHistoryItem = {
      status: TICKET_STATUS.APPROVED,
      timestamp: new Date(),
      feedback_note: TICKET_FEEDBACK.CLAIMED_BY_MENTOR,
    };

    const updated = await this.ticketsRepository.claimTicket(id, mentorId, historyEntry);
    if (!updated) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, TICKET_ERROR_MESSAGES.NOT_FOUND_DURING_CLAIM);
    }
    this.eventEmitter.emit(
      TICKET_EVENTS.CLAIMED,
      new TicketClaimedEvent(ticket.id, ticket.studentId),
    );
    return updated;
  }

  async resolveWithGuidance(ticketId: string, mentorId: string, message: string): Promise<TicketModel> {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.status !== TICKET_STATUS.APPROVED && ticket.status !== TICKET_STATUS.ACTIVE) {
      throw new AppException(ErrorCode.BAD_REQUEST, TICKET_ERROR_MESSAGES.MUST_BE_APPROVED_OR_ACTIVE);
    }
    if (ticket.mentorId !== mentorId) {
      throw new AppException(ErrorCode.FORBIDDEN, TICKET_ERROR_MESSAGES.NOT_MENTOR_FOR_TICKET);
    }

    const historyEntry: TicketStatusHistoryItem = {
      status: TICKET_STATUS.COMPLETED,
      timestamp: new Date(),
      feedback_note: TICKET_FEEDBACK.RESOLVED_WITH_GUIDANCE,
    };

    const updated = await this.ticketsRepository.resolveTicketWithGuidance(ticketId, message, historyEntry);
    if (!updated) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, TICKET_ERROR_MESSAGES.NOT_FOUND_DURING_RESOLUTION);
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
    await this.getTicketById(id);
    const historyEntry: TicketStatusHistoryItem = {
      status,
      timestamp: new Date(),
      feedback_note: feedbackNote,
    };

    const updated = await this.ticketsRepository.updateTicketStatus(id, status, historyEntry);
    if (!updated) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, TICKET_ERROR_MESSAGES.NOT_FOUND_DURING_UPDATE);
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
