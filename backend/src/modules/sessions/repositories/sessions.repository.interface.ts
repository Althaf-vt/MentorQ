import {
  SessionModel,
  CreateSessionInput,
  CompleteSessionInput,
} from '../types/session.type.js';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface ISessionsRepository {
  create(input: CreateSessionInput): Promise<SessionModel>;
  findById(id: string): Promise<SessionModel | null>;
  findActiveByTicketId(ticketId: string): Promise<SessionModel | null>;
  findByTicketId(ticketId: string): Promise<SessionModel | null>;
  findActiveByMentor(mentorId: string): Promise<SessionModel | null>;
  findActiveByStudent(studentId: string): Promise<SessionModel | null>;
  findStaleSessions(cutoff: Date): Promise<SessionModel[]>;
  markEmpty(id: string): Promise<void>;
  clearEmpty(id: string): Promise<void>;
  complete(id: string, input: CompleteSessionInput): Promise<SessionModel | null>;
  count(query?: Record<string, unknown>): Promise<number>;
}
