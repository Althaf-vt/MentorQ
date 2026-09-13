import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema.js';
import { SessionsRepository } from './repositories/sessions.repository.js';
import { SessionsService } from './services/sessions.service.js';
import { SessionsController } from './controllers/sessions.controller.js';
import { SessionsGateway } from './gateways/sessions.gateway.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    TicketsModule,
    AuthModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsRepository, SessionsService, SessionsGateway],
  exports: [SessionsService],
})
export class SessionsModule {}
