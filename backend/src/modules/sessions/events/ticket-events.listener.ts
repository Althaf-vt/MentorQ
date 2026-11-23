import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SessionsGateway } from '../gateways/sessions.gateway.js';
import {
  TICKET_EVENTS,
  TicketRequestedEvent,
  TicketClaimedEvent,
  TicketResolvedEvent,
} from '../../tickets/events/ticket.events.js';

@Injectable()
export class TicketEventsListener {
  constructor(private readonly sessionsGateway: SessionsGateway) {}

  @OnEvent(TICKET_EVENTS.REQUESTED)
  handleTicketRequested(event: TicketRequestedEvent): void {
    this.sessionsGateway.emitStudentRequestedMentorship(event.ticketId);
  }

  @OnEvent(TICKET_EVENTS.CLAIMED)
  handleTicketClaimed(event: TicketClaimedEvent): void {
    this.sessionsGateway.emitMentorClaimedTicket(event.studentId, event.ticketId);
  }

  @OnEvent(TICKET_EVENTS.RESOLVED)
  handleTicketResolved(event: TicketResolvedEvent): void {
    this.sessionsGateway.emitTicketResolvedWithGuidance(
      event.ticketId,
      event.studentId,
      event.mentorId,
    );
  }
}
