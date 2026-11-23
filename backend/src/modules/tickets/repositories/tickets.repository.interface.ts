import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';

export const TICKETS_REPOSITORY = Symbol('TICKETS_REPOSITORY');

export interface ITicketsRepository {
  create(ticket: Partial<Ticket>): Promise<TicketDocument>;
  findById(id: string): Promise<TicketDocument | null>;
  findPendingPool(): Promise<TicketDocument[]>;
  findByStudentId(studentId: string): Promise<TicketDocument[]>;
  findByMentorId(mentorId: string): Promise<TicketDocument[]>;
  update(id: string, update: any): Promise<TicketDocument | null>;
  countPending(): Promise<number>;
  getQueuePosition(ticketId: string): Promise<number>;
}
