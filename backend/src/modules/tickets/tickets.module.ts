import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Ticket, TicketSchema } from './schemas/ticket.schema.js';
import { TicketsRepository } from './repositories/tickets.repository.js';
import { TicketsService } from './services/tickets.service.js';
import { TicketsController } from './controllers/tickets.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [TicketsController],
  providers: [TicketsRepository, TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
