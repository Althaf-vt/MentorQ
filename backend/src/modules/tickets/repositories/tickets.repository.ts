import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument } from '../schemas/ticket.schema.js';

@Injectable()
export class TicketsRepository {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<TicketDocument>,
  ) {}

  async create(ticket: Partial<Ticket>): Promise<TicketDocument> {
    const newTicket = new this.ticketModel(ticket);
    return newTicket.save();
  }

  async findOne(query: any): Promise<TicketDocument | null> {
    return this.ticketModel.findOne(query).exec();
  }

  async findById(id: string): Promise<TicketDocument | null> {
    return this.ticketModel.findById(id).exec();
  }

  async find(query: any, sort: any = { createdAt: 1 }): Promise<TicketDocument[]> {
    return this.ticketModel.find(query).sort(sort).exec();
  }

  async update(id: string, update: any): Promise<TicketDocument | null> {
    return this.ticketModel.findByIdAndUpdate(id, update, { returnDocument: 'after' }).exec();
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
