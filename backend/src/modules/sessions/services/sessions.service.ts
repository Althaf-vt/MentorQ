import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  SESSIONS_REPOSITORY,
  type ISessionsRepository,
} from '../repositories/sessions.repository.interface.js';
import { TicketsService } from '../../tickets/services/tickets.service.js';
import { SessionDocument } from '../schemas/session.schema.js';
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

  async startSession(ticketId: string, mentorId: string): Promise<SessionDocument> {
    const ticket = await this.ticketsService.getTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If an active session already exists for this ticket, re-emit start and return it idempotently
    const existingSession = await this.sessionsRepository.findActiveByTicketId(ticketId);
    if (existingSession) {
      this.sessionsGateway.emitFocusModeStarted({
        sessionId: existingSession._id.toString(),
        ticketId,
        studentId: existingSession.student_id.toString(),
        mentorId: existingSession.mentor_id.toString(),
        startedAt: existingSession.started_at,
        allocatedMinutes: existingSession.allocated_minutes,
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
      student_id: ticket.student_id,
      allocated_minutes: ticket.requested_minutes || 15,
      session_status: 'ACTIVE',
      started_at: new Date(),
    });

    await this.ticketsService.updateTicketStatus(ticketId, 'ACTIVE');

    // Notify student and ticket rooms in real time that Focus Mode has started
    this.sessionsGateway.emitFocusModeStarted({
      sessionId: session._id.toString(),
      ticketId,
      studentId: ticket.student_id.toString(),
      mentorId,
      startedAt: session.started_at,
      allocatedMinutes: session.allocated_minutes,
    });

    return session;
  }

  async endSession(sessionId: string, resolutionNotes?: string, userId?: string): Promise<SessionDocument> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    const endedAt = new Date();
    const actualDuration = Math.ceil(
      (endedAt.getTime() - session.started_at.getTime()) / (1000 * 60),
    );

    const updatedSession = await this.sessionsRepository.update(sessionId, {
      session_status: 'COMPLETED',
      ended_at: endedAt,
      actual_duration_minutes: actualDuration,
      resolution_notes: resolutionNotes,
    });

    if (!updatedSession) throw new NotFoundException('Session not found during update');

    await this.ticketsService.updateTicketStatus(
      session.ticket_id.toString(),
      'COMPLETED',
      resolutionNotes,
    );

    // Determine who initiated session completion
    let endedByRole: 'MENTOR' | 'STUDENT' | undefined;
    if (userId) {
      const mentorIdStr = (session.mentor_id as any)?._id?.toString?.() || session.mentor_id?.toString();
      endedByRole = mentorIdStr === userId ? 'MENTOR' : 'STUDENT';
    }

    // Notify session participants that session ended
    this.sessionsGateway.emitSessionEnded(sessionId, resolutionNotes, userId, endedByRole);

    return updatedSession;
  }

  async getActiveSessionByMentor(mentorId: string): Promise<SessionDocument | null> {
    return this.sessionsRepository.findActiveByMentor(mentorId);
  }

  async getActiveSessionByStudent(studentId: string): Promise<SessionDocument | null> {
    return this.sessionsRepository.findActiveByStudent(studentId);
  }

  async getSessionById(sessionId: string): Promise<SessionSummary | null> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) return null;
    return {
      id: session._id.toString(),
      ticketId: session.ticket_id.toString(),
      mentorId: session.mentor_id.toString(),
      studentId: session.student_id.toString(),
      sessionStatus: session.session_status,
      startedAt: session.started_at,
      allocatedMinutes: session.allocated_minutes,
    };
  }

  async getSessionCount(query: any = {}): Promise<number> {
    return this.sessionsRepository.count(query);
  }

  async getSessionByTicketId(ticketId: string): Promise<SessionDocument | null> {
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
        session._id.toString(),
        'Automatically abandoned due to inactivity',
      );
      console.log(`Abandoned session ${session._id} closed by Cron Job.`);
    }
  }
}
