import { Controller, Post, Body, Param, Get, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from '../services/sessions.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { EndSessionDto } from '../dto/end-session.dto.js';
import type { AuthenticatedRequest } from '../types/session-request.type.js';

@Controller('api/v1/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start/:ticketId')
  async startSession(
    @Param('ticketId') ticketId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id.toString();
    return this.sessionsService.startSession(ticketId, userId);
  }

  @Post(':ticketId/start')
  async startSessionAlt(
    @Param('ticketId') ticketId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id.toString();
    return this.sessionsService.startSession(ticketId, userId);
  }

  @Get('ticket/:ticketId')
  async getSessionByTicketId(@Param('ticketId') ticketId: string) {
    return this.sessionsService.getSessionByTicketId(ticketId);
  }

  @Post(':id/end')
  async endSession(
    @Param('id') id: string,
    @Body() endSessionDto: EndSessionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id.toString();
    return this.sessionsService.endSession(id, endSessionDto.notes, userId);
  }

  @Get('active/mentor')
  async getActiveMentorSession(@Request() req: AuthenticatedRequest) {
    return this.sessionsService.getActiveSessionByMentor(req.user.id);
  }

  @Get('active/student')
  async getActiveStudentSession(@Request() req: AuthenticatedRequest) {
    return this.sessionsService.getActiveSessionByStudent(req.user.id);
  }
}
