import {
  TicketModel,
  CreateTicketInput,
  TicketStatusHistoryItem,
} from '../types/ticket.type.js';

export const TICKETS_REPOSITORY = Symbol('TICKETS_REPOSITORY');

export interface ITicketsRepository {
  create(input: CreateTicketInput): Promise<TicketModel>;
  findById(id: string): Promise<TicketModel | null>;
  findPendingPool(): Promise<TicketModel[]>;
  findByStudentId(studentId: string): Promise<TicketModel[]>;
  findByMentorId(mentorId: string): Promise<TicketModel[]>;
  claimTicket(
    id: string,
    mentorId: string,
    historyEntry: TicketStatusHistoryItem,
  ): Promise<TicketModel | null>;
  resolveTicketWithGuidance(
    id: string,
    guidanceMessage: string,
    historyEntry: TicketStatusHistoryItem,
  ): Promise<TicketModel | null>;
  updateTicketStatus(
    id: string,
    status: string,
    historyEntry?: TicketStatusHistoryItem,
  ): Promise<TicketModel | null>;
  countPending(): Promise<number>;
  getQueuePosition(ticketId: string): Promise<number>;
}
