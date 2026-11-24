import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema.js';
import { ISessionsRepository } from './sessions.repository.interface.js';
import {
  SessionModel,
  CreateSessionInput,
  CompleteSessionInput,
} from '../types/session.type.js';
import { SessionSchemaMapper } from './mappers/session.schema-mapper.js';

@Injectable()
export class SessionsRepository implements ISessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(input: CreateSessionInput): Promise<SessionModel> {
    const newSession = new this.sessionModel({
      ticket_id: new Types.ObjectId(input.ticketId),
      mentor_id: new Types.ObjectId(input.mentorId),
      student_id: new Types.ObjectId(input.studentId),
      allocated_minutes: input.allocatedMinutes,
      started_at: input.startedAt ?? new Date(),
      session_status: 'ACTIVE',
    });
    const saved = await newSession.save();
    return SessionSchemaMapper.toDomain(saved);
  }

  async findById(id: string): Promise<SessionModel | null> {
    const doc = await this.sessionModel.findById(id).exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findActiveByTicketId(ticketId: string): Promise<SessionModel | null> {
    const filter: Record<string, unknown> = {
      ticket_id: new Types.ObjectId(ticketId),
      session_status: 'ACTIVE',
    };
    const doc = await this.sessionModel.findOne(filter).exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findByTicketId(ticketId: string): Promise<SessionModel | null> {
    const filter: Record<string, unknown> = {
      ticket_id: new Types.ObjectId(ticketId),
    };
    const doc = await this.sessionModel.findOne(filter).exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findActiveByMentor(mentorId: string): Promise<SessionModel | null> {
    const filter: Record<string, unknown> = {
      mentor_id: new Types.ObjectId(mentorId),
      session_status: 'ACTIVE',
    };
    const doc = await this.sessionModel.findOne(filter).exec();
    return doc ? SessionSchemaMapper.toDomain(doc) : null;
  }

  async findActiveByStudent(studentId: string): Promise<SessionModel | null> {
    const filter: Record<string, unknown> = {
      student_id: new Types.ObjectId(studentId),
      session_status: 'ACTIVE',
    };
    const doc = await this.sessionModel.findOne(filter).exec();
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

  async markEmpty(id: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(id, { last_empty_at: new Date() }).exec();
  }

  async clearEmpty(id: string): Promise<void> {
    await this.sessionModel.findByIdAndUpdate(id, { $unset: { last_empty_at: 1 } }).exec();
  }

  async complete(id: string, input: CompleteSessionInput): Promise<SessionModel | null> {
    const updated = await this.sessionModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            session_status: 'COMPLETED',
            ended_at: input.endedAt,
            actual_duration_minutes: input.actualDurationMinutes,
            resolution_notes: input.resolutionNotes,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? SessionSchemaMapper.toDomain(updated) : null;
  }

  async count(query: Record<string, unknown> = {}): Promise<number> {
    return this.sessionModel.countDocuments(query).exec();
  }
}
