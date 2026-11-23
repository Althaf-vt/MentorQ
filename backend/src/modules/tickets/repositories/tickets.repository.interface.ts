import { Ticket } from '../schemas/ticket.schema.js';
import { TicketModel } from '../types/ticket.type.js';

export const TICKETS_REPOSITORY = Symbol('TICKETS_REPOSITORY');

export interface ITicketsRepository {
  create(ticket: Partial<Ticket>): Promise<TicketModel>;
  findById(id: string): Promise<TicketModel | null>;
  findPendingPool(): Promise<TicketModel[]>;
  findByStudentId(studentId: string): Promise<TicketModel[]>;
  findByMentorId(mentorId: string): Promise<TicketModel[]>;
  update(id: string, update: any): Promise<TicketModel | null>;
  countPending(): Promise<number>;
  getQueuePosition(ticketId: string): Promise<number>;
}
