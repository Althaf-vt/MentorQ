import { Controller, Post, Body, Param, Get, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from '../services/sessions.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('start/:ticketId')
  async startSession(@Param('ticketId') ticketId: string, @Request() req: any) {
    return this.sessionsService.startSession(ticketId, req.user.id);
  }

  @Post(':id/end')
  async endSession(@Param('id') id: string, @Body('resolution_notes') resolutionNotes?: string) {
    return this.sessionsService.endSession(id, resolutionNotes);
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
