import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Admin, AdminSchema } from './schemas/admin.schema.js';
import { AdminSeederService } from './services/admin-seeder.service.js';
import { AdminAuthService } from './services/admin-auth.service.js';
import { AdminAuthController } from './controllers/admin-auth.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { PlatformSettings, PlatformSettingsSchema } from './schemas/settings.schema.js';
import { SettingsSeederService } from './services/settings-seeder.service.js';
import { SettingsService } from './services/settings.service.js';
import { SettingsController } from './controllers/settings.controller.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema.js';
import { Session, SessionSchema } from '../sessions/schemas/session.schema.js';
import { AdminUsersService } from './services/admin-users.service.js';
import { AdminUsersController } from './controllers/admin-users.controller.js';
import { MetricsService } from './services/metrics.service.js';
import { MetricsController } from './controllers/metrics.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
      { name: User.name, schema: UserSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    AuthModule,
  ],
  controllers: [AdminAuthController, SettingsController, AdminUsersController, MetricsController],
  providers: [
    AdminSeederService, 
    AdminAuthService, 
    SettingsSeederService, 
    SettingsService, 
    AdminUsersService, 
    MetricsService
  ],
  exports: [AdminAuthService],
})
export class AdminModule {}
