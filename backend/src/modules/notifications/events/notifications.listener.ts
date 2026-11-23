import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../services/notifications.service.js';
import { NotificationType } from '../types/notification.type.js';
import {
  SESSION_EVENTS,
  SessionFocusStartedEvent,
} from '../../sessions/events/session-lifecycle.events.js';
import {
  TICKET_EVENTS,
  TicketRequestedEvent,
  TicketClaimedEvent,
  TicketResolvedEvent,
} from '../../tickets/events/ticket.events.js';

@Injectable()
export class NotificationsListener {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(SESSION_EVENTS.FOCUS_STARTED)
  async handleFocusStarted(event: SessionFocusStartedEvent): Promise<void> {
    const { mentorId, studentId } = event.payload;

    await Promise.allSettled([
      this.notificationsService.createNotification(
        mentorId,
        'MENTOR',
        'Focus Mode Started',
        'Your focus mode session has started.',
        NotificationType.SESSION,
      ),
      this.notificationsService.createNotification(
        studentId,
        'STUDENT',
        'Focus Mode Started',
        'Your focus mode session has started.',
        NotificationType.SESSION,
      ),
    ]);
  }

  @OnEvent(TICKET_EVENTS.REQUESTED)
  async handleTicketRequested(_event: TicketRequestedEvent): Promise<void> {
    await this.notificationsService
      .createNotification(
        null,
        'MENTOR',
        'New Mentorship Request',
        'A new mentorship request is available.',
        NotificationType.TICKET,
      )
      .catch(console.error);
  }

  @OnEvent(TICKET_EVENTS.CLAIMED)
  async handleTicketClaimed(event: TicketClaimedEvent): Promise<void> {
    await this.notificationsService
      .createNotification(
        event.studentId,
        'STUDENT',
        'Ticket Claimed',
        'A mentor has claimed your ticket.',
        NotificationType.TICKET,
      )
      .catch(console.error);
  }

  @OnEvent(TICKET_EVENTS.RESOLVED)
  async handleTicketResolved(event: TicketResolvedEvent): Promise<void> {
    await this.notificationsService
      .createNotification(
        event.studentId,
        'STUDENT',
        'Ticket Resolved',
        'Your mentor has resolved your request with guidance.',
        NotificationType.TICKET,
      )
      .catch(console.error);
  }
}
