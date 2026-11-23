import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';
import { ITicketsRepository } from './tickets.repository.interface.js';

@Injectable()
export class TicketsRepository implements ITicketsRepository {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async create(ticket: Partial<Ticket>): Promise<TicketDocument> {
    const newTicket = new this.ticketModel(ticket);
    return newTicket.save();
  }

  async findById(id: string): Promise<TicketDocument | null> {
    return this.ticketModel.findById(id).exec();
  }

  async findPendingPool(): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({
        status: 'PENDING',
        $or: [{ mentor_id: null }, { mentor_id: { $exists: false } }],
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findByStudentId(studentId: string): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({ student_id: studentId as any })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByMentorId(mentorId: string): Promise<TicketDocument[]> {
    return this.ticketModel
      .find({ mentor_id: mentorId as any })
      .sort({ createdAt: 1 })
      .exec();
  }

  async update(id: string, update: any): Promise<TicketDocument | null> {
    return this.ticketModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
  }

  async countPending(): Promise<number> {
    return this.ticketModel.countDocuments({ status: 'PENDING' }).exec();
  }

  async getQueuePosition(ticketId: string): Promise<number> {
    const ticket = await this.findById(ticketId);
    if (!ticket || ticket.status !== 'PENDING') return -1;

    const count = await this.ticketModel.countDocuments({
      status: 'PENDING',
      createdAt: { $lt: ticket.createdAt },
    });
    return count + 1;
  }
}
