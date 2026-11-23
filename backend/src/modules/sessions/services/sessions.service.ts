import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  SESSIONS_REPOSITORY,
  type ISessionsRepository,
} from '../repositories/sessions.repository.interface.js';
import { TicketsService } from '../../tickets/services/tickets.service.js';
import { SessionModel } from '../types/session.type.js';
import { SessionSummary } from '../types/session-summary.type.js';
import {
  SESSION_EVENTS,
  SessionFocusStartedEvent,
  SessionEndedEvent,
} from '../events/session-lifecycle.events.js';
import {
  SESSION_CONFIG,
  SESSION_ERROR_MESSAGES,
} from '../constants/sessions.constants.js';
import { TICKET_STATUS, TICKET_ERROR_MESSAGES } from '../../tickets/constants/tickets.constants.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: ISessionsRepository,
    private readonly ticketsService: TicketsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startSession(ticketId: string, mentorId: string): Promise<SessionModel> {
    const ticket = await this.ticketsService.getTicketById(ticketId);
    if (!ticket) {
      throw new AppException(ErrorCode.TICKET_NOT_FOUND, TICKET_ERROR_MESSAGES.NOT_FOUND);
    }

    // If an active session already exists for this ticket, re-emit start and return it idempotently
    const existingSession = await this.sessionsRepository.findActiveByTicketId(ticketId);
    if (existingSession) {
      this.eventEmitter.emit(
        SESSION_EVENTS.FOCUS_STARTED,
        new SessionFocusStartedEvent({
          sessionId: existingSession.id,
          ticketId,
          studentId: existingSession.studentId,
          mentorId: existingSession.mentorId,
          startedAt: existingSession.startedAt,
          allocatedMinutes: existingSession.allocatedMinutes,
        }),
      );
      return existingSession;
    }

    // If ticket is pending, claim it first
    if (ticket.status === TICKET_STATUS.PENDING) {
      await this.ticketsService.claimTicket(ticketId, mentorId);
    }

    const session = await this.sessionsRepository.create({
      ticketId,
      mentorId,
      studentId: ticket.studentId,
      allocatedMinutes: ticket.requestedMinutes || SESSION_CONFIG.DEFAULT_ALLOCATED_MINUTES,
      startedAt: new Date(),
    });

    await this.ticketsService.updateTicketStatus(ticketId, TICKET_STATUS.ACTIVE);

    // Notify student and ticket rooms in real time via domain event
    this.eventEmitter.emit(
      SESSION_EVENTS.FOCUS_STARTED,
      new SessionFocusStartedEvent({
        sessionId: session.id,
        ticketId,
        studentId: ticket.studentId,
        mentorId,
        startedAt: session.startedAt,
        allocatedMinutes: session.allocatedMinutes,
      }),
    );

    return session;
  }

  async endSession(sessionId: string, resolutionNotes?: string, userId?: string): Promise<SessionModel> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, SESSION_ERROR_MESSAGES.NOT_FOUND);
    }

    const endedAt = new Date();
    const actualDuration = Math.ceil(
      (endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60),
    );

    const updatedSession = await this.sessionsRepository.complete(sessionId, {
      endedAt,
      actualDurationMinutes: actualDuration,
      resolutionNotes,
    });

    if (!updatedSession) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, SESSION_ERROR_MESSAGES.NOT_FOUND_DURING_UPDATE);
    }

    await this.ticketsService.updateTicketStatus(
      session.ticketId,
      TICKET_STATUS.COMPLETED,
      resolutionNotes,
    );

    // Determine who initiated session completion
    let endedByRole: 'MENTOR' | 'STUDENT' | undefined;
    if (userId) {
      const mentorIdStr = session.mentorId;
      endedByRole = mentorIdStr === userId ? 'MENTOR' : 'STUDENT';
    }

    // Notify session participants via domain event
    this.eventEmitter.emit(
      SESSION_EVENTS.ENDED,
      new SessionEndedEvent(sessionId, resolutionNotes, userId, endedByRole),
    );

    return updatedSession;
  }

  async recordEmptySession(sessionId: string): Promise<void> {
    await this.sessionsRepository.markEmpty(sessionId);
  }

  async clearEmptySession(sessionId: string): Promise<void> {
    await this.sessionsRepository.clearEmpty(sessionId);
  }

  async getActiveSessionByMentor(mentorId: string): Promise<SessionModel | null> {
    return this.sessionsRepository.findActiveByMentor(mentorId);
  }

  async getActiveSessionByStudent(studentId: string): Promise<SessionModel | null> {
    return this.sessionsRepository.findActiveByStudent(studentId);
  }

  async getSessionById(sessionId: string): Promise<SessionSummary | null> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) return null;
    return {
      id: session.id,
      ticketId: session.ticketId,
      mentorId: session.mentorId,
      studentId: session.studentId,
      sessionStatus: session.sessionStatus,
      startedAt: session.startedAt,
      allocatedMinutes: session.allocatedMinutes,
    };
  }

  async getSessionCount(query: Record<string, unknown> = {}): Promise<number> {
    return this.sessionsRepository.count(query);
  }

  async getSessionByTicketId(ticketId: string): Promise<SessionModel | null> {
    const active = await this.sessionsRepository.findActiveByTicketId(ticketId);
    if (active) return active;
    return this.sessionsRepository.findByTicketId(ticketId);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronStaleSessions() {
    const fifteenMinsAgo = new Date(Date.now() - SESSION_CONFIG.STALE_INACTIVITY_THRESHOLD_MS);
    const staleSessions = await this.sessionsRepository.findStaleSessions(fifteenMinsAgo);

    for (const session of staleSessions) {
      await this.endSession(
        session.id,
        SESSION_CONFIG.ABANDONED_REASON,
      );
      console.log(`Abandoned session ${session.id} closed by Cron Job.`);
    }
  }
}
