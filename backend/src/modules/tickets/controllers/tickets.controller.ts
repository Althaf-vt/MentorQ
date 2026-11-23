import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from '../services/tickets.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { CreateTicketDto } from '../dto/create-ticket.dto.js';
import { ResolveGuidanceDto } from '../dto/resolve-guidance.dto.js';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto.js';
import {
  TicketResponseDto,
  TicketQueuePositionResponseDto,
} from '../dto/ticket-response.dto.js';
import { TicketDtoMapper } from '../mappers/ticket.dto-mapper.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.type.js';

@Controller('api/v1/tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreateTicketDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.createTicket(req.user.id, body);
    return TicketDtoMapper.toResponseDto(ticket);
  }

  @Get('pool/pending')
  async getPendingPool(): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.getPendingPool();
    return TicketDtoMapper.toResponseDtoList(tickets);
  }

  @Post(':id/claim')
  async claim(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.claimTicket(id, req.user.id);
    return TicketDtoMapper.toResponseDto(ticket);
  }

  @Get('student')
  async getStudentTickets(
    @Request() req: AuthenticatedRequest,
  ): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.getStudentTickets(req.user.id);
    return TicketDtoMapper.toResponseDtoList(tickets);
  }

  @Get('mentor')
  async getMentorTickets(
    @Request() req: AuthenticatedRequest,
  ): Promise<TicketResponseDto[]> {
    const tickets = await this.ticketsService.getMentorTickets(req.user.id);
    return TicketDtoMapper.toResponseDtoList(tickets);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.getTicketById(id);
    return TicketDtoMapper.toResponseDto(ticket);
  }

  @Patch(':id/resolve-with-guidance')
  async resolveWithGuidance(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ResolveGuidanceDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.resolveWithGuidance(
      id,
      req.user.id,
      body.message,
    );
    return TicketDtoMapper.toResponseDto(ticket);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ): Promise<TicketResponseDto> {
    const ticket = await this.ticketsService.updateTicketStatus(
      id,
      body.status,
      body.feedback_note,
    );
    return TicketDtoMapper.toResponseDto(ticket);
  }

  @Get(':id/queue-position')
  async getQueuePosition(
    @Param('id') id: string,
  ): Promise<TicketQueuePositionResponseDto> {
    const position = await this.ticketsService.getQueuePosition(id);
    return TicketDtoMapper.toQueuePositionDto(position);
  }
}
