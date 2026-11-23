import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  MESSAGES_REPOSITORY,
  type IMessagesRepository,
} from '../repositories/messages.repository.interface.js';
import { SessionsService } from '../../sessions/services/sessions.service.js';
import { SessionsGateway } from '../../sessions/gateways/sessions.gateway.js';
import { MessageModel } from '../types/message.type.js';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(MESSAGES_REPOSITORY)
    private readonly messagesRepository: IMessagesRepository,
    private readonly sessionsService: SessionsService,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async sendMessage(sessionId: string, senderId: string, text: string): Promise<MessageModel> {
    const session = await this.sessionsService.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const sMentorId = session.mentorId;
    const sStudentId = session.studentId;
    const senderIdStr = senderId?.toString();

    if (sMentorId !== senderIdStr && sStudentId !== senderIdStr) {
      throw new ForbiddenException('Cannot send message: user is not a participant in this session');
    }

    const message = await this.messagesRepository.create({
      session_id: sessionId as any,
      sender_id: senderId as any,
      message_text: text,
      sent_at: new Date(),
    });

    // Broadcast message to session room so participants receive it in real-time
    this.sessionsGateway.emitNewMessage(sessionId, message);

    return message;
  }

  async getSessionMessages(sessionId: string): Promise<MessageModel[]> {
    return this.messagesRepository.findBySession(sessionId);
  }

  async markAsRead(sessionId: string, userId: string): Promise<void> {
    await this.messagesRepository.markAsRead(sessionId, userId);
  }
}
