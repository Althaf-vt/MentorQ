import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SessionsGateway } from '../gateways/sessions.gateway.js';
import {
  SESSION_EVENTS,
  SessionFocusStartedEvent,
  SessionEndedEvent,
} from './session-lifecycle.events.js';

@Injectable()
export class SessionEventsListener {
  constructor(private readonly sessionsGateway: SessionsGateway) {}

  @OnEvent(SESSION_EVENTS.FOCUS_STARTED)
  handleFocusStarted(event: SessionFocusStartedEvent): void {
    this.sessionsGateway.emitFocusModeStarted(event.payload);
  }

  @OnEvent(SESSION_EVENTS.ENDED)
  handleSessionEnded(event: SessionEndedEvent): void {
    this.sessionsGateway.emitSessionEnded(
      event.sessionId,
      event.resolutionNotes,
      event.userId,
      event.endedByRole,
    );
  }
}
