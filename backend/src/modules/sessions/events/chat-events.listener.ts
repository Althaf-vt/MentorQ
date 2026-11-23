import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SessionsGateway } from '../gateways/sessions.gateway.js';
import {
  CHAT_EVENTS,
  ChatMessageSentEvent,
} from '../../chat/events/chat.events.js';

@Injectable()
export class ChatEventsListener {
  constructor(private readonly sessionsGateway: SessionsGateway) {}

  @OnEvent(CHAT_EVENTS.MESSAGE_SENT)
  handleChatMessageSent(event: ChatMessageSentEvent): void {
    this.sessionsGateway.emitNewMessage(event.sessionId, event.message);
  }
}
