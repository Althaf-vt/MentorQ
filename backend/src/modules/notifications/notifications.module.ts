import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Notification, NotificationSchema } from './schemas/notification.schema.js';
import { NotificationsRepository } from './repositories/notifications.repository.js';
import { NotificationsService } from './services/notifications.service.js';
import { NotificationsController } from './controllers/notifications.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsRepository, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
