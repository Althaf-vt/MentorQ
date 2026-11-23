import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  SESSIONS_REPOSITORY,
  type ISessionsRepository,
} from '../repositories/sessions.repository.interface.js';
import { TicketsService } from '../../tickets/services/tickets.service.js';
import { SessionModel } from '../types/session.type.js';
import { SessionSummary } from '../types/session-summary.type.js';
import { SessionsGateway } from '../gateways/sessions.gateway.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SessionsService {
  constructor(
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: ISessionsRepository,
    private readonly ticketsService: TicketsService,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async startSession(ticketId: string, mentorId: string): Promise<SessionModel> {
    const ticket = await this.ticketsService.getTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If an active session already exists for this ticket, re-emit start and return it idempotently
    const existingSession = await this.sessionsRepository.findActiveByTicketId(ticketId);
    if (existingSession) {
      this.sessionsGateway.emitFocusModeStarted({
        sessionId: existingSession.id,
        ticketId,
        studentId: existingSession.studentId,
        mentorId: existingSession.mentorId,
        startedAt: existingSession.startedAt,
        allocatedMinutes: existingSession.allocatedMinutes,
      });
      return existingSession;
    }

    // If ticket is pending, claim it first
    if (ticket.status === 'PENDING') {
      await this.ticketsService.claimTicket(ticketId, mentorId);
    }

    const session = await this.sessionsRepository.create({
      ticket_id: ticketId as any,
      mentor_id: mentorId as any,
      student_id: ticket.studentId as any,
      allocated_minutes: ticket.requestedMinutes || 15,
      session_status: 'ACTIVE',
      started_at: new Date(),
    });

    await this.ticketsService.updateTicketStatus(ticketId, 'ACTIVE');

    // Notify student and ticket rooms in real time that Focus Mode has started
    this.sessionsGateway.emitFocusModeStarted({
      sessionId: session.id,
      ticketId,
      studentId: ticket.studentId,
      mentorId,
      startedAt: session.startedAt,
      allocatedMinutes: session.allocatedMinutes,
    });

    return session;
  }

  async endSession(sessionId: string, resolutionNotes?: string, userId?: string): Promise<SessionModel> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    const endedAt = new Date();
    const actualDuration = Math.ceil(
      (endedAt.getTime() - session.startedAt.getTime()) / (1000 * 60),
    );

    const updatedSession = await this.sessionsRepository.update(sessionId, {
      session_status: 'COMPLETED',
      ended_at: endedAt,
      actual_duration_minutes: actualDuration,
      resolution_notes: resolutionNotes,
    });

    if (!updatedSession) throw new NotFoundException('Session not found during update');

    await this.ticketsService.updateTicketStatus(
      session.ticketId,
      'COMPLETED',
      resolutionNotes,
    );

    // Determine who initiated session completion
    let endedByRole: 'MENTOR' | 'STUDENT' | undefined;
    if (userId) {
      const mentorIdStr = session.mentorId;
      endedByRole = mentorIdStr === userId ? 'MENTOR' : 'STUDENT';
    }

    // Notify session participants that session ended
    this.sessionsGateway.emitSessionEnded(sessionId, resolutionNotes, userId, endedByRole);

    return updatedSession;
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

  async getSessionCount(query: any = {}): Promise<number> {
    return this.sessionsRepository.count(query);
  }

  async getSessionByTicketId(ticketId: string): Promise<SessionModel | null> {
    const active = await this.sessionsRepository.findActiveByTicketId(ticketId);
    if (active) return active;
    return this.sessionsRepository.findByTicketId(ticketId);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCronStaleSessions() {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const staleSessions = await this.sessionsRepository.findStaleSessions(fifteenMinsAgo);

    for (const session of staleSessions) {
      await this.endSession(
        session.id,
        'Automatically abandoned due to inactivity',
      );
      console.log(`Abandoned session ${session.id} closed by Cron Job.`);
    }
  }
}
