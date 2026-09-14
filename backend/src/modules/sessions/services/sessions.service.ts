import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionsRepository } from '../repositories/sessions.repository.js';
import { TicketsService } from '../../tickets/services/tickets.service.js';
import { SessionDocument } from '../schemas/session.schema.js';
import { SessionsGateway } from '../gateways/sessions.gateway.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly ticketsService: TicketsService,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async startSession(ticketId: string, mentorId: string): Promise<SessionDocument> {
    const ticket = await this.ticketsService.getTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // If an active session already exists for this ticket, re-emit start and return it idempotently
    const existingSession = await this.sessionsRepository.findOne({
      ticket_id: ticketId as any,
      session_status: 'ACTIVE',
    });
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

  async endSession(sessionId: string, resolutionNotes?: string): Promise<SessionDocument> {
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

    // Notify session participants that session ended
    this.sessionsGateway.emitSessionEnded(sessionId, resolutionNotes);

    return updatedSession;
  }

  async getActiveSessionByMentor(mentorId: string): Promise<SessionDocument | null> {
    return this.sessionsRepository.findActiveByMentor(mentorId);
  }

  async getActiveSessionByStudent(studentId: string): Promise<SessionDocument | null> {
    return this.sessionsRepository.findActiveByStudent(studentId);
  }

  async getSessionByTicketId(ticketId: string): Promise<SessionDocument | null> {
    const active = await this.sessionsRepository.findOne({
      ticket_id: ticketId as any,
      session_status: 'ACTIVE',
    });
    if (active) return active;
    return this.sessionsRepository.findOne({ ticket_id: ticketId as any });
  }
}
