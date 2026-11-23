import { Controller, Post, Body, Param, Get, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from '../services/sessions.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { EndSessionDto } from '../dto/end-session.dto.js';
import { SessionResponseDto } from '../dto/session-response.dto.js';
import { SessionDtoMapper } from '../mappers/session.dto-mapper.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';

@Controller('api/v1/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start/:ticketId')
  async startSession(
    @Param('ticketId') ticketId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.startSession(ticketId, req.user.id);
    return SessionDtoMapper.toResponseDto(session);
  }

  @Post(':ticketId/start')
  async startSessionAlt(
    @Param('ticketId') ticketId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.startSession(ticketId, req.user.id);
    return SessionDtoMapper.toResponseDto(session);
  }

  @Get('ticket/:ticketId')
  async getSessionByTicketId(
    @Param('ticketId') ticketId: string,
  ): Promise<SessionResponseDto | null> {
    const session = await this.sessionsService.getSessionByTicketId(ticketId);
    return session ? SessionDtoMapper.toResponseDto(session) : null;
  }

  @Post(':id/end')
  async endSession(
    @Param('id') id: string,
    @Body() endSessionDto: EndSessionDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionsService.endSession(id, endSessionDto.notes, req.user.id);
    return SessionDtoMapper.toResponseDto(session);
  }

  @Get('active/mentor')
  async getActiveMentorSession(
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto | null> {
    const session = await this.sessionsService.getActiveSessionByMentor(req.user.id);
    return session ? SessionDtoMapper.toResponseDto(session) : null;
  }

  @Get('active/student')
  async getActiveStudentSession(
    @Request() req: AuthenticatedRequest,
  ): Promise<SessionResponseDto | null> {
    const session = await this.sessionsService.getActiveSessionByStudent(req.user.id);
    return session ? SessionDtoMapper.toResponseDto(session) : null;
  }
}
