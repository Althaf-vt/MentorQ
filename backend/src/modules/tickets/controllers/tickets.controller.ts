import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from '../services/tickets.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CreateTicketDto } from '../dto/create-ticket.dto.js';
import { ResolveGuidanceDto } from '../dto/resolve-guidance.dto.js';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';

@Controller('api/v1/tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() body: CreateTicketDto) {
    return this.ticketsService.createTicket(req.user.id, body);
  }

  @Get('pool/pending')
  async getPendingPool() {
    const tickets = await this.ticketsService.getPendingPool();
    return tickets;
  }

  @Post(':id/claim')
  async claim(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ticketsService.claimTicket(id, req.user.id);
  }

  @Get('student')
  async getStudentTickets(@Request() req: AuthenticatedRequest) {
    return this.ticketsService.getStudentTickets(req.user.id);
  }

  @Get('mentor')
  async getMentorTickets(@Request() req: AuthenticatedRequest) {
    return this.ticketsService.getMentorTickets(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.ticketsService.getTicketById(id);
  }

  @Patch(':id/resolve-with-guidance')
  async resolveWithGuidance(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ResolveGuidanceDto,
  ) {
    return this.ticketsService.resolveWithGuidance(id, req.user.id, body.message);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateTicketStatus(id, body.status, body.feedback_note);
  }

  @Get(':id/queue-position')
  async getQueuePosition(@Param('id') id: string) {
    const position = await this.ticketsService.getQueuePosition(id);
    return { position };
  }
}
