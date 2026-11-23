import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import { TicketsService } from '../../tickets/services/tickets.service.js';
import { SessionsService } from '../../sessions/services/sessions.service.js';

@Injectable()
export class MetricsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly ticketsService: TicketsService,
    private readonly sessionsService: SessionsService,
  ) {}

  async getGlobalMetrics() {
    const [userMetrics, totalSessions, pendingTickets] = await Promise.all([
      this.usersService.getUserMetrics(),
      this.sessionsService.getSessionCount(),
      this.ticketsService.getPendingTicketCount(),
    ]);

    return {
      students: userMetrics.students,
      mentors: userMetrics.mentors,
      sessions: {
        total: totalSessions,
      },
      tickets: {
        pending: pendingTickets,
      },
    };
  }
}
