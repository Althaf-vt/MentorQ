import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { MentorProfilesModule } from './modules/mentor-profiles/mentor-profiles.module.js';
import { TicketsModule } from './modules/tickets/tickets.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MentorProfilesModule,
    TicketsModule,
    SessionsModule,
    ChatModule,
    NotificationsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
