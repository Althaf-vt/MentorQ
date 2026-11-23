import { Session, SessionDocument } from '../schemas/session.schema.js';

export const SESSIONS_REPOSITORY = Symbol('SESSIONS_REPOSITORY');

export interface ISessionsRepository {
  create(session: Partial<Session>): Promise<SessionDocument>;
  findById(id: string): Promise<SessionDocument | null>;
  findActiveByTicketId(ticketId: string): Promise<SessionDocument | null>;
  findByTicketId(ticketId: string): Promise<SessionDocument | null>;
  findActiveByMentor(mentorId: string): Promise<SessionDocument | null>;
  findActiveByStudent(studentId: string): Promise<SessionDocument | null>;
  findStaleSessions(cutoff: Date): Promise<SessionDocument[]>;
  update(id: string, update: any): Promise<SessionDocument | null>;
  count(query?: any): Promise<number>;
}
