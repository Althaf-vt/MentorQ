import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from '../repositories/messages.repository.js';
import { SessionsRepository } from '../../sessions/repositories/sessions.repository.js';
import { SessionsGateway } from '../../sessions/gateways/sessions.gateway.js';
import { MessageDocument } from '../schemas/message.schema.js';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly sessionsRepository: SessionsRepository,
    private readonly sessionsGateway: SessionsGateway,
  ) {}

  async sendMessage(sessionId: string, senderId: string, text: string): Promise<MessageDocument> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const sMentorId = session.mentor_id?.toString();
    const sStudentId = session.student_id?.toString();
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

  async getSessionMessages(sessionId: string): Promise<MessageDocument[]> {
    return this.messagesRepository.findBySession(sessionId);
  }

  async markAsRead(sessionId: string, userId: string): Promise<void> {
    await this.messagesRepository.markAsRead(sessionId, userId);
  }
}
