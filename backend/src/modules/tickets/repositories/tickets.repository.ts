import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';
import { ITicketsRepository } from './tickets.repository.interface.js';
import { TicketModel } from '../types/ticket.type.js';
import { TicketSchemaMapper } from './mappers/ticket.schema-mapper.js';

@Injectable()
export class TicketsRepository implements ITicketsRepository {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async create(ticket: Partial<Ticket>): Promise<TicketModel> {
    const newTicket = new this.ticketModel(ticket);
    const saved = await newTicket.save();
    return TicketSchemaMapper.toDomain(saved);
  }

  async findById(id: string): Promise<TicketModel | null> {
    const doc = await this.ticketModel.findById(id).exec();
    return doc ? TicketSchemaMapper.toDomain(doc) : null;
  }

  async findPendingPool(): Promise<TicketModel[]> {
    const docs = await this.ticketModel
      .find({
        status: 'PENDING',
        $or: [{ mentor_id: null }, { mentor_id: { $exists: false } }],
      })
      .sort({ createdAt: 1 })
      .exec();
    return TicketSchemaMapper.toDomainList(docs);
  }

  async findByStudentId(studentId: string): Promise<TicketModel[]> {
    const docs = await this.ticketModel
      .find({ student_id: studentId as any })
      .sort({ createdAt: -1 })
      .exec();
    return TicketSchemaMapper.toDomainList(docs);
  }

  async findByMentorId(mentorId: string): Promise<TicketModel[]> {
    const docs = await this.ticketModel
      .find({ mentor_id: mentorId as any })
      .sort({ createdAt: 1 })
      .exec();
    return TicketSchemaMapper.toDomainList(docs);
  }

  async update(id: string, update: any): Promise<TicketModel | null> {
    const updated = await this.ticketModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
    return updated ? TicketSchemaMapper.toDomain(updated) : null;
  }

  async countPending(): Promise<number> {
    return this.ticketModel.countDocuments({ status: 'PENDING' }).exec();
  }

  async getQueuePosition(ticketId: string): Promise<number> {
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket || ticket.status !== 'PENDING') return -1;

    const count = await this.ticketModel.countDocuments({
      status: 'PENDING',
      createdAt: { $lt: ticket.createdAt },
    });
    return count + 1;
  }
}
