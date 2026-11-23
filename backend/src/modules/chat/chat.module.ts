import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Message, MessageSchema } from './schemas/message.schema.js';
import { MessagesRepository } from './repositories/messages.repository.js';
import { MESSAGES_REPOSITORY } from './repositories/messages.repository.interface.js';
import { MessagesService } from './services/messages.service.js';
import { MessagesController } from './controllers/messages.controller.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    SessionsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [MessagesController],
  providers: [
    {
      provide: MESSAGES_REPOSITORY,
      useClass: MessagesRepository,
    },
    MessagesService,
  ],
  exports: [MessagesService],
})
export class ChatModule {}
