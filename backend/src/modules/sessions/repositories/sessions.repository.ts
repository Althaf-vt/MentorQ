import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema.js';
import { ISessionsRepository } from './sessions.repository.interface.js';
import { SessionModel } from '../types/session.type.js';
import { SessionSchemaMapper } from './mappers/session.schema-mapper.js';

@Injectable()
export class SessionsRepository implements ISessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(session: Partial<Session>): Promise<SessionModel> {
    const newSession = new this.sessionModel(session);
    const saved = await newSession.save();
    return SessionSchemaMapper.toDomain(saved);
  }

  async findById(id: string): Promise<SessionModel | null> {
    const doc = await this.sessionModel.findById(id).exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findActiveByTicketId(ticketId: string): Promise<SessionModel | null> {
    const doc = await this.sessionModel
      .findOne({
        ticket_id: ticketId as any,
        session_status: 'ACTIVE',
      })
      .exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findByTicketId(ticketId: string): Promise<SessionModel | null> {
    const doc = await this.sessionModel
      .findOne({
        ticket_id: ticketId as any,
      })
      .exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findActiveByMentor(mentorId: string): Promise<SessionModel | null> {
    const doc = await this.sessionModel
      .findOne({ mentor_id: mentorId as any, session_status: 'ACTIVE' })
      .exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findActiveByStudent(studentId: string): Promise<SessionModel | null> {
    const doc = await this.sessionModel
      .findOne({ student_id: studentId as any, session_status: 'ACTIVE' })
      .exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findStaleSessions(cutoff: Date): Promise<SessionModel[]> {
    const docs = await this.sessionModel
      .find({
        session_status: 'ACTIVE',
        last_empty_at: { $lte: cutoff },
      })
      .exec();
    return SessionSchemaMapper.toDomainList(docs);
  }

  async update(id: string, update: any): Promise<SessionModel | null> {
    const updated = await this.sessionModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
    return updated ? SessionSchemaMapper.toDomain(updated) : null;
  }

  async count(query: any = {}): Promise<number> {
    return this.sessionModel.countDocuments(query).exec();
  }
}
