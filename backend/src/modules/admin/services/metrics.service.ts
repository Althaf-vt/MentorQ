import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema.js';
import { Ticket, TicketDocument } from '../../tickets/schemas/ticket.schema.js';
import { Session, SessionDocument } from '../../sessions/schemas/session.schema.js';

@Injectable()
export class MetricsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async getGlobalMetrics() {
    const [
      totalStudents,
      suspendedStudents,
      totalMentors,
      suspendedMentors,
      totalSessions,
      pendingTickets
    ] = await Promise.all([
      this.userModel.countDocuments({ role: 'STUDENT' }).exec(),
      this.userModel.countDocuments({ role: 'STUDENT', status: 'SUSPENDED' }).exec(),
      this.userModel.countDocuments({ role: 'MENTOR' }).exec(),
      this.userModel.countDocuments({ role: 'MENTOR', status: 'SUSPENDED' }).exec(),
      this.sessionModel.countDocuments().exec(),
      this.ticketModel.countDocuments({ status: 'PENDING' }).exec(),
    ]);

    return {
      students: {
        total: totalStudents,
        suspended: suspendedStudents,
        active: totalStudents - suspendedStudents,
      },
      mentors: {
        total: totalMentors,
        suspended: suspendedMentors,
        active: totalMentors - suspendedMentors,
      },
      sessions: {
        total: totalSessions,
      },
      tickets: {
        pending: pendingTickets,
      },
    };
  }
}
