import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from '../services/messages.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { SendMessageDto } from '../dto/send-message.dto.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';
import { MessageDtoMapper } from '../mappers/message.dto-mapper.js';
import {
  MessageResponseDto,
  MessageActionResponseDto,
} from '../dto/message-response.dto.js';

@Controller('api/v1/chat')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('session/:sessionId')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthenticatedRequest,
    @Body() sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.sendMessage(
      sessionId,
      req.user.id,
      sendMessageDto.message_text,
    );
    return MessageDtoMapper.toResponseDto(message);
  }

  @Get('session/:sessionId')
  async getSessionMessages(@Param('sessionId') sessionId: string): Promise<MessageResponseDto[]> {
    const messages = await this.messagesService.getSessionMessages(sessionId);
    return MessageDtoMapper.toResponseDtoList(messages);
  }

  @Post('session/:sessionId/read')
  async markAsRead(
    @Param('sessionId') sessionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<MessageActionResponseDto> {
    await this.messagesService.markAsRead(sessionId, req.user.id);
    return MessageDtoMapper.toActionResponse(true);
  }
}
