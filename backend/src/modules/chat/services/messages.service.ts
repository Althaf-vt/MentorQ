import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessagesRepository } from '../repositories/messages.repository.js';
import { SessionsService } from '../../sessions/services/sessions.service.js';
import { MessageDocument } from '../schemas/message.schema.js';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly sessionsService: SessionsService,
  ) {}

  async sendMessage(sessionId: string, senderId: string, text: string): Promise<MessageDocument> {
    const session = await this.sessionsService.getActiveSessionByMentor(senderId) ||
                    await this.sessionsService.getActiveSessionByStudent(senderId);

    if (!session || session._id.toString() !== sessionId) {
      throw new ForbiddenException('Cannot send message: session is not active or user is not a participant');
    }

    return this.messagesRepository.create({
      session_id: sessionId as any,
      sender_id: senderId as any,
      message_text: text,
      sent_at: new Date(),
    });
  }

  async getSessionMessages(sessionId: string): Promise<MessageDocument[]> {
    return this.messagesRepository.findBySession(sessionId);
  }

  async markAsRead(sessionId: string, userId: string): Promise<void> {
    await this.messagesRepository.markAsRead(sessionId, userId);
  }
}
