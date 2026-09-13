import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from '../services/messages.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('session/:sessionId')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
    @Body('message_text') text: string,
  ) {
    return this.messagesService.sendMessage(sessionId, req.user.id, text);
  }

  @Get('session/:sessionId')
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    return this.messagesService.getSessionMessages(sessionId);
  }

  @Post('session/:sessionId/read')
  async markAsRead(@Param('sessionId') sessionId: string, @Request() req: any) {
    await this.messagesService.markAsRead(sessionId, req.user.id);
    return { success: true };
  }
}
