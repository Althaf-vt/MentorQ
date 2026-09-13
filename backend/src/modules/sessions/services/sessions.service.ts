import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionsRepository } from '../repositories/sessions.repository.js';
import { TicketsService } from '../../tickets/services/tickets.service.js';
import { SessionDocument } from '../schemas/session.schema.js';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly ticketsService: TicketsService,
  ) {}

  async startSession(ticketId: string, mentorId: string): Promise<SessionDocument> {
    const ticket = await this.ticketsService.getTicketById(ticketId);
    if (ticket.status !== 'APPROVED') {
      throw new BadRequestException('Ticket must be APPROVED to start a session');
    }

    const existingSession = await this.sessionsRepository.findOne({ ticket_id: ticketId as any });
    if (existingSession) {
      throw new BadRequestException('Session already exists for this ticket');
    }

    const session = await this.sessionsRepository.create({
      ticket_id: ticketId as any,
      mentor_id: mentorId as any,
      student_id: ticket.student_id,
      allocated_minutes: ticket.requested_minutes,
      session_status: 'ACTIVE',
      started_at: new Date(),
    });

    await this.ticketsService.updateTicketStatus(ticketId, 'ACTIVE');
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

    return updatedSession;
  }

  async getActiveSessionByMentor(mentorId: string): Promise<SessionDocument | null> {
    return this.sessionsRepository.findActiveByMentor(mentorId);
  }

  async getActiveSessionByStudent(studentId: string): Promise<SessionDocument | null> {
    return this.sessionsRepository.findActiveByStudent(studentId);
  }
}
