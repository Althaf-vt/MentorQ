import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from './schemas/message.schema.js';
import { MessagesRepository } from './repositories/messages.repository.js';
import { MessagesService } from './services/messages.service.js';
import { MessagesController } from './controllers/messages.controller.js';
import { SessionsModule } from '../sessions/sessions.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    SessionsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesRepository, MessagesService],
  exports: [MessagesService],
})
export class ChatModule {}
