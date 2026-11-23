import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Session, SessionSchema } from './schemas/session.schema.js';
import { SessionsRepository } from './repositories/sessions.repository.js';
import { SESSIONS_REPOSITORY } from './repositories/sessions.repository.interface.js';
import { SessionsService } from './services/sessions.service.js';
import { SessionsController } from './controllers/sessions.controller.js';
import { SessionsGateway } from './gateways/sessions.gateway.js';
import { TicketEventsListener } from './events/ticket-events.listener.js';
import { ChatEventsListener } from './events/chat-events.listener.js';
import { SessionEventsListener } from './events/session-events.listener.js';
import { TicketsModule } from '../tickets/tickets.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    TicketsModule,
    AuthModule,
    NotificationsModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [SessionsController],
  providers: [
    {
      provide: SESSIONS_REPOSITORY,
      useClass: SessionsRepository,
    },
    SessionsService,
    SessionsGateway,
    TicketEventsListener,
    ChatEventsListener,
    SessionEventsListener,
  ],
  exports: [SessionsService],
})
export class SessionsModule {}
