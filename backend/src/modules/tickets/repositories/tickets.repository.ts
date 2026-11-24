import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';
import { ITicketsRepository } from './tickets.repository.interface.js';
import {
  TicketModel,
  CreateTicketInput,
  TicketStatusHistoryItem,
} from '../types/ticket.type.js';
import { TicketSchemaMapper } from './mappers/ticket.schema-mapper.js';

@Injectable()
export class TicketsRepository implements ITicketsRepository {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async create(input: CreateTicketInput): Promise<TicketModel> {
    const newTicket = new this.ticketModel({
      student_id: new Types.ObjectId(input.studentId),
      topic: input.topic,
      description: input.description,
      requested_minutes: input.requestedMinutes ?? 15,
      tags: input.tags ?? [],
      scheduled_time: input.scheduledTime ?? null,
      status: 'PENDING',
      status_history: [{ status: 'PENDING', timestamp: new Date() }],
    });
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
    const filter: Record<string, unknown> = {
      student_id: new Types.ObjectId(studentId),
    };
    const docs = await this.ticketModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return TicketSchemaMapper.toDomainList(docs);
  }

  async findByMentorId(mentorId: string): Promise<TicketModel[]> {
    const filter: Record<string, unknown> = {
      mentor_id: new Types.ObjectId(mentorId),
    };
    const docs = await this.ticketModel
      .find(filter)
      .sort({ createdAt: 1 })
      .exec();
    return TicketSchemaMapper.toDomainList(docs);
  }

  async claimTicket(
    id: string,
    mentorId: string,
    historyEntry: TicketStatusHistoryItem,
  ): Promise<TicketModel | null> {
    const updated = await this.ticketModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            mentor_id: new Types.ObjectId(mentorId),
            status: historyEntry.status,
          },
          $push: { status_history: historyEntry },
        },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? TicketSchemaMapper.toDomain(updated) : null;
  }

  async resolveTicketWithGuidance(
    id: string,
    guidanceMessage: string,
    historyEntry: TicketStatusHistoryItem,
  ): Promise<TicketModel | null> {
    const updated = await this.ticketModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: historyEntry.status,
            guidance_message: guidanceMessage,
          },
          $push: { status_history: historyEntry },
        },
        { returnDocument: 'after' },
      )
      .exec();
    return updated ? TicketSchemaMapper.toDomain(updated) : null;
  }

  async updateTicketStatus(
    id: string,
    status: string,
    historyEntry?: TicketStatusHistoryItem,
  ): Promise<TicketModel | null> {
    const updateOps: Record<string, unknown> = {
      $set: { status },
    };
    if (historyEntry) {
      updateOps.$push = { status_history: historyEntry };
    }
    const updated = await this.ticketModel
      .findByIdAndUpdate(id, updateOps, { returnDocument: 'after' })
      .exec();
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
