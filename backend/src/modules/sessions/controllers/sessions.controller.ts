import { Controller, Post, Body, Param, Get, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from '../services/sessions.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('api/v1/sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start/:ticketId')
  async startSession(@Param('ticketId') ticketId: string, @Request() req: any) {
    const userId = (req.user?.id || req.user?._id)?.toString();
    return this.sessionsService.startSession(ticketId, userId);
  }

  @Post(':ticketId/start')
  async startSessionAlt(@Param('ticketId') ticketId: string, @Request() req: any) {
    const userId = (req.user?.id || req.user?._id)?.toString();
    return this.sessionsService.startSession(ticketId, userId);
  }

  @Get('ticket/:ticketId')
  async getSessionByTicketId(@Param('ticketId') ticketId: string) {
    return this.sessionsService.getSessionByTicketId(ticketId);
  }

  @Post(':id/end')
  async endSession(@Param('id') id: string, @Body('resolution_notes') resolutionNotes?: string, @Request() req?: any) {
    const userId = (req?.user?.id || req?.user?._id)?.toString();
    return this.sessionsService.endSession(id, resolutionNotes, userId);
  }

  @Get('active/mentor')
  async getActiveMentorSession(@Request() req: any) {
    return this.sessionsService.getActiveSessionByMentor(req.user.id);
  }

  @Get('active/student')
  async getActiveStudentSession(@Request() req: any) {
    return this.sessionsService.getActiveSessionByStudent(req.user.id);
  }
}
