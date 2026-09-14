import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from '../services/tickets.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@Controller('api/v1/tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.ticketsService.createTicket(req.user.id, body);
  }

  @Get('pool/pending')
  async getPendingPool() {
    const tickets = await this.ticketsService.getPendingPool();
    return tickets;
  }

  @Post(':id/claim')
  async claim(@Request() req: any, @Param('id') id: string) {
    return this.ticketsService.claimTicket(id, req.user.id);
  }

  @Get('student')
  async getStudentTickets(@Request() req: any) {
    return this.ticketsService.getStudentTickets(req.user.id);
  }

  @Get('mentor')
  async getMentorTickets(@Request() req: any) {
    return this.ticketsService.getMentorTickets(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('feedback_note') feedbackNote?: string,
  ) {
    return this.ticketsService.updateTicketStatus(id, status, feedbackNote);
  }

  @Get(':id/queue-position')
  async getQueuePosition(@Param('id') id: string) {
    const position = await this.ticketsService.getQueuePosition(id);
    return { position };
  }
}

