import { Session } from '../schemas/session.schema.js';
import { SessionModel } from '../types/session.type.js';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface ISessionsRepository {
  create(session: Partial<Session>): Promise<SessionModel>;
  findById(id: string): Promise<SessionModel | null>;
  findActiveByTicketId(ticketId: string): Promise<SessionModel | null>;
  findByTicketId(ticketId: string): Promise<SessionModel | null>;
  findActiveByMentor(mentorId: string): Promise<SessionModel | null>;
  findActiveByStudent(studentId: string): Promise<SessionModel | null>;
  findStaleSessions(cutoff: Date): Promise<SessionModel[]>;
  update(id: string, update: any): Promise<SessionModel | null>;
  count(query?: any): Promise<number>;
}
