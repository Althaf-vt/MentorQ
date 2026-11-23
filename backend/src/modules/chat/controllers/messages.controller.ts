import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from '../services/messages.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { SendMessageDto } from '../dto/send-message.dto.js';
import type { AuthenticatedRequest } from '../types/chat-request.type.js';

@Controller('api/v1/chat')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('session/:sessionId')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthenticatedRequest,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(
      sessionId,
      req.user.id,
      sendMessageDto.message_text,
    );
  }

  @Get('session/:sessionId')
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    return this.messagesService.getSessionMessages(sessionId);
  }

  @Post('session/:sessionId/read')
  async markAsRead(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.messagesService.markAsRead(sessionId, req.user.id);
    return { success: true };
  }
}
