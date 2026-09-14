import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../schemas/session.schema.js';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async create(session: Partial<Session>): Promise<SessionDocument> {
    const newSession = new this.sessionModel(session);
    return newSession.save();
  }

  async findById(id: string): Promise<SessionDocument | null> {
    return this.sessionModel.findById(id).exec();
  }

  async findOne(query: any): Promise<SessionDocument | null> {
    return this.sessionModel.findOne(query).exec();
  }

  async update(id: string, update: any): Promise<SessionDocument | null> {
    return this.sessionModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
  }

  async findActiveByMentor(mentorId: string): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOne({ mentor_id: mentorId as any, session_status: 'ACTIVE' })
      .exec();
  }

  async findActiveByStudent(studentId: string): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOne({ student_id: studentId as any, session_status: 'ACTIVE' })
      .exec();
  }
}
