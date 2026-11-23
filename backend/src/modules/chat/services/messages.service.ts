import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppException, ErrorCode } from '../../../common/exceptions/app.exception.js';
import {
  MESSAGES_REPOSITORY,
  type IMessagesRepository,
} from '../repositories/messages.repository.interface.js';
import { SessionsService } from '../../sessions/services/sessions.service.js';
import { CHAT_EVENTS, ChatMessageSentEvent } from '../events/chat.events.js';
import { MessageModel } from '../types/message.type.js';
import { CHAT_ERROR_MESSAGES } from '../constants/chat.constants.js';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: IMessagesRepository,
    private readonly sessionsService: SessionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(sessionId: string, senderId: string, text: string): Promise<MessageModel> {
    const session = await this.sessionsService.getSessionById(sessionId);

    if (!session) {
      throw new AppException(ErrorCode.SESSION_NOT_FOUND, CHAT_ERROR_MESSAGES.SESSION_NOT_FOUND);
    }

    const sMentorId = session.mentorId;
    const sStudentId = session.studentId;
    const senderIdStr = senderId?.toString();

    if (sMentorId !== senderIdStr && sStudentId !== senderIdStr) {
      throw new AppException(
        ErrorCode.UNAUTHORIZED_SESSION_PARTICIPANT,
        CHAT_ERROR_MESSAGES.UNAUTHORIZED_PARTICIPANT,
      );
    }

    const message = await this.messagesRepository.create({
      sessionId,
      senderId,
      messageText: text,
      sentAt: new Date(),
    });

    // Broadcast message via domain event (decoupled from WebSocket gateway)
    this.eventEmitter.emit(
      CHAT_EVENTS.MESSAGE_SENT,
      new ChatMessageSentEvent(sessionId, message),
    );

    return message;
  }

  async getSessionMessages(sessionId: string): Promise<MessageModel[]> {
    return this.messagesRepository.findBySession(sessionId);
  }

  async markAsRead(sessionId: string, userId: string): Promise<number> {
    return this.messagesRepository.markAsRead(sessionId, userId);
  }
}
